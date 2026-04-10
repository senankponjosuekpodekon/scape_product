import fs from "fs";
import fetch from "node-fetch";
import puppeteer from "puppeteer";
import xml2js from "xml2js";

/* =====================
   CONFIG
===================== */

const CONFIG = {
  // Site configuration
  BASE_URL: "https://warmholzgmbh.de/",
  SITEMAP_URL: "https://warmholzgmbh.de/wp-sitemap.xml",
  VENDOR_NAME: "EHS-PELLETS GmbH",
  
  // Product URL pattern (auto-detected from sitemap)
  PRODUCT_URL_PATTERN: "/produto/", // /product/, /produkt/, etc.
  
  // Output format: 'new' (57 columns) or 'legacy' (20 columns)
  OUTPUT_FORMAT: "new",
  
  // Category filters (empty = all products)
  CATEGORIES_FILTER: [],
  
  // Limits and optimization
  MAX_PRODUCTS: null, // null = all products
  DELAY_BETWEEN_PAGES: 1500,
  SAVE_PROGRESS_EVERY: 10,
  RETRY_ON_ERROR: 2,
  
  // Output filename
  OUTPUT_FILE: "shopify_products_optimized.csv"
};

/* =====================
   SHOPIFY FORMATS
===================== */

const SHOPIFY_FORMATS = {
  new: [
    'Title', 'URL handle', 'Description', 'Vendor', 'Product category', 'Type', 'Tags',
    'Published on online store', 'Status', 'SKU', 'Barcode', 'Option1 name', 'Option1 value',
    'Option1 Linked To', 'Option2 name', 'Option2 value', 'Option2 Linked To', 'Option3 name',
    'Option3 value', 'Option3 Linked To', 'Price', 'Compare-at price', 'Cost per item',
    'Charge tax', 'Tax code', 'Unit price total measure', 'Unit price total measure unit',
    'Unit price base measure', 'Unit price base measure unit', 'Inventory tracker',
    'Inventory quantity', 'Continue selling when out of stock', 'Weight value (grams)',
    'Weight unit for display', 'Requires shipping', 'Fulfillment service', 'Product image URL',
    'Image position', 'Image alt text', 'Variant image URL', 'Gift card', 'SEO title',
    'SEO description', 'Color (product.metafields.shopify.color-pattern)',
    'Google Shopping / Google product category', 'Google Shopping / Gender',
    'Google Shopping / Age group', 'Google Shopping / Manufacturer part number (MPN)',
    'Google Shopping / Ad group name', 'Google Shopping / Ads labels',
    'Google Shopping / Condition', 'Google Shopping / Custom product',
    'Google Shopping / Custom label 0', 'Google Shopping / Custom label 1',
    'Google Shopping / Custom label 2', 'Google Shopping / Custom label 3',
    'Google Shopping / Custom label 4'
  ],
  
  legacy: [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
    'Variant Price', 'Variant Compare At Price', 'Image Src', 'Image Position',
    'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
    'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Requires Shipping',
    'Variant Taxable', 'Variant Barcode'
  ]
};

/* =====================
   UTILS
===================== */

const slugify = text =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function cleanHTML(html) {
  if (!html) return "";
  return html
    .replace(/\r?\n/g, ' ')    // Remove line breaks
    .replace(/\s+/g, ' ')       // Reduce multiple spaces
    .trim();
}

function cleanPrice(value) {
  if (!value) return "";
  
  let cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return "";
  
  // Handle different formats: 1.800,00 or 1,800.00
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // European: 1.800,00 -> 1800.00
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // American: 1,800.00 -> 1800.00
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // 1800,00 -> 1800.00
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // 1.800.00 -> 1800.00
      cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
  }
  
  return cleaned;
}

async function fetchXml(url) {
  const res = await fetch(url, { timeout: 20000 });
  if (!res.ok) throw new Error(`Sitemap inaccessible : ${url}`);
  return res.text();
}

async function extractUrlsFromSitemap(url) {
  const xml = await fetchXml(url);
  const parsed = await xml2js.parseStringPromise(xml);
  let urls = [];

  if (parsed.sitemapindex) {
    for (const sm of parsed.sitemapindex.sitemap) {
      const child = await fetchXml(sm.loc[0]);
      const childParsed = await xml2js.parseStringPromise(child);
      if (childParsed.urlset?.url) {
        urls.push(...childParsed.urlset.url.map(u => u.loc[0]));
      }
    }
  } else if (parsed.urlset?.url) {
    urls = parsed.urlset.url.map(u => u.loc[0]);
  }

  return urls;
}

