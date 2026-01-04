import fs from "fs";
import fetch from "node-fetch";
import puppeteer from "puppeteer";
import xml2js from "xml2js";

const BASE_URL = "https://pelletsherrera.es";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

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
  return (
    url.includes("/pellets-de-madera/") ||
    url.includes("/briquetas-de-madera/") ||
    url.includes("/inicio/")
  );
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

    await new Promise(r => setTimeout(r, 1500));

    const product = await page.evaluate(() => {
      const clean = v => (v ? v.trim() : "");

      // IMAGES PRESTASHOP
      let images = Array.from(
        document.querySelectorAll(
          "img[data-full-size-image-url], img.product-cover, img.js-qv-product-cover, img[srcset]"
        )
      )
        .map(img =>
          img.dataset.fullSizeImageUrl ||
          img.src ||
          img.getAttribute("srcset")?.split(" ")[0]
        )
        .filter(Boolean);

      images = [...new Set(images)];

    let price = "";

    /* 1️⃣ JSON-LD (le plus fiable) */
    try {
      const jsonLd = Array.from(
        document.querySelectorAll("script[type='application/ld+json']")
      );

      for (const script of jsonLd) {
        const data = JSON.parse(script.innerText);
        if (data?.offers?.price) {
          price = data.offers.price.toString();
          break;
        }
      }
    } catch (e) {}

    /* 2️⃣ Microdata */
    if (!price) {
      price =
        document.querySelector("[itemprop='price']")?.getAttribute("content") ||
        "";
    }

    /* 3️⃣ DOM classique */
    if (!price) {
      price =
        document.querySelector(".price, .product-price, [class*='price']")?.innerText ||
        "";
    }

    price = price.replace(/[^\d,.]/g, "").replace(",", ".");


      return {
        title: clean(document.querySelector("h1")?.innerText),
        price,
        description: document.querySelector(".product-description, .rte")?.innerHTML || "",
        images,
      };
    });

    // Ignore pages vides
    if (product.title && product.images.length > 0) {
      products.push({ url, ...product });
    }
  }

  await browser.close();

  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
  console.log("Export terminé avec succès.");
})();

