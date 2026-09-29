import puppeteer from 'puppeteer';

const url = 'https://drikecontainers.com/produit/100019';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});

const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
await page.setViewport({ width: 1280, height: 800 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 3000));

const result = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const allText = document.body.innerText;
  const priceMatches = allText.match(/(?:\d+[.,]?\d*)\s*[€$£]/g) || [];

  // Try to find structured data / main description
  const descSection = document.querySelector('section, article, .description, .product-description, [class*="description"]');
  const desc = descSection ? descSection.innerText.slice(0, 1200) : allText.slice(0, 1200);

  const imgs = Array.from(document.querySelectorAll('img')).map(img => ({
    src: img.src,
    alt: img.alt,
    class: img.className
  })).filter(i => i.src && !i.src.includes('data:image') && !i.src.includes('svg')).slice(0, 20);

  // Extract all visible text first 1500 chars
  const visibleText = allText.slice(0, 1500);

  return {
    url: window.location.href,
    h1: h1?.innerText?.trim() || '',
    title: document.title,
    priceMatches: priceMatches.slice(0, 10),
    images: imgs,
    visibleText: visibleText,
    description: desc
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
