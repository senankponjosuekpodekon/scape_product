import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

console.log('🔧 Creating feed WITHOUT images for successful Shopify import...');

// Read the ultimate feed
const ultimateFeedData = fs.readFileSync('ULTIMATE-complete-combined-shopify-feed.csv', 'utf8');

// Parse CSV data
function parseCSV(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
    
    const products = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
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

const ultimateFeed = parseCSV(ultimateFeedData);

console.log(`📊 Original feed: ${ultimateFeed.products.length} rows`);

// Keep only main product rows (those with titles) and remove images
const mainProductsOnly = ultimateFeed.products.filter(product => {
    return product.Title && product.Title.trim() !== '';
});

console.log(`🎯 Main products only: ${mainProductsOnly.length} rows`);

// Clear image URLs but keep image position for future reference
const productsWithoutImages = mainProductsOnly.map(product => {
    const modified = { ...product };
    
    // Clear all image-related fields
    modified['Image Src'] = '';
    modified['Image Alt Text'] = '';
    modified['Image Position'] = '1';
    
    return modified;
});

console.log(`🖼️ Created ${productsWithoutImages.length} products without images`);

// Create new CSV
const csvData = [ultimateFeed.headers, ...productsWithoutImages.map(product => 
    ultimateFeed.headers.map(header => product[header] || '')
)];

const csv = stringify(csvData);

// Write feed without images
fs.writeFileSync('shopify-feed-no-images.csv', csv, 'utf8');

// Create summary
const summary = {
    generated_at: new Date().toISOString(),
    original_rows: ultimateFeed.products.length,
    main_products_only: mainProductsOnly.length,
    final_products: productsWithoutImages.length,
    image_removal: {
        images_removed: ultimateFeed.products.length - mainProductsOnly.length,
        reason: 'Shopify upload failure - URLs not accessible'
    },
    products_by_vendor: {},
    products_by_type: {}
};

// Analyze products
productsWithoutImages.forEach(product => {
    const vendor = product.Vendor || 'Unknown';
    const type = product.Type || 'Unknown';
    
    summary.products_by_vendor[vendor] = (summary.products_by_vendor[vendor] || 0) + 1;
    summary.products_by_type[type] = (summary.products_by_type[type] || 0) + 1;
});

fs.writeFileSync('shopify-feed-no-images-summary.json', JSON.stringify(summary, null, 2), 'utf8');

console.log('\n✅ Feed without images created successfully!');
console.log(`📊 Final products: ${productsWithoutImages.length}`);
console.log(`🏷️ Vendors: ${Object.keys(summary.products_by_vendor).join(', ')}`);
console.log(`📁 Files created:`);
console.log(`  - shopify-feed-no-images.csv`);
console.log(`  - shopify-feed-no-images-summary.json`);

console.log('\n📋 Product List:');
productsWithoutImages.forEach((product, index) => {
    console.log(`${index + 1}. ${product.Title} (${product.Vendor}) - ${product.Price}`);
});

console.log('\n💡 Next Steps:');
console.log('1. Import shopify-feed-no-images.csv into Shopify');
console.log('2. Products will be created without images');
console.log('3. You can add images manually later in Shopify admin');
console.log('4. Or we can create a separate image upload script later');
