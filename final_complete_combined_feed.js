import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

console.log('🔧 Creating COMPLETE combined feed with ALL original data...');

// Read all relevant CSV files
const gshandelsData = fs.readFileSync('gshandels-shopify-import-complete.csv', 'utf8');
const vanduchevalData = fs.readFileSync('vanducheval-shopify-import.csv', 'utf8');
const deutscheBoutiqueData = fs.readFileSync('deutsche-boutique-shopify-feed.csv', 'utf8');

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
const deutscheBoutique = parseCSV(deutscheBoutiqueData);

console.log(`📊 GSHandels: ${gshandels.products.length} rows`);
console.log(`📊 VanDuCheval: ${vanducheval.products.length} rows`);
console.log(`📊 Deutsche Boutique: ${deutscheBoutique.products.length} rows`);

// STEP 1: Get 5 pool products from deutsche-boutique (these have the pool data)
const poolProductsFromDeutsche = deutscheBoutique.products.filter(product => {
    const handle = product.Handle || '';
    return handle.startsWith('pool-');
}).slice(0, 5);

console.log(`🏊 Found ${poolProductsFromDeutsche.length} pool products from deutsche-boutique`);

// STEP 2: For each pool product, find ALL corresponding rows in GSHandels complete data
const completePoolProducts = [];
const poolHandles = poolProductsFromDeutsche.map(p => p.Handle);

poolHandles.forEach(poolHandle => {
    // Find all rows for this handle in GSHandels data
    const allRowsForHandle = gshandels.products.filter(p => p.Handle === poolHandle);
    
    if (allRowsForHandle.length > 0) {
        console.log(`🏊 ${poolHandle}: Found ${allRowsForHandle.length} rows in GSHandels`);
        completePoolProducts.push(...allRowsForHandle);
    } else {
        console.log(`⚠️ ${poolHandle}: No rows found in GSHandels, using deutsche-boutique data`);
        // If not found in GSHandels, use the deutsche-boutique data
        const deutscheRows = deutscheBoutique.products.filter(p => p.Handle === poolHandle);
        completePoolProducts.push(...deutscheRows);
    }
});

console.log(`🏊 Total pool product rows: ${completePoolProducts.length}`);

// STEP 3: Get 5 van products from VanDuCheval with ALL their data
const vanHandles = new Set();
const vanduchevalVanProducts = vanducheval.products.filter(product => {
    if (product.Title && product.Title.trim() !== '' && !vanHandles.has(product.Handle)) {
        vanHandles.add(product.Handle);
        return true;
    }
    return false;
});

// Group by handle and get all rows for first 5 unique handles
const vanProductsByHandle = {};
vanduchevalVanProducts.forEach(product => {
    if (!vanProductsByHandle[product.Handle]) {
        vanProductsByHandle[product.Handle] = [];
    }
    vanProductsByHandle[product.Handle].push(product);
});

const uniqueVanHandles = Object.keys(vanProductsByHandle).slice(0, 5);
const completeVanProducts = [];
uniqueVanHandles.forEach(handle => {
    const allRowsForHandle = vanducheval.products.filter(p => p.Handle === handle);
    completeVanProducts.push(...allRowsForHandle);
    console.log(`🐴 ${handle}: Found ${allRowsForHandle.length} rows`);
});

console.log(`🐴 Total van product rows: ${completeVanProducts.length}`);

// STEP 4: Use the most complete headers (GSHandels format)
const combinedHeaders = gshandels.headers;

