#!/usr/bin/env node

import puppeteer from 'puppeteer';
import xml2jsModule from 'xml2js';
import fetch from 'node-fetch';
import { createWriteStream } from 'fs';

const { parseString } = xml2jsModule;

const BASE_URL = process.argv[2] || 'https://www.luminaire.fr';
const OUTPUT_FILE = process.argv[3] || 'luminaire_products.jsonl';

async function fetchSitemap() {
  console.log('📍 Fetching sitemap...');
  const sitemapPaths = [
    '/sitemap.xml',
    '/pub/media/sitemap/sitemap.xml',
    '/.well-known/sitemap.xml',
    '/sitemap_products_1.xml',
    '/pub/media/sitemap/sitemap_products_1.xml'
  ];

  for (const path of sitemapPaths) {
    try {
      const url = `${BASE_URL}${path}`;
      const res = await fetch(url);
      if (res.status === 200) {
        const xml = await res.text();
        if (xml.includes('<?xml') || xml.includes('urlset')) {
          console.log(`✅ Found sitemap at ${url}`);
          return new Promise((resolve, reject) => {
            parseString(xml, { strict: false }, (err, result) => {
              if (err) {
                console.warn('⚠️  Parse error:', err.message);
                return resolve([`${BASE_URL}/sitemap_products_1.xml`]);
              }
              const sitemaps = [];
              if (result?.sitemapindex?.sitemap) {
                result.sitemapindex.sitemap.forEach(s => {
                  if (s.loc?.[0]) sitemaps.push(s.loc[0]);
                });
              }
              resolve(sitemaps.length > 0 ? sitemaps : [url]);
            });
          });
        }
      }
    } catch (e) {
      // Continue to next path
    }
  }

  console.warn('⚠️  Could not find any sitemap, trying /pub/media/sitemap/');
  return [`${BASE_URL}/pub/media/sitemap/sitemap_products_1.xml`];
}

async function fetchProductUrls(sitemapUrl) {
  console.log(`📍 Fetching product URLs from ${sitemapUrl}...`);
  try {
    const res = await fetch(sitemapUrl);
    const xml = await res.text();
    return new Promise((resolve, reject) => {
      parseString(xml, { strict: false }, (err, result) => {
        if (err) {
          console.error(`❌ XML parse error for ${sitemapUrl}:`, err.message);
          return resolve([]);
        }
        const urls = [];
        if (result?.urlset?.url) {
          result.urlset.url.forEach(u => {
            if (u.loc?.[0]) urls.push(u.loc[0]);
          });
        }
        resolve(urls.filter(u => u.includes('/product') || u.includes('/p/')));
      });
    });
  } catch (e) {
    console.error(`❌ Error fetching ${sitemapUrl}:`, e.message);
    return [];
  }
}

async function scrapeProduct(browser, productUrl) {
  let page;
  try {
    page = await browser.newPage();
    await page.goto(productUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    const product = await page.evaluate(() => {
      const title = document.querySelector('h1[data-ui-id="page-title-heading"]')?.textContent?.trim() ||
                    document.querySelector('h1.page-title')?.textContent?.trim() ||
                    document.querySelector('h1')?.textContent?.trim() ||
                    '';

      let price = 0;
      const priceElem = document.querySelector('[data-price-type="finalPrice"]');
      if (priceElem) {
        price = parseFloat(priceElem.getAttribute('data-price-amount'));
      } else {
        const priceText = document.querySelector('.price-box [data-price-amount]')?.getAttribute('data-price-amount') ||
                          document.querySelector('span.price')?.textContent;
        if (priceText) {
          price = parseFloat(priceText.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
        }
      }

      const description = document.querySelector('#product-description')?.textContent?.trim() ||
                          document.querySelector('[data-role="content"]')?.textContent?.trim() ||
                          document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                          '';

      const images = [];
      const imgSelectors = [
        '[data-gallery-role="gallery-placeholder"] [data-role="gallery-placeholder-image"]',
        '[data-gallery] img.gallery-placeholder__image',
        '.product-image img'
      ];
      
      imgSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(elem => {
          let imgSrc = elem.getAttribute('data-src') || elem.getAttribute('src');
          if (imgSrc && !imgSrc.includes('placeholder') && !images.includes(imgSrc)) {
            images.push(imgSrc);
          }
        });
      });

      let sku = '';
      let ean = '';
      document.querySelectorAll('dd').forEach(elem => {
        const text = elem.textContent.trim();
        if (text && /^[A-Z0-9-]{5,}$/.test(text)) {
          if (!sku) sku = text;
          else if (!ean) ean = text;
        }
      });

      const categories = [];
      document.querySelectorAll('a[href*="/category/"]').forEach(elem => {
        const cat = elem.textContent.trim();
        if (cat && !categories.includes(cat)) {
          categories.push(cat);
        }
      });

      const stockText = document.querySelector('[data-role="product-stock-status"]')?.textContent?.trim() ||
                        document.querySelector('.product-info-stock-sku .stock')?.textContent?.trim() ||
                        '';
      const inStock = !stockText.includes('rupture') && !stockText.includes('indisponible');

      return {
        title: title || 'N/A',
        price: price || 0,
        description: description.substring(0, 500),
        images: images.slice(0, 10),
        sku: sku || '',
        ean: ean || '',
        categories: categories,
        inStock: inStock
      };
    });

    return {
      ...product,
      url: productUrl,
      scrapedAt: new Date().toISOString()
    };
  } catch (e) {
    console.error(`❌ Error scraping ${productUrl}:`, e.message);
    return null;
  } finally {
    if (page) await page.close();
  }
}

async function main() {
  console.log(`🚀 Starting Luminaire.fr scraper\n`);
  
  const sitemaps = await fetchSitemap();
  console.log(`✅ Found ${sitemaps.length} sitemap(s)\n`);

  let allProductUrls = [];
  for (const sitemapUrl of sitemaps) {
    const urls = await fetchProductUrls(sitemapUrl);
    allProductUrls = allProductUrls.concat(urls);
    console.log(`✅ Found ${urls.length} products in this sitemap\n`);
  }

  allProductUrls = [...new Set(allProductUrls)];
  console.log(`📊 Total unique products: ${allProductUrls.length}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const output = createWriteStream(OUTPUT_FILE);
  let processed = 0;
  let failed = 0;

  for (const url of allProductUrls) {
    const product = await scrapeProduct(browser, url);
    if (product) {
      output.write(JSON.stringify(product) + '\n');
      processed++;
      if (processed % 10 === 0) {
        console.log(`📍 Processed: ${processed}/${allProductUrls.length}`);
      }
    } else {
      failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  output.end();
  await browser.close();
  
  console.log(`\n✅ Scraping complete!\n`);
  console.log(`📊 Results:`);
  console.log(`   - Total processed: ${processed}`);
  console.log(`   - Failed: ${failed}`);
  console.log(`   - Output: ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
