/**
 * Scraper – duvary-transports.com
 * Exporte toutes les fiches produits WooCommerce (216 produits / 15 catégories)
 * en format CSV WooCommerce prêt à l'import.
 *
 * Usage : node duvary_scraper.js
 * Output: duvary_products_export.csv
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { stringify } from 'csv-stringify/sync';

// ─── Config ──────────────────────────────────────────────────────────────────

const SITEMAP_URL =
  'https://duvary-transports.com/wp-sitemap-posts-product-1.xml';
const CATEGORY_SITEMAP_URL =
  'https://duvary-transports.com/wp-sitemap-taxonomies-product_cat-1.xml';
const OUTPUT_FILE = path.resolve('./duvary_products_export.csv');
const DELAY_MS = 600;          // délai poli entre requêtes (ms)
const CONCURRENCY = 3;         // requêtes en parallèle max
const MAX_RETRIES = 3;
const TIMEOUT_MS = 20000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Nettoie un prix "22.886,25 €" → "22886.25" */
function parsePrice(text = '') {
  if (!text) return '';
  return text
    .replace(/[^\d,\.]/g, '')   // garde chiffres , .
    .replace(/\./g, '')         // enlève séparateur de milliers
    .replace(',', '.')          // virgule → point
    .trim();
}

/** Pause */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Requête HTTP avec retries */
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url, {
        headers: HEADERS,
        timeout: TIMEOUT_MS,
        maxRedirects: 5,
      });
      return res.data;
    } catch (err) {
      if (i < retries - 1) {
        const wait = 1500 * (i + 1);
        console.warn(
          `  ↩ Retry ${i + 1}/${retries - 1} for ${url} (${err.message})`
        );
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

/** Traitement par lots (pool de concurrency) */
async function processBatch(items, fn, concurrency = CONCURRENCY) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + concurrency < items.length) await sleep(DELAY_MS);
  }
  return results;
}

// ─── Récupération des URLs depuis le sitemap ─────────────────────────────────

async function fetchProductUrls() {
  console.log('📥  Chargement du sitemap produits…');
  const xml = await fetchWithRetry(SITEMAP_URL);
  const parsed = await parseStringPromise(xml);
  const urls = parsed.urlset.url.map((u) => u.loc[0]);
  console.log(`    → ${urls.length} URLs produits trouvées`);
  return urls;
}

