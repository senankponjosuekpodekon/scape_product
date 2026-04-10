import fetch from "node-fetch";
import xml2js from "xml2js";

const BASE_URL = "https://www.contentuslda.com";
const SITEMAP_URL = `${BASE_URL}/wp-sitemap.xml`;

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

(async () => {
  console.log("🔍 Vérification du sitemap...");
  const allUrls = await extractUrlsFromSitemap(SITEMAP_URL);
  
  console.log(`\n📊 Total URLs trouvées: ${allUrls.length}\n`);
  
  // Afficher quelques exemples
  console.log("📄 Exemples d'URLs:");
  allUrls.slice(0, 20).forEach(url => console.log("  -", url));
  
  // Analyser les patterns
  console.log("\n🔍 Patterns détectés:");
  const patterns = {};
  allUrls.forEach(url => {
    const parts = url.replace(BASE_URL, '').split('/').filter(Boolean);
    if (parts.length > 0) {
      const pattern = '/' + parts[0] + '/';
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    }
  });
  
  Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, count]) => {
      console.log(`  ${pattern} : ${count} URLs`);
    });
})();