const isProductUrl = url => {
  if (!url.includes(CONFIG.PRODUCT_URL_PATTERN)) return false;
  if (CONFIG.CATEGORIES_FILTER.length === 0) return true;
  return CONFIG.CATEGORIES_FILTER.some(cat => url.includes(cat));
};

/* =====================
   CSV GENERATORS
===================== */

function generateNewFormatRow(product, imageIndex, isFirstImage) {
  const row = {};
  const headers = SHOPIFY_FORMATS.new;
  
  headers.forEach(header => {
    if (isFirstImage) {
      // First image row - full product data
      switch(header) {
        case 'Title': row[header] = product.title; break;
        case 'URL handle': row[header] = product.handle; break;
        case 'Description': row[header] = product.description; break;
        case 'Vendor': row[header] = product.vendor; break;
        case 'Published on online store': row[header] = 'TRUE'; break;
        case 'Status': row[header] = 'active'; break;
        case 'Price': row[header] = product.price; break;
        case 'Compare-at price': row[header] = product.compare_at_price; break;
        case 'Charge tax': row[header] = 'TRUE'; break;
        case 'Requires shipping': row[header] = 'TRUE'; break;
        case 'Fulfillment service': row[header] = 'manual'; break;
        case 'Inventory tracker': row[header] = 'shopify'; break;
        case 'Continue selling when out of stock': row[header] = 'DENY'; break;
        case 'Weight unit for display': row[header] = 'g'; break;
        case 'Gift card': row[header] = 'FALSE'; break;
        case 'Product image URL': row[header] = product.images[imageIndex]; break;
        case 'Image position': row[header] = String(imageIndex + 1); break;
        default: row[header] = '';
      }
    } else {
      // Additional image rows - minimal data
      switch(header) {
        case 'URL handle': row[header] = product.handle; break;
        case 'Product image URL': row[header] = product.images[imageIndex]; break;
        case 'Image position': row[header] = String(imageIndex + 1); break;
        default: row[header] = '';
      }
    }
  });
  
  return row;
}

function generateLegacyFormatRow(product, imageIndex, isFirstImage) {
  return {
    Handle: product.handle,
    Title: product.title,
    'Body (HTML)': isFirstImage ? product.description : '',
    Vendor: product.vendor,
    Type: '',
    Tags: '',
    Published: 'TRUE',
    'Variant Price': isFirstImage ? product.price : '',
    'Variant Compare At Price': isFirstImage ? product.compare_at_price : '',
    'Image Src': product.images[imageIndex],
    'Image Position': imageIndex + 1,
    'Variant SKU': '',
    'Variant Grams': '',
    'Variant Inventory Tracker': '',
    'Variant Inventory Qty': '',
    'Variant Inventory Policy': 'deny',
    'Variant Fulfillment Service': 'manual',
    'Variant Requires Shipping': 'TRUE',
    'Variant Taxable': 'TRUE',
    'Variant Barcode': ''
  };
}

