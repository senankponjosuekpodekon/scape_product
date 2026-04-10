import fs from 'fs';

console.log('🔧 Lecture du CSV actuel...');
const content = fs.readFileSync('shopify_products.csv', 'utf8');

// Parser manuel pour récupérer les données
const lines = content.split('\n');
const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));

console.log(`📊 Headers trouvés: ${headers.length}`);

// Récupérer les données du fichier de progression JSON si disponible
let products = [];

// Parser le CSV en mode robuste
let currentRecord = {};
let inQuote = false;
let currentField = '';
let fieldIndex = 0;
let lineBuffer = '';

for (let i = 1; i < lines.length; i++) {
  lineBuffer += (lineBuffer ? '\n' : '') + lines[i];
  
  // Compter les guillemets pour savoir si on est dans un champ quoté
  const quotes = (lineBuffer.match(/"/g) || []).length;
  
  // Si nombre pair de guillemets, on a une ligne complète
  if (quotes % 2 === 0 && lineBuffer.trim()) {
    // C'est une ligne complète, on peut la parser
    const fields = [];
    let currentValue = '';
    let inQuotedField = false;
    
    for (let j = 0; j < lineBuffer.length; j++) {
      const char = lineBuffer[j];
      
      if (char === '"') {
        if (inQuotedField && lineBuffer[j + 1] === '"') {
          // Double quote escaped
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
    fields.push(currentValue); // Dernier champ
    
    if (fields.length === headers.length) {
      const record = {};
      headers.forEach((h, idx) => {
        record[h] = fields[idx];
      });
      products.push(record);
    }
    
    lineBuffer = '';
  }
}

console.log(`✅ ${products.length} lignes parsées`);

// Nettoyer les données
products = products.map(p => {
  const cleaned = { ...p };
  
  // Nettoyer le Body HTML : supprimer les sauts de ligne réels
  if (cleaned['Body (HTML)']) {
    cleaned['Body (HTML)'] = cleaned['Body (HTML)']
      .replace(/\r?\n/g, ' ') // Remplacer les sauts de ligne par des espaces
      .replace(/\s+/g, ' ')    // Réduire les espaces multiples
      .trim();
  }
  
  return cleaned;
});

console.log('🧹 Données nettoyées');

// Créer le nouveau CSV
const csvHeaders = headers.join(',');
const csvRows = products.map(row => 
  headers.map(h => {
    const value = String(row[h] || '');
    // Échapper les guillemets et wrapper dans des guillemets
    return `"${value.replace(/"/g, '""')}"`;
  }).join(',')
);

const newCSV = csvHeaders + '\n' + csvRows.join('\n');

// Sauvegarder
fs.writeFileSync('shopify_products_fixed.csv', newCSV, 'utf8');

console.log('✅ Fichier nettoyé créé : shopify_products_fixed.csv');
console.log(`📦 ${products.length} lignes au total`);

// Vérification rapide
const uniqueHandles = [...new Set(products.map(p => p.Handle))];
console.log(`📦 ${uniqueHandles.length} produits uniques`);
