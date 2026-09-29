import puppeteer from 'puppeteer';
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

const RETRY_URLS = [
  'https://drikecontainers.com/produit/100061',
  'https://drikecontainers.com/produit/100062',
  'https://drikecontainers.com/produit/100063',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scrapeProduct(browser, url, retry = 0) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 900 });

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    if (!response || response.status() >= 400) throw new Error(`HTTP ${response ? response.status() : 'no response'}`);

    await sleep(4000);

    await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, span, a, div, p')).filter(el =>
        el.innerText && el.innerText.trim() === 'Mehr lesen'
      );
      for (const el of candidates) {
        el.click();
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    await sleep(2000);

    const data = await page.evaluate((pageUrl) => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => { try { return JSON.parse(s.innerText); } catch(_) { return null; } })
        .filter(Boolean);

      const productLd = scripts.find(s => s['@type'] === 'Product' || (Array.isArray(s['@graph']) && s['@graph'].some(g => g['@type'] === 'Product')));
      const ld = productLd && productLd['@graph'] ? productLd['@graph'].find(g => g['@type'] === 'Product') : productLd;

      const text = document.body.innerText;
      let fullDescription = '';
      const match = text.match(/Produktbeschreibung\s*([\s\S]+?)(?:Mehr lesen|SKU\s*:|SKU\s*&\s*Kategorie|Gewünschte Farbe|Gewünschte|Menge|In den Warenkorb|Individuelles Angebot|Unsere Öffnungszeiten)/);
      if (match) fullDescription = match[1].replace(/Mehr lesen|Weniger anzeigen/g, '').trim();

      let category = '';
      const catMatch = text.match(/(?:^|\n)Kategorie\s*\n\s*([^\n]+)/m);
      if (catMatch) category = catMatch[1].trim();
      if (!category) {
        const upper = text.match(/(?:^|\n)([A-Z][A-ZÄÖÜ\s&/\-]{2,30})\n\n/);
        if (upper) category = upper[1].trim().replace(/\s+/g, ' ');
      }

      const images = Array.from(document.querySelectorAll('img'))
        .map(img => ({ src: img.src || img.getAttribute('data-src') || '', alt: img.alt || '' }))
        .filter(i => i.src && i.src.startsWith('https://static.wixstatic.com/'));

      const bgImgs = Array.from(document.querySelectorAll('*'))
        .map(el => {
          const style = window.getComputedStyle(el).backgroundImage;
          const m = style.match(/url\(["']?(https:\/\/static\.wixstatic\.com\/[^"')]+)/);
          return m ? m[1] : null;
        })
        .filter(Boolean);

      return { jsonLd: ld, fullDescription, category, images, bgImgs, bodyText: text.slice(0,4000), h1: document.querySelector('h1')?.innerText?.trim() || '', title: document.title };
    }, url);

    await page.close();
    return { url, ...data, retry };
  } catch (err) {
    await page.close();
    if (retry < 2) {
      console.warn(`  ↩ Retry ${retry + 1} ${url}: ${err.message}`);
      await sleep(5000 * (retry + 1));
      return scrapeProduct(browser, url, retry + 1);
    }
    return { url, error: err.message };
  }
}

