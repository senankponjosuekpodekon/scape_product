import puppeteer from 'puppeteer';

const url = 'https://drikecontainers.com/produit/100019';

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

const before = await page.evaluate(() => document.body.innerText);

// Click expand description
await page.evaluate(() => {
  const candidates = Array.from(document.querySelectorAll('button, span, a, div, p')).filter(el =>
    el.innerText && el.innerText.trim() === 'Mehr lesen'
  );
  for (const el of candidates) {
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});
await new Promise(r => setTimeout(r, 1500));

const after = await page.evaluate(() => {
  const text = document.body.innerText;

  // Description extraction
  let fullDescription = '';
  const match = text.match(/Produktbeschreibung\s*([\s\S]+?)(?:Mehr lesen|SKU\s*:|SKU\s*&\s*Kategorie|Gewünschte Farbe|Gewünschte|Menge|In den Warenkorb|Individuelles Angebot|Unsere Öffnungszeiten)/);
  if (match) fullDescription = match[1].replace(/Mehr lesen|Weniger anzeigen/g, '').trim();

  // Category extraction
  let category = '';
  const catMatch = text.match(/(?:^|\n)Kategorie\s*\n\s*([^\n]+)/m);
  if (catMatch) category = catMatch[1].trim();

  if (!category) {
    const upper = text.match(/(?:^|\n)([A-Z][A-ZÄÖÜ\s&/\-]{2,30})\n\n/);
    if (upper) category = upper[1].trim().replace(/\s+/g, ' ');
  }

  return { fullDescription, category, text };
});

console.log('=== CATEGORY ===');
console.log(after.category);
console.log('\n=== DESCRIPTION (before expansion) ===');
const beforeMatch = before.match(/Produktbeschreibung\s*([\s\S]+?)(?:Mehr lesen|SKU\s*:|SKU\s*&\s*Kategorie|Gewünschte Farbe|Gewünschte|Menge|In den Warenkorb|Individuelles Angebot|Unsere Öffnungszeiten)/);
if (beforeMatch) console.log(beforeMatch[1].slice(0, 500));
console.log('\n=== DESCRIPTION (after expansion) ===');
console.log(after.fullDescription.slice(0, 1500));

await browser.close();
