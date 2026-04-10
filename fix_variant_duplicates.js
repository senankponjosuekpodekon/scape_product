import fs from 'fs';

console.log('🔧 Correction du problème de variantes dupliquées...\n');

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
const imagePosIdx = headers.indexOf('Image position');

// SEULS ces champs doivent être présents sur les lignes 2+ pour les images
const keepOnImageLines = [
  'URL handle',           // Pour grouper les lignes
  'Product image URL',    // L'URL de l'image
  'Image position',       // La position de l'image
  'Image alt text'        // Texte alternatif optionnel
];

const keepIndices = keepOnImageLines.map(f => headers.indexOf(f));

console.log(`Champs conservés sur lignes d'images: ${keepOnImageLines.join(', ')}\n`);

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

// Corriger : sur les lignes 2+, garder SEULEMENT les champs des images
const correctedProducts = [];

Object.values(productGroups).forEach(group => {
  group.forEach((fields, index) => {
    if (index === 0) {
      // Première ligne : garder tout
      correctedProducts.push(fields);
    } else {
      // Lignes 2+ : TOUT vider sauf les champs d'image
      const newFields = headers.map((header, idx) => {
        return keepIndices.includes(idx) ? fields[idx] : '';
      });
      correctedProducts.push(newFields);
    }
  });
});

console.log(`🔄 ${correctedProducts.length} lignes corrigées\n`);

// Générer le CSV final
const csvContent = headers.join(',') + '\n' +
  correctedProducts.map(fields => 
    fields.map(f => `"${(f || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');

fs.writeFileSync('shopify_products_new_format.csv', csvContent, 'utf8');

console.log('✅ Problème de variantes dupliquées corrigé !');
console.log('✅ Fichier mis à jour : shopify_products_new_format.csv\n');

// Vérification
const sample = Object.values(productGroups)[0];
if (sample && sample.length > 1) {
  console.log('📋 Exemple (premier produit):');
  console.log(`   Lignes: ${sample.length}`);
  console.log(`   Image 1 - Champs non-vides: ${correctedProducts[0].filter(f => f).length}`);
  console.log(`   Image 2 - Champs non-vides: ${correctedProducts[1].filter(f => f).length} (devrait être ~4)`);
}
