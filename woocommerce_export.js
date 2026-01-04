import fs from "fs";
import fetch from "node-fetch";
import puppeteer from "puppeteer";
import xml2js from "xml2js";

const BASE_URL = "https://lenasdiazcb.es";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
const VENDOR_NAME = "Pablo Escobar";

/* =====================
   UTILS
===================== */

async function fetchXml(url) {
  const res = await fetch(url);
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

/* =====================
   FILTRAGE PRODUITS
===================== */

function isProductUrl(url) {
  return url.includes("/producto/");
}

/* =====================
   MAIN
===================== */

(async () => {
  const allUrls = await extractUrlsFromSitemap(SITEMAP_URL);
  const productUrls = allUrls.filter(isProductUrl);

  console.log(`${productUrls.length} pages produit détectées`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const products = [];

  for (const url of productUrls) {
    console.log("Scraping :", url);

    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForFunction(() => document.readyState === "complete");

    // Attendre que JS WooCommerce injecte le prix
    await new Promise(r => setTimeout(r, 2500));

    const product = await page.evaluate((vendor) => {
      const clean = v => (v ? v.trim() : "");

      const title = clean(document.querySelector("h1.product_title")?.innerText);

      let images = Array.from(
        document.querySelectorAll(
          "img.wp-post-image, img.attachment-woocommerce_thumbnail, img[srcset]"
        )
      )
        .map(img => img.src || img.getAttribute("srcset")?.split(" ")[0])
        .filter(Boolean);
      images = [...new Set(images)];

      // LONG DESCRIPTION
      const description =
        document.querySelector(".woocommerce-Tabs-panel--description")?.innerHTML ||
        document.querySelector("#tab-description")?.innerHTML ||
        document.querySelector(".entry-content")?.innerHTML ||
        document.querySelector(".woocommerce-product-details__short-description")?.innerHTML ||
        "";

    // PRIX
    // =====================
    // PRIX (WooCommerce → Shopify)
    // =====================
    let price = "";
    let compare_at_price = "";

    // Prix promotionnel
    const saleEl = document.querySelector("p.price ins .woocommerce-Price-amount, p.price ins .amount");
    if (saleEl) {
      price = saleEl.innerText;
    }

    // Prix normal barré
    const regularEl = document.querySelector("p.price del .woocommerce-Price-amount, p.price del .amount");
    if (regularEl) {
      compare_at_price = regularEl.innerText;
    }

    // Produit sans promo
    if (!price) {
      const normalEl = document.querySelector(
        "p.price > .woocommerce-Price-amount, p.price > .amount"
      );
      if (normalEl) {
        price = normalEl.innerText;
      }
    }

    // Nettoyage
    const cleanPrice = v =>
      v
        ? v.replace(/[^\d.,]/g, "").replace(/\.(?=.*\.)/g, "").replace(",", ".")
        : "";

    price = cleanPrice(price);
    compare_at_price = cleanPrice(compare_at_price);

    // Sécurité Shopify
    if (compare_at_price && parseFloat(compare_at_price) <= parseFloat(price)) {
      compare_at_price = "";
    }

      return { title, price, compare_at_price, description, images, vendor };
    }, VENDOR_NAME);

    if (product.title && product.images.length > 0) {
      products.push({ url, ...product });
    }
  }

  await browser.close();

  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
  console.log("Export terminé avec succès.");
})();

