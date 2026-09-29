import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

const LINKS_FILE = '/tmp/neubach_links.json';
const JSON_OUT = './neubach_products.json';
const SHOPIFY_CSV = './neubach_products_shopify.csv';
const GMC_CSV = './neubach_products_gmc.csv';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        },
        timeout: 60000,
      });
      return data;
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`  ↩ Retry ${i + 1} ${url}: ${err.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}

function parseLdJson($) {
  const products = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data['@type'] === 'Product') products.push(data);
      if (Array.isArray(data)) {
        data.forEach(item => { if (item['@type'] === 'Product') products.push(item); });
      }
      if (data['@graph']) {
        data['@graph'].forEach(item => { if (item['@type'] === 'Product') products.push(item); });
      }
    } catch (_) {}
  });
  return products[0] || null;
}

function extractImages($) {
  const imgSet = new Set();

  // WooCommerce gallery links
  $('.woocommerce-product-gallery__image a, .woocommerce-product-gallery__image img, .flex-control-thumbs img').each((i, el) => {
    const $el = $(el);
    let src = $el.attr('href') || $el.attr('data-src') || $el.attr('data-large_image') || $el.attr('src');
    if (src && !src.startsWith('data:')) {
      // Convert resized to full size if possible
      src = src.replace(/-\d+x\d+\.(jpg|jpeg|png|webp|avif|gif)$/i, '.$1');
      if (src.includes('wp-content/uploads')) imgSet.add(src);
    }
  });

  // JSON-LD image
  const ld = parseLdJson($);
  if (ld && ld.image) {
    if (Array.isArray(ld.image)) ld.image.forEach(im => imgSet.add(im));
    else imgSet.add(ld.image);
  }

  // og:image
  const ogImage = $('meta[property="og:image:secure_url"]').attr('content') || $('meta[property="og:image"]').attr('content');
  if (ogImage) imgSet.add(ogImage);

  return [...imgSet].filter(u => !u.includes('LogoBriefpapier') && !u.includes('logo') && !u.includes('placeholder'));
}

function extractCategory($, text) {
  let cat = '';
  const match = text.match(/Kategorie\s*[:\-]?\s*([A-Za-zäöüÄÖÜß\s&/\-–—]+)/i);
  if (match) cat = match[1].trim();
  if (!cat) {
    // Breadcrumb
    const bc = $('.woocommerce-breadcrumb, .breadcrumbs').text();
    const parts = bc.split(/[›>/]/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) cat = parts[parts.length - 1];
  }
  return cat;
}

function extractPrice(ld, text) {
  let price = '';
  if (ld && ld.offers) {
    const offers = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
    if (offers.priceSpecification) {
      const spec = Array.isArray(offers.priceSpecification) ? offers.priceSpecification[0] : offers.priceSpecification;
      price = spec.price || spec.value || '';
    } else if (offers.price) {
      price = String(offers.price).replace(/[^\d.,]/g, '');
    }
  }
  if (!price) {
    const m = text.match(/(\d{1,}(?:[.,]\d{3})*[.,]\d{0,2})\s*[€$£]/);
    if (m) price = m[1].replace(/\./g, '').replace(/,/g, '.');
  }
  if (price) {
    const p = parseFloat(String(price).replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(p)) return p.toFixed(2) + ' EUR';
  }
  return '';
}

function cleanDescription(text) {
  return text
    .replace(/^\s*Description\s*/i, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractDescription($) {
  let desc = '';
  const selectors = ['.woocommerce-Tabs-panel--description', '.woocommerce-product-details__short-description', '.product-description', '[class*="product__description"]', '.summary.entry-summary'];
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length) {
      const txt = el.text().trim();
      if (txt.length > desc.length && !txt.includes('©')) {
        desc = txt;
      }
    }
  }
  // If no description, use JSON-LD description
  if (!desc) {
    const ld = parseLdJson($);
    if (ld && ld.description) desc = ld.description;
  }
  return cleanDescription(desc);
}

function scrapeProduct(html, url) {
  const $ = cheerio.load(html);
  const ld = parseLdJson($);
  const text = $('body').text();

  const title = ld?.name || $('h1').first().text().trim() || $('title').text().replace(/\s*–\s*.*/, '').trim();
  const description = extractDescription($);
  const images = extractImages($);
  const category = extractCategory($, text);
  const price = extractPrice(ld, text);

  const sku = ld?.sku || $('.sku, .product-sku').first().text().trim() || '';
  const availability = (ld?.offers?.availability || '').includes('InStock') || (ld?.offers?.availability || '').includes('InStock') ? 'in stock' : 'out of stock';

  return { url, title, description, images, category, price, sku, availability, ld };
}

function normalize(raw) {
  return {
    id: raw.sku || raw.url.split('/').filter(Boolean).pop(),
    title: raw.title,
    description: raw.description,
    shortDescription: raw.description.slice(0, 300),
    link: raw.url,
    imageLink: raw.images[0] || '',
    additionalImageLinks: raw.images.slice(1).join(', '),
    images: raw.images,
    availability: raw.availability,
    price: raw.price,
    salePrice: '',
    brand: 'Neubach Container',
    vendor: 'Neubach Container',
    sku: raw.sku,
    mpn: raw.sku,
    gtin: '',
    condition: 'new',
    productType: raw.category || classifyType(raw.title),
    colorOptions: [],
    deliveryTime: '',
    handle: raw.url.split('/').filter(Boolean).pop(),
    raw: { ld: raw.ld }
  };
}

function classifyType(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('pool')) return 'Pool Container';
  if (t.includes('kühl')) return 'Kühlcontainer';
  if (t.includes('büro')) return 'Bürocontainer';
  if (t.includes('sanitär') || t.includes('wc') || t.includes('dusche') || t.includes('toilette') || t.includes('urinal') || t.includes('waschbecken')) return 'Sanitärcontainer';
  if (t.includes('lager')) return 'Lagercontainer';
  if (t.includes('bar')) return 'Bar Container';
  if (t.includes('wohn') || t.includes('tiny') || t.includes('haus') || t.includes('home')) return 'Wohncontainer';
  if (t.includes('seecontainer') || t.includes('versand') || t.includes('shipping') || t.includes('container')) return 'Seecontainer';
  if (t.includes('container')) return 'Container';
  return 'Container';
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[ä]/g, 'ae').replace(/[ö]/g, 'oe').replace(/[ü]/g, 'ue').replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function googleCategory(productType, title) {
  const t = `${productType} ${title}`.toLowerCase();
  if (t.includes('pool')) return 'Home & Garden > Pools & Spas';
  if (t.includes('kühl')) return 'Business & Industrial > Food Service > Refrigeration Equipment';
  if (t.includes('büro') || t.includes('lager') || t.includes('seecontainer') || t.includes('versand') || t.includes('container')) return 'Business & Industrial > Material Handling > Shipping Containers';
  if (t.includes('sanitär') || t.includes('wc') || t.includes('dusche') || t.includes('toilette')) return 'Home & Garden > Bathroom Accessories';
  if (t.includes('bar')) return 'Furniture > Outdoor Furniture > Outdoor Kitchens & Bars';
  if (t.includes('wohn') || t.includes('tiny') || t.includes('haus')) return 'Home & Garden > Household & Cleaning > Storage & Organization > Storage Buildings';
  return 'Business & Industrial > Material Handling > Shipping Containers';
}

function buildShopifyCsv(products) {
  const headers = [
    'Handle','Title','Body (HTML)','Vendor','Product Category','Type','Tags','Published',
    'Option1 Name','Option1 Value','Option2 Name','Option2 Value','Option3 Name','Option3 Value',
    'Variant SKU','Variant Grams','Variant Inventory Tracker','Variant Inventory Qty','Variant Inventory Policy',
    'Variant Fulfillment Service','Variant Price','Variant Compare At Price','Variant Requires Shipping','Variant Taxable',
    'Variant Barcode','Image Src','Image Position','Image Alt Text','Gift Card','SEO Title','SEO Description',
    'Google Shopping / Google Product Category','Google Shopping / MPN','Google Shopping / Condition','Google Shopping / Custom Product','Variant Weight Unit','Status'
  ];
  const rows = [];
  products.forEach(p => {
    const handle = p.handle || slugify(p.title);
    const googleCat = googleCategory(p.productType, p.title);
    const bodyHtml = p.description ? p.description.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('') : '';
    const baseRow = [
      handle, p.title, bodyHtml, p.vendor, googleCat, p.productType, p.productType, 'TRUE',
      'Title', 'Default Title', '', '', '', '', p.sku, '0', 'shopify', '10', 'deny', 'manual',
      p.price ? p.price.replace(' EUR', '') : '', p.salePrice ? p.salePrice.replace(' EUR', '') : '', 'TRUE', 'TRUE', p.gtin,
      '', '', '', 'FALSE', p.title, p.shortDescription.slice(0, 320) || '',
      googleCat, p.mpn || '', 'new', 'FALSE', 'kg', 'active'
    ];
    const firstRow = [...baseRow];
    firstRow[25] = p.imageLink || '';
    firstRow[26] = p.imageLink ? '1' : '';
    firstRow[27] = p.title;
    rows.push(firstRow);
    p.images.slice(1).forEach((img, idx) => {
      rows.push([
        handle, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        img, String(idx + 2), p.title, '', '', '', '', '', '', '', '', 'active'
      ]);
    });
  });
  return [headers, ...rows];
}

function buildGmcCsv(products) {
  const headers = ['id','title','description','link','image_link','additional_image_link','availability','price','sale_price','brand','gtin','mpn','condition','product_type'];
  const rows = products.map(p => [p.id || '', p.title || '', p.description || '', p.link || '', p.imageLink || '', p.additionalImageLinks || '', p.availability || '', p.price || '', p.salePrice || '', p.brand || '', p.gtin || '', p.mpn || '', 'new', p.productType || '']);
  return [headers, ...rows];
}

async function main() {
  const productUrls = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
  console.log(`Found ${productUrls.length} product URLs\n`);

  const raws = [];
  const concurrency = 3;
  for (let i = 0; i < productUrls.length; i += concurrency) {
    const batch = productUrls.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(async (url) => {
      try {
        const html = await fetchWithRetry(url);
        const raw = scrapeProduct(html, url);
        return raw;
      } catch (err) {
        console.warn(`✗ Error ${url}: ${err.message}`);
        return null;
      }
    }));
    raws.push(...results.filter(Boolean));
    console.log(`  Progress: ${Math.min(i + concurrency, productUrls.length)}/${productUrls.length}`);
    await sleep(400);
  }

  const products = raws.map(normalize);

  fs.writeFileSync(JSON_OUT, JSON.stringify(products, null, 2), 'utf8');
  fs.writeFileSync(SHOPIFY_CSV, stringify(buildShopifyCsv(products)), 'utf8');
  fs.writeFileSync(GMC_CSV, stringify(buildGmcCsv(products)), 'utf8');

  console.log(`\n✅ ${products.length}/${productUrls.length} products scraped`);
  console.log('💾 Saved:');
  console.log(`  ${JSON_OUT}`);
  console.log(`  ${SHOPIFY_CSV}`);
  console.log(`  ${GMC_CSV}`);

  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log('RÉSUMÉ');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  products.slice(0, 15).forEach(p => {
    console.log(`  • ${p.title}`);
    console.log(`    Prix: ${p.price} | SKU: ${p.sku} | Stock: ${p.availability} | Images: ${p.images.length} | Type: ${p.productType}`);
  });
  if (products.length > 15) console.log(`  ... and ${products.length - 15} more`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
