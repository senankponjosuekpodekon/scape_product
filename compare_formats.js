import fs from 'fs';

console.log('📊 Comparaison des formats CSV\n');

// Template Shopify
const template = fs.readFileSync('product_template (1).csv', 'utf8');
const templateHeaders = template.split('\n')[0].split(',');

// Notre CSV généré
const generated = fs.readFileSync('shopify_products.csv', 'utf8');
const generatedHeaders = generated.split('\n')[0].split(',');

console.log('🔵 FORMAT TEMPLATE SHOPIFY (Nouveau):');
console.log(`   Colonnes: ${templateHeaders.length}`);
console.log(`   Headers: ${templateHeaders.slice(0, 10).join(', ')}...`);

console.log('\n🔴 FORMAT GÉNÉRÉ (Ancien):');
console.log(`   Colonnes: ${generatedHeaders.length}`);
console.log(`   Headers: ${generatedHeaders.slice(0, 10).join(', ')}...`);

console.log('\n📋 DIFFÉRENCES MAJEURES:\n');

// Colonnes du template qui n'existent pas dans notre fichier
const templateOnly = [
  'URL handle',
  'Description', 
  'Product category',
  'Status',
  'Option1 name/value',
  'Cost per item',
  'Tax code',
  'Weight value (grams)',
  'Product image URL',
  'SEO title',
  'SEO description'
];

const generatedOnly = [
  'Handle',
  'Body (HTML)',
  'Variant Price',
  'Variant Compare At Price',
  'Image Src',
  'Variant SKU',
  'Variant Inventory Policy',
  'Variant Fulfillment Service'
];

console.log('✅ Colonnes dans TEMPLATE uniquement:');
templateOnly.forEach(col => console.log(`   - ${col}`));

console.log('\n❌ Colonnes dans GÉNÉRÉ uniquement:');
generatedOnly.forEach(col => console.log(`   - ${col}`));

console.log('\n⚠️  CONCLUSION:');
console.log('   Le format généré utilise l\'ANCIEN format Shopify CSV');
console.log('   Le template utilise le NOUVEAU format Shopify CSV');
console.log('   Les deux NE SONT PAS COMPATIBLES!\n');