function normalizeProduct(raw) {
  const ld = raw.jsonLd || {};
  const offers = ld.offers || {};
  const title = ld.name || raw.h1 || raw.title || '';

  let price = '';
  if (offers.price) price = String(offers.price);
  else if (offers.priceSpecification && offers.priceSpecification[0]) price = String(offers.priceSpecification[0].price || offers.priceSpecification[0].value || '');
  if (price) {
    const p = parseFloat(price);
    if (!isNaN(p)) price = p.toFixed(2) + ' EUR';
  }

  let description = raw.fullDescription || ld.description || '';
  description = description.replace(/SKU\s*[:\-]?\s*[A-Z0-9\-]+/gi, '').replace(/\d+[.,]?\d*\s*€/g, '').replace(/Mehr lesen|Weniger anzeigen/g, '').trim();
  const cleanDescription = description.split('\n').map(l => l.trim()).filter(l => l.length).join('\n');

  const allImages = new Set();
  if (ld.image) { if (Array.isArray(ld.image)) ld.image.forEach(i => allImages.add(i)); else allImages.add(ld.image); }
  raw.images.forEach(i => allImages.add(i.src));
  raw.bgImgs.forEach(i => allImages.add(i));
  const imageList = [...allImages].filter(u => !u.includes('placeholder') && !u.includes('lazy'));

  const sku = ld.sku || '';
  const brand = ld.brand?.name || ld.manufacturer?.name || 'DRIK CONTAINERS';
  const availability = offers.availability?.includes('InStock') || raw.bodyText.includes('AUF LAGER') ? 'in stock' : 'out of stock';
  const category = raw.category || '';

  return {
    id: sku || raw.url.split('/').pop(),
    title,
    description: cleanDescription,
    shortDescription: cleanDescription.slice(0,300),
    link: raw.url,
    imageLink: imageList[0] || '',
    additionalImageLinks: imageList.slice(1).join(', '),
    images: imageList,
    availability,
    price,
    salePrice: '',
    brand,
    vendor: brand,
    sku,
    mpn: ld.mpn || sku,
    gtin: ld.gtin13 || ld.gtin12 || ld.gtin8 || ld.gtin || '',
    condition: 'new',
    productType: category,
    colorOptions: [],
    deliveryTime: raw.bodyText.match(/(\d+\s*(?:bis|-)\s*\d+\s*Werktage|\d+\s*Werktage)/)?.[0] || '',
    dimensions: {
      length: cleanDescription.match(/Länge[:\s]+([\d,.]+)\s*m/)?.[1] || '',
      width: cleanDescription.match(/Breite[:\s]+([\d,.]+)\s*m/)?.[1] || '',
      height: cleanDescription.match(/Höhe[:\s]+([\d,.]+)\s*m|AußenHöhe[:\s]+([\d,.]+)\s*m/)?.[1] || '',
    },
    raw: { jsonLd: ld }
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
  if (t.includes('büro') || t.includes('bureau') || t.includes('office')) return 'Home & Garden > Household & Cleaning > Storage & Organization > Storage Buildings';
  if (t.includes('wohn') || t.includes('habitation') || t.includes('tiny')) return 'Home & Garden > Household & Cleaning > Storage & Organization > Storage Buildings';
  if (t.includes('bar') || t.includes('restaurant')) return 'Furniture > Outdoor Furniture > Outdoor Kitchens & Bars';
  if (t.includes('kühl') || t.includes('frigorifique') || t.includes('cold')) return 'Business & Industrial > Food Service > Refrigeration Equipment';
  if (t.includes('lager') || t.includes('storage')) return 'Home & Garden > Household & Cleaning > Storage & Organization > Storage Buildings';
  if (t.includes('sanitär') || t.includes('wc') || t.includes('toilette')) return 'Home & Garden > Bathroom Accessories';
  if (t.includes('neu') || t.includes('gebraucht') || t.includes('container')) return 'Business & Industrial > Material Handling > Shipping Containers';
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
    const handle = slugify(p.title);
    const googleCat = googleCategory(p.productType, p.title);
    const bodyHtml = p.description ? p.description.split('\n').map(line => `<p>${line}</p>`).join('') : '';
    return [
      handle, p.title, bodyHtml, p.vendor || 'DRIK CONTAINERS', googleCat, p.productType || 'Container', p.productType || 'Container', 'TRUE',
      'Title', 'Default Title', '', '', '', '', p.sku || '', '0', 'shopify', '10', 'deny', 'manual',
      p.price ? p.price.replace(' EUR','') : '', p.salePrice ? p.salePrice.replace(' EUR','') : '', 'TRUE', 'TRUE', p.gtin || '',
      p.imageLink || '', p.imageLink ? '1' : '', p.title || '', 'FALSE', p.title || '', p.shortDescription.slice(0,320) || '',
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
  const jsonPath = './drike_products.json';
  const shopifyPath = './drike_products_shopify.csv';
  const gmcPath = './drike_products_gmc.csv';

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });

  const raws = [];
  for (const url of RETRY_URLS) {
    console.log('Scraping:', url);
    const res = await scrapeProduct(browser, url);
    raws.push(res);
  }
  await browser.close();

  const newProducts = raws.filter(r => !r.error && r.jsonLd).map(normalizeProduct);
  console.log(`\n✅ ${newProducts.length}/${RETRY_URLS.length} produits rescrapés avec succès`);
  raws.filter(r => r.error).forEach(r => console.log('  ✗', r.url, r.error));

  // Load existing data and replace failed entries
  let existing = [];
  if (fs.existsSync(jsonPath)) existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const existingUrls = new Set(existing.map(p => p.link));
  const merged = [...existing.filter(p => !newProducts.find(np => np.link === p.link)), ...newProducts];

  fs.writeFileSync(jsonPath, JSON.stringify(merged, null, 2), 'utf8');
  fs.writeFileSync(shopifyPath, stringify(buildShopifyCsv(merged)), 'utf8');
  fs.writeFileSync(gmcPath, stringify(buildGmcCsv(merged)), 'utf8');
  console.log('Fichiers mis à jour.');
}

main().catch(console.error);
