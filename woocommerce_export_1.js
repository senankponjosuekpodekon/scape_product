import fs from "fs";
import fetch from "node-fetch";
import puppeteer from "puppeteer";
import xml2js from "xml2js";

/* =====================
   CONFIG
===================== */

const BASE_URL = "https://lenasdiazcb.es";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
const VENDOR_NAME = "lenasdiazcb";

/* =====================
   UTILS
===================== */

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

const isProductUrl = url => url.includes("/producto/");

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
  const csvRows = [];

  for (const url of productUrls) {
    console.log("Scraping :", url);

    try {
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      await page.waitForFunction(() => document.readyState === "complete");
      await new Promise(r => setTimeout(r, 2500));

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

        const cleanPrice = v =>
          v
            ? v.replace(/[^\d.,]/g, "").replace(/\.(?=.*\.)/g, "").replace(",", ".")
            : "";

        price = cleanPrice(price);
        compare_at_price = cleanPrice(compare_at_price);

        if (
          compare_at_price &&
          parseFloat(compare_at_price) <= parseFloat(price)
        ) {
          compare_at_price = "";
        }

        return { title, price, compare_at_price, description, images, vendor };
      }, VENDOR_NAME);

      if (!product.title || product.images.length === 0) continue;

      const handle = slugify(product.title);

      product.images.forEach((img, index) => {
        csvRows.push({
          Handle: handle,
          Title: index === 0 ? product.title : "",
          "Body (HTML)": index === 0 ? product.description : "",
          Vendor: index === 0 ? product.vendor : "",
          Type: "",
          Tags: "",
          Published: "TRUE",
          "Variant Price": index === 0 ? product.price : "",
          "Variant Compare At Price":
            index === 0 ? product.compare_at_price : "",
          "Image Src": img,
          "Image Position": index + 1,
        });
      });

    } catch (err) {
      console.error("⛔ Erreur sur :", url);
      console.error(err.message);
    }
  }

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
          .map(h => `"${(row[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

  fs.writeFileSync("shopify_products.csv", csv, "utf8");

  console.log("✅ Export Shopify terminé : shopify_products.csv");
})();

