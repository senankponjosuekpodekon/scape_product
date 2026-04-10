import fs from 'fs';

const content = fs.readFileSync('shopify_products_new_format.csv', 'utf8');
const lines = content.split('\n');

function parseCsvLine(line) {
  const fields = [];
  let currentValue = '';
  let inQuotedField = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    if (char === '"') {
      if (inQuotedField && line[j + 1] === '"') {
        currentValue += '"';
        j++;
      } else {
        inQuotedField = !inQuotedField;
      }
    } else if (char === ',' && !inQuotedField) {
      fields.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  fields.push(currentValue);
  return fields;
}

const headers = parseCsvLine(lines[0]);
console.log('✅ Validation du nouveau format Shopify\n');
console.log(`📋 Colonnes: ${headers.length}`);

const titleIdx = headers.indexOf('Title');
const urlIdx = headers.indexOf('URL handle');
const priceIdx = headers.indexOf('Price');
const imageIdx = headers.indexOf('Product image URL');
const posIdx = headers.indexOf('Image position');

let productsWithPrice = 0;
let totalImages = 0;
let currentHandle = '';

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  const fields = parseCsvLine(lines[i]);
  const handle = fields[urlIdx];
  const title = fields[titleIdx];
  const price = fields[priceIdx];
  const imageUrl = fields[imageIdx];
  
  if (handle !== currentHandle) {
    currentHandle = handle;
    if (price) productsWithPrice++;
    
    if (productsWithPrice <= 5) {
      console.log(`\n✅ Produit ${productsWithPrice}:`);
      console.log(`   Handle: ${handle}`);
      console.log(`   Title: ${title.substring(0, 40)}...`);
      console.log(`   Prix: ${price || '(vide)'}`);
    }
  } else {
    if (title) {
      console.log(`⚠️  ERREUR: Titre présent sur ligne image ${i}`);
    }
  }
  
  if (imageUrl) totalImages++;
}

console.log(`\n📊 Résumé:`);
console.log(`   Produits avec prix: ${productsWithPrice}`);
console.log(`   Total images: ${totalImages}`);
console.log(`   Total lignes: ${lines.length - 1}\n`);
console.log('✅ Fichier prêt pour import Shopify (nouveau format) !');
