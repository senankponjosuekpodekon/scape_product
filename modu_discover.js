import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import fs from 'fs';

const SITEMAP_URL = 'https://modu-luxe-gmbh.de/sitemap_products_1.xml?from=15377261330817&to=15478618685825';
const OUTPUT = '/tmp/modu_links.json';

async function main() {
  console.log('Fetching sitemap...');
  const { data } = await axios.get(SITEMAP_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    },
    timeout: 60000
  });

  const parsed = await parseStringPromise(data);
  const urls = parsed.urlset.url || [];

  const productUrls = urls
    .map(u => u.loc?.[0])
    .filter(url => url && url.includes('/products/'))
    .sort();

  const images = productUrls.map(url => {
    const u = urls.find(x => x.loc?.[0] === url);
    const img = u && Array.isArray(u['image:image']) ? u['image:image'][0] : null;
    return {
      url,
      image: img?.['image:loc']?.[0] || '',
      imageTitle: img?.['image:title']?.[0] || ''
    };
  });

  fs.writeFileSync(OUTPUT, JSON.stringify({ productUrls, images }, null, 2), 'utf8');
  console.log(`Found ${productUrls.length} product URLs`);
  console.log('Saved to', OUTPUT);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
