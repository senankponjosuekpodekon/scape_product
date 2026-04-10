import fs from 'fs';

const content = fs.readFileSync('shopify_products.csv', 'utf8');
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
const handleIdx = headers.indexOf('Handle');
const titleIdx = headers.indexOf('Title');
const priceIdx = headers.indexOf('Variant Price');
const imageIdx = headers.indexOf('Image Position');

console.log('📊 Analyse des prix par produit:\n');

let currentHandle = '';
let productCount = 0;
let productsWithPrice = 0;
let productsWithoutPrice = 0;

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  const fields = parseCsvLine(lines[i]);
  const handle = fields[handleIdx];
  const price = fields[priceIdx];
  const imagePos = fields[imageIdx];
  const title = fields[titleIdx];
  
  if (handle !== currentHandle) {
    currentHandle = handle;
    productCount++;
    
    if (price && price !== '') {
      productsWithPrice++;
      if (productCount <= 10) {
        console.log(`✅ Produit ${productCount}: ${title.substring(0, 40)}...`);
        console.log(`   Prix: ${price} (Image Position: ${imagePos})`);
      }
    } else {
      productsWithoutPrice++;
      if (productsWithoutPrice <= 5) {
        console.log(`❌ Produit ${productCount}: ${title.substring(0, 40)}...`);
        console.log(`   PAS DE PRIX sur la première ligne !`);
      }
    }
  }
}

console.log(`\n📊 Résumé:`);
console.log(`   Total produits: ${productCount}`);
console.log(`   Avec prix: ${productsWithPrice}`);
console.log(`   Sans prix: ${productsWithoutPrice}`);

if (productsWithoutPrice > 0) {
  console.log(`\n⚠️  ${productsWithoutPrice} produits n'ont PAS de prix!`);
} else {
  console.log(`\n✅ Tous les produits ont un prix !`);
}
