/**
 * Scraper – lenasjerahi.es
 * Exporte toutes les fiches produits WooCommerce
 * en format CSV Google Merchant Center compliant.
 *
 * Usage : node lenasjerahi_scraper.js
 * Output: lenasjerahi_products_gmc.csv
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { stringify } from 'csv-stringify/sync';

// ─── Config ──────────────────────────────────────────────────────────────────

const SITEMAP_URL =
  'https://lenasjerahi.es/wp-sitemap-posts-product-1.xml';
const OUTPUT_FILE = path.resolve('./lenasjerahi_products_gmc.csv');
const DELAY_MS = 1000;          // délai poli entre requêtes (ms)
const CONCURRENCY = 2;         // requêtes en parallèle max
const MAX_RETRIES = 3;
const TIMEOUT_MS = 20000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Nettoie un prix "129,00 €" → "129.00" */
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

// ─── Requête HTTP avec retries ───────────────────────────────────────────────

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
  const title =
    $('h1.product_title').text().trim() ||
    $('h1.entry-title').text().trim() ||
    $('h1').first().text().trim();

  // ── Prix ──────────────────────────────────────────────────────────────────
  let price = '';
  let salePrice = '';

  const delEl = $('p.price del .woocommerce-Price-amount.amount').first();
  const insEl = $('p.price ins .woocommerce-Price-amount.amount').first();

  if (delEl.length && insEl.length) {
    price = parsePrice(delEl.text());
    salePrice = parsePrice(insEl.text());
  } else {
    price = parsePrice(
      $('p.price .woocommerce-Price-amount.amount').first().text()
    );
  }

  // Ajouter EUR si prix
  if (price) price += ' EUR';
  if (salePrice) salePrice += ' EUR';

  // ── SKU ───────────────────────────────────────────────────────────────────
  let sku = $('span.sku').text().trim();

  // Parfois dans meta
  if (!sku) {
    sku = $('meta[name="sku"]').attr('content') || '';
  }

  // ── GTIN / MPN ────────────────────────────────────────────────────────────
  let gtin = '';
  let mpn = sku; // utiliser SKU comme MPN

  // ── Catégorie ─────────────────────────────────────────────────────────────
  const category = $('.posted_in a')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(' > ');

  // ── Description ───────────────────────────────────────────────────────────
  const shortDesc = $(
    '.woocommerce-product-details__short-description, ' +
      '.product-short-description'
  )
    .text()
    .replace(/\s+/g, ' ')
    .trim();

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

  const description = fullDesc || shortDesc;

  // ── Images ────────────────────────────────────────────────────────────────
  const images = new Set();

  // Images galerie WooCommerce
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
      images.add(src);
    }
  });

  // og:image
  if (images.size === 0) {
    const og = $('meta[property="og:image"]').attr('content');
    if (og) images.add(og);
  }

  const imageList = [...images];
  const imageLink = imageList[0] || '';
  const additionalImageLinks = imageList.slice(1).join(', ');

  // ── Stock ─────────────────────────────────────────────────────────────────
  const availability =
    $('p.in-stock, .in-stock').length > 0 ||
    $('button.single_add_to_cart_button').length > 0 ||
    !$('.out-of-stock').length
      ? 'in stock'
      : 'out of stock';

  // ── Marque ───────────────────────────────────────────────────────────────
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
    if (label.includes('marca') || label.includes('brand') || label.includes('fabricante'))
      brand = val;
  });

  console.log(`  ✓ ${title || url}`);

  return {
    id: sku || url.split('/').pop(),
    title,
    description,
    link: url,
    image_link: imageLink,
    additional_image_link: additionalImageLinks,
    availability,
    price,
    sale_price: salePrice,
    brand,
    gtin,
    mpn,
    condition: 'new',
    product_type: category,
  };
}

// ─── Construction du CSV GMC ─────────────────────────────────────────────────

function buildCsvRows(products) {
  const headers = [
    'id',
    'title',
    'description',
    'link',
    'image_link',
    'additional_image_link',
    'availability',
    'price',
    'sale_price',
    'brand',
    'gtin',
    'mpn',
    'condition',
    'product_type',
  ];

  const rows = products
    .filter((p) => p.title && !p.error)
    .map((p) => [
      p.id || '',
      p.title || '',
      p.description || '',
      p.link || '',
      p.image_link || '',
      p.additional_image_link || '',
      p.availability || '',
      p.price || '',
      p.sale_price || '',
      p.brand || '',
      p.gtin || '',
      p.mpn || '',
      p.condition || '',
      p.product_type || '',
    ]);

  return [headers, ...rows];
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  try {
    const urls = await fetchProductUrls();
    console.log('🔍 Scraping des produits…');
    const products = await processBatch(urls, scrapeProduct);
    console.log(`    → ${products.filter(p => !p.error).length} produits scrapés`);

    const csvRows = buildCsvRows(products);
    const csv = stringify(csvRows);
    fs.writeFileSync(OUTPUT_FILE, csv, 'utf8');
    console.log(`💾 CSV sauvegardé: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

main();