function saveCSV(csvRows, filename) {
  if (csvRows.length === 0) return;
  
  const headers = Object.keys(csvRows[0]);
  const csv =
    headers.join(",") +
    "\n" +
    csvRows
      .map(row =>
        headers
          .map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
  
  fs.writeFileSync(filename, csv, "utf8");
}

/* =====================
   MAIN
===================== */

(async () => {
  console.log("🚀 WooCommerce to Shopify Exporter (Optimized)\n");
  console.log(`📊 Format: ${CONFIG.OUTPUT_FORMAT.toUpperCase()}`);
  console.log(`📦 Output: ${CONFIG.OUTPUT_FILE}\n`);
  
  console.log("🔍 Récupération du sitemap...");
  const allUrls = await extractUrlsFromSitemap(CONFIG.SITEMAP_URL);
  let productUrls = allUrls.filter(isProductUrl);
  
  if (CONFIG.CATEGORIES_FILTER.length > 0) {
    console.log(`📂 Filtres: ${CONFIG.CATEGORIES_FILTER.join(", ")}`);
  }
  
  if (CONFIG.MAX_PRODUCTS && productUrls.length > CONFIG.MAX_PRODUCTS) {
    productUrls = productUrls.slice(0, CONFIG.MAX_PRODUCTS);
  }

  console.log(`✅ ${productUrls.length} produits à scraper\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const csvRows = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < productUrls.length; i++) {
    const url = productUrls[i];
    const progress = `[${i + 1}/${productUrls.length}]`;
    console.log(`${progress} Scraping :`, url);

    let attempts = 0;
    let success = false;
    
    while (attempts < CONFIG.RETRY_ON_ERROR && !success) {
      try {
        attempts++;
        
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        await page.waitForFunction(() => document.readyState === "complete");
        await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_PAGES));

        const product = await page.evaluate((vendor) => {
          const clean = v => (v ? v.trim() : "");

          const title = clean(document.querySelector("h1.product_title")?.innerText);

          let images = Array.from(
            document.querySelectorAll(
              "img.wp-post-image, img.attachment-woocommerce_thumbnail, .woocommerce-product-gallery__image img"
            )
          )
            .map(img => img.src)
            .filter(Boolean);

          images = [...new Set(images)];

          const description =
            document.querySelector(".woocommerce-Tabs-panel--description")?.innerHTML ||
            document.querySelector("#tab-description")?.innerHTML ||
            document.querySelector(".entry-content")?.innerHTML ||
            "";

          let price = "";
          let compare_at_price = "";

          const saleEl = document.querySelector("p.price ins .amount");
          if (saleEl) price = saleEl.innerText;

          const regularEl = document.querySelector("p.price del .amount");
          if (regularEl) compare_at_price = regularEl.innerText;

          if (!price) {
            const normalEl = document.querySelector("p.price > .amount");
            if (normalEl) price = normalEl.innerText;
          }

          return { title, price, compare_at_price, description, images, vendor };
        }, CONFIG.VENDOR_NAME);

        if (!product.title || product.images.length === 0) {
          console.log(`⚠️  Produit ignoré (titre ou images manquants)`);
          break;
        }

        // Clean data
        product.handle = slugify(product.title);
        product.description = cleanHTML(product.description);
        product.price = cleanPrice(product.price);
        product.compare_at_price = cleanPrice(product.compare_at_price);

        // Generate CSV rows based on format
        const generateRow = CONFIG.OUTPUT_FORMAT === 'new' 
          ? generateNewFormatRow 
          : generateLegacyFormatRow;

        product.images.forEach((img, index) => {
          csvRows.push(generateRow(product, index, index === 0));
        });
        
        successCount++;
        success = true;
        console.log(`✅ Succès (${product.images.length} images)`);
        
        // Save progress
        if (successCount % CONFIG.SAVE_PROGRESS_EVERY === 0) {
          saveCSV(csvRows, `${CONFIG.OUTPUT_FILE}.progress`);
          console.log(`💾 Sauvegarde intermédiaire (${successCount} produits)\n`);
        }

      } catch (err) {
        if (attempts >= CONFIG.RETRY_ON_ERROR) {
          errorCount++;
          console.error(`⛔ Échec après ${CONFIG.RETRY_ON_ERROR} tentatives`);
          console.error(`   Erreur: ${err.message}\n`);
        } else {
          console.log(`🔄 Nouvelle tentative (${attempts}/${CONFIG.RETRY_ON_ERROR})...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
  }
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   ✅ Réussis: ${successCount}`);
  console.log(`   ❌ Échecs: ${errorCount}`);
  console.log(`   📦 Total lignes CSV: ${csvRows.length}\n`);

  await browser.close();

  // Save final CSV
  saveCSV(csvRows, CONFIG.OUTPUT_FILE);
  
  // Clean up progress file
  const progressFile = `${CONFIG.OUTPUT_FILE}.progress`;
  if (fs.existsSync(progressFile)) {
    fs.unlinkSync(progressFile);
  }

  console.log(`✅ Export terminé : ${CONFIG.OUTPUT_FILE}`);
  console.log(`📋 Format: ${CONFIG.OUTPUT_FORMAT.toUpperCase()} (${SHOPIFY_FORMATS[CONFIG.OUTPUT_FORMAT].length} colonnes)`);
})();
