#!/usr/bin/env node
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const input = process.argv[2] || 'luminaire_products_http.jsonl';
const output = process.argv[3] || 'shopify_from_luminaire.csv';

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function extractSkuFromUrl(u){
  if (!u) return '';
  const m = u.match(/-([0-9]+)\.html(?:$|#|\?)/);
  if (m) return m[1];
  return '';
}

async function run() {
  if (!fs.existsSync(input)) {
    console.error('Input file not found:', input);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(input),
    crlfDelay: Infinity,
  });

  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Variant SKU',
    'Variant Price',
    'Variant Grams',
    'Variant Inventory Qty',
    'Variant Inventory Policy',
    'Variant Requires Shipping',
    'Variant Taxable',
    'Variant Barcode',
    'Image Src',
    'Image Position',
    'URL'
  ];

  const out = fs.createWriteStream(output, { flags: 'w' });
  out.write(headers.join(',') + '\n');

  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj;
    try { obj = JSON.parse(line); } catch(e){ continue; }

    const title = obj.title || '';
    const handle = slugify(title) || slugify(extractSkuFromUrl(obj.url) || Math.random().toString(36).slice(2,8));
    const body = obj.desc || '';
    const vendor = '';
    const type = '';
    const tags = '';
    const published = 'TRUE';
    const option1Name = 'Title';
    const option1Value = title;
    const sku = extractSkuFromUrl(obj.url) || '';
    const price = obj.price || '';

    const images = Array.isArray(obj.images) ? obj.images : [];

    // main row: product + first image (if any)
    const main = [
      csvEscape(handle),
      csvEscape(title),
      csvEscape(body),
      csvEscape(vendor),
      csvEscape(type),
      csvEscape(tags),
      csvEscape(published),
      csvEscape(option1Name),
      csvEscape(option1Value),
      csvEscape(sku),
      csvEscape(price),
      '', // Variant Grams
      '', // Variant Inventory Qty
      'deny', // Variant Inventory Policy
      'TRUE', // Variant Requires Shipping
      'TRUE', // Variant Taxable
      '', // Variant Barcode
      images[0] ? csvEscape(images[0]) : '',
      images[0] ? '1' : '',
      csvEscape(obj.url || '')
    ];
    out.write(main.join(',') + '\n');

    // additional images as separate rows: only Handle + Image Src + Image Position
    for (let i = 1; i < images.length; i++){
      const row = [
        csvEscape(handle), // Handle
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', // placeholders
        csvEscape(images[i]),
        String(i+1),
        ''
      ];
      out.write(row.join(',') + '\n');
    }
  }

  out.end();
  console.log('Wrote', output);
}

run().catch(err=>{ console.error(err); process.exit(1); });
