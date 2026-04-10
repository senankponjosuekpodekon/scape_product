import fs from 'fs';

console.log('🔄 Conversion vers le nouveau format Shopify...\n');

// Lire l'ancien format
const oldContent = fs.readFileSync('shopify_products.csv', 'utf8');
const oldLines = oldContent.split('\n');

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

const oldHeaders = parseCsvLine(oldLines[0]);

// Mapping des colonnes
const mapping = {
  'Handle': 'URL handle',
  'Title': 'Title',
  'Body (HTML)': 'Description',
  'Vendor': 'Vendor',
  'Type': 'Type',
  'Tags': 'Tags',
  'Published': 'Published on online store',
  'Variant Price': 'Price',
  'Variant Compare At Price': 'Compare-at price',
  'Image Src': 'Product image URL',
  'Image Position': 'Image position',
  'Variant SKU': 'SKU',
  'Variant Barcode': 'Barcode',
  'Variant Grams': 'Weight value (grams)',
  'Variant Inventory Policy': 'Continue selling when out of stock',
  'Variant Fulfillment Service': 'Fulfillment service',
  'Variant Requires Shipping': 'Requires shipping',
  'Variant Taxable': 'Charge tax',
};

// Nouveau format headers (toutes les colonnes requises)
const newHeaders = [
  'Title',
  'URL handle',
  'Description',
  'Vendor',
  'Product category',
  'Type',
  'Tags',
  'Published on online store',
  'Status',
  'SKU',
  'Barcode',
  'Option1 name',
  'Option1 value',
  'Option1 Linked To',
  'Option2 name',
  'Option2 value',
  'Option2 Linked To',
  'Option3 name',
  'Option3 value',
  'Option3 Linked To',
  'Price',
  'Compare-at price',
  'Cost per item',
  'Charge tax',
  'Tax code',
  'Unit price total measure',
  'Unit price total measure unit',
  'Unit price base measure',
  'Unit price base measure unit',
  'Inventory tracker',
  'Inventory quantity',
  'Continue selling when out of stock',
  'Weight value (grams)',
  'Weight unit for display',
  'Requires shipping',
  'Fulfillment service',
  'Product image URL',
  'Image position',
  'Image alt text',
  'Variant image URL',
  'Gift card',
  'SEO title',
  'SEO description',
  'Color (product.metafields.shopify.color-pattern)',
  'Google Shopping / Google product category',
  'Google Shopping / Gender',
  'Google Shopping / Age group',
  'Google Shopping / Manufacturer part number (MPN)',
  'Google Shopping / Ad group name',
  'Google Shopping / Ads labels',
  'Google Shopping / Condition',
  'Google Shopping / Custom product',
  'Google Shopping / Custom label 0',
  'Google Shopping / Custom label 1',
  'Google Shopping / Custom label 2',
  'Google Shopping / Custom label 3',
  'Google Shopping / Custom label 4'
];

// Parser les données de l'ancien format
const products = [];
for (let i = 1; i < oldLines.length; i++) {
  if (!oldLines[i].trim()) continue;
  
  const fields = parseCsvLine(oldLines[i]);
  const product = {};
  
  oldHeaders.forEach((header, idx) => {
    product[header] = fields[idx] || '';
  });
  
  products.push(product);
}

console.log(`✅ ${products.length} lignes parsées\n`);

// Convertir vers le nouveau format
const newProducts = products.map(old => {
  const newProd = {};
  
  // Mapper les colonnes existantes
  newHeaders.forEach(newHeader => {
    // Trouver la correspondance dans le mapping
    const oldHeader = Object.keys(mapping).find(k => mapping[k] === newHeader);
    
    if (oldHeader && old[oldHeader]) {
      newProd[newHeader] = old[oldHeader];
    } else {
      // Valeurs par défaut
      switch(newHeader) {
        case 'Status':
          newProd[newHeader] = old['Published'] === 'TRUE' ? 'active' : 'draft';
          break;
        case 'Weight unit for display':
          newProd[newHeader] = 'g';
          break;
        case 'Inventory tracker':
          newProd[newHeader] = 'shopify';
          break;
        case 'Inventory quantity':
          newProd[newHeader] = old['Variant Inventory Qty'] || '';
          break;
        case 'Continue selling when out of stock':
          newProd[newHeader] = old['Variant Inventory Policy'] === 'deny' ? 'DENY' : 'CONTINUE';
          break;
        case 'Fulfillment service':
          newProd[newHeader] = old['Variant Fulfillment Service'] || 'manual';
          break;
        case 'Gift card':
          newProd[newHeader] = 'FALSE';
          break;
        case 'Published on online store':
          newProd[newHeader] = old['Published'];
          break;
        default:
          newProd[newHeader] = '';
      }
    }
  });
  
  return newProd;
});

console.log(`🔄 Conversion effectuée\n`);

// Générer le nouveau CSV
const csvContent = newHeaders.join(',') + '\n' +
  newProducts.map(prod => 
    newHeaders.map(h => {
      const value = String(prod[h] || '');
      // Échapper et quoter
      return `"${value.replace(/"/g, '""')}"`;
    }).join(',')
  ).join('\n');

fs.writeFileSync('shopify_products_new_format.csv', csvContent, 'utf8');

console.log('✅ Fichier converti : shopify_products_new_format.csv');
console.log(`📊 ${newProducts.length} lignes converties`);
console.log(`📋 ${newHeaders.length} colonnes\n`);

// Afficher un aperçu
console.log('📄 Aperçu des premières colonnes:');
console.log(newHeaders.slice(0, 10).join(', '));
