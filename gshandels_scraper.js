/**
 * Scraper - gshandels.com
 *
 * Builds a Google Merchant Center feed from GSHandels product sitemap and
 * saves a full raw JSON export with page-level product details.
 *
 * Usage:
 *   node gshandels_scraper.js
 *   node gshandels_scraper.js --limit=10
 *
 * Outputs:
 *   gshandels-products-raw.json
 *   gshandels-google-merchant-feed.csv
 *   gshandels-validation-report.json
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { stringify } from 'csv-stringify/sync';

const SITEMAP_URL = 'https://gshandels.com/wp-sitemap-posts-product-1.xml';
const DEFAULT_OUT_PREFIX = 'gshandels';
const SITE_DOMAIN = 'gshandels.com';

const DELAY_MS = 800;
const CONCURRENCY = 2;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml,application/xml',
};

const GMC_HEADERS = [
  'id',
  'item_group_id',
  'title',
  'description',
  'link',
  'image_link',
  'additional_image_link',
  'availability',
  'price',
  'sale_price',
  'condition',
  'brand',
  'mpn',
  'gtin',
  'identifier_exists',
  'google_product_category',
  'product_type',
  'color',
  'size',
  'material',
  'shipping_weight',
  'product_detail',
  'product_highlight',
];

const CATEGORY_MAPPING = {
  'container': '594',
  'seecontainer': '594',
  'bürocontainer': '594',
  'wohncontainer': '594',
  'lagercontainer': '594',
  'sanitärcontainer': '594',
  'high-cube': '594',
  'tiny-house': '594',
  'pool': '594',
  'sauna': '594',
  'barcontainer': '594',
  'kühlcontainer': '594',
  'flat-rack': '594',
  'open-top': '594',
  'reefer': '594',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getArg(name, fallback = '') {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function cleanText(value = '') {
  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(html = '') {
  return cleanText(cheerio.load(`<div>${html}</div>`).text());
}

function slugFromUrl(url = '') {
  return url
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '')
    .split('/')
    .filter(Boolean)
    .pop();
}

function normalizeId(value = '') {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).slice(0, 6);
}

function normalizeProductId(value = '') {
  const normalized = normalizeId(value);
  if (normalized.length <= 50) return normalized;
  return `${normalized.slice(0, 43)}-${hashString(normalized)}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function schemaTypes(node) {
  return asArray(node?.['@type']).map(String);
}

function decodeSchemaText(value = '') {
  return stripHtml(value);
}

function truncate(value = '', maxLength = 5000) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function formatPrice(amount, currency = 'EUR') {
  if (amount === undefined || amount === null || amount === '') return '';
  const normalized = String(amount)
    .replace(/[^\d,.-]/g, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const numeric = Number.parseFloat(normalized);
  if (Number.isNaN(numeric)) return '';
  return `${numeric.toFixed(2)} ${currency || 'EUR'}`;
}

function normalizeAvailability(availability = '') {
  const lower = String(availability).toLowerCase();
  if (/out.?of.?stock|vergriffen|nicht.?verfügbar/i.test(lower)) return 'out_of_stock';
  if (/in.?stock|verfügbar|auf.?lager/i.test(lower)) return 'in_stock';
  if (/preorder|vorbestellen/i.test(lower)) return 'preorder';
  if (/backorder|nachbestellung/i.test(lower)) return 'backorder';
  return 'in_stock';
}

function googleCategory(productType = '') {
  const lower = productType.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
    if (lower.includes(key)) return value;
  }
  return '594';
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: HEADERS,
        timeout: TIMEOUT_MS,
        maxRedirects: 5,
      });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      if (attempt === retries) throw error;
      if (status === 404 || status === 410) throw error;
      const wait = DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`  Retry ${attempt}/${retries} for ${url} (${error.message}), waiting ${wait}ms`);
      await sleep(wait);
    }
  }
}

async function processBatch(items, processor) {
  const results = [];
  const queue = [...items];
  const workers = Array(CONCURRENCY)
    .fill(null)
    .map(async () => {
      while (queue.length) {
        const item = queue.shift();
        if (!item) break;
        await sleep(DELAY_MS);
        results.push(await processor(item));
      }
    });
  await Promise.all(workers);
  return results;
}

async function fetchProductUrls() {
  console.log(`Fetching product sitemap: ${SITEMAP_URL}`);
  const xml = await fetchWithRetry(SITEMAP_URL);
  const parsed = await parseStringPromise(xml);
  const urls = (parsed.urlset?.url || [])
    .map((entry) => entry.loc?.[0])
    .filter((url) => url && url.includes('/product/'));
  console.log(`Found ${urls.length} product URLs`);
  return urls;
}

function parseJsonLd($) {
  const nodes = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).html() || '{}');
      if (data['@graph']) {
        nodes.push(...data['@graph']);
      } else if (data['@type']) {
        nodes.push(data);
      }
    } catch {}
  });
  return nodes;
}

function buildImageMap(nodes) {
  const imageMap = new Map();
  for (const node of nodes) {
    if (!schemaTypes(node).includes('ImageObject')) continue;
    const key = node['@id'];
    const url = node.contentUrl || node.url;
    if (key && url) imageMap.set(key, url);
  }
  return imageMap;
}

function resolveImage(image, imageMap) {
  if (!image) return '';
  if (typeof image === 'string') return imageMap.get(image) || image;
  if (image.url || image.contentUrl) return image.url || image.contentUrl;
  if (image['@id']) return imageMap.get(image['@id']) || '';
  return '';
}

function extractImages(product, imageMap, $) {
  const schemaImages = asArray(product.image)
    .map((image) => resolveImage(image, imageMap))
    .filter(Boolean);

  const htmlImages = [];
  $('.woocommerce-product-gallery__image a, .woocommerce-product-gallery__image img, .product-image img, .single-product-image img').each(
    (_, element) => {
      const src =
        $(element).attr('href') ||
        $(element).attr('data-large_image') ||
        $(element).attr('data-src') ||
        $(element).attr('src') ||
        '';
      if (src && !src.includes('placeholder')) htmlImages.push(src);
    }
  );

  const ogImage = $('meta[property="og:image"]').attr('content');
  return unique([...schemaImages, ...htmlImages, ogImage]).filter(
    (url) => url && !/placeholder/i.test(url)
  );
}

function extractBreadcrumb(nodes, url, $) {
  const breadcrumb = nodes.find((node) => schemaTypes(node).includes('BreadcrumbList'));
  const items = asArray(breadcrumb?.itemListElement)
    .map((item) => cleanText(item.name))
    .filter(Boolean);

  if (items.length) return items;

  return $('.woocommerce-breadcrumb a, .breadcrumb a, nav.breadcrumbs a')
    .map((_, element) => cleanText($(element).text()))
    .get()
    .concat([cleanText($('h1').first().text()) || slugFromUrl(url)]);
}

function extractProductType(breadcrumbs) {
  return breadcrumbs
    .filter((part) => !/^start$/i.test(part))
    .filter((part) => !/^home$/i.test(part))
    .filter((part) => !/^produkte$/i.test(part))
    .slice(0, -1)
    .join(' > ');
}

function extractTechnicalDetails($) {
  const details = [];
  
  $('#tab-additional_information tr.woocommerce-product-attributes-item, .woocommerce-product-attributes tr').each((_, row) => {
    const name = cleanText($(row).find('th, .woocommerce-product-attributes-item__label').text());
    const value = cleanText($(row).find('td, .woocommerce-product-attributes-item__value').text());
    if (name && value) details.push({ section: 'Technische Daten', name, value });
  });

  $('.product-specs table tr, .specifications table tr').each((_, row) => {
    const name = cleanText($(row).find('th').text());
    const value = cleanText($(row).find('td').text());
    if (name && value && !details.find(d => d.name === name)) {
      details.push({ section: 'Spezifikationen', name, value });
    }
  });

  return details;
}

function extractHighlights($) {
  const highlights = [];

  $('#tab-description li, .woocommerce-product-details__short-description li, .product-description li')
    .slice(0, 12)
    .each((_, element) => {
      const text = cleanText($(element).text());
      if (text && text.length <= 160 && text.length >= 8) highlights.push(text);
    });

  $('.product-feature, .feature-item, .product-benefit').slice(0, 6).each((_, element) => {
    const text = cleanText($(element).text());
    if (text && text.length <= 220 && text.length >= 8) highlights.push(text);
  });

  return unique(highlights).slice(0, 10);
}

function extractOptions($) {
  const options = {};
  $('select[name^="attribute_"], .variations select').each((_, element) => {
    const name = $(element).attr('name')?.replace(/^attribute_pa_/, '').replace(/^attribute_/, '') || '';
    const values = $(element)
      .find('option')
      .map((__, option) => cleanText($(option).text()))
      .get()
      .filter((value) => value && !/^wählen sie/i.test(value) && !/^auswählen/i.test(value));
    if (name && values.length) options[name] = unique(values);
  });
  return options;
}

function offerPrices(offer) {
  const specs = asArray(offer?.priceSpecification);
  const list = specs.find((spec) => String(spec.priceType || '').includes('ListPrice'));
  const current = specs.find((spec) => !String(spec.priceType || '').includes('ListPrice'));
  const currency =
    current?.priceCurrency || list?.priceCurrency || offer?.priceCurrency || 'EUR';
  const basePrice = list?.price || offer?.price || current?.price || '';
  const salePrice = list && current ? current.price : '';
  return {
    price: formatPrice(basePrice, currency),
    sale_price: formatPrice(salePrice, currency),
  };
}

function extractHtmlProductBasics(url, $) {
  const title =
    cleanText($('h1.product_title, h1.entry-title, h1').first().text()) || slugFromUrl(url);

  const descriptionText = cleanText($('.woocommerce-product-details__short-description, .product-short-description, .product-description').text());
  const fullDescriptionText = cleanText($('#tab-description, .product-full-description').text());

  const sku = cleanText($('.sku, .product-sku').first().text());

  const outOfStock =
    $('.out-of-stock, p.out-of-stock, .stock.out-of-stock').length > 0 ||
    /OutOfStock|vergriffen/i.test($('link[itemprop="availability"]').attr('href') || '') ||
    /vergriffen|nicht verfügbar/i.test($('.stock, .availability').text() || '');
  const availability = outOfStock ? 'out_of_stock' : 'in_stock';

  const priceDel = $('p.price del .woocommerce-Price-amount.amount, del .woocommerce-Price-amount').first().text();
  const priceIns = $('p.price ins .woocommerce-Price-amount.amount, ins .woocommerce-Price-amount').first().text();
  const priceNormal = $('p.price .woocommerce-Price-amount.amount, .summary .woocommerce-Price-amount, .price .amount').first().text();

  const parse = (value) =>
    String(value || '')
      .replace(/[^\d,.-]/g, '')
      .replace(/\s/g, '')
      .replace(',', '.');

  const metaPrice =
    $('meta[property="product:price:amount"]').attr('content') ||
    $('meta[property="og:price:amount"]').attr('content') ||
    $('meta[itemprop="price"]').attr('content') ||
    '';
  const metaCurrency =
    $('meta[property="product:price:currency"]').attr('content') ||
    $('meta[property="og:price:currency"]').attr('content') ||
    $('meta[itemprop="priceCurrency"]').attr('content') ||
    'EUR';

  const basePrice = parse(priceDel || priceNormal || metaPrice);
  const salePrice = priceDel && priceIns ? parse(priceIns) : '';

  return {
    title,
    sku,
    short_description: descriptionText,
    description: fullDescriptionText || descriptionText,
    availability,
    price: formatPrice(basePrice, metaCurrency || 'EUR'),
    sale_price: formatPrice(salePrice, metaCurrency || 'EUR'),
  };
}

function getBrand(product, title = '', $) {
  if (typeof product.brand === 'string') return cleanText(product.brand);
  if (product.brand?.name) return cleanText(product.brand.name);

  const brandMeta = $('meta[property="product:brand"]').attr('content');
  if (brandMeta) return cleanText(brandMeta);

  return 'GSHandels';
}

function extractMaterial($, description = '') {
  const materials = [
    'cortenstahl', 'stahl', 'aluminium', 'holz', 'multiplex', 'kunststoff',
    'polypropylen', 'glas', 'beton', 'isolierung'
  ];
  
  const text = (description + ' ' + $('.woocommerce-product-attributes, .product-specs').text()).toLowerCase();
  
  for (const material of materials) {
    if (text.includes(material)) {
      return material.charAt(0).toUpperCase() + material.slice(1);
    }
  }
  return 'Stahl';
}

function extractColor($, description = '') {
  const colors = [
    'schwarz', 'weiß', 'grau', 'blau', 'grün', 'rot', 'gelb', 'braun',
    'anthrazit', 'silber', 'gold', 'orange'
  ];
  
  const text = (description + ' ' + $('.woocommerce-product-attributes, .product-specs').text() + ' ' + $('h1').first().text()).toLowerCase();
  
  for (const color of colors) {
    if (text.includes(color)) {
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
  }
  return '';
}

function variantAttributes(variant) {
  const parsed = new URL(variant.url || `https://${SITE_DOMAIN}/`);
  const attrs = {};
  for (const [key, value] of parsed.searchParams.entries()) {
    const normalized = key.replace(/^attribute_pa_/, '').replace(/^attribute_/, '');
    attrs[normalized] = cleanText(value.replace(/-/g, ' '));
  }
  return attrs;
}

function buildProductRows(page) {
  const base = page.product;
  const groupId = normalizeProductId(base.url || page.url);
  const sourceProducts = base.variants.length ? base.variants : [base.schemaProduct];

  return sourceProducts.map((source, index) => {
    const offer = asArray(source.offers)[0] || {};
    const prices = offerPrices(offer);
    const attrs = variantAttributes(source);
    const title = decodeSchemaText(source.name || base.title);
    const sourceDesc = decodeSchemaText(source.description || '');
    const baseLong = decodeSchemaText(base.description || '');
    const baseShort = decodeSchemaText(base.short_description || '');
    const description = truncate(
      baseLong && baseLong.length >= 200
        ? baseLong
        : sourceDesc && sourceDesc.length >= 100
          ? sourceDesc
          : baseLong || baseShort || sourceDesc,
      5000
    );
    const resolved = resolveImage(source.image, page.imageMap) || '';
    const basePrimary = (base.images || []).find((u) => u && !/placeholder/i.test(u)) || '';
    const image = !resolved || /placeholder/i.test(resolved) ? basePrimary || base.images[0] || '' : resolved;
    const images = unique([image, ...base.images]).filter((img) => img !== image);
    const variantSuffix = Object.values(attrs).filter(Boolean).join('-');
    const sourceBaseId = source.sku || source.mpn || slugFromUrl(source.url || base.url) || groupId;
    const id = normalizeProductId(
      base.variants.length
        ? `${sourceBaseId}-${variantSuffix || index + 1}`
        : sourceBaseId
    );

    return {
      id,
      item_group_id: base.variants.length ? groupId : '',
      title: truncate(title, 150),
      description,
      link: source.url || base.url,
      image_link: image,
      additional_image_link: images.slice(0, 10).join(', '),
      availability: normalizeAvailability(offer.availability || base.availability),
      price: prices.price || base.price,
      sale_price: prices.sale_price || base.sale_price,
      condition: 'new',
      brand: base.brand || 'GSHandels',
      mpn: source.mpn || source.sku || base.sku || '',
      gtin: source.gtin13 || source.gtin || '',
      identifier_exists: source.gtin13 || source.gtin || source.mpn || source.sku || base.sku ? 'yes' : 'no',
      google_product_category: googleCategory(base.product_type),
      product_type: base.product_type,
      color: attrs.color || attrs.farbe || base.color || '',
      size: attrs.größe || attrs.size || '',
      material: base.material || 'Stahl',
      shipping_weight: base.shipping_weight,
      product_detail: base.details
        .map((detail) => `${detail.section}:${detail.name}:${detail.value}`)
        .join(', '),
      product_highlight: base.highlights.join(', '),
    };
  });
}

async function scrapeProduct(url) {
  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);
    const nodes = parseJsonLd($);
    const imageMap = buildImageMap(nodes);
    const schemaProduct =
      nodes.find((node) => schemaTypes(node).includes('ProductGroup')) ||
      nodes.find((node) => schemaTypes(node).includes('Product'));

    const breadcrumbs = extractBreadcrumb(nodes, url, $);
    const productType = extractProductType(breadcrumbs);

    const htmlBasics = extractHtmlProductBasics(url, $);
    const title = schemaProduct
      ? decodeSchemaText(schemaProduct.name) || htmlBasics.title
      : htmlBasics.title;

    const shortDescription = schemaProduct
      ? decodeSchemaText(
          schemaProduct.description ||
            $('.woocommerce-product-details__short-description, .product-short-description').text() ||
            ''
        )
      : htmlBasics.short_description;

    const fullDescription = cleanText($('#tab-description, .product-full-description').text()) || shortDescription;

    const brand = schemaProduct ? getBrand(schemaProduct, title, $) : getBrand({}, title, $);
    const variants = schemaProduct ? asArray(schemaProduct.hasVariant) : [];

    const offers = schemaProduct ? asArray(schemaProduct.offers) : [];
    const firstOffer = offers[0] || {};
    const prices = schemaProduct
      ? offerPrices(firstOffer)
      : { price: htmlBasics.price, sale_price: htmlBasics.sale_price };

    const images = schemaProduct
      ? extractImages(schemaProduct, imageMap, $)
      : unique([
          $('meta[property="og:image"]').attr('content'),
          ...$(
            '.woocommerce-product-gallery__image a, .woocommerce-product-gallery__image img, .product-image img'
          )
            .map((_, el) => {
              const src =
                $(el).attr('href') ||
                $(el).attr('data-large_image') ||
                $(el).attr('data-src') ||
                $(el).attr('src') ||
                '';
              return src || '';
            })
            .get(),
        ]
          .filter(Boolean)
          .filter((value) => !/placeholder/i.test(value)));
    
    const details = extractTechnicalDetails($);
    const material = extractMaterial($, fullDescription);
    const color = extractColor($, fullDescription);

    const page = {
      url,
      imageMap,
      product: {
        schema_type: schemaProduct ? schemaTypes(schemaProduct).join(', ') : 'HTMLOnly',
        schema_id: schemaProduct ? schemaProduct['@id'] || '' : '',
        schemaProduct:
          schemaProduct ||
          ({
            '@type': 'Product',
            '@id': url,
            name: title,
            url,
            description: shortDescription,
            offers: [
              {
                '@type': 'Offer',
                url,
                availability:
                  htmlBasics.availability === 'out_of_stock'
                    ? 'http://schema.org/OutOfStock'
                    : 'http://schema.org/InStock',
                priceSpecification: [
                  {
                    '@type': 'UnitPriceSpecification',
                    price: cleanText(htmlBasics.price).split(' ')[0],
                    priceCurrency: 'EUR',
                    valueAddedTaxIncluded: true,
                  },
                ],
              },
            ],
            brand: brand ? { '@type': 'Brand', name: brand } : undefined,
          }),
        title,
        url: (schemaProduct && schemaProduct.url) || url,
        short_description: shortDescription,
        description: fullDescription,
        breadcrumbs,
        product_type: productType || breadcrumbs[breadcrumbs.length - 2] || 'Container',
        brand,
        sku: cleanText($('.sku, .product-sku').first().text()) || htmlBasics.sku,
        availability: normalizeAvailability(firstOffer.availability || htmlBasics.availability),
        price: prices.price || htmlBasics.price,
        sale_price: prices.sale_price || htmlBasics.sale_price,
        images,
        options: extractOptions($),
        details,
        highlights: extractHighlights($),
        rating: schemaProduct?.aggregateRating || null,
        reviews_count: schemaProduct?.aggregateRating?.reviewCount || '',
        variants,
        material,
        color,
        shipping_weight:
          details.find((detail) => /gewicht|weight/i.test(detail.name))?.value || '',
      },
    };

    page.gmc_rows = buildProductRows(page);
    console.log(`  OK ${title} (${page.gmc_rows.length} row(s))`);
    return page;
  } catch (error) {
    console.error(`  FAIL ${url}: ${error.message}`);
    return { url, error: error.message, gmc_rows: [] };
  }
}

function validateRows(rows) {
  const required = ['id', 'title', 'description', 'link', 'image_link', 'availability', 'price', 'condition'];
  const seen = new Set();
  const issues = [];

  rows.forEach((row, index) => {
    for (const field of required) {
      if (!row[field]) issues.push({ row: index + 2, id: row.id, field, issue: 'missing_required' });
    }
    if (row.id && seen.has(row.id)) {
      issues.push({ row: index + 2, id: row.id, field: 'id', issue: 'duplicate_id' });
    }
    if (row.id) seen.add(row.id);
    if (row.title && row.title.length > 150) {
      issues.push({ row: index + 2, id: row.id, field: 'title', issue: 'over_150_chars' });
    }
    if (row.description && row.description.length > 5000) {
      issues.push({ row: index + 2, id: row.id, field: 'description', issue: 'over_5000_chars' });
    }
    if (row.price && !/^\d+(\.\d{2})?\s+[A-Z]{3}$/.test(row.price)) {
      issues.push({ row: index + 2, id: row.id, field: 'price', issue: 'invalid_price_format' });
    }
    if (row.image_link && /placeholder/i.test(row.image_link)) {
      issues.push({ row: index + 2, id: row.id, field: 'image_link', issue: 'placeholder_image' });
    }
  });

  return {
    generated_at: new Date().toISOString(),
    rows: rows.length,
    issue_count: issues.length,
    issues,
  };
}

async function main() {
  const limit = Number.parseInt(getArg('limit', '0'), 10);
  const outPrefix = getArg('out_prefix', DEFAULT_OUT_PREFIX) || DEFAULT_OUT_PREFIX;
  const outputRaw = path.resolve(`./${outPrefix}-products-raw.json`);
  const outputGmc = path.resolve(`./${outPrefix}-google-merchant-feed.csv`);
  const outputReport = path.resolve(`./${outPrefix}-validation-report.json`);

  const urls = await fetchProductUrls();
  const selectedUrls = limit > 0 ? urls.slice(0, limit) : urls;

  console.log(`Scraping ${selectedUrls.length} product page(s)...`);
  const pages = await processBatch(selectedUrls, scrapeProduct);
  const rows = pages.flatMap((page) => page.gmc_rows || []);
  const report = validateRows(rows);

  fs.writeFileSync(
    outputRaw,
    JSON.stringify(
      pages.map((page) => ({ ...page, imageMap: undefined })),
      null,
      2
    ),
    'utf8'
  );
  fs.writeFileSync(
    outputGmc,
    stringify([GMC_HEADERS, ...rows.map((row) => GMC_HEADERS.map((field) => row[field] || ''))]),
    'utf8'
  );
  fs.writeFileSync(outputReport, JSON.stringify(report, null, 2), 'utf8');

  console.log(`\n========================================`);
  console.log(`Saved raw data: ${outputRaw}`);
  console.log(`Saved GMC feed: ${outputGmc}`);
  console.log(`Saved validation report: ${outputReport}`);
  console.log(`Rows: ${rows.length}; validation issues: ${report.issue_count}`);
  console.log(`========================================`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
