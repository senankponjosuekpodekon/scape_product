import fs from 'fs';

console.log('🔧 Correction des prix dans le CSV...\n');

const content = fs.readFileSync('shopify_products.csv', 'utf8');
const lines = content.split('\n');

function cleanPrice(v) {
  if (!v || v === '""' || v === '') return '';
  
  // Retirer les guillemets
  let cleaned = v.replace(/"/g, '');
  
  // Supprimer tous les caractères sauf chiffres, virgule et point
  cleaned = cleaned.replace(/[^\d.,]/g, '');
  
  if (!cleaned) return '';
  
  // Gérer les différents formats
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Format européen: 1.800,00 -> 1800.00
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Format américain: 1,800.00 -> 1800.00
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Format: 1800,00 -> 1800.00
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // 1.800.00 -> 1800.00
      cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
  }
  
  return cleaned;
}

const headers = lines[0].split(',');
const priceIndex = headers.findIndex(h => h.includes('Variant Price'));
const compareIndex = headers.findIndex(h => h.includes('Variant Compare At Price'));

console.log(`Colonnes à corriger: ${priceIndex} (Variant Price), ${compareIndex} (Compare At Price)\n`);

let correctedCount = 0;
const correctedLines = lines.map((line, index) => {
  if (index === 0) return line; // Header unchanged
  
  // Parser la ligne
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
  
  if (fields.length >= Math.max(priceIndex, compareIndex) + 1) {
    const oldPrice = fields[priceIndex];
    const oldCompare = fields[compareIndex];
    
    fields[priceIndex] = cleanPrice(oldPrice);
    fields[compareIndex] = cleanPrice(oldCompare);
    
    if (oldPrice !== fields[priceIndex] || oldCompare !== fields[compareIndex]) {
      correctedCount++;
      if (correctedCount <= 5) {
        console.log(`Ligne ${index}: "${oldPrice}" -> "${fields[priceIndex]}"`);
      }
    }
  }
  
  // Reconstruire la ligne
  return fields.map(f => `"${f}"`).join(',');
});

console.log(`\n✅ ${correctedCount} prix corrigés\n`);

const newContent = correctedLines.join('\n');
fs.writeFileSync('shopify_products.csv', newContent, 'utf8');

console.log('✅ Fichier corrigé : shopify_products.csv');
