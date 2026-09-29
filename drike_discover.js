import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'https://drikecontainers.com/';
const OUTPUT = '/tmp/drike_links.json';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const visited = new Set();
  const productUrls = new Set();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  const toVisit = [BASE_URL];

  while (toVisit.length > 0) {
    const url = toVisit.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      console.log('Visiting:', url);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(2000); // wait for React render

      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.getAttribute('href'))
          .filter(h => h && h.startsWith('/') && !h.startsWith('//'))
          .map(h => new URL(h, window.location.origin).href)
          .filter((v, i, a) => a.indexOf(v) === i);
      });

      for (const link of links) {
        const lower = link.toLowerCase();
        if (lower.includes('/products/') || lower.includes('/produit/')) {
          productUrls.add(link);
        } else if (lower.startsWith('https://drikecontainers.com/') && !lower.includes('#') && !lower.includes('?')) {
          toVisit.push(link);
        }
      }

      console.log(`  Found ${productUrls.size} product URLs so far, ${toVisit.length} to visit`);
    } catch (e) {
      console.error('  Error:', e.message);
    }

    await sleep(1000);
  }

  await browser.close();

  const result = [...productUrls].sort();
  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), 'utf8');
  console.log('\n=== TOTAL PRODUCT URLS:', result.length);
  console.log('Saved to', OUTPUT);
  result.forEach(u => console.log('  -', u));
}

main().catch(console.error);
