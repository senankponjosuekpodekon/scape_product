import fs from 'fs';

const csvContent = fs.readFileSync('shopify_products.csv', 'utf8');
const lines = csvContent.split('\n').filter(Boolean);

console.log('📊 ANALYSE DU FICHIER CSV\n');
console.log(`Nombre total de lignes: ${lines.length}`);
console.log(`Nombre de produits (lignes de données): ${lines.length - 1}\n`);

// Parser simplifié pour les guillemets
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && nextChar === '"' && inQuotes) {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

const headers = parseCSVLine(lines[0]);
console.log('✅ En-têtes détectés:', headers.length);

// Analyser les premiers produits
const products = {};
let currentHandle = null;

for (let i = 1; i < Math.min(150, lines.length); i++) {
  const values = parseCSVLine(lines[i]);
  const handle = values[0];
  const title = values[1];
  const vendor = values[3];
  const price = values[7];
  const imageSrc = values[9];
  const imagePos = values[10];
  
  if (handle !== currentHandle) {
    currentHandle = handle;
    products[handle] = {
      totalLines: 0,
      firstLine: i,
      titles: [],
      vendors: [],
      prices: [],
      images: []
    };
  }
  
  products[handle].totalLines++;
  products[handle].titles.push(title);
  products[handle].vendors.push(vendor);
  products[handle].prices.push(price);
  products[handle].images.push({ src: imageSrc ? imageSrc.substring(0, 50) + '...' : '(vide)', pos: imagePos });
}

console.log('\n🔍 ANALYSE DES PREMIERS PRODUITS:\n');

Object.entries(products).forEach(([handle, data]) => {
  console.log(`📦 Produit: ${handle}`);
  console.log(`   Nombre d'images: ${data.totalLines}`);
  
  // Vérifier la cohérence du titre
  const uniqueTitles = [...new Set(data.titles.filter(Boolean))];
  if (uniqueTitles.length === 1) {
    console.log(`   ✅ Title cohérent: "${uniqueTitles[0]}"`);
  } else if (uniqueTitles.length === 0) {
    console.log(`   ⚠️  Pas de titre détecté`);
  } else {
    console.log(`   ❌ Titles incohérents: ${uniqueTitles.length} différents`);
    uniqueTitles.forEach(t => console.log(`      - "${t}"`));
  }
  
  // Vérifier la cohérence du vendor
  const uniqueVendors = [...new Set(data.vendors.filter(Boolean))];
  if (uniqueVendors.length === 1) {
    console.log(`   ✅ Vendor cohérent: "${uniqueVendors[0]}"`);
  } else if (uniqueVendors.length === 0) {
    console.log(`   ⚠️  Pas de vendor détecté`);
  } else {
    console.log(`   ❌ Vendors incohérents: ${uniqueVendors.length} différents`);
  }
  
  // Vérifier les prix (devrait être seulement sur la première ligne)
  const pricesWithValues = data.prices.filter(Boolean);
  if (pricesWithValues.length === 1) {
    console.log(`   ✅ Prix uniquement sur ligne 1: ${pricesWithValues[0]}`);
  } else {
    console.log(`   ⚠️  Prix sur ${pricesWithValues.length} lignes`);
  }
  
  // Afficher les positions d'images
  const positions = data.images.map(img => img.pos).join(', ');
  if (positions === Array.from({length: data.totalLines}, (_, i) => i + 1).join(', ')) {
    console.log(`   ✅ Positions d'images séquentielles: 1 à ${data.totalLines}`);
  } else {
    console.log(`   ⚠️  Positions d'images: ${positions}`);
  }
  
  console.log('');
});

console.log('\n📋 RÉSUMÉ:');
console.log(`Total de produits uniques analysés: ${Object.keys(products).length}`);
console.log(`Total de lignes d'images: ${Object.values(products).reduce((sum, p) => sum + p.totalLines, 0)}`);
