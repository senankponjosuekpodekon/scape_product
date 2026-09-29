import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

const BASE = 'https://chaufobois.fr';
const SITEMAP = `${BASE}/wp-sitemap-posts-product-1.xml`;
const API = `${BASE}/wp-json/wc/store/v1/products`;
const JSON_OUT = './chaufobois_products.json';
const SHOPIFY_CSV = './chaufobois_products_shopify.csv';
const GMC_CSV = './chaufobois_products_gmc.csv';
const VENDOR = 'Chaufobois';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function get(url, params = {}, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data } = await axios.get(url, {
        params,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
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

const decode = (s) => s ? cheerio.load(`<div>${s}</div>`)('div').text().trim() : '';
const toPrice = (p) => {
  if (!p || p.price === '' || p.price == null) return '';
  const n = Number(p.price) / 10 ** (p.currency_minor_unit ?? 2);
  return n > 0 ? n.toFixed(2) : '';
};
const cleanHtml = (html) => (html || '').replace(/\r?\n/g, '').replace(/\s{2,}/g, ' ').trim();

async function fetchSitemapUrls() {
  const xml = await get(SITEMAP);
  const $ = cheerio.load(xml, { xmlMode: true });
  return $('loc').map((_, el) => $(el).text().trim()).get();
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; ; page++) {
    const batch = await get(API, { per_page: 100, page });
    all.push(...batch);
    console.log(`  API page ${page}: ${batch.length} produits`);
    if (batch.length < 100) break;
    await sleep(500);
  }
  return all;
}

async function fetchVariations(p) {
  const vars = [];
  for (const v of p.variations || []) {
    try {
      const d = await get(`${API}/${v.id}`);
      vars.push({
        id: d.id,
        sku: d.sku || '',
        price: toPrice(d.prices),
        regularPrice: d.prices?.regular_price ? (Number(d.prices.regular_price) / 100).toFixed(2) : '',
        inStock: d.is_in_stock,
        image: d.images?.[0]?.src || '',
        attributes: (v.attributes || []).map(a => ({ name: a.name, value: a.value })),
      });
      await sleep(250);
    } catch (err) {
      console.warn(`  ✗ Variation ${v.id} de ${p.slug}: ${err.message}`);
    }
  }
  return vars;
}

async function normalize(p) {
  const price = toPrice(p.prices);
  const regular = p.prices?.regular_price ? (Number(p.prices.regular_price) / 10 ** (p.prices.currency_minor_unit ?? 2)).toFixed(2) : '';
  const onSale = p.on_sale && regular && price && Number(regular) > Number(price);
  const images = [...new Set((p.images || []).map(i => i.src))];
  const variations = p.type === 'variable' ? await fetchVariations(p) : [];
  const variantAttrs = (p.attributes || []).filter(a => a.has_variations);

  return {
    id: String(p.id),
    title: decode(p.name),
    handle: p.slug,
    link: p.permalink,
    type: p.type,
    sku: p.sku || `CHB-${p.id}`,
    shortDescriptionHtml: cleanHtml(p.short_description),
    descriptionHtml: cleanHtml(p.description),
    description: decode(p.description) || decode(p.short_description),
    shortDescription: decode(p.short_description),
    price: onSale ? regular : price,
    salePrice: onSale ? price : '',
    currency: p.prices?.currency_code || 'EUR',
    availability: p.is_in_stock ? 'in stock' : 'out of stock',
    categories: (p.categories || []).map(c => decode(c.name)),
    tags: (p.tags || []).map(t => decode(t.name)),
    images,
    imageLink: images[0] || '',
    additionalImageLinks: images.slice(1).join(','),
    attributes: (p.attributes || []).map(a => ({ name: a.name, values: (a.terms || []).map(t => decode(t.name)), variation: a.has_variations })),
    variantAttributes: variantAttrs.map(a => a.name),
    variations,
    brand: VENDOR,
    condition: 'new',
  };
}

function googleCategory(p) {
  const t = `${p.categories.join(' ')} ${p.title}`.toLowerCase();
  if (/bois|granul|pellet|briquette|bûche|buche/.test(t) && !/po[eê]le/.test(t)) return 'Home & Garden > Fireplace & Wood Stove Accessories > Firewood & Fuel';
  if (/po[eê]le|insert|cheminée|foyer/.test(t)) return 'Home & Garden > Fireplaces';
  if (/conduit|tubage|flexible|réduction|reduction|poujoulat|raccord/.test(t)) return 'Home & Garden > Fireplace & Wood Stove Accessories';
  return 'Home & Garden > Fireplace & Wood Stove Accessories';
}

const SHOPIFY_HEADERS = [
  'Handle','Title','Body (HTML)','Vendor','Product Category','Type','Tags','Published',
  'Option1 Name','Option1 Value','Option2 Name','Option2 Value','Option3 Name','Option3 Value',
  'Variant SKU','Variant Grams','Variant Inventory Tracker','Variant Inventory Qty','Variant Inventory Policy',
  'Variant Fulfillment Service','Variant Price','Variant Compare At Price','Variant Requires Shipping','Variant Taxable',
  'Variant Barcode','Image Src','Image Position','Image Alt Text','Gift Card','SEO Title','SEO Description',
  'Google Shopping / Google Product Category','Google Shopping / MPN','Google Shopping / Condition','Google Shopping / Custom Product',
  'Variant Image','Variant Weight Unit','Status'
];

function buildShopifyCsv(products) {
  const col = Object.fromEntries(SHOPIFY_HEADERS.map((h, i) => [h, i]));
  const row = (obj) => { const r = Array(SHOPIFY_HEADERS.length).fill(''); Object.entries(obj).forEach(([k, v]) => { r[col[k]] = v ?? ''; }); return r; };
  const rows = [];

  products.forEach(p => {
    const body = [p.shortDescriptionHtml, p.descriptionHtml].filter(Boolean).join('');
    const gcat = googleCategory(p);
    const variants = p.variations.length
      ? p.variations.map(v => ({
          options: v.attributes.map(a => a.value),
          sku: v.sku || `${p.sku}-${v.id}`,
          price: v.price || p.salePrice || p.price,
          compare: v.regularPrice && Number(v.regularPrice) > Number(v.price) ? v.regularPrice : '',
          image: v.image,
        }))
      : [{ options: ['Default Title'], sku: p.sku, price: p.salePrice || p.price, compare: p.salePrice ? p.price : '', image: '' }];
    const optNames = p.variations.length ? (p.variations[0].attributes.map(a => p.variantAttributes.find(n => n.toLowerCase().includes(a.name.replace(/^pa_/, '').toLowerCase())) || a.name.replace(/^pa_/, ''))) : ['Title'];

    variants.forEach((v, i) => {
      const r = {
        'Handle': p.handle,
        'Option1 Value': v.options[0] || '', 'Option2 Value': v.options[1] || '', 'Option3 Value': v.options[2] || '',
        'Variant SKU': v.sku, 'Variant Grams': '0', 'Variant Inventory Tracker': 'shopify', 'Variant Inventory Qty': p.availability === 'in stock' ? '10' : '0',
        'Variant Inventory Policy': 'deny', 'Variant Fulfillment Service': 'manual', 'Variant Price': v.price, 'Variant Compare At Price': v.compare,
        'Variant Requires Shipping': 'TRUE', 'Variant Taxable': 'TRUE', 'Variant Image': v.image, 'Variant Weight Unit': 'kg',
      };
      if (i === 0) Object.assign(r, {
        'Title': p.title, 'Body (HTML)': body, 'Vendor': p.brand, 'Product Category': gcat, 'Type': p.categories[0] || '',
        'Tags': [...p.categories, ...p.tags].join(', '), 'Published': 'TRUE',
        'Option1 Name': optNames[0] || '', 'Option2 Name': optNames[1] || '', 'Option3 Name': optNames[2] || '',
        'Image Src': p.images[0] || '', 'Image Position': p.images[0] ? '1' : '', 'Image Alt Text': p.images[0] ? p.title : '',
        'Gift Card': 'FALSE', 'SEO Title': p.title.slice(0, 70), 'SEO Description': p.shortDescription.replace(/\s+/g, ' ').slice(0, 320),
        'Google Shopping / Google Product Category': gcat, 'Google Shopping / MPN': p.sku, 'Google Shopping / Condition': 'new',
        'Google Shopping / Custom Product': 'FALSE', 'Status': 'active',
      });
      rows.push(row(r));
    });

    p.images.slice(1).forEach((img, idx) => rows.push(row({ 'Handle': p.handle, 'Image Src': img, 'Image Position': String(idx + 2), 'Image Alt Text': p.title })));
  });
  return [SHOPIFY_HEADERS, ...rows];
}

function buildGmcCsv(products) {
  const headers = ['id','title','description','link','image_link','additional_image_link','availability','price','sale_price','brand','mpn','condition','google_product_category','product_type','item_group_id'];
  const rows = [];
  products.forEach(p => {
    const base = [p.title, p.description.replace(/\s+/g, ' ').slice(0, 5000), p.link];
    const common = (price, sale) => [price ? `${price} ${p.currency}` : '', sale ? `${sale} ${p.currency}` : '', p.brand];
    if (p.variations.length) {
      p.variations.forEach(v => rows.push([
        v.sku || `${p.sku}-${v.id}`, `${p.title} - ${v.attributes.map(a => a.value).join(' / ')}`, base[1], base[2],
        v.image || p.imageLink, p.additionalImageLinks, v.inStock ? 'in stock' : 'out of stock',
        ...common(v.regularPrice || v.price, v.regularPrice && Number(v.regularPrice) > Number(v.price) ? v.price : ''),
        v.sku || `${p.sku}-${v.id}`, 'new', googleCategory(p), p.categories.join(' > '), p.sku,
      ]));
    } else {
      rows.push([p.sku, ...base, p.imageLink, p.additionalImageLinks, p.availability, ...common(p.price, p.salePrice), p.sku, 'new', googleCategory(p), p.categories.join(' > '), '']);
    }
  });
  return [headers, ...rows];
}

async function main() {
  console.log('📄 Lecture du sitemap...');
  const sitemapUrls = await fetchSitemapUrls();
  console.log(`  ${sitemapUrls.length} URLs produit dans le sitemap`);

  console.log('🛒 Récupération via WooCommerce Store API...');
  const apiProducts = await fetchAllProducts();

  const bySlugUrl = new Set(apiProducts.map(p => p.permalink.replace(/\/$/, '')));
  const missing = sitemapUrls.filter(u => !bySlugUrl.has(u.replace(/\/$/, '')));
  if (missing.length) console.warn(`⚠ ${missing.length} URLs du sitemap absentes de l'API:\n  ${missing.join('\n  ')}`);

  const products = [];
  for (const p of apiProducts) products.push(await normalize(p));

  fs.writeFileSync(JSON_OUT, JSON.stringify(products, null, 2), 'utf8');
  fs.writeFileSync(SHOPIFY_CSV, stringify(buildShopifyCsv(products)), 'utf8');
  fs.writeFileSync(GMC_CSV, stringify(buildGmcCsv(products)), 'utf8');

  const noPrice = products.filter(p => !p.price && !p.variations.length).length;
  const noImg = products.filter(p => !p.images.length).length;
  console.log(`\n✅ ${products.length} produits (sitemap: ${sitemapUrls.length}) | variables: ${products.filter(p => p.variations.length).length} | sans prix: ${noPrice} | sans image: ${noImg}`);
  console.log(`💾 ${JSON_OUT}\n💾 ${SHOPIFY_CSV}\n💾 ${GMC_CSV}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
