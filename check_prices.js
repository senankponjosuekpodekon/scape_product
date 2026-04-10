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
const priceIdx = headers.indexOf('Variant Price');
const compareIdx = headers.indexOf('Variant Compare At Price');
const handleIdx = headers.indexOf('Handle');

console.log('🔍 Vérification des prix dans le CSV\n');

let validPrices = 0;
let invalidPrices = [];

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  const fields = parseCsvLine(lines[i]);
  const price = fields[priceIdx];
  const handle = fields[handleIdx];
  
  if (price && price !== '') {
    // Vérifier si le prix contient des points multiples (format invalide)
    const priceValue = price.replace(/"/g, '');
    
    if (priceValue.match(/\d+\.\d{3}\./)) {
      invalidPrices.push({ line: i + 1, handle, price: priceValue });
    } else {
      validPrices++;
      if (validPrices <= 10) {
        console.log(`✅ Ligne ${i + 1}: ${priceValue}`);
      }
    }
  }
}

if (invalidPrices.length > 0) {
  console.log(`\n❌ ${invalidPrices.length} prix invalides trouvés:\n`);
  invalidPrices.slice(0, 10).forEach(p => {
    console.log(`   Ligne ${p.line}: ${p.price}`);
  });
} else {
  console.log(`\n✅ Tous les prix sont valides !`);
  console.log(`✅ ${validPrices} prix vérifiés\n`);
}
