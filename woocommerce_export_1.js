import fs from "fs";
import fetch from "node-fetch";
import puppeteer from "puppeteer";
import xml2js from "xml2js";
import https from "https";
import http from "http";

/* =====================
   CONFIG
===================== */

const BASE_URL = "https://warmholzgmbh.de";
const SITEMAP_URL = `${BASE_URL}/wp-sitemap.xml`;
const VENDOR_NAME = "EHS-PELLETS GmbH";

// FILTRES PAR CATÉGORIES (laisser vide [] pour tout télécharger)
// Catégories actives : Brennholz, Holzbriketts, Holzpellets
const CATEGORIES_FILTER = [

];

// OPTIONS D'OPTIMISATION
const MAX_PRODUCTS = null; // null = tous, ou nombre max de produits
const DELAY_BETWEEN_PAGES = 1500; // ms d'attente entre chaque page
const SAVE_PROGRESS_EVERY = 10; // sauvegarde intermédiaire tous les X produits
const RETRY_ON_ERROR = 2; // nombre de tentatives en cas d'échec

/* =====================
   UTILS
===================== */

async function fetchXml(url) {
  // Extraire le nom du fichier de l'URL
  const fileName = url.split('/').pop();
  
  // Si le fichier existe localement, le lire
  if (fs.existsSync(fileName)) {
    console.log(`📄 Lecture depuis le fichier local: ${fileName}`);
    return fs.readFileSync(fileName, 'utf-8');
  }
  
  console.log(`⬇️  Téléchargement de: ${url}`);
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/xml,text/xml,*/*'
      },
      timeout: 60000
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Sitemap inaccessible : ${url}, status: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    }).on('timeout', () => {
      reject(new Error('Request timeout'));
    });
  });
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

const slugify = text =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* =====================
   FILTER
===================== */

const isProductUrl = url => {
  if (!url.includes("/produkt/")) return false;
  
  // Si pas de filtre de catégorie, accepter tous les produits
  if (CATEGORIES_FILTER.length === 0) return true;
  
  // Vérifier si l'URL contient une des catégories filtrées
  return CATEGORIES_FILTER.some(cat => url.includes(cat));
};

/* =====================
   SAVE PROGRESS
===================== */

function saveProgressCSV(csvRows, filename = "shopify_products_progress.csv") {
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
  console.log("🔍 Récupération du sitemap...");
  const allUrls = await extractUrlsFromSitemap(SITEMAP_URL);
  let productUrls = allUrls.filter(isProductUrl);
  
  if (CATEGORIES_FILTER.length > 0) {
    console.log(`📂 Filtres de catégories actifs: ${CATEGORIES_FILTER.join(", ")}`);
  }
  
  if (MAX_PRODUCTS && productUrls.length > MAX_PRODUCTS) {
    productUrls = productUrls.slice(0, MAX_PRODUCTS);
  }

  console.log(`✅ ${productUrls.length} pages produit à scraper\n`);

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
    
    while (attempts < RETRY_ON_ERROR && !success) {
      try {
        attempts++;
        
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        await page.waitForFunction(() => document.readyState === "complete");
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_PAGES));

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

        // Nettoyer la description : supprimer les sauts de ligne et espaces multiples
        const cleanDescription = description
          .replace(/\r?\n|\r/g, ' ')  // Remplacer tous les sauts de ligne par un espace
          .replace(/\s+/g, ' ')        // Remplacer les espaces multiples par un seul
          .trim();                      // Supprimer les espaces au début/fin

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

        const cleanPrice = v => {
          if (!v) return "";
          
          // Supprimer tous les caractères sauf chiffres, virgule et point
          let cleaned = v.replace(/[^\d.,]/g, "");
          
          // Détecter le format et normaliser
          // Format européen: 1.800,00 ou 1 800,00 (virgule = décimales)
          // Format américain: 1,800.00 (point = décimales)
          
          if (cleaned.includes(',') && cleaned.includes('.')) {
            // Les deux sont présents, déterminer lequel est les décimales
            const lastComma = cleaned.lastIndexOf(',');
            const lastDot = cleaned.lastIndexOf('.');
            
            if (lastComma > lastDot) {
              // Format européen: 1.800,00
              cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else {
              // Format américain: 1,800.00
              cleaned = cleaned.replace(/,/g, '');
            }
          } else if (cleaned.includes(',')) {
            // Uniquement virgule
            const parts = cleaned.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
              // Format: 1800,00 ou 1.800,00 (virgule = décimales)
              cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else {
              // Virgule comme séparateur de milliers
              cleaned = cleaned.replace(/,/g, '');
            }
          } else if (cleaned.includes('.')) {
            // Uniquement point
            const parts = cleaned.split('.');
            if (parts.length > 2) {
              // Plusieurs points = séparateurs de milliers sauf le dernier
              cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
            } else if (parts.length === 2 && parts[1].length > 2) {
              // Format: 1.80000 (point = séparateur de milliers)
              cleaned = cleaned.replace(/\./g, '');
            }
            // Sinon c'est déjà au bon format
          }
          
          return cleaned;
        };

        price = cleanPrice(price);
        compare_at_price = cleanPrice(compare_at_price);

        if (
          compare_at_price &&
          parseFloat(compare_at_price) <= parseFloat(price)
        ) {
          compare_at_price = "";
        }

        return { title, price, compare_at_price, description: cleanDescription, images, vendor };
      }, VENDOR_NAME);

        if (!product.title || product.images.length === 0) {
          console.log(`⚠️  Produit ignoré (titre ou images manquants)`);
          break;
        }

        const handle = slugify(product.title);

        product.images.forEach((img, index) => {
          csvRows.push({
            Handle: handle,
            Title: product.title, // Le titre doit être présent sur TOUTES les lignes
            "Body (HTML)": index === 0 ? product.description : "",
            Vendor: product.vendor, // Le vendor doit être présent sur TOUTES les lignes
            Type: "",
            Tags: "",
            Published: "TRUE",
            "Variant Price": index === 0 ? product.price : "",
            "Variant Compare At Price":
              index === 0 ? product.compare_at_price : "",
            "Image Src": img,
            "Image Position": index + 1,
            "Variant SKU": "", // Ajout du SKU pour éviter les variantes multiples
            "Variant Grams": "",
            "Variant Inventory Tracker": "",
            "Variant Inventory Qty": "",
            "Variant Inventory Policy": "deny",
            "Variant Fulfillment Service": "manual",
            "Variant Requires Shipping": "TRUE",
            "Variant Taxable": "TRUE",
            "Variant Barcode": "",
          });
        });
        
        successCount++;
        success = true;
        console.log(`✅ Succès (${product.images.length} images)`);
        
        // Sauvegarde intermédiaire
        if (successCount % SAVE_PROGRESS_EVERY === 0) {
          saveProgressCSV(csvRows);
          console.log(`💾 Sauvegarde intermédiaire (${successCount} produits)\n`);
        }

      } catch (err) {
        if (attempts >= RETRY_ON_ERROR) {
          errorCount++;
          console.error(`⛔ Échec après ${RETRY_ON_ERROR} tentatives`);
          console.error(`   Erreur: ${err.message}\n`);
        } else {
          console.log(`🔄 Nouvelle tentative (${attempts}/${RETRY_ON_ERROR})...`);
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

  /* =====================
     CSV SHOPIFY
  ===================== */

  const headers = Object.keys(csvRows[0] || {});
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

  fs.writeFileSync("shopify_products.csv", csv, "utf8");
  
  // Supprimer le fichier de progression
  if (fs.existsSync("shopify_products_progress.csv")) {
    fs.unlinkSync("shopify_products_progress.csv");
  }

  console.log("✅ Export Shopify terminé : shopify_products.csv");
})();

