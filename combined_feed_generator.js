import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

// Read both CSV files - use deutsche-boutique for pool products
const gshandelsData = fs.readFileSync('deutsche-boutique-shopify-feed.csv', 'utf8');
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

const gshandels = parseCSV(gshandelsData);
const vanducheval = parseCSV(vanduchevalData);

// Find 5 container pool products from GSHandels (deutsche-boutique has pool products)
const gshandelsPoolProducts = gshandels.products
    .filter(product => {
        const title = (product.Title || '').toLowerCase();
        const tags = (product.Tags || '').toLowerCase();
        const type = (product.Type || '').toLowerCase();
        const handle = (product.Handle || '').toLowerCase();
        const description = (product['Body (HTML)'] || '').toLowerCase();
        
        return title.includes('pool') || 
               title.includes('schwimm') || 
               title.includes('becken') ||
               title.includes('spa') ||
               title.includes('container') ||
               tags.includes('pool') || 
               tags.includes('schwimm') ||
               tags.includes('wellness') ||
               tags.includes('spa') ||
               type.includes('pool') ||
               type.includes('spa') ||
               handle.includes('pool') ||
               description.includes('pool') ||
               description.includes('schwimm') ||
               description.includes('becken') ||
               description.includes('spa');
    })
    .slice(0, 5);

// Get 5 products from VanDuCheval (first 5 available)
const vanduchevalProducts = vanducheval.products
    .filter(product => product.Title && product.Title.trim() !== '')
    .slice(0, 5);

// Combine products
const combinedProducts = [...gshandelsPoolProducts, ...vanduchevalProducts];

// Create combined CSV
const combinedCSV = stringify([gshandels.headers, ...combinedProducts.map(product => 
    gshandels.headers.map(header => product[header] || '')
)]);

// Write combined feed
fs.writeFileSync('combined-shopify-feed.csv', combinedCSV, 'utf8');

// Create summary
const summary = {
    generated_at: new Date().toISOString(),
    total_products: combinedProducts.length,
    gshandels_pool_products: gshandelsPoolProducts.length,
    vanducheval_products: vanduchevalProducts.length,
    products: combinedProducts.map(product => ({
        handle: product.Handle,
        title: product.Title,
        vendor: product.Vendor,
        type: product.Type,
        price: product.Price,
        image_count: product['Image Src'] ? '1+' : '0'
    }))
};

fs.writeFileSync('combined-feed-summary.json', JSON.stringify(summary, null, 2), 'utf8');

console.log('✅ Combined feed created successfully!');
console.log(`📊 Total products: ${combinedProducts.length}`);
console.log(`🏊 GSHandels pool products: ${gshandelsPoolProducts.length}`);
console.log(`🐴 VanDuCheval products: ${vanduchevalProducts.length}`);
console.log(`📁 Files created:`);
console.log(`  - combined-shopify-feed.csv`);
console.log(`  - combined-feed-summary.json`);

// Display product list
console.log('\n📋 Product List:');
combinedProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.Title} (${product.Vendor}) - ${product.Price}`);
});
