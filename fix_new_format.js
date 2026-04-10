import fs from 'fs';

console.log('🔧 Correction du format pour images multiples...\n');

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

const urlHandleIdx = headers.indexOf('URL handle');
const titleIdx = headers.indexOf('Title');
const descIdx = headers.indexOf('Description');
const vendorIdx = headers.indexOf('Vendor');
const typeIdx = headers.indexOf('Type');
const tagsIdx = headers.indexOf('Tags');
const publishedIdx = headers.indexOf('Published on online store');
const statusIdx = headers.indexOf('Status');
const priceIdx = headers.indexOf('Price');
const compareIdx = headers.indexOf('Compare-at price');
const imageUrlIdx = headers.indexOf('Product image URL');
const imagePosIdx = headers.indexOf('Image position');

// Champs qui doivent être présents sur toutes les lignes
const alwaysPresentFields = [
  'URL handle',
  'Product image URL',
  'Image position',
  'Charge tax',
  'Requires shipping',
  'Fulfillment service',
  'Weight unit for display',
  'Inventory tracker',
  'Continue selling when out of stock',
  'Gift card',
  'Status',
  'Published on online store'
];

const alwaysPresentIdx = alwaysPresentFields.map(f => headers.indexOf(f));

// Parser toutes les lignes
const products = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  const fields = parseCsvLine(lines[i]);
  products.push(fields);
}

console.log(`✅ ${products.length} lignes parsées\n`);

// Regrouper par handle
const productGroups = {};
products.forEach(fields => {
  const handle = fields[urlHandleIdx];
  if (!productGroups[handle]) {
    productGroups[handle] = [];
  }
  productGroups[handle].push(fields);
});

console.log(`📦 ${Object.keys(productGroups).length} produits uniques\n`);

// Corriger : vider les champs des lignes 2+
const correctedProducts = [];

Object.values(productGroups).forEach(group => {
  group.forEach((fields, index) => {
    const newFields = [...fields];
    
    if (index > 0) {
      // Pour les lignes 2+, vider les champs sauf ceux qui doivent toujours être présents
      headers.forEach((header, idx) => {
        if (!alwaysPresentFields.includes(header)) {
          newFields[idx] = '';
        }
      });
    }
    
    correctedProducts.push(newFields);
  });
});

console.log(`🔄 ${correctedProducts.length} lignes corrigées\n`);

// Générer le CSV final
const csvContent = headers.join(',') + '\n' +
  correctedProducts.map(fields => 
    fields.map(f => `"${(f || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');

fs.writeFileSync('shopify_products_new_format.csv', csvContent, 'utf8');

console.log('✅ Format corrigé pour images multiples');
console.log('✅ Fichier mis à jour : shopify_products_new_format.csv\n');

// Vérification
let firstProduct = Object.values(productGroups)[0];
if (firstProduct && firstProduct.length > 1) {
  console.log('📋 Exemple (premier produit avec plusieurs images):');
  console.log(`   Ligne 1 - Title: "${firstProduct[0][titleIdx].substring(0, 30)}..."`);
  console.log(`   Ligne 2 - Title: "${firstProduct[1][titleIdx]}" (devrait être vide)`);
}
