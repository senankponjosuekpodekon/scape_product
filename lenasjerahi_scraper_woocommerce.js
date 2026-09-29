import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { stringify } from 'csv-stringify/sync';

const SITEMAP_URL = 'https://lenasjerahi.es/wp-sitemap-posts-product-1.xml';
const OUTPUT_FILE = path.resolve('./lenasjerahi_products_woocommerce.csv');
const DELAY_MS = 1000;
const CONCURRENCY = 2;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 20000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml',
};

function parsePrice(text = '') {
  if (!text) return '';
  return text
    .replace(/[^\d,\.]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        const wait = 1500 * (i + 1);
        console.warn(`  ↩ Retry ${i + 1}/${retries - 1} for ${url}: ${err.message}`);
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

async function fetchProductUrls() {
  console.log('📥  Chargement du sitemap produits…');
  const xml = await fetchWithRetry(SITEMAP_URL);
  const parsed = await parseStringPromise(xml);
  const urls = parsed.urlset.url.map((u) => u.loc[0]);
  console.log(`    → ${urls.length} URLs produits trouvées`);
  return urls;
}

async function scrapeProduct(url) {
  let html;
  try {
    html = await fetchWithRetry(url);
  } catch (err) {
    console.error(`  ✗ Impossible de charger ${url}: ${err.message}`);
    return { url, error: err.message };
  }

  const $ = cheerio.load(html);
  const title =
    $('h1.product_title').text().trim() ||
    $('h1.entry-title').text().trim() ||
    $('h1').first().text().trim();

  let regularPrice = '';
  let salePrice = '';
  const delEl = $('p.price del .woocommerce-Price-amount.amount').first();
  const insEl = $('p.price ins .woocommerce-Price-amount.amount').first();
  if (delEl.length && insEl.length) {
    regularPrice = parsePrice(delEl.text());
    salePrice = parsePrice(insEl.text());
  } else {
    regularPrice = parsePrice($('p.price .woocommerce-Price-amount.amount').first().text());
  }

  let sku = $('span.sku').text().trim();
  if (!sku) sku = $('meta[name="sku"]').attr('content') || '';
  if (!sku) sku = url.split('/').filter(Boolean).pop() || '';

  const categories = $('.posted_in a')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(', ');

  const shortDesc = $('.woocommerce-product-details__short-description, .product-short-description')
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  const fullDesc = $('#tab-description, .woocommerce-Tabs-panel--description')
    .clone()
    .find('.title-tab-desc')
    .remove()
    .end()
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  const description = fullDesc || shortDesc;

  const images = new Set();
  $('.woocommerce-product-gallery__image a, .woocommerce-product-gallery__image img').each((_, el) => {
    const src = $(el).attr('href') || $(el).attr('data-large_image') || $(el).attr('src') || $(el).attr('data-src') || '';
    if (src && !src.includes('placeholder')) images.add(src);
  });
  $('[data-large_image]').each((_, el) => {
    const src = $(el).attr('data-large_image');
    if (src) images.add(src);
  });
  if (images.size === 0) {
    const og = $('meta[property="og:image"]').attr('content');
    if (og) images.add(og);
  }

  const imageList = [...images];
  const imageField = imageList.join(', ');

  const inStock = $('p.in-stock, .in-stock').length > 0 || $('button.single_add_to_cart_button').length > 0;

  const tags = $('.tagged_as a')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(', ');

  let brand = '';
  $('tr.woocommerce-product-attributes-item').each((_, row) => {
    const label = $(row).find('.woocommerce-product-attributes-item__label').text().trim().toLowerCase();
    const val = $(row).find('.woocommerce-product-attributes-item__value').text().trim();
    if (label.includes('marca') || label.includes('brand') || label.includes('fabricante')) brand = val;
  });

  return {
    Type: 'simple',
    SKU: sku,
    Name: title,
    Published: 1,
    'Visibility in catalog': 'visible',
    'Short description': shortDesc,
    Description: description,
    'In stock?': inStock ? 1 : 0,
    'Regular price': regularPrice,
    'Sale price': salePrice,
    Categories: categories,
    Tags: tags,
    Images: imageField,
    Brand: brand,
    GTIN: '',
    'Product URL': url,
  };
}

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

  const rows = products.filter((p) => p.Name && !p.error).map((p) =>
    headers.map((header) => p[header] || '')
  );

  return [headers, ...rows];
}

async function main() {
  try {
    const urls = await fetchProductUrls();
    const products = await processBatch(urls, scrapeProduct);
    console.log(`    → ${products.filter((p) => !p.error).length} produits scrapés`);
    const csv = stringify(buildCsvRows(products), { quoted: true });
    fs.writeFileSync(OUTPUT_FILE, csv, 'utf8');
    console.log(`💾 CSV WooCommerce sauvegardé: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

main();