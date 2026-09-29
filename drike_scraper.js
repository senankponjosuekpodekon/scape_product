/**
 * Scraper professionnel – drikecontainers.com
 * Crawl React SPA, extracte JSON-LD + DOM riche,
 * exporte JSON, CSV Shopify, CSV Google Merchant Center.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify/sync';

const BASE_URL = 'https://drikecontainers.com/';
const OUTPUT_DIR = path.resolve('.');
const CONCURRENCY = 2; // Puppeteer tabs en parallèle
const MAX_RETRIES = 3;
const REQUEST_DELAY_MS = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Découverte des URLs produits
// ─────────────────────────────────────────────────────────────────────────────

async function discoverProductUrls(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1280, height: 900 });

  const visited = new Set();
  const productUrls = new Set();
  const toVisit = [BASE_URL];

  while (toVisit.length > 0) {
    const url = toVisit.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(1500);

      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href]'))
          .map((a) => a.getAttribute('href'))
          .filter((h) => h && h.startsWith('/') && !h.startsWith('//'))
          .map((h) => new URL(h, window.location.origin).href)
      );

      for (const link of links) {
        const lower = link.toLowerCase();
        if (lower.includes('/produit/')) {
          productUrls.add(link);
        } else if (
          link.startsWith('https://drikecontainers.com/') &&
          !link.includes('#') &&
          !lower.includes('/politique-') &&
          !lower.includes('/agb') &&
          !lower.includes('/impressum') &&
          !lower.includes('/datenschutz') &&
          !lower.includes('/widerruf')
        ) {
          if (!visited.has(link) && !toVisit.includes(link)) toVisit.push(link);
        }
      }
    } catch (e) {
      console.warn(`⚠️ Discover error on ${url}: ${e.message}`);
    }
  }

  await page.close();
  return [...productUrls].sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction JSON-LD
// ─────────────────────────────────────────────────────────────────────────────

function extractJsonLd($) {
  const data = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      if (Array.isArray(json)) data.push(...json);
      else data.push(json);
    } catch (_) {}
  });
  return data.find((d) => d['@type'] === 'Product') || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scraping d'une page produit
// ─────────────────────────────────────────────────────────────────────────────

async function scrapeProduct(browser, url, retry = 0) {
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1280, height: 900 });

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response ? response.status() : 'no response'}`);
    }

    await sleep(2500);

    // Try to expand description by clicking all "Mehr lesen" buttons
    try {
      await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('button, span, a, div, p')).filter((el) =>
          el.innerText && el.innerText.trim() === 'Mehr lesen'
        );
        for (const el of candidates) {
          el.click();
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
      await sleep(1500);
    } catch (_) {}

    const result = await page.evaluate((pageUrl) => {
      const scripts = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]')
      ).map((s) => {
        try {
          return JSON.parse(s.innerText);
        } catch (_) {
          return null;
        }
      }).filter(Boolean);

      const productLd = scripts.find((s) => s && (s['@type'] === 'Product' || (Array.isArray(s['@graph']) && s['@graph'].some(g => g['@type'] === 'Product'))));
      const resolvedProduct = productLd && productLd['@graph']
        ? productLd['@graph'].find(g => g['@type'] === 'Product')
        : productLd;

      const text = document.body.innerText;

      // Description extraction: between "Produktbeschreibung" and end markers
      let fullDescription = '';
      const descMatch = text.match(
        /Produktbeschreibung\s*([\s\S]+?)(?:Mehr lesen|SKU\s*:|SKU\s*&\s*Kategorie|Gewünschte Farbe|Gewünschte|Menge|In den Warenkorb|Individuelles Angebot|Unsere Öffnungszeiten)/
      );
      if (descMatch) {
        fullDescription = descMatch[1]
          .replace(/Mehr lesen/g, '')
          .replace(/Weniger anzeigen/g, '')
          .trim();
      }

      // Category extraction from structured "Kategorie" field
      let category = '';
      const catMatch = text.match(/(?:^|\n)Kategorie\s*\n\s*([^\n]+)/m);
      if (catMatch) {
        category = catMatch[1].trim();
      }
      if (!category) {
        // Try uppercase label near the title
        const labelMatch = text.match(/(?:^|\n)([A-Z][A-ZÄÖÜ\s&/\-]{2,30})\n\n/);
        if (labelMatch) category = labelMatch[1].trim().replace(/\s+/g, ' ');
      }

      // Variant options - look for elements after "Gewünschte Farbe" / "Kategorie" / "Menge"
      const variantSet = new Set();
      const knownColors = [
        'Hellblau', 'Signalweiß', 'Verkehrsrot', 'Minzgrün', 'Signalgelb',
        'Telemagenta', 'Reinorange', 'Dunkelschwarz', 'Anthrazitgrau', 'Hellgrau',
        'Anthrazit', 'RAL 7016', 'RAL 9002', 'RAL 9006', 'Grauweiß', 'Anthrazitgrau'
      ];
      const allText = Array.from(document.querySelectorAll('button, label, span, div, a')).map(el => el.innerText?.trim()).filter(Boolean);
      // Find all text that matches known colors or looks like short option labels
      allText.forEach((t) => {
        if (knownColors.some(c => t.includes(c))) {
          variantSet.add(t);
          return;
        }
        if (
          t.length > 0 &&
          t.length < 35 &&
          !t.includes('€') &&
          !t.includes('Warenkorb') &&
          !t.includes('Angebot') &&
          !t.includes('Menge') &&
          !t.includes('Kategorie') &&
          !/^\d+$/.test(t) &&
          !/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(t) // avoid long labels
        ) {
          variantSet.add(t);
        }
      });

      // Images: all non-data, non-logo product images
      const images = Array.from(document.querySelectorAll('img'))
        .map((img) => ({
          src: img.src || img.getAttribute('data-src') || '',
          alt: img.alt || '',
        }))
        .filter((i) => i.src && i.src.startsWith('https://static.wixstatic.com/'));

      // Also find background images in style attributes
      const bgImgs = Array.from(document.querySelectorAll('*'))
        .map((el) => {
          const style = window.getComputedStyle(el).backgroundImage;
          const m = style.match(/url\(["']?(https:\/\/static\.wixstatic\.com\/[^"')]+)/);
          return m ? m[1] : null;
        })
        .filter(Boolean);

      return {
        jsonLd: resolvedProduct || null,
        fullDescription,
        category,
        variantTexts: [...variantSet],
        images,
        bgImgs,
        bodyText: text.slice(0, 4000),
        title: document.title,
        h1: document.querySelector('h1')?.innerText?.trim() || '',
      };
    }, url);

    await page.close();
    return { url, ...result, retry };
  } catch (err) {
    await page.close();
    if (retry < MAX_RETRIES) {
      console.warn(`  ↩ Retry ${retry + 1}/${MAX_RETRIES} ${url}: ${err.message}`);
      await sleep(3000 * (retry + 1));
      return scrapeProduct(browser, url, retry + 1);
    }
    return { url, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation d'un produit
// ─────────────────────────────────────────────────────────────────────────────

function normalizeProduct(raw) {
  const ld = raw.jsonLd || {};
  const offers = ld.offers || {};

  // Titre
  const title = ld.name || raw.h1 || raw.title || '';

  // Prix
  let price = '';
  let salePrice = '';
  if (offers.price) {
    price = String(offers.price);
  } else if (offers.priceSpecification && offers.priceSpecification[0]) {
    price = String(offers.priceSpecification[0].price || offers.priceSpecification[0].value || '');
  }

  if (price) {
    const p = parseFloat(price);
    if (!isNaN(p)) price = p.toFixed(2) + ' EUR';
  }

  // Description
  let description = raw.fullDescription || ld.description || '';

  // Nettoyage agressif: supprimer mentions de SKU, prix et stop-words restants
  description = description
    .replace(/SKU\s*[:\-]?\s*[A-Z0-9\-]+/gi, '')
    .replace(/\d+[.,]?\d*\s*€/g, '')
    .replace(/Mehr lesen|Weniger anzeigen/g, '')
    .replace(/Gewünschte Farbe|Gewünschte Größe|Gewünschte Option/g, '')
    .trim();

  // Nettoyage
  const cleanDescription = description
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join('\n');

  // Images
  const allImages = new Set();
  if (ld.image) {
    if (Array.isArray(ld.image)) ld.image.forEach((i) => allImages.add(i));
    else allImages.add(ld.image);
  }
  raw.images.forEach((i) => allImages.add(i.src));
  raw.bgImgs.forEach((i) => allImages.add(i));
  const imageList = [...allImages].filter((u) => !u.includes('placeholder') && !u.includes('lazy'));

  // Variant options
  const knownColorNames = [
    'Hellblau', 'Signalweiß', 'Verkehrsrot', 'Minzgrün', 'Signalgelb',
    'Telemagenta', 'Reinorange', 'Dunkelschwarz', 'Anthrazitgrau', 'Hellgrau',
    'Anthrazit', 'RAL 7016', 'RAL 9002', 'RAL 9006', 'Grauweiß', 'Anthrazitgrau'
  ];
  const colorOptions = (raw.variantTexts || []).filter(v =>
    knownColorNames.some(c => v.includes(c)) ||
    (v.startsWith('RAL ') || (v.includes('Anthrazit') || v.includes('Grau')))
  );

  // SKU / MPN / GTIN
  const sku = ld.sku || '';
  const mpn = ld.mpn || sku;
  const gtin = ld.gtin13 || ld.gtin12 || ld.gtin8 || ld.gtin || '';

  // Marque
  const brand = ld.brand?.name || ld.manufacturer?.name || 'DRIK CONTAINERS';

  // Stock
  const availability =
    offers.availability?.includes('InStock') || raw.bodyText.includes('AUF LAGER')
      ? 'in stock'
      : 'out of stock';

  // Catégorie
  let category = raw.category || '';
  if (!category && raw.bodyText) {
    const m = raw.bodyText.match(/Kategorie\s*\n\s*([A-Za-zäöüÄÖÜß0-9\s&/\-–—]+?)(?=\n|$)/);
    category = m ? m[1].trim() : '';
  }

  // Livraison
  const shippingMatch = raw.bodyText.match(/(\d+\s*(?:bis|-)\s*\d+\s*Werktage|\d+\s*Werktage)/);
  const deliveryTime = shippingMatch ? shippingMatch[0] : '';

  // Poids / dimensions from description
  const dimensions = {
    length: cleanDescription.match(/Länge[:\s]+([\d,.]+)\s*m/)?.[1] || '',
    width: cleanDescription.match(/Breite[:\s]+([\d,.]+)\s*m/)?.[1] || '',
    height: cleanDescription.match(/Höhe[:\s]+([\d,.]+)\s*m|AußenHöhe[:\s]+([\d,.]+)\s*m/)?.[1] || '',
  };

  return {
    id: sku || mpn || raw.url.split('/').pop(),
    title,
    description: cleanDescription,
    shortDescription: cleanDescription.slice(0, 300),
    link: raw.url,
    imageLink: imageList[0] || '',
    additionalImageLinks: imageList.slice(1).join(', '),
    images: imageList,
    availability,
    price,
    salePrice,
    brand,
    vendor: brand,
    sku,
    mpn,
    gtin,
    condition: 'new',
    productType: category,
    colorOptions: [...new Set(colorOptions)],
    deliveryTime,
    dimensions,
    raw: {
      jsonLd: ld,
      variantTexts: raw.variantTexts,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Génération CSV
// ─────────────────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags',
    'Published', 'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
    'Option3 Name', 'Option3 Value',
    'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
    'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price',
    'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
    'Variant Barcode', 'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card',
    'SEO Title', 'SEO Description',
    'Google Shopping / Google Product Category', 'Google Shopping / MPN',
    'Google Shopping / Condition', 'Google Shopping / Custom Product',
    'Variant Weight Unit', 'Status',
  ];

  const rows = products.map((p) => {
    const handle = slugify(p.title);
    const googleCat = googleCategory(p.productType, p.title);
    const colorOptions = p.colorOptions;
    const hasVariants = colorOptions.length > 0;

    // Body HTML
    const bodyHtml = p.description
      ? p.description
          .split('\n')
          .map((line) => `<p>${line}</p>`)
          .join('')
      : '';

    const baseRow = [
      handle,
      p.title,
      bodyHtml,
      p.vendor || 'DRIK CONTAINERS',
      googleCat,
      p.productType || 'Container',
      p.productType || 'Container',
      'TRUE',
      hasVariants ? 'Farbe' : 'Title',
      hasVariants ? colorOptions[0] || 'Default' : 'Default Title',
      '', '', '', '', // Option2/3
      p.sku || '',
      '0',
      'shopify',
      '10',
      'deny',
      'manual',
      p.price ? p.price.replace(' EUR', '') : '',
      p.salePrice ? p.salePrice.replace(' EUR', '') : '',
      'TRUE',
      'TRUE',
      p.gtin || '',
      p.imageLink || '',
      p.imageLink ? '1' : '',
      p.title || '',
      'FALSE',
      p.title || '',
      p.shortDescription.slice(0, 320) || '',
      googleCat,
      p.mpn || '',
      'new',
      'FALSE',
      'kg',
      'active',
    ];

    // Additional rows for other color variants
    const extraRows = [];
    for (let i = 1; i < colorOptions.length; i += 1) {
      extraRows.push([
        handle,
        '', '', '', '', '', '', '',
        'Farbe',
        colorOptions[i],
        '', '', '', '',
        `${p.sku || ''}-${i + 1}`,
        '0', 'shopify', '10', 'deny', 'manual',
        p.price ? p.price.replace(' EUR', '') : '',
        '', 'TRUE', 'TRUE', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      ]);
    }

    // Additional images rows
    const imageRows = [];
    p.images.slice(1).forEach((img, idx) => {
      imageRows.push([
        handle,
        '', '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '',
        img,
        String(idx + 2),
        p.title || '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      ]);
    });

    return [baseRow, ...extraRows, ...imageRows];
  });

  return [headers, ...rows.flat()];
}

function buildGmcCsv(products) {
  const headers = [
    'id', 'title', 'description', 'link', 'image_link', 'additional_image_link',
    'availability', 'price', 'sale_price', 'brand', 'gtin', 'mpn', 'condition',
    'product_type',
  ];

  const rows = products.map((p) => [
    p.id || '',
    p.title || '',
    p.description || '',
    p.link || '',
    p.imageLink || '',
    p.additionalImageLinks || '',
    p.availability || '',
    p.price || '',
    p.salePrice || '',
    p.brand || '',
    p.gtin || '',
    p.mpn || '',
    'new',
    p.productType || '',
  ]);

  return [headers, ...rows];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    console.log('🔍 Découverte des URLs produits…');
    let productUrls;
    const linksFile = '/tmp/drike_links.json';
    if (fs.existsSync(linksFile)) {
      productUrls = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
      console.log(`  → ${productUrls.length} URLs chargées depuis cache`);
    } else {
      productUrls = await discoverProductUrls(browser);
      fs.writeFileSync(linksFile, JSON.stringify(productUrls, null, 2), 'utf8');
    }

    console.log(`\n🚀 Scraping de ${productUrls.length} produits (concurrency: ${CONCURRENCY})…\n`);

    const products = [];
    for (let i = 0; i < productUrls.length; i += CONCURRENCY) {
      const batch = productUrls.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((url) => scrapeProduct(browser, url))
      );
      products.push(...batchResults);
      console.log(`  Progress: ${Math.min(i + CONCURRENCY, productUrls.length)}/${productUrls.length}`);
      if (i + CONCURRENCY < productUrls.length) await sleep(REQUEST_DELAY_MS);
    }

    const valid = products.filter((p) => !p.error);
    const errors = products.filter((p) => p.error);

    const normalized = valid.map(normalizeProduct);

    console.log(`\n✅ ${normalized.length} produits normalisés`);
    if (errors.length) {
      console.log(`⚠️  ${errors.length} erreurs`);
      errors.forEach((e) => console.log(`   - ${e.url}: ${e.error}`));
    }

    // JSON
    const jsonPath = path.join(OUTPUT_DIR, 'drike_products.json');
    fs.writeFileSync(jsonPath, JSON.stringify(normalized, null, 2), 'utf8');
    console.log(`💾 JSON: ${jsonPath}`);

    // Shopify CSV
    const shopifyPath = path.join(OUTPUT_DIR, 'drike_products_shopify.csv');
    const shopifyRows = buildShopifyCsv(normalized);
    fs.writeFileSync(shopifyPath, stringify(shopifyRows), 'utf8');
    console.log(`💾 Shopify CSV: ${shopifyPath}`);

    // GMC CSV
    const gmcPath = path.join(OUTPUT_DIR, 'drike_products_gmc.csv');
    const gmcRows = buildGmcCsv(normalized);
    fs.writeFileSync(gmcPath, stringify(gmcRows), 'utf8');
    console.log(`💾 GMC CSV: ${gmcPath}`);

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('RÉSUMÉ');
    console.log('═'.repeat(80));
    normalized.forEach((p) => {
      console.log(`  • ${p.title}`);
      console.log(`    Prix: ${p.price || 'N/A'} | SKU: ${p.sku || 'N/A'} | Stock: ${p.availability} | Images: ${p.images.length}`);
    });
    console.log('═'.repeat(80));
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
