/**
 * Scraper – wismarlobaugmbh.com
 * Exporte toutes les fiches produits WooCommerce
 * en CSV Shopify-ready + GMC (Google Merchant Center).
 *
 * Usage : node wismar_scraper.js
 * Output: wismar_products_shopify.csv + wismar_products_gmc.csv
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { stringify } from 'csv-stringify/sync';

// ─── Config ──────────────────────────────────────────────────────────────────

const SITEMAP_URL = 'https://wismarlobaugmbh.com/wp-sitemap-posts-product-1.xml';
const OUTPUT_SHOPIFY = path.resolve('./wismar_products_shopify.csv');
const OUTPUT_GMC = path.resolve('./wismar_products_gmc.csv');
const OUTPUT_JSON = path.resolve('./wismar_products.json');
const DELAY_MS = 1500;
const CONCURRENCY = 2;
const MAX_RETRIES = 4;
const TIMEOUT_MS = 45000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(text = '') {
  if (!text) return '';
  return text
    .replace(/[^\d,\.]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Requête HTTP avec retries ───────────────────────────────────────────────

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await axios.get(url, {
        headers: HEADERS,
        timeout: TIMEOUT_MS,
        maxRedirects: 5,
      });
      return res.data;
    } catch (err) {
      if (i < retries - 1) {
        const wait = 2000 * (i + 1);
        console.warn(`  ↩ Retry ${i + 1}/${retries - 1} for ${url} (${err.message})`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

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

// ─── Extraction JSON-LD ──────────────────────────────────────────────────────

function extractJsonLd($) {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i += 1) {
    try {
      const raw = $(scripts[i]).html();
      const data = JSON.parse(raw);
      const graph = data['@graph'] || [data];
      for (const item of graph) {
        if (item['@type'] === 'Product') {
          return item;
        }
      }
    } catch (_) {
      // ignore parse errors
    }
  }
  return null;
}

// ─── Scraping d'une fiche produit ────────────────────────────────────────────

async function scrapeProduct(url) {
  let html;
  try {
    html = await fetchWithRetry(url);
  } catch (err) {
    console.error(`  ✗ ${url}: ${err.message}`);
    return { url, error: err.message };
  }

  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($) || {};

  // ── Titre ─────────────────────────────────────────────────────────────────
  const title =
    jsonLd.name ||
    $('h1.product_title').text().trim() ||
    $('h1.entry-title').text().trim() ||
    $('h1').first().text().trim();

  // ── Prix ──────────────────────────────────────────────────────────────────
  let price = '';
  let salePrice = '';

  // From JSON-LD offers
  if (jsonLd.offers && jsonLd.offers[0]) {
    const offer = jsonLd.offers[0];
    if (offer.priceSpecification && offer.priceSpecification[0]) {
      price = offer.priceSpecification[0].price || '';
    } else {
      price = offer.price || '';
    }
  }

  // Fallback: parse from HTML
  if (!price) {
    const delEl = $('p.price del .woocommerce-Price-amount.amount, .price del .woocommerce-Price-amount.amount').first();
    const insEl = $('p.price ins .woocommerce-Price-amount.amount, .price ins .woocommerce-Price-amount.amount').first();

    if (delEl.length && insEl.length) {
      price = parsePrice(delEl.text());
      salePrice = parsePrice(insEl.text());
    } else {
      price = parsePrice(
        $('p.price .woocommerce-Price-amount.amount, .price .woocommerce-Price-amount.amount').first().text()
      );
    }
  }

  if (price) price = `${parseFloat(price).toFixed(2)} EUR`;
  if (salePrice) salePrice = `${parseFloat(salePrice).toFixed(2)} EUR`;

  // ── SKU ───────────────────────────────────────────────────────────────────
  let sku = jsonLd.sku || $('span.sku').text().trim() || '';

  // ── GTIN ──────────────────────────────────────────────────────────────────
  let gtin = jsonLd.gtin13 || jsonLd.gtin12 || jsonLd.gtin8 || '';
  let mpn = sku;

  // ── Marque ────────────────────────────────────────────────────────────────
  let brand = '';
  if (jsonLd.brand && jsonLd.brand.name) {
    brand = jsonLd.brand.name;
  }
  if (!brand) {
    $('tr.woocommerce-product-attributes-item, .product-attribute').each((_, row) => {
      const label = $(row).find('.woocommerce-product-attributes-item__label, .label').text().trim().toLowerCase();
      const val = $(row).find('.woocommerce-product-attributes-item__value, .value').text().trim();
      if (label.includes('marke') || label.includes('brand') || label.includes('hersteller')) {
        brand = val;
      }
    });
  }

  // ── Catégorie ─────────────────────────────────────────────────────────────
  const category = $('.posted_in a')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(' > ');

  // Breadcrumb from JSON-LD
  let breadcrumbCat = '';
  if (jsonLd['@context']) {
    // Try to get from breadcrumb in the full JSON-LD
    const scripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i += 1) {
      try {
        const data = JSON.parse($(scripts[i]).html());
        const graph = data['@graph'] || [data];
        for (const item of graph) {
          if (item['@type'] === 'BreadcrumbList' && item.itemListElement) {
            const crumbs = item.itemListElement
              .map((e) => e.item?.name || e.name)
              .filter((n) => n && n !== 'Start');
            breadcrumbCat = crumbs.join(' > ');
          }
        }
      } catch (_) {}
    }
  }

  const productType = category || breadcrumbCat || '';

  // ── Description courte ────────────────────────────────────────────────────
  const shortDesc = $(
    '.woocommerce-product-details__short-description, .product-short-description'
  )
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  // ── Description complète (HTML) ───────────────────────────────────────────
  let fullDescHtml = '';
  const descPanel = $('#tab-description, .woocommerce-Tabs-panel--description');
  if (descPanel.length) {
    // Get HTML, clean up
    fullDescHtml = descPanel.html() || '';
    // Remove inline scripts/styles
    fullDescHtml = fullDescHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    fullDescHtml = fullDescHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    // Trim whitespace between tags
    fullDescHtml = fullDescHtml.replace(/\s+/g, ' ').trim();
  }

  // Plain text description
  const fullDescText = fullDescHtml
    ? $('<div>').html(fullDescHtml).text().replace(/\s+/g, ' ').trim()
    : shortDesc;

  // ── Images ────────────────────────────────────────────────────────────────
  const images = new Set();

  // From JSON-LD
  if (jsonLd.image) {
    if (Array.isArray(jsonLd.image)) {
      jsonLd.image.forEach((i) => images.add(i));
    } else {
      images.add(jsonLd.image);
    }
  }

  // From WooCommerce gallery
  $('.woocommerce-product-gallery__image a, .woocommerce-product-gallery__image img').each((_, el) => {
    const src =
      $(el).attr('href') ||
      $(el).attr('data-large_image') ||
      $(el).attr('data-src') ||
      $(el).attr('src') ||
      '';
    if (src && !src.includes('placeholder') && !src.includes('lazy.png')) {
      images.add(src);
    }
  });

  // og:image fallback
  if (images.size === 0) {
    const og = $('meta[property="og:image"]').attr('content');
    if (og) images.add(og);
  }

  const imageList = [...images];
  const imageLink = imageList[0] || '';
  const additionalImageLinks = imageList.slice(1).join(', ');

  // ── Stock ─────────────────────────────────────────────────────────────────
  let availability = 'in stock';
  if (jsonLd.offers && jsonLd.offers[0]) {
    const av = jsonLd.offers[0].availability || '';
    availability = av.includes('InStock') ? 'in stock' : 'out of stock';
  }
  if (availability === 'in stock') {
    // Double-check HTML
    if ($('.out-of-stock').length > 0 && $('.in-stock').length === 0) {
      availability = 'out of stock';
    }
  }

  // ── Vendor / Seller ───────────────────────────────────────────────────────
  let vendor = 'Wismarlobau GmbH';
  if (jsonLd.offers && jsonLd.offers[0] && jsonLd.offers[0].seller) {
    vendor = jsonLd.offers[0].seller.name || vendor;
  }

  console.log(`  ✓ ${title || url}`);

  return {
    id: sku || url.split('/').filter(Boolean).pop(),
    title,
    description: fullDescText,
    descriptionHtml: fullDescHtml,
    shortDescription: shortDesc,
    link: url,
    image_link: imageLink,
    additional_image_link: additionalImageLinks,
    availability,
    price,
    sale_price: salePrice,
    brand,
    vendor,
    gtin,
    mpn,
    condition: 'new',
    product_type: productType,
    sku,
  };
}

// ─── Construction du CSV Shopify ─────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[äöü]/g, (m) => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[m]))
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapGoogleCategory(productType) {
  const text = (productType || '').toLowerCase();
  if (text.includes('pellet')) return 'Hardware > Heating, Ventilation & Air Conditioning > Fuel > Wood Pellets & Biomass Fuel';
  if (text.includes('brikett') || text.includes('briquet')) return 'Hardware > Heating, Ventilation & Air Conditioning > Fuel > Wood Pellets & Biomass Fuel';
  if (text.includes('holz') || text.includes('firewood') || text.includes('brennholz')) return 'Hardware > Heating, Ventilation & Air Conditioning > Fuel > Firewood';
  if (text.includes('regal') || text.includes('unterstand')) return 'Home & Garden > Fireplaces & Accessories > Fireplace Accessories';
  return 'Hardware > Heating, Ventilation & Air Conditioning > Fuel';
}

function buildShopifyCsv(products) {
  const headers = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags',
    'Published', 'Option1 Name', 'Option1 Value',
    'Variant SKU', 'Variant Grams',
    'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy',
    'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
    'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode',
    'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card',
    'SEO Title', 'SEO Description',
    'Google Shopping / Google Product Category',
    'Google Shopping / MPN', 'Google Shopping / Condition',
    'Google Shopping / Custom Product',
    'Variant Weight Unit', 'Status',
  ];

  const rows = products
    .filter((p) => p.title && !p.error)
    .map((p) => {
      const handle = slugify(p.title);
      const googleCat = mapGoogleCategory(p.product_type);
      const bodyHtml = p.descriptionHtml || `<p>${p.description}</p>`;
      const seoDesc = (p.shortDescription || p.description || '').slice(0, 320);

      return [
        handle,
        p.title,
        bodyHtml,
        p.vendor || 'Wismarlobau GmbH',
        googleCat,
        p.product_type || '',
        p.product_type || '',
        'TRUE',
        'Title',
        'Default Title',
        p.sku || '',
        '0',
        'shopify',
        '100',
        'deny',
        'manual',
        p.price ? p.price.replace(' EUR', '') : '',
        p.sale_price ? p.sale_price.replace(' EUR', '') : '',
        'TRUE',
        'TRUE',
        p.gtin || '',
        p.image_link || '',
        p.image_link ? '1' : '',
        p.title || '',
        'FALSE',
        p.title || '',
        seoDesc,
        googleCat,
        p.mpn || '',
        'new',
        'FALSE',
        'kg',
        'active',
      ];
    });

  return [headers, ...rows];
}

// ─── Construction du CSV GMC ─────────────────────────────────────────────────

function buildGmcCsv(products) {
  const headers = [
    'id', 'title', 'description', 'link', 'image_link',
    'additional_image_link', 'availability', 'price', 'sale_price',
    'brand', 'gtin', 'mpn', 'condition', 'product_type',
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
    console.log(`\n🔍 Scraping de ${urls.length} produits…\n`);
    const products = await processBatch(urls, scrapeProduct);

    const valid = products.filter((p) => !p.error);
    const errors = products.filter((p) => p.error);
    console.log(`\n✅ ${valid.length} produits scrapés avec succès`);
    if (errors.length) console.log(`⚠️  ${errors.length} erreurs`);

    // Save JSON (full data)
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(valid, null, 2), 'utf8');
    console.log(`💾 JSON: ${OUTPUT_JSON}`);

    // Save Shopify CSV
    const shopifyRows = buildShopifyCsv(valid);
    fs.writeFileSync(OUTPUT_SHOPIFY, stringify(shopifyRows), 'utf8');
    console.log(`💾 Shopify CSV: ${OUTPUT_SHOPIFY}`);

    // Save GMC CSV
    const gmcRows = buildGmcCsv(valid);
    fs.writeFileSync(OUTPUT_GMC, stringify(gmcRows), 'utf8');
    console.log(`💾 GMC CSV: ${OUTPUT_GMC}`);

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('RÉSUMÉ');
    console.log('═'.repeat(70));
    valid.forEach((p) => {
      console.log(`  • ${p.title}`);
      console.log(`    Prix: ${p.price} | Marque: ${p.brand || 'N/A'} | Cat: ${p.product_type || 'N/A'}`);
    });
    console.log('═'.repeat(70));
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

main();
