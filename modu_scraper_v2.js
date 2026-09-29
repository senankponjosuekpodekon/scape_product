import axios from 'axios';
import fs from 'fs';
import { parseStringPromise } from 'xml2js';
import { stringify } from 'csv-stringify/sync';
import * as cheerio from 'cheerio';

const SITEMAP_URL = 'https://modu-luxe-gmbh.de/sitemap_products_1.xml?from=15377261330817&to=15478618685825';
const JSON_OUT = './modu_products.json';
const SHOPIFY_CSV = './modu_products_shopify.csv';
const GMC_CSV = './modu_products_gmc.csv';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
        maxRedirects: 5,
      });
      return data;
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`  ↩ Retry ${i + 1} ${url}: ${err.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}

function cleanHtmlToText(html) {
  if (!html) return '';
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '\n- ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  // Remove multiple blank lines
  text = text.replace(/\n\s*\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return text;
}

function parseProductJson($, url) {
  const script = $('script.product-json[type="application/json"]').first().html();
  if (!script) return null;
  try {
    return JSON.parse(script);
  } catch (e) {
    console.warn('JSON parse error for', url, e.message);
    return null;
  }
}

function extractMeta($, url) {
  const title = $('title').text().replace(/\s*–\s*MODULUXE GMBH\s*$/, '').trim();
  const h1 = $('h1').first().text().trim();
  const description = $('meta[name="description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image:secure_url"]').attr('content') || $('meta[property="og:image"]').attr('content') || '';

  // Availability from body text or product JSON
  const bodyText = $('body').text();
  const available = bodyText.toLowerCase().includes('auf lager') || bodyText.toLowerCase().includes('in stock') || bodyText.toLowerCase().includes('versandbereit');
  const stock = available ? 'in stock' : 'out of stock';

  return { title, h1, description, ogImage, stock, bodyText };
}

function normalizeProduct(product, meta, url) {
  const variant = product.variants && product.variants[0] ? product.variants[0] : {};

  // Title
  const title = product.title || meta.title || meta.h1 || '';

  // Price
  let price = '';
  if (variant.price) {
    const p = parseFloat(variant.price);
    if (!isNaN(p)) price = p.toFixed(2) + ' EUR';
  } else if (product.price) {
    const p = parseFloat(product.price);
    if (!isNaN(p)) price = (p > 10000 ? p / 100 : p).toFixed(2) + ' EUR';
  }

  // Description
  const rawDesc = product.description || '';
  const cleanDescription = cleanHtmlToText(rawDesc) || cleanHtmlToText(meta.description);

  // Images from product JSON
  const imgSet = new Set();
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach(img => {
      if (typeof img === 'string') imgSet.add(img.startsWith('//') ? 'https:' + img : img);
      else if (img && img.src) imgSet.add(img.src.startsWith('//') ? 'https:' + img.src : img.src);
    });
  }
  if (product.featured_image) imgSet.add(product.featured_image.startsWith('//') ? 'https:' + product.featured_image : product.featured_image);
  if (variant.featured_image && variant.featured_image.src) imgSet.add(variant.featured_image.src.startsWith('//') ? 'https:' + variant.featured_image.src : variant.featured_image.src);
  if (imgSet.size === 0 && meta.ogImage) imgSet.add(meta.ogImage);

  const images = [...imgSet].filter(u => u.includes('cdn.shopify') || u.includes('cdn/shop') || u.includes('modu-luxe-gmbh.de'));

  // SKU
  const sku = variant.sku || product.variants?.map(v => v.sku).filter(Boolean)[0] || product.handle || url.split('/').pop();

  // Vendor / Brand
  const vendor = product.vendor && product.vendor !== 'Mi tienda' ? product.vendor : 'MODULUXE GMBH';
  const brand = 'MODULUXE GMBH';

  // Product type from product JSON or title heuristics
  let productType = product.type || '';
  if (!productType) {
    const t = title.toLowerCase();
    if (t.includes('pool')) productType = 'Pool Container';
    else if (t.includes('kühl')) productType = 'Kühlcontainer';
    else if (t.includes('büro')) productType = 'Bürocontainer';
    else if (t.includes('lager')) productType = 'Lagercontainer';
    else if (t.includes('bar')) productType = 'Bar Container';
    else if (t.includes('sanitär') || t.includes('wc') || t.includes('dusche') || t.includes('toilette') || t.includes('urinal')) productType = 'Sanitärcontainer';
    else if (t.includes('wohn') || t.includes('tiny') || t.includes('haus') || t.includes('home')) productType = 'Wohncontainer';
    else if (t.includes('seecontainer') || t.includes('container')) productType = 'Container';
    else productType = 'Container';
  }

  // Availability
  const availability = variant.available !== false && variant.inventory_quantity !== 0 ? 'in stock' : 'out of stock';
  // Override with meta stock if available
  const stock = meta.stock || availability;

  return {
    id: sku,
    title,
    description: cleanDescription,
    shortDescription: cleanDescription.slice(0, 300),
    link: url,
    imageLink: images[0] || meta.ogImage || '',
    additionalImageLinks: images.slice(1).join(', '),
    images,
    availability: stock,
    price,
    salePrice: '',
    brand,
    vendor,
    sku,
    mpn: sku,
    gtin: '',
    condition: 'new',
    productType,
    colorOptions: [],
    handle: product.handle || url.split('/').pop(),
    raw: { product }
  };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[ä]/g, 'ae').replace(/[ö]/g, 'oe').replace(/[ü]/g, 'ue').replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function googleCategory(productType, title) {
  const t = `${productType} ${title}`.toLowerCase();
  if (t.includes('pool')) return 'Home & Garden > Pools & Spas';
  if (t.includes('kühl')) return 'Business & Industrial > Food Service > Refrigeration Equipment';
  if (t.includes('büro') || t.includes('lager') || t.includes('container')) return 'Business & Industrial > Material Handling > Shipping Containers';
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
  const rows = products.map(p => {
    const handle = p.handle || slugify(p.title);
    const googleCat = googleCategory(p.productType, p.title);
    const bodyHtml = p.description ? p.description.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('') : '';
    return [
      handle, p.title, bodyHtml, p.vendor, googleCat, p.productType, p.productType, 'TRUE',
      'Title', 'Default Title', '', '', '', '', p.sku, '0', 'shopify', '10', 'deny', 'manual',
      p.price ? p.price.replace(' EUR', '') : '', p.salePrice ? p.salePrice.replace(' EUR', '') : '', 'TRUE', 'TRUE', p.gtin,
      p.imageLink || '', p.imageLink ? '1' : '', p.title, 'FALSE', p.title, p.shortDescription.slice(0, 320) || '',
      googleCat, p.mpn || '', 'new', 'FALSE', 'kg', 'active'
    ];
  });
  return [headers, ...rows];
}

function buildGmcCsv(products) {
  const headers = ['id','title','description','link','image_link','additional_image_link','availability','price','sale_price','brand','gtin','mpn','condition','product_type'];
  const rows = products.map(p => [p.id || '', p.title || '', p.description || '', p.link || '', p.imageLink || '', p.additionalImageLinks || '', p.availability || '', p.price || '', p.salePrice || '', p.brand || '', p.gtin || '', p.mpn || '', 'new', p.productType || '']);
  return [headers, ...rows];
}

async function main() {
  console.log('🔍 Fetching sitemap...');
  const sitemapXml = await fetchWithRetry(SITEMAP_URL);
  const sitemap = await parseStringPromise(sitemapXml);
  const urls = sitemap.urlset.url || [];
  const productUrls = urls
    .map(u => u.loc?.[0])
    .filter(url => url && url.includes('/products/'))
    .sort();

  console.log(`Found ${productUrls.length} product URLs\n`);

  const raws = [];
  const concurrency = 5;
  for (let i = 0; i < productUrls.length; i += concurrency) {
    const batch = productUrls.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(async (url) => {
      try {
        const html = await fetchWithRetry(url);
        const $ = cheerio.load(html);
        const product = parseProductJson($, url);
        if (!product) {
          console.warn(`⚠️ No product JSON for ${url}`);
          return null;
        }
        const meta = extractMeta($, url);
        return { url, product, meta };
      } catch (err) {
        console.warn(`✗ Error ${url}: ${err.message}`);
        return null;
      }
    }));
    raws.push(...results.filter(Boolean));
    console.log(`  Progress: ${Math.min(i + concurrency, productUrls.length)}/${productUrls.length}`);
    await sleep(500);
  }

  const products = raws.map(({ url, product, meta }) => normalizeProduct(product, meta, url));

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
