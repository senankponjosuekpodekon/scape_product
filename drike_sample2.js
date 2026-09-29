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

// Click "Mehr lesen" if exists
const moreBtn = await page.$('text=Mehr lesen');
if (moreBtn) {
  await moreBtn.click();
  await new Promise(r => setTimeout(r, 1000));
}

const result = await page.evaluate(() => {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.innerText);

  // Try to find the full description
  const all = document.body.innerText;

  // Extract section after "Produktbeschreibung" and before "SKU & Kategorie"
  let fullDesc = '';
  const match = all.match(/Produktbeschreibung\s*([\s\S]+?)(?:SKU & Kategorie|Gewünschte Farbe|In den Warenkorb|Individuelles Angebot)/);
  if (match) fullDesc = match[1].replace(/Mehr lesen|Weniger anzeigen/g, '').trim();

  // Variant options - color selector
  const variantLabels = Array.from(document.querySelectorAll('label, button, span')).filter(el => el.textContent.trim().length > 0).map(el => el.textContent.trim());
  const colors = variantLabels.filter(t => ['Hellblau', 'Signalweiß', 'Verkehrsrot', 'Minzgrün', 'Signalgelb', 'Telemagenta', 'Reinorange', 'Dunkelschwarz', 'Anthrazitgrau', 'Hellgrau'].includes(t));

  // Stock
  const stock = all.includes('AUF LAGER') ? 'in stock' : (all.includes('NICHT AUF LAGER') || all.includes('Nicht auf Lager') ? 'out of stock' : '');

  // Breadcrumb / category
  const categoryMatch = all.match(/Kategorie\s*\n?\s*([A-Za-zäöüÄÖÜß\s&-]+)/);
  const category = categoryMatch ? categoryMatch[1].trim() : '';

  return {
    scripts: scripts,
    fullDesc: fullDesc.slice(0, 1500),
    colors: [...new Set(colors)],
    stock,
    category,
    hasImages: document.querySelectorAll('img').length
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
