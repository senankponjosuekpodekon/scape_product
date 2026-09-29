import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';
import { googleCategory, buildShopifyCsv, buildGmcCsv } from './chaufobois_scraper.js';

const JSON_IN = './chaufobois_products.json';
const JSON_OUT = './chaufobois_products_de.json';
const SHOPIFY_CSV = './chaufobois_products_shopify_de.csv';
const GMC_CSV = './chaufobois_products_gmc_de.csv';
const CACHE_FILE = './chaufobois_translate_de_cache.json';
const TRANSLATE_URL = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=fr&tl=de';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};

async function translateBatch(texts) {
  const body = new URLSearchParams();
  texts.forEach(t => body.append('q', t));
  for (let i = 0; i <= 4; i++) {
    try {
      const { data } = await axios.post(TRANSLATE_URL, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
        timeout: 60000,
      });
      const out = Array.isArray(data) ? data.map(d => (Array.isArray(d) ? d[0] : d)) : [data];
      if (out.length !== texts.length) throw new Error(`Réponse ${out.length}/${texts.length}`);
      return out;
    } catch (err) {
      if (i === 4) throw err;
      console.warn(`  ↩ Retry ${i + 1}: ${err.message}`);
      await sleep(3000 * (i + 1));
    }
  }
}

async function translateAll(strings) {
  const todo = [...new Set(strings.filter(s => s && /\p{L}/u.test(s) && !(s in cache)))];
  console.log(`🌍 ${todo.length} segments à traduire (${Object.keys(cache).length} en cache)`);
  const batches = [];
  let cur = [], len = 0;
  for (const s of todo) {
    if (cur.length && (cur.length >= 40 || len + s.length > 4500)) { batches.push(cur); cur = []; len = 0; }
    cur.push(s); len += s.length;
  }
  if (cur.length) batches.push(cur);
  for (const [i, b] of batches.entries()) {
    const res = await translateBatch(b);
    b.forEach((s, j) => { cache[s] = res[j]; });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1), 'utf8');
    console.log(`  Lot ${i + 1}/${batches.length}`);
    await sleep(600);
  }
}

const tr = (s) => {
  if (!s || !/\p{L}/u.test(s)) return s;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  return lead + (cache[s.trim()] ?? s.trim()) + trail;
};

function htmlTextNodes(html) {
  if (!html) return [];
  const $ = cheerio.load(html, null, false);
  const out = [];
  const walk = (nodes) => nodes.each((_, n) => {
    if (n.type === 'text') out.push(n.data.trim());
    else if (n.children) walk($(n).contents());
  });
  walk($.root().contents());
  return out;
}

function translateHtml(html) {
  if (!html) return html;
  const $ = cheerio.load(html, null, false);
  const walk = (nodes) => nodes.each((_, n) => {
    if (n.type === 'text') n.data = tr(n.data);
    else if (n.children) walk($(n).contents());
  });
  walk($.root().contents());
  $('[alt]').each((_, el) => $(el).attr('alt', tr($(el).attr('alt'))));
  return $.html();
}

const slugify = (t) => t.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  const products = JSON.parse(fs.readFileSync(JSON_IN, 'utf8'));

  const segments = [];
  for (const p of products) {
    segments.push(p.title, p.description, p.shortDescription, ...p.categories, ...p.tags, ...p.variantAttributes);
    segments.push(...htmlTextNodes(p.shortDescriptionHtml), ...htmlTextNodes(p.descriptionHtml));
    p.attributes.forEach(a => segments.push(a.name, ...a.values));
    p.variations.forEach(v => v.attributes.forEach(a => segments.push(a.name, a.value)));
  }
  await translateAll(segments.map(s => (s || '').trim()));

  const seen = new Set();
  const de = products.map(p => {
    const title = tr(p.title);
    let handle = slugify(title) || p.handle;
    while (seen.has(handle)) handle += `-${p.id}`;
    seen.add(handle);
    return {
      ...p,
      googleCategory: googleCategory(p),
      title,
      handle,
      sourceHandle: p.handle,
      shortDescriptionHtml: translateHtml(p.shortDescriptionHtml),
      descriptionHtml: translateHtml(p.descriptionHtml),
      description: tr(p.description),
      shortDescription: tr(p.shortDescription),
      categories: p.categories.map(tr),
      tags: p.tags.map(tr),
      variantAttributes: p.variantAttributes.map(tr),
      attributes: p.attributes.map(a => ({ ...a, name: tr(a.name), values: a.values.map(tr) })),
      variations: p.variations.map(v => ({ ...v, attributes: v.attributes.map(a => ({ name: tr(a.name), value: tr(a.value) })) })),
      language: 'de',
    };
  });

  fs.writeFileSync(JSON_OUT, JSON.stringify(de, null, 2), 'utf8');
  fs.writeFileSync(SHOPIFY_CSV, stringify(buildShopifyCsv(de)), 'utf8');
  fs.writeFileSync(GMC_CSV, stringify(buildGmcCsv(de)), 'utf8');
  console.log(`\n✅ ${de.length} produits traduits en allemand`);
  console.log(`💾 ${JSON_OUT}\n💾 ${SHOPIFY_CSV}\n💾 ${GMC_CSV}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