// STEP 5: Normalize van products to match GSHandels headers
const normalizedVanProducts = completeVanProducts.map(product => {
    const normalized = {};
    combinedHeaders.forEach(header => {
        normalized[header] = product[header] || '';
    });
    
    // Ensure required fields have proper values
    if (!normalized.Vendor && product.Vendor) {
        normalized.Vendor = product.Vendor;
    }
    
    if (!normalized['Product Category']) {
        normalized['Product Category'] = 'Trailers & Vehicle Parts';
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

// STEP 6: Combine all products
const allCompleteProducts = [...completePoolProducts, ...normalizedVanProducts];

console.log(`📦 Final combined: ${allCompleteProducts.length} total rows`);

// STEP 7: Create complete CSV
const csvData = [combinedHeaders, ...allCompleteProducts.map(product => 
    combinedHeaders.map(header => product[header] || '')
)];

const csv = stringify(csvData);

// Write complete combined feed
fs.writeFileSync('FINAL-complete-combined-shopify-feed.csv', csv, 'utf8');

// STEP 8: Create comprehensive summary
const summary = {
    generated_at: new Date().toISOString(),
    total_rows: allCompleteProducts.length,
    sources: {
        gshandels_complete: {
            file: 'gshandels-shopify-import-complete.csv',
            total_rows: gshandels.products.length
        },
        vanducheval_complete: {
            file: 'vanducheval-shopify-import.csv', 
            total_rows: vanducheval.products.length
        },
        deutsche_boutique: {
            file: 'deutsche-boutique-shopify-feed.csv',
            total_rows: deutscheBoutique.products.length
        }
    },
    pool_products: {
        unique_handles: poolHandles.length,
        total_rows: completePoolProducts.length,
        handles: poolHandles,
        rows_by_handle: {}
    },
    van_products: {
        unique_handles: uniqueVanHandles.length,
        total_rows: completeVanProducts.length,
        handles: uniqueVanHandles,
        rows_by_handle: {}
    },
    image_analysis: {
        total_images: allCompleteProducts.filter(p => p['Image Src'] && p['Image Src'].trim() !== '').length,
        main_product_rows: allCompleteProducts.filter(p => p.Title && p.Title.trim() !== '').length,
        image_only_rows: allCompleteProducts.filter(p => (!p.Title || p.Title.trim() === '') && p['Image Src'] && p['Image Src'].trim() !== '').length,
        average_images_per_product: 0
    },
    data_completeness: {
        products_with_descriptions: allCompleteProducts.filter(p => p['Body (HTML)'] && p['Body (HTML)'].trim() !== '').length,
        products_with_prices: allCompleteProducts.filter(p => p.Price && p.Price.trim() !== '' && p.Price !== '0').length,
        products_with_skus: allCompleteProducts.filter(p => p.SKU && p.SKU.trim() !== '').length,
        products_with_weight: allCompleteProducts.filter(p => p.Grams && p.Grams.trim() !== '').length
    }
};

// Calculate rows per handle for pools
poolHandles.forEach(handle => {
    const rows = allCompleteProducts.filter(p => p.Handle === handle);
    summary.pool_products.rows_by_handle[handle] = rows.length;
});

// Calculate rows per handle for vans
uniqueVanHandles.forEach(handle => {
    const rows = allCompleteProducts.filter(p => p.Handle === handle);
    summary.van_products.rows_by_handle[handle] = rows.length;
});

// Calculate average images per product
if (summary.image_analysis.main_product_rows > 0) {
    summary.image_analysis.average_images_per_product = 
        (summary.image_analysis.total_images / summary.image_analysis.main_product_rows).toFixed(2);
}

fs.writeFileSync('FINAL-complete-combined-feed-summary.json', JSON.stringify(summary, null, 2), 'utf8');

console.log('\n✅ FINAL COMPLETE combined feed created successfully!');
console.log(`📊 Total rows: ${allCompleteProducts.length}`);
console.log(`🏊 Pool products: ${poolHandles.length} unique (${completePoolProducts.length} rows)`);
console.log(`🐴 Van products: ${uniqueVanHandles.length} unique (${completeVanProducts.length} rows)`);
console.log(`🖼️ Total images: ${summary.image_analysis.total_images}`);
console.log(`📈 Average images per product: ${summary.image_analysis.average_images_per_product}`);
console.log(`📝 Products with descriptions: ${summary.data_completeness.products_with_descriptions}`);
console.log(`💰 Products with prices: ${summary.data_completeness.products_with_prices}`);
console.log(`📁 Files created:`);
console.log(`  - FINAL-complete-combined-shopify-feed.csv`);
console.log(`  - FINAL-complete-combined-feed-summary.json`);

// Display detailed breakdown
console.log('\n📋 Detailed Product Breakdown:');

console.log('\n🏊 Pool Products (with ALL image rows):');
poolHandles.forEach((handle, index) => {
    const mainProduct = allCompleteProducts.find(p => p.Handle === handle && p.Title && p.Title.trim() !== '');
    const allRows = allCompleteProducts.filter(p => p.Handle === handle);
    const imageRows = allRows.filter(p => p['Image Src'] && p['Image Src'].trim() !== '');
    
    if (mainProduct) {
        console.log(`${index + 1}. ${mainProduct.Title}`);
        console.log(`   📊 Total rows: ${allRows.length} | 🖼️ Images: ${imageRows.length}`);
        console.log(`   💰 Price: ${mainProduct.Price} | 🏷️ Vendor: ${mainProduct.Vendor}`);
    }
});

console.log('\n🐴 Van Products (with ALL image rows):');
uniqueVanHandles.forEach((handle, index) => {
    const mainProduct = allCompleteProducts.find(p => p.Handle === handle && p.Title && p.Title.trim() !== '');
    const allRows = allCompleteProducts.filter(p => p.Handle === handle);
    const imageRows = allRows.filter(p => p['Image Src'] && p['Image Src'].trim() !== '');
    
    if (mainProduct) {
        console.log(`${index + 1}. ${mainProduct.Title}`);
        console.log(`   📊 Total rows: ${allRows.length} | 🖼️ Images: ${imageRows.length}`);
        console.log(`   💰 Price: ${mainProduct.Price} | 🏷️ Vendor: ${mainProduct.Vendor}`);
    }
});

console.log(`\n🎯 COMPLETE feed ready with ALL original data preserved!`);
console.log(`📈 Data completeness: ${((summary.data_completeness.products_with_descriptions / summary.image_analysis.main_product_rows) * 100).toFixed(1)}% have descriptions`);
