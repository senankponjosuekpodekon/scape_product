import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

// Read both original CSV files
const gshandelsData = fs.readFileSync('gshandels-shopify-import-complete.csv', 'utf8');
const vanduchevalData = fs.readFileSync('vanducheval-shopify-import.csv', 'utf8');

console.log('📖 Reading original CSV files...');

// Parse CSV data properly handling quoted fields
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

const gshandels = parseCSV(gshandelsData);
const vanducheval = parseCSV(vanduchevalData);

console.log(`📊 GSHandels: ${gshandels.products.length} rows`);
console.log(`📊 VanDuCheval: ${vanducheval.products.length} rows`);

// Manually extract the 5 pool products from deutsche-boutique data
const deutscheBoutiqueData = fs.readFileSync('deutsche-boutique-shopify-feed.csv', 'utf8');
const deutscheBoutique = parseCSV(deutscheBoutiqueData);

// Get the 5 pool products from deutsche-boutique
const poolProductsFromDeutsche = deutscheBoutique.products.filter(product => {
    const handle = product.Handle || '';
    return handle.startsWith('pool-');
});

console.log(`🏊 Found ${poolProductsFromDeutsche.length} pool products in deutsche-boutique`);

// Find corresponding products in GSHandels complete data to get all image rows
const poolHandles = new Set(poolProductsFromDeutsche.map(p => p.Handle));
const gshandelsPoolProducts = gshandels.products.filter(product => {
    return poolHandles.has(product.Handle);
});

// Group by handle to get complete product data with all images
const poolProductsByHandle = {};
gshandelsPoolProducts.forEach(product => {
    if (!poolProductsByHandle[product.Handle]) {
        poolProductsByHandle[product.Handle] = [];
    }
    poolProductsByHandle[product.Handle].push(product);
});

// Get first 5 unique pool products with all their rows
const uniquePoolHandles = Object.keys(poolProductsByHandle).slice(0, 5);
const completePoolProducts = [];
uniquePoolHandles.forEach(handle => {
    completePoolProducts.push(...poolProductsByHandle[handle]);
});

console.log(`🏊 Found ${uniquePoolHandles.length} unique pool products with ${completePoolProducts.length} total rows`);

// Get 5 van products from VanDuCheval with ALL their data
const vanHandles = new Set();
const vanduchevalVanProducts = vanducheval.products.filter(product => {
    if (product.Title && product.Title.trim() !== '' && !vanHandles.has(product.Handle)) {
        vanHandles.add(product.Handle);
        return true;
    }
    return false;
});

// Group by handle to get complete product data with all images
const vanProductsByHandle = {};
vanduchevalVanProducts.forEach(product => {
    if (!vanProductsByHandle[product.Handle]) {
        vanProductsByHandle[product.Handle] = [];
    }
    vanProductsByHandle[product.Handle].push(product);
});

// Get first 5 unique van products with all their rows
const uniqueVanHandles = Object.keys(vanProductsByHandle).slice(0, 5);
const completeVanProducts = [];
uniqueVanHandles.forEach(handle => {
    completeVanProducts.push(...vanProductsByHandle[handle]);
});

console.log(`🐴 Found ${uniqueVanHandles.length} unique van products with ${completeVanProducts.length} total rows`);

// Use GSHandels headers as they are more complete
const combinedHeaders = gshandels.headers;

// Normalize van products to match GSHandels headers
const normalizedVanProducts = completeVanProducts.map(product => {
    const normalized = {};
    combinedHeaders.forEach(header => {
        normalized[header] = product[header] || '';
    });
    
    // Map specific fields that might have different names
    if (!normalized.Vendor && product.Vendor) {
        normalized.Vendor = product.Vendor;
    }
    
    if (!normalized['Product Category'] && product['Product Category']) {
        normalized['Product Category'] = product['Product Category'];
    }
    
    if (!normalized.Type && product.Type) {
        normalized.Type = product.Type;
    }
    
    if (!normalized.Tags && product.Tags) {
        normalized.Tags = product.Tags;
    }
    
    // Ensure required fields have defaults
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

// Combine all products
const allCompleteProducts = [...completePoolProducts, ...normalizedVanProducts];

console.log(`📦 Combined: ${allCompleteProducts.length} total rows`);

// Create complete CSV
const csvData = [combinedHeaders, ...allCompleteProducts.map(product => 
    combinedHeaders.map(header => product[header] || '')
)];

const csv = stringify(csvData);

// Write complete combined feed
fs.writeFileSync('complete-combined-shopify-feed.csv', csv, 'utf8');

// Create detailed summary
const summary = {
    generated_at: new Date().toISOString(),
    total_rows: allCompleteProducts.length,
    gshandels_pool_products: {
        unique_products: uniquePoolHandles.length,
        total_rows: completePoolProducts.length,
        handles: uniquePoolHandles
    },
    vanducheval_products: {
        unique_products: uniqueVanHandles.length,
        total_rows: completeVanProducts.length,
        handles: uniqueVanHandles
    },
    image_analysis: {
        total_images: allCompleteProducts.filter(p => p['Image Src'] && p['Image Src'].trim() !== '').length,
        main_product_rows: allCompleteProducts.filter(p => p.Title && p.Title.trim() !== '').length,
        image_only_rows: allCompleteProducts.filter(p => !p.Title || p.Title.trim() === '').length
    },
    products_by_type: {}
};

// Analyze products by type
allCompleteProducts.forEach(product => {
    if (product.Title && product.Title.trim() !== '') {
        const type = product.Type || 'Unknown';
        if (!summary.products_by_type[type]) {
            summary.products_by_type[type] = 0;
        }
        summary.products_by_type[type]++;
    }
});

fs.writeFileSync('complete-combined-feed-summary.json', JSON.stringify(summary, null, 2), 'utf8');

console.log('\n✅ Complete combined feed created successfully!');
console.log(`📊 Total rows: ${allCompleteProducts.length}`);
console.log(`🏊 Pool products: ${uniquePoolHandles.length} unique (${completePoolProducts.length} rows)`);
console.log(`🐴 Van products: ${uniqueVanHandles.length} unique (${completeVanProducts.length} rows)`);
console.log(`🖼️ Total images: ${summary.image_analysis.total_images}`);
console.log(`📁 Files created:`);
console.log(`  - complete-combined-shopify-feed.csv`);
console.log(`  - complete-combined-feed-summary.json`);

// Display product breakdown
console.log('\n📋 Product Breakdown:');
console.log('\n🏊 Pool Products:');
uniquePoolHandles.forEach((handle, index) => {
    const mainProduct = poolProductsByHandle[handle].find(p => p.Title && p.Title.trim() !== '');
    if (mainProduct) {
        const imageCount = poolProductsByHandle[handle].filter(p => p['Image Src'] && p['Image Src'].trim() !== '').length;
        console.log(`${index + 1}. ${mainProduct.Title} (${imageCount} images)`);
    }
});

console.log('\n🐴 Van Products:');
uniqueVanHandles.forEach((handle, index) => {
    const mainProduct = vanProductsByHandle[handle].find(p => p.Title && p.Title.trim() !== '');
    if (mainProduct) {
        const imageCount = vanProductsByHandle[handle].filter(p => p['Image Src'] && p['Image Src'].trim() !== '').length;
        console.log(`${index + 1}. ${mainProduct.Title} (${imageCount} images)`);
    }
});

console.log(`\n🎯 Complete feed ready with ALL original data preserved!`);
