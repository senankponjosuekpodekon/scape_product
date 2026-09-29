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

// Scroll and wait for images
await page.evaluate(async () => {
  for (let i = 0; i < 3; i++) {
    window.scrollBy(0, 400);
    await new Promise(r => setTimeout(r, 500));
  }
});
await new Promise(r => setTimeout(r, 1000));

const data = await page.evaluate(() => {
  // Images from all possible sources
  const imgSet = new Set();

  // 1. img src/srcset/data-src
  document.querySelectorAll('img, source').forEach(el => {
    const addSrc = (s) => { if (s && (s.includes('cdn.shopify') || s.includes('cdn/shop'))) imgSet.add(s.split(' ')[0]); };
    if (el.src) addSrc(el.src);
    if (el.dataset.src) addSrc(el.dataset.src);
    if (el.srcset) el.srcset.split(',').forEach(u => addSrc(u.trim()));
    if (el.dataset.srcset) el.dataset.srcset.split(',').forEach(u => addSrc(u.trim()));
  });

  // 2. JSON-LD image?
  document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    try {
      const d = JSON.parse(s.innerText);
      if (d.image) { if (Array.isArray(d.image)) d.image.forEach(i => imgSet.add(i)); else imgSet.add(d.image); }
    } catch(_) {}
  });

  // 3. og:image / twitter:image
  ['og:image:secure_url', 'og:image', 'twitter:image'].forEach(prop => {
    const meta = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
    if (meta) {
      const src = meta.getAttribute('content');
      if (src) imgSet.add(src.replace('http://', 'https://'));
    }
  });

  // 4. Look for Shopify image JSON or data
  const html = document.documentElement.innerHTML;
  const matches = html.matchAll(/(?:cdn\.shopify\.com|cdn\/shop\/)[^"'\s]+\.(?:jpg|jpeg|png|webp|avif|gif)/g);
  for (const m of matches) imgSet.add('https://' + m[0].replace(/^\//, ''));

  // Price
  const priceEl = document.querySelector('[class*="price"], [data-price], .product__price, .price-item');
  const price = priceEl ? priceEl.innerText.trim() : '';

  // Availability
  const stock = document.body.innerText.includes('Auf Lager') ? 'in stock' : 'out of stock';

  // Description: between Beschreibung and Das könnte Ihnen auch gefallen / MODULUXE
  const allText = document.body.innerText;
  let description = '';
  const m = allText.match(/Beschreibung\s*([\s\S]+?)(?:Das könnte Ihnen auch gefallen|MODULUXE GMBH|Versandrichtlinien\s*$)/);
  if (m) description = m[1].trim();

  // Product meta from script
  let productMeta = null;
  document.querySelectorAll('script').forEach(s => {
    const txt = s.innerText;
    const mm = txt.match(/var\s+meta\s*=\s*({[\s\S]+?});/);
    if (mm) { try { productMeta = JSON.parse(mm[1]); } catch(_) {} }
  });

  return {
    title: document.querySelector('title')?.innerText || '',
    h1: document.querySelector('h1')?.innerText?.trim() || '',
    images: [...imgSet],
    price,
    stock,
    description,
    productMeta,
    bodyText: allText.slice(0, 2000)
  };
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
