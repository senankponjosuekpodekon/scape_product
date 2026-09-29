import puppeteer from 'puppeteer';
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

const LINKS_FILE = '/tmp/modu_links.json';
const JSON_OUT = './modu_products.json';
const SHOPIFY_CSV = './modu_products_shopify.csv';
const GMC_CSV = './modu_products_gmc.csv';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parsePrice(priceTextOrCents) {
  if (typeof priceTextOrCents === 'number') {
    return (priceTextOrCents / 100).toFixed(2) + ' EUR';
  }
  if (!priceTextOrCents) return '';
  const m = String(priceTextOrCents).match(/([\d.,]+)\s*€/);
  if (m) {
    const p = parseFloat(m[1].replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(p)) return p.toFixed(2) + ' EUR';
  }
  const n = parseFloat(String(priceTextOrCents).replace(/[^\d,.]/g, '').replace(/\./g, '').replace(/,/g, '.'));
  if (!isNaN(n) && n > 0) return (n > 10000 ? n / 100 : n).toFixed(2) + ' EUR';
  return '';
}

async function scrapeProduct(browser, url, retry = 0) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 900 });

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    if (!response || response.status() >= 400) throw new Error(`HTTP ${response ? response.status() : 'no response'}`);

    await sleep(2500);

    // Scroll to load images
    await page.evaluate(async () => {
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, 500);
        await new Promise(r => setTimeout(r, 400));
      }
    });
    await sleep(800);

    const data = await page.evaluate(() => {
      const allText = document.body.innerText;

      // Product meta from script
      let productMeta = null;
      document.querySelectorAll('script').forEach(s => {
        const mm = s.innerText.match(/var\s+meta\s*=\s*({[\s\S]+?});/);
        if (mm) { try { productMeta = JSON.parse(mm[1]); } catch(_) {} }
      });

      // Description extraction
      let description = '';
      const descMatch = allText.match(/Beschreibung\s*([\s\S]+?)(?:Das könnte Ihnen auch gefallen|MODULUXE GMBH|Kundenbereich|Katalog|Kontakt\s*$)/);
      if (descMatch) description = descMatch[1].trim();
      if (!description) {
        // Fallback: use product description section
        const descEl = document.querySelector('[data-product-description], [class*="product__description"], [class*="product-description"], [class*="product__text"], [id*="product-description"]');
        if (descEl) description = descEl.innerText.trim();
      }

      // Clean "Versandrichtlinien" header if it appears at start
      description = description.replace(/^Versandrichtlinien\s*/i, '').trim();

      // Images
      const imgMap = new Map();
      const addSrc = (s) => {
        if (!s) return;
        let u = s.trim().split(' ')[0];
        if (u.startsWith('//')) u = 'https:' + u;
        if (u.startsWith('/')) u = window.location.origin + u;
        if (u.includes('cdn.shopify') || u.includes('cdn/shop/files')) {
          // Normalize cdn/shop to full cdn.shopify
          if (u.includes('/cdn/shop/files/')) {
            u = u.replace(window.location.origin, 'https://modu-luxe-gmbh.de');
          }
          // Dedupe by base filename, keep highest width
          const base = u.replace(/[?&]width=\d+/, '').split('?')[0];
          const widthMatch = u.match(/[?&]width=(\d+)/);
          const width = widthMatch ? parseInt(widthMatch[1]) : 9999;
          const existing = imgMap.get(base);
          if (!existing || existing.width < width) imgMap.set(base, { url: u, width });
        }
      };

      document.querySelectorAll('img, source, noscript img').forEach(el => {
        if (el.src) addSrc(el.src);
        if (el.dataset.src) addSrc(el.dataset.src);
        if (el.srcset) el.srcset.split(',').forEach(u => addSrc(u.trim()));
        if (el.dataset.srcset) el.dataset.srcset.split(',').forEach(u => addSrc(u.trim()));
      });

      // Also parse HTML for all cdn.shopify file URLs
      const html = document.documentElement.innerHTML;
      const matches = html.matchAll(/(?:https?:)?(?:\/\/)?(?:cdn\.shopify\.com[^"'\s]+|cdn\/shop\/files\/[^"'\s]+\.(?:jpg|jpeg|png|webp|avif|gif))/g);
      for (const m of matches) addSrc(m[0]);

      // Meta images
      ['og:image:secure_url', 'og:image', 'twitter:image'].forEach(prop => {
        const meta = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
        if (meta) addSrc(meta.getAttribute('content'));
      });

      const images = [...imgMap.values()].map(v => v.url).filter(u => !u.includes('moslux') && !u.includes('logo'));

      // Price and stock
      const priceEl = document.querySelector('[class*="price"], [data-price], .product__price, .price-item, [class*="product__regular-price"]');
      const priceText = priceEl ? priceEl.innerText.trim() : '';

      const stock = allText.includes('Auf Lager') ? 'in stock' : (allText.includes('Nicht auf Lager') || allText.includes('Ausverkauft') ? 'out of stock' : '');

      // Breadcrumb / category
      let category = '';
      const bc = allText.match(/Home\s*[›/]\s*([^\n]+)/);
      if (bc) category = bc[1].split('\n')[0].trim();

      // H1 and title
      const h1 = document.querySelector('h1')?.innerText?.trim() || '';
      const title = document.querySelector('title')?.innerText?.trim() || '';

      return {
        url: window.location.href,
        title,
        h1,
        productMeta,
        description,
        priceText,
        stock,
        category,
        images,
        bodyText: allText.slice(0, 2500)
      };
    });

    await page.close();
    return { ...data, retry };
  } catch (err) {
    await page.close();
    if (retry < 2) {
      console.warn(`  ↩ Retry ${retry + 1} ${url}: ${err.message}`);
      await sleep(3000 * (retry + 1));
      return scrapeProduct(browser, url, retry + 1);
    }
    return { url, error: err.message };
  }
}

function normalizeProduct(raw, sitemapImage = '') {
  const meta = raw.productMeta?.product || {};
  const variant = (meta.variants && meta.variants[0]) || {};

  const title = raw.h1 || meta.name || raw.title.replace(/\s*–\s*MODULUXE GMBH\s*$/, '') || '';

  // Price: from productMeta cents, then visible text
  let price = '';
  if (variant.price) price = parsePrice(variant.price);
  if (!price && raw.priceText) price = parsePrice(raw.priceText);

  const description = raw.description || '';
  const cleanDescription = description
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && l !== 'Beschreibung' && l !== 'Versandrichtlinien')
    .join('\n');

  let images = raw.images || [];
  // If no images, use sitemap image
  if (images.length === 0 && sitemapImage) images = [sitemapImage];

  const sku = variant.sku || meta.sku || raw.url.split('/').pop();
  const handle = meta.handle || raw.url.split('/').pop();
  const vendor = 'MODULUXE GMBH';
  const brand = 'MODULUXE GMBH';

  // Product type heuristics
  let productType = raw.category || meta.type || '';
  if (!productType) {
    const t = title.toLowerCase();
    if (t.includes('pool')) productType = 'Pool Container';
    else if (t.includes('kühl')) productType = 'Kühlcontainer';
    else if (t.includes('büro')) productType = 'Bürocontainer';
    else if (t.includes('lager')) productType = 'Lagercontainer';
    else if (t.includes('bar')) productType = 'Bar Container';
    else if (t.includes('sanitär') || t.includes('wc') || t.includes('dusche')) productType = 'Sanitärcontainer';
    else if (t.includes('wohn') || t.includes('tiny') || t.includes('haus')) productType = 'Wohncontainer';
    else if (t.includes('seecontainer') || t.includes('container')) productType = 'Container';
    else productType = 'Container';
  }

  const availability = raw.stock || 'in stock';

  // Delivery from text
  const deliveryMatch = raw.bodyText.match(/(\d+\s*(?:bis|-)\s*\d+\s*Werktage|\d+\s*Werktage|Lieferzeit[^\d]*\d+[^\d]*Werktage)/);
  const deliveryTime = deliveryMatch ? deliveryMatch[0].replace('Lieferzeit:', '').trim() : '';

  return {
    id: sku,
    title,
    description: cleanDescription,
    shortDescription: cleanDescription.slice(0, 300),
    link: raw.url,
    imageLink: images[0] || sitemapImage || '',
    additionalImageLinks: images.slice(1).join(', '),
    images,
    availability,
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
    deliveryTime,
    handle,
    raw: { productMeta: raw.productMeta, images, bodyText: raw.bodyText }
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
  if (t.includes('sanitär') || t.includes('wc') || t.includes('dusche')) return 'Home & Garden > Bathroom Accessories';
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
    const bodyHtml = p.description ? p.description.split('\n').map(line => `<p>${line}</p>`).join('') : '';
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
  const { productUrls, images } = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
  const imageMap = new Map(images.map(i => [i.url, i.image]));

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const raws = [];
  const concurrency = 2;
  for (let i = 0; i < productUrls.length; i += concurrency) {
    const batch = productUrls.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(url => scrapeProduct(browser, url)));
    raws.push(...results);
    console.log(`  Progress: ${Math.min(i + concurrency, productUrls.length)}/${productUrls.length}`);
  }

  await browser.close();

  const errors = raws.filter(r => r.error);
  const successes = raws.filter(r => !r.error);
  console.log(`\n✅ ${successes.length} succès | ⚠️ ${errors.length} erreurs`);
  errors.forEach(e => console.log('  ✗', e.url, e.error));

  const products = successes.map(r => normalizeProduct(r, imageMap.get(r.url) || ''));

  fs.writeFileSync(JSON_OUT, JSON.stringify(products, null, 2), 'utf8');
  fs.writeFileSync(SHOPIFY_CSV, stringify(buildShopifyCsv(products)), 'utf8');
  fs.writeFileSync(GMC_CSV, stringify(buildGmcCsv(products)), 'utf8');

  console.log('\n💾 Sauvegardé :');
  console.log(`  ${JSON_OUT}`);
  console.log(`  ${SHOPIFY_CSV}`);
  console.log(`  ${GMC_CSV}`);

  // Summary
  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log('RÉSUMÉ');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  products.slice(0, 15).forEach(p => {
    console.log(`  • ${p.title}`);
    console.log(`    Prix: ${p.price} | SKU: ${p.sku} | Stock: ${p.availability} | Images: ${p.images.length}`);
  });
  if (products.length > 15) console.log(`  ... and ${products.length - 15} more`);
}

main().catch(console.error);
