import fs from 'fs';

console.log('🔄 Mise à jour des prix depuis luminaire_products_http.jsonl');

const jsonlPath = 'luminaire_products_http.jsonl';
const csvPath = 'shopify_from_luminaire.csv';
const outPath = 'shopify_from_luminaire_priced.csv';

function cleanPrice(v) {
  if (!v || v === '""' || v === '') return '';
  let cleaned = v.replace(/"/g, '');
  // keep only digits, comma or dot
  cleaned = cleaned.replace(/[^\d.,]/g, '');
  if (!cleaned) return '';
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
  }
  return cleaned;
}

// Read JSONL and build map sku->price
const jsonl = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
const priceMap = {};
jsonl.forEach(line => {
  try {
    const obj = JSON.parse(line);
    if (obj.url && obj.price) {
      // extract digits at end before .html
      const m = obj.url.match(/-(\d+)\.html$/);
      if (m) {
        priceMap[m[1]] = cleanPrice(obj.price);
      }
    }
  } catch (e) {
    console.error('ligne json invalide:', line);
  }
});
console.log(`🔢 ${Object.keys(priceMap).length} prix lus du JSONL`);

// read csv
const csv = fs.readFileSync(csvPath, 'utf8').split('\n');
const header = csv[0].split(',');
const skuIdx = header.indexOf('Variant SKU');
const priceIdx = header.indexOf('Variant Price');

const updated = csv.map((line, idx) => {
  if (idx === 0) return line;
  if (!line.trim()) return line;
  // simple parse, handle quoted fields
  const fields = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i+1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === ',' && !inQ) {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);

  const sku = fields[skuIdx];
  if (sku && priceMap[sku]) {
    const existing = fields[priceIdx];
    if (!existing || existing.trim() === '') {
      fields[priceIdx] = priceMap[sku];
    }
  }
  return fields.map(f => `"${f.replace(/"/g,'""')}"`).join(',');
});

fs.writeFileSync(outPath, updated.join('\n'), 'utf8');
console.log(`✅ Fichier généré : ${outPath}`);