#!/usr/bin/env node

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createWriteStream } from 'fs';
import { URL } from 'url';

const BASE = process.argv[2] || 'https://www.luminaire.fr';
const OUTPUT = process.argv[3] || 'luminaire_products_http.jsonl';
const MAX = parseInt(process.argv[4]) || 100;

const visited = new Set();
const productUrls = new Set();
const queue = [BASE];

function normalize(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

async function fetchPage(u) {
  try {
    const res = await axios.get(u, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    return res.data;
  } catch (e) {
    return null;
  }
}

async function crawl() {
  while (queue.length && productUrls.size < MAX) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    const html = await fetchPage(url);
    if (!html) continue;
    const $ = cheerio.load(html);

    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const abs = normalize(href, BASE);
      if (!abs || visited.has(abs)) return;
      if (abs.includes('/p/') || abs.includes('/product')) {
        productUrls.add(abs);
      } else if (abs.startsWith(BASE) && abs.length < BASE.length + 50) {
        queue.push(abs);
      }
    });
  }
}

async function scrapeProduct(u) {
  const html = await fetchPage(u);
  if (!html) return null;
  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim();
  const price = $('[data-price-type="finalPrice"]').attr('data-price-amount') || $('span.price').first().text().trim();
  const desc = $('.product.attribute.description .value').text().trim() || $('#product-description').text().trim() || $('meta[name="description"]').attr('content') || '';
  // collect product images from the gallery
  const imgsSet = new Set();
  const addSrc = src => {
    if (!src) return;
    // normalize URL (remove size hints after ';' if any)
    const clean = src.split('?')[0];
    if (clean.match(/lw-cdn\.com\/images\//)) {
      imgsSet.add(clean);
    }
  };

  // look for images that appear in the gallery markup
  $('.gallery-placeholder__image img, .gallery__thumbnail img, img.fotorama__img').each((i, el) => {
    addSrc($(el).attr('src') || $(el).attr('data-src'));
  });

  // fallback: og:image meta tag
  const og = $('meta[property="og:image"]').attr('content');
  addSrc(og);

  const imgs = Array.from(imgsSet);
  return { url:u, title, price, desc, images: imgs.slice(0, 10) };
}

async function main() {
  await crawl();
  console.log('Found product urls', productUrls.size);
  const out = createWriteStream(OUTPUT);
  let count = 0;
  for (const u of productUrls) {
    if (count >= MAX) break;
    const p = await scrapeProduct(u);
    if (p) {
      out.write(JSON.stringify(p) + '\n');
      count++;
      console.log('Scraped',count, p.title);
    }
  }
  out.end();
  console.log('Done');
}

main().catch(console.error);
