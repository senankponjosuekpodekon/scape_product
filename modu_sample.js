import puppeteer from 'puppeteer';

const url = 'https://modu-luxe-gmbh.de/products/10-fuss-kuhlcontainer-fur-den-inlandsbereich-neu';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});

const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
await page.setViewport({ width: 1280, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 3000));

const data = await page.evaluate(() => {
  const title = document.title;
  const h1 = document.querySelector('h1')?.innerText?.trim() || '';

  // Extract meta.js product data
  let productMeta = null;
  const scripts = Array.from(document.querySelectorAll('script')).map(s => s.innerText).filter(Boolean);
  for (const s of scripts) {
    const m = s.match(/var\s+meta\s*=\s*({[\s\S]+?});/);
    if (m) {
      try { productMeta = JSON.parse(m[1]); } catch(_) {}
    }
  }

  // Try JSON-LD
  const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
    try { return JSON.parse(s.innerText); } catch(_) { return null; }
  }).filter(Boolean);

  // Images
  const imgs = [];
  document.querySelectorAll('img, img[data-src], img[srcset], source, noscript img').forEach(el => {
    const src = el.src || el.getAttribute('data-src') || el.getAttribute('srcset')?.split(' ')[0] || '';
    if (src && src.includes('cdn.shopify')) imgs.push(src);
  });

  // Full description
  const descEl = document.querySelector('[class*="product__description"], [class*="description"], .product-description, [itemprop="description"], [class*="product-information"], [data-product-description]');
  const description = descEl ? descEl.innerText.trim() : document.body.innerText.slice(0, 2000);

  // Price and availability
  const priceEl = document.querySelector('[class*="price"], [data-price]');
  const price = priceEl ? priceEl.innerText.trim() : '';

  const bodyText = document.body.innerText.slice(0, 3000);

  return { title, h1, productMeta, ld, imgs, description, price, bodyText };
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
