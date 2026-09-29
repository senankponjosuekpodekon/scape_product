import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

// Read the deutsche-boutique feed for pool products
const deutscheBoutiqueData = fs.readFileSync('deutsche-boutique-shopify-feed.csv', 'utf8');
const vanduchevalData = fs.readFileSync('vanducheval-shopify-import.csv', 'utf8');

// Parse CSV data
function parseCSV(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
    
    const products = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        // Parse CSV with quoted fields
        for (let char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current);
        
        if (values.length === headers.length) {
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
            });
            products.push(product);
        }
    }
    
    return { headers, products };
}

const deutscheBoutique = parseCSV(deutscheBoutiqueData);
const vanducheval = parseCSV(vanduchevalData);

// Manually select 5 pool products from deutsche-boutique
const poolProducts = deutscheBoutique.products.filter(product => {
    const handle = product.Handle || '';
    return handle.startsWith('pool-');
}).slice(0, 5);

// Get 5 products from VanDuCheval (first 5 available)
const vanduchevalProducts = vanducheval.products
    .filter(product => product.Title && product.Title.trim() !== '')
    .slice(0, 5);

// Combine products
const combinedProducts = [...poolProducts, ...vanduchevalProducts];

// Use deutsche-boutique headers as they are more complete
const combinedHeaders = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type',
    'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Option2 Name', 
    'Option2 Value', 'Option3 Name', 'Option3 Value', 'SKU', 'Grams', 
    'Weight Unit', 'Inventory Qty', 'Inventory Policy', 'Fulfillment Service',
    'Price', 'Compare At Price', 'Requires Shipping', 'Taxable', 'Barcode',
    'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card', 'SEO Title',
    'SEO Description', 'Google Shopping / Google Product Category', 'Google Shopping / Gender',
    'Google Shopping / Age Group', 'Google Shopping / MPN', 'Google Shopping / AdWords Grouping',
    'Google Shopping / AdWords Labels', 'Google Shopping / Condition', 'Google Shopping / Custom Product',
    'Google Shopping / Custom Label 0', 'Google Shopping / Custom Label 1',
    'Google Shopping / Custom Label 2', 'Google Shopping / Custom Label 3',
    'Google Shopping / Custom Label 4', 'Variant Image', 'Variant Weight Unit',
    'Variant Tax Code', 'Cost per item', 'Status'
];

// Normalize products to combined headers
const normalizedProducts = combinedProducts.map(product => {
    const normalized = {};
    combinedHeaders.forEach(header => {
        normalized[header] = product[header] || '';
    });
    
    // Handle specific field mappings for vanducheval products
    if (!product.Vendor || product.Vendor === '') {
        normalized.Vendor = product.Vendor || 'VanDuCheval';
    }
    
    // Ensure required fields have defaults
    if (!normalized['Product Category']) {
        normalized['Product Category'] = normalized.Type || 'Container';
    }
    
    if (!normalized.Published) {
        normalized.Published = 'TRUE';
    }
    
    if (!normalized['Option1 Name']) {
        normalized['Option1 Name'] = 'Title';
        normalized['Option1 Value'] = 'Default Title';
    }
    
    if (!normalized['Inventory Qty']) {
        normalized['Inventory Qty'] = '1';
    }
    
    if (!normalized['Inventory Policy']) {
        normalized['Inventory Policy'] = 'deny';
    }
    
    if (!normalized['Fulfillment Service']) {
        normalized['Fulfillment Service'] = 'manual';
    }
    
    if (!normalized['Requires Shipping']) {
        normalized['Requires Shipping'] = 'TRUE';
    }
    
    if (!normalized.Taxable) {
        normalized.Taxable = 'TRUE';
    }
    
    if (!normalized['Gift Card']) {
        normalized['Gift Card'] = 'FALSE';
    }
    
    if (!normalized['Google Shopping / Google Product Category']) {
        normalized['Google Shopping / Google Product Category'] = '972';
    }
    
    if (!normalized['Google Shopping / Gender']) {
        normalized['Google Shopping / Gender'] = 'Unisex';
    }
    
    if (!normalized['Google Shopping / Age Group']) {
        normalized['Google Shopping / Age Group'] = 'Adult';
    }
    
    if (!normalized['Google Shopping / Condition']) {
        normalized['Google Shopping / Condition'] = 'new';
    }
    
    if (!normalized.Status) {
        normalized.Status = 'active';
    }
    
    return normalized;
});

// Create combined CSV
const combinedCSV = stringify([combinedHeaders, ...normalizedProducts.map(product => 
    combinedHeaders.map(header => product[header] || '')
)]);

// Write combined feed
fs.writeFileSync('combined-shopify-feed.csv', combinedCSV, 'utf8');

// Create summary
const summary = {
    generated_at: new Date().toISOString(),
    total_products: combinedProducts.length,
    pool_products: poolProducts.length,
    vanducheval_products: vanduchevalProducts.length,
    products: combinedProducts.map(product => ({
        handle: product.Handle,
        title: product.Title,
        vendor: product.Vendor,
        type: product.Type,
        price: product.Price || product['Variant Price'],
        is_pool: (product.Handle || '').startsWith('pool-')
    }))
};

fs.writeFileSync('combined-feed-summary.json', JSON.stringify(summary, null, 2), 'utf8');

console.log('✅ Combined feed created successfully!');
console.log(`📊 Total products: ${combinedProducts.length}`);
console.log(`🏊 Pool products: ${poolProducts.length}`);
console.log(`🐴 VanDuCheval products: ${vanduchevalProducts.length}`);
console.log(`📁 Files created:`);
console.log(`  - combined-shopify-feed.csv`);
console.log(`  - combined-feed-summary.json`);

// Display product list
console.log('\n📋 Product List:');
combinedProducts.forEach((product, index) => {
    const isPool = (product.Handle || '').startsWith('pool-') ? '🏊' : '🐴';
    const price = product.Price || product['Variant Price'] || 'N/A';
    console.log(`${index + 1}. ${isPool} ${product.Title} (${product.Vendor}) - ${price}`);
});