async function fetchCategoryMap() {
  console.log('📥  Chargement du sitemap catégories…');
  const xml = await fetchWithRetry(CATEGORY_SITEMAP_URL);
  const parsed = await parseStringPromise(xml);
  const catUrls = parsed.urlset.url.map((u) => u.loc[0]);

  /** Extrait le slug de la catégorie depuis l'URL */
  const slugToName = {};
  for (const url of catUrls) {
    const slug = url.replace(/.*\/categorie-produit\//, '').replace(/\/$/, '');
    slugToName[slug] = slug; // on l'enrichira plus tard si besoin
  }
  return slugToName;
}

// ─── Scraping d'une fiche produit ────────────────────────────────────────────

async function scrapeProduct(url) {
  let html;
  try {
    html = await fetchWithRetry(url);
  } catch (err) {
    console.error(`  ✗ Impossible de charger ${url}: ${err.message}`);
    return { url, error: err.message };
  }

  const $ = cheerio.load(html);

  // ── Titre ─────────────────────────────────────────────────────────────────
  const name =
    $('h1.product_title').text().trim() ||
    $('h1.entry-title').text().trim() ||
    $('h1').first().text().trim();

  // ── Prix ──────────────────────────────────────────────────────────────────
  let regularPrice = '';
  let salePrice = '';

  const delEl = $('del .woocommerce-Price-amount.amount').first();
  const insEl = $('ins .woocommerce-Price-amount.amount').first();

  if (delEl.length && insEl.length) {
    regularPrice = parsePrice(delEl.text());
    salePrice = parsePrice(insEl.text());
  } else {
    regularPrice = parsePrice(
      $('.woocommerce-Price-amount.amount').first().text()
    );
  }

  // ── SKU / GTIN / HAN ──────────────────────────────────────────────────────
  let sku = $('span.sku').text().trim();
  let gtin = '';
  let han = '';

  // Table des informations produit
  $('table tr').each((_, row) => {
    const cells = $(row).find('td, th');
    if (cells.length >= 2) {
      const label = $(cells.eq(0)).text().trim().toLowerCase();
      const value = $(cells.eq(1)).text().trim();
      if (label.includes('gtin')) gtin = value;
      if (label === 'han:' || label === 'han') han = value;
      // parfois SKU est dans la table
      if ((label.includes('sku') || label.includes('art.-nr')) && !sku)
        sku = value;
    }
  });

  if (!sku && han) sku = han;

  // ── Catégorie ─────────────────────────────────────────────────────────────
  // 1. Via breadcrumb
  const crumbs = [];
  $(
    '.woocommerce-breadcrumb a, nav.breadcrumbs a, ' +
      '.breadcrumbs span a, .breadcrumb a'
  ).each((_, el) => {
    const t = $(el).text().trim();
    if (t && !['Start', 'Startseite', 'Home', 'Shop'].includes(t))
      crumbs.push(t);
  });

  // 2. Via .posted_in (WooCommerce natif)
  const postedIn = $('.posted_in a')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(', ');

  // 3. Via meta info table
  let catFromTable = '';
  $('table tr').each((_, row) => {
    const cells = $(row).find('td, th');
    if (cells.length >= 2) {
      const label = $(cells.eq(0)).text().trim().toLowerCase();
      const value = $(cells.eq(1)).text().trim();
      if (label.includes('kategorie') || label.includes('category'))
        catFromTable = value;
    }
  });

  const category = crumbs.join(' > ') || postedIn || catFromTable;

  // ── Description ───────────────────────────────────────────────────────────
  // Description courte (sous le prix)
  const shortDesc = $(
    '.woocommerce-product-details__short-description, ' +
      '.product-short-description'
  )
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  // Description longue (onglet "Beschreibung")
  const fullDescEl = $(
    '#tab-description, .woocommerce-Tabs-panel--description'
  );
  const fullDesc = fullDescEl
    .clone()
    .find('.title-tab-desc')
    .remove()
    .end()
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  // ── Images ────────────────────────────────────────────────────────────────
  const images = new Set();

  // Images galerie WooCommerce standard
  $(
    '.woocommerce-product-gallery__image a, ' +
      '.woocommerce-product-gallery__image img'
  ).each((_, el) => {
    const src =
      $(el).attr('href') ||
      $(el).attr('data-large_image') ||
      $(el).attr('src') ||
      $(el).attr('data-src') ||
      '';
    if (src && !src.includes('placeholder')) {
      // Supprimer les suffixes de taille (ex: -300x300)
      const full = src.replace(/-\d{2,4}x\d{2,4}(\.\w+(\?.*)?)$/, '$1$2');
      images.add(full);
    }
  });

  // Attribut data-large_image sur les figures
  $('[data-large_image]').each((_, el) => {
    const src = $(el).attr('data-large_image');
    if (src) images.add(src);
  });

  // Fallback : og:image
  if (images.size === 0) {
    const og = $('meta[property="og:image"]').attr('content');
    if (og) images.add(og);
  }

  // ── Stock ─────────────────────────────────────────────────────────────────
  const bodyText = $('body').text();
  const inStock =
    $('p.in-stock, .in-stock').length > 0 ||
    bodyText.includes('Auf Lager') ||
    bodyText.includes('Sofort verfügbar')
      ? 1
      : 0;

  // ── Tags ──────────────────────────────────────────────────────────────────
  const tags = $('.tagged_as a')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(', ');

  // ── Marque (si attribut pa_marke) ────────────────────────────────────────
  let brand = '';
  $('tr.woocommerce-product-attributes-item').each((_, row) => {
    const label = $(row)
      .find('.woocommerce-product-attributes-item__label')
      .text()
      .trim()
      .toLowerCase();
    const val = $(row)
      .find('.woocommerce-product-attributes-item__value')
      .text()
      .trim();
    if (label.includes('marke') || label.includes('brand') || label.includes('hersteller'))
      brand = val;
  });

  console.log(`  ✓ ${name || url}`);

  return {
    url,
    name,
    sku,
    gtin,
    han,
    brand,
    regularPrice,
    salePrice,
    category,
    shortDesc,
    fullDesc,
    images: [...images].join(', '),
    inStock,
    tags,
  };
}

// ─── Construction du CSV ─────────────────────────────────────────────────────

function buildCsvRows(products) {
  const headers = [
    'Type',
    'SKU',
    'Name',
    'Published',
    'Visibility in catalog',
    'Short description',
    'Description',
    'In stock?',
    'Regular price',
    'Sale price',
    'Categories',
    'Tags',
    'Images',
    'Brand',
    'GTIN',
    'Product URL',
  ];

  const rows = products
    .filter((p) => p.name && !p.error)
    .map((p) => [
      'simple',
      p.sku || '',
      p.name || '',
      1,
      'visible',
      p.shortDesc || '',
      p.fullDesc || '',
      p.inStock,
      p.regularPrice || '',
      p.salePrice || '',
      p.category || '',
      p.tags || '',
      p.images || '',
      p.brand || '',
      p.gtin || '',
      p.url || '',
    ]);

  return stringify([headers, ...rows], {
    quoted: true,
    quoted_empty: true,
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌿  Duvary-Transports – Scraper de fiches produits\n');
  console.log(`    Source : ${SITEMAP_URL}`);
  console.log(`    Output : ${OUTPUT_FILE}\n`);

  // 1. URLs depuis le sitemap
  const productUrls = await fetchProductUrls();

  // 2. Scraping par lots
  console.log(`\n🔍  Scraping de ${productUrls.length} fiches produits…\n`);
  const total = productUrls.length;
  let done = 0;

  const products = await processBatch(
    productUrls,
    async (url) => {
      const result = await scrapeProduct(url);
      done++;
      process.stdout.write(`\r    Progression : ${done}/${total}`);
      return result;
    },
    CONCURRENCY
  );

  console.log('\n');

  // 3. Stats
  const ok = products.filter((p) => !p.error);
  const errors = products.filter((p) => p.error);
  console.log(`✅  Succès : ${ok.length}  |  ✗ Erreurs : ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n⚠  URLs en erreur :');
    errors.forEach((e) => console.log(`   - ${e.url}: ${e.error}`));
  }

  // 4. CSV
  const csv = buildCsvRows(products);
  fs.writeFileSync(OUTPUT_FILE, csv, 'utf8');
  console.log(`\n📁  Fichier exporté : ${OUTPUT_FILE}`);

  // 5. Résumé par catégorie
  const catCounts = {};
  ok.forEach((p) => {
    const cat = p.category || '(sans catégorie)';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  console.log('\n📊  Produits par catégorie :');
  Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`    ${String(count).padStart(3)}  ${cat}`);
    });

  console.log('\n✨  Terminé !\n');
}

main().catch((err) => {
  console.error('\n💥 Erreur fatale :', err);
  process.exit(1);
});
