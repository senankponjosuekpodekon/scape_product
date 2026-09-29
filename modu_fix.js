import axios from 'axios';
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';
import * as cheerio from 'cheerio';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const LINKS_FILE = '/tmp/modu_links.json';
const JSON_FILE = './modu_products.json';
const SHOPIFY_CSV = './modu_products_shopify.csv';
const GMC_CSV = './modu_products_gmc.csv';

async function fetchProduct(url) {
  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    },
    timeout: 60000,
  });
  const $ = cheerio.load(html);
  const script = $('script.product-json[type="application/json"]').first().html();
  if (!script) throw new Error('No product JSON');
  const product = JSON.parse(script);

  const title = $('title').text().replace(/\s*–\s*MODULUXE GMBH\s*$/, '').trim();
  const bodyText = $('body').text();
  const stock = bodyText.toLowerCase().includes('auf lager') ? 'in stock' : 'out of stock';

  return { product, meta: { title, stock, bodyText } };
}

function cleanHtmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '\n- ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
    .replace(/\n\s*\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

function fixPrice(price) {
  if (typeof price === 'number') {
    const p = price / 100;
    return p.toFixed(2) + ' EUR';
  }
  if (!price) return '';
  const s = String(price).replace(/[^\d,.]/g, '').replace(/\./g, '').replace(/,/g, '.');
  const p = parseFloat(s);
  if (!isNaN(p) && p > 0) {
    const final = p > 10000 ? p / 100 : p;
    return final.toFixed(2) + ' EUR';
  }
  return '';
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
  if (t.includes('seecontainer') || t.includes('versandbehälter') || t.includes('shipping') || t.includes('schiffscontainer')) return 'Seecontainer';
  if (t.includes('container')) return 'Container';
  return 'Container';
}

function normalizeProduct(product, meta, url) {
  const variant = product.variants && product.variants[0] ? product.variants[0] : {};
  const title = product.title || meta.title || '';

  const price = fixPrice(variant.price) || fixPrice(product.price);

  const rawDesc = product.description || '';
  const cleanDescription = cleanHtmlToText(rawDesc);

  const imgSet = new Set();
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach(img => {
      const src = typeof img === 'string' ? img : (img && img.src);
      if (src) {
        const u = src.startsWith('//') ? 'https:' + src : src;
        imgSet.add(u);
      }
    });
  }
  if (product.featured_image) imgSet.add(product.featured_image.startsWith('//') ? 'https:' + product.featured_image : product.featured_image);
  if (variant.featured_image && variant.featured_image.src) imgSet.add(variant.featured_image.src.startsWith('//') ? 'https:' + variant.featured_image.src : variant.featured_image.src);
  const images = [...imgSet];

  const sku = variant.sku || product.variants?.map(v => v.sku).filter(Boolean)[0] || product.handle || url.split('/').pop();

  return {
    id: sku,
    title,
    description: cleanDescription,
    shortDescription: cleanDescription.slice(0, 300),
    link: url,
    imageLink: images[0] || '',
    additionalImageLinks: images.slice(1).join(', '),
    images,
    availability: meta.stock || 'in stock',
    price,
    salePrice: '',
    brand: 'MODULUXE GMBH',
    vendor: 'MODULUXE GMBH',
    sku,
    mpn: sku,
    gtin: '',
    condition: 'new',
    productType: product.type || classifyType(title),
    colorOptions: [],
    handle: product.handle || url.split('/').pop(),
    raw: { product }
  };
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
    // First row with first image and variant data
    const firstRow = [...baseRow];
    firstRow[25] = p.imageLink || ''; // Image Src
    firstRow[26] = p.imageLink ? '1' : ''; // Image Position
    firstRow[27] = p.title; // Image Alt Text
    rows.push(firstRow);
    // Additional image rows
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
  console.log('Loading existing products...');
  let products = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

  // Re-normalize existing products
  products = products.map(p => {
    const product = p.raw.product;
    const meta = { title: p.title, stock: p.availability, bodyText: '' };
    return normalizeProduct(product, meta, p.link);
  });

  // Find missing URLs
  const { productUrls } = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
  const existingUrls = new Set(products.map(p => p.link));
  const missing = productUrls.filter(u => !existingUrls.has(u));
  console.log(`Missing: ${missing.length} products`);

  for (const url of missing) {
    try {
      const { product, meta } = await fetchProduct(url);
      products.push(normalizeProduct(product, meta, url));
      console.log('  ✓', url);
      await sleep(1500);
    } catch (err) {
      console.warn('  ✗', url, err.message);
    }
  }

  // Sort by title
  products.sort((a, b) => a.title.localeCompare(b.title));

  fs.writeFileSync(JSON_FILE, JSON.stringify(products, null, 2), 'utf8');
  fs.writeFileSync(SHOPIFY_CSV, stringify(buildShopifyCsv(products)), 'utf8');
  fs.writeFileSync(GMC_CSV, stringify(buildGmcCsv(products)), 'utf8');

  console.log(`\n✅ ${products.length}/${productUrls.length} products processed`);
}

main().catch(console.error);
