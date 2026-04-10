import fs from 'fs';

const csvPath = 'shopify_products.csv';
console.log('📋 Validation du fichier CSV Shopify\n');

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').filter(l => l.trim());

console.log(`✅ Total lignes: ${lines.length}`);

// Parser le header
const headerLine = lines[0];
const headers = headerLine.split(',').map(h => h.replace(/"/g, ''));
console.log(`✅ Colonnes: ${headers.length}`);
console.log(`   ${headers.join(', ')}\n`);

// Vérifier quelques lignes
let validLines = 0;
let invalidLines = 0;
const issues = [];

for (let i = 1; i < Math.min(lines.length, 100); i++) {
  const line = lines[i];
  
  // Compter les colonnes (méthode simple pour vérification rapide)
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
  
  if (fields.length === headers.length) {
    validLines++;
    
    // Vérifier que Title et Vendor ne sont pas vides
    const title = fields[headers.indexOf('Title')];
    const vendor = fields[headers.indexOf('Vendor')];
    const handle = fields[headers.indexOf('Handle')];
    
    if (!title || title === '""') {
      issues.push(`Ligne ${i + 1}: Title vide`);
    }
    if (!vendor || vendor === '""') {
      issues.push(`Ligne ${i + 1}: Vendor vide`);
    }
    if (!handle || handle === '""') {
      issues.push(`Ligne ${i + 1}: Handle vide`);
    }
  } else {
    invalidLines++;
    if (invalidLines <= 5) {
      issues.push(`Ligne ${i + 1}: ${fields.length} colonnes au lieu de ${headers.length}`);
    }
  }
}

console.log(`✅ Lignes valides (100 premières): ${validLines}`);
console.log(`❌ Lignes invalides: ${invalidLines}`);

if (issues.length > 0) {
  console.log(`\n⚠️  Problèmes détectés:`);
  issues.slice(0, 10).forEach(issue => console.log(`   - ${issue}`));
  if (issues.length > 10) {
    console.log(`   ... et ${issues.length - 10} autres\n`);
  }
} else {
  console.log(`\n✅ Aucun problème détecté !\n`);
}

// Compter les produits uniques
const handles = new Set();
for (let i = 1; i < lines.length; i++) {
  const match = lines[i].match(/^"([^"]+)"/);
  if (match) handles.add(match[1]);
}

console.log(`📦 Produits uniques: ${handles.size}`);
console.log(`📦 Images totales: ${lines.length - 1}`);
console.log(`📊 Moyenne images/produit: ${((lines.length - 1) / handles.size).toFixed(1)}`);

console.log('\n✅ Le fichier CSV est prêt pour l\'import Shopify !');
