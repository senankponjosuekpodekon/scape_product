import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const BASE_URL = 'https://neubach-container.de/shop/';
const OUTPUT = '/tmp/neubach_links.json';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchPage(url) {
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    timeout: 60000
  });
  return data;
}

function extractProductUrls(html, baseUrl) {
  const $ = cheerio.load(html);
  const urls = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/shop/') && !href.includes('/page/') && !href.includes('?') && href !== baseUrl) {
      // Heuristic: product URLs are like /shop/category/product/ or /shop/product/
      const path = new URL(href, baseUrl).pathname;
      if (path.split('/').filter(Boolean).length >= 2) {
        urls.push(new URL(href, baseUrl).href);
      }
    }
  });
  return [...new Set(urls)];
}

function extractPagination(html, baseUrl) {
  const $ = cheerio.load(html);
  const pages = new Set();
  $('a.page-numbers').each((i, el) => {
    const href = $(el).attr('href');
    if (href) pages.add(new URL(href, baseUrl).href);
  });
  return [...pages];
}

async function main() {
  const productUrls = new Set();
  const toVisit = new Set([BASE_URL]);
  const visited = new Set();

  while (toVisit.size > 0) {
    const url = [...toVisit][0];
    toVisit.delete(url);
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      console.log('Visiting:', url);
      const html = await fetchPage(url);
      const products = extractProductUrls(html, BASE_URL);
      products.forEach(u => productUrls.add(u));

      const pages = extractPagination(html, BASE_URL);
      pages.forEach(p => {
        if (!visited.has(p)) toVisit.add(p);
      });

      console.log(`  Found ${products.length} products, total ${productUrls.size}`);
    } catch (err) {
      console.warn('  Error:', err.message);
    }
    await sleep(500);
  }

  const result = [...productUrls].sort();
  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n✅ Total product URLs: ${result.length}`);
  console.log('Saved to', OUTPUT);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
