import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

// Load the scraped data
const rawData = JSON.parse(fs.readFileSync('gshandels-products-raw.json', 'utf8'));

// Shopify CSV headers
const SHOPIFY_HEADERS = [
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

function cleanHtml(text) {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeCsvField(field) {
    if (field === null || field === undefined) return '';
    const string = String(field);
    if (string.includes(',') || string.includes('"') || string.includes('\n')) {
        return `"${string.replace(/"/g, '""')}"`;
    }
    return string;
}

function extractWeight(shippingWeight) {
    if (!shippingWeight) return '';
    // Extract weight in kg from various formats
    const match = shippingWeight.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (match) {
        return Math.round(parseFloat(match[1]) * 1000); // Convert to grams
    }
    return '';
}

function generateHandle(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function generateTags(productType, material, color) {
    const tags = ['container', 'shipping', 'storage', 'industrial'];
    
    if (productType) {
        tags.push(...productType.toLowerCase().split(/[ >\/]+/).filter(Boolean));
    }
    
    if (material && material !== 'Stahl') {
        tags.push(material.toLowerCase());
    }
    
    if (color) {
        tags.push(color.toLowerCase());
    }
    
    return [...new Set(tags)].join(', ');
}

function convertToShopifyFormat() {
    const shopifyProducts = [];
    
    rawData.forEach(page => {
        if (!page.product || page.error) return;
        
        const product = page.product;
        const handle = generateHandle(product.title);
        const tags = generateTags(product.product_type, product.material, product.color);
        const weight = extractWeight(product.shipping_weight);
        
        // Main product row
        const mainRow = {
            'Handle': handle,
            'Title': product.title || '',
            'Body (HTML)': product.description ? product.description.replace(/\n/g, '<br>') : '',
            'Vendor': product.brand || 'GSHandels',
            'Product Category': 'Shipping Containers & Storage',
            'Type': product.product_type || 'Container',
            'Tags': tags,
            'Published': 'TRUE',
            'Option1 Name': 'Title',
            'Option1 Value': 'Default Title',
            'Option2 Name': '',
            'Option2 Value': '',
            'Option3 Name': '',
            'Option3 Value': '',
            'SKU': product.sku || '',
            'Grams': weight,
            'Weight Unit': weight ? 'g' : '',
            'Inventory Qty': '100',
            'Inventory Policy': 'deny',
            'Fulfillment Service': 'manual',
            'Price': product.price ? product.price.replace(/[^\d.,]/g, '') : '0',
            'Compare At Price': product.sale_price ? product.sale_price.replace(/[^\d.,]/g, '') : '',
            'Requires Shipping': 'TRUE',
            'Taxable': 'TRUE',
            'Barcode': '',
            'Image Src': product.images && product.images.length > 0 ? product.images[0] : '',
            'Image Position': '1',
            'Image Alt Text': product.title || '',
            'Gift Card': 'FALSE',
            'SEO Title': product.title || '',
            'SEO Description': product.description ? cleanHtml(product.description).substring(0, 160) : '',
            'Google Shopping / Google Product Category': '594',
            'Google Shopping / Gender': 'Unisex',
            'Google Shopping / Age Group': 'Adult',
            'Google Shopping / MPN': product.sku || '',
            'Google Shopping / AdWords Grouping': '',
            'Google Shopping / AdWords Labels': '',
            'Google Shopping / Condition': 'new',
            'Google Shopping / Custom Product': '',
            'Google Shopping / Custom Label 0': '',
            'Google Shopping / Custom Label 1': '',
            'Google Shopping / Custom Label 2': '',
            'Google Shopping / Custom Label 3': '',
            'Google Shopping / Custom Label 4': '',
            'Variant Image': '',
            'Variant Weight Unit': '',
            'Variant Tax Code': '',
            'Cost per item': '',
            'Status': 'active'
        };
        
        shopifyProducts.push(mainRow);
        
        // Additional image rows
        if (product.images && product.images.length > 1) {
            product.images.slice(1).forEach((image, index) => {
                const imageRow = {
                    'Handle': handle,
                    'Title': '',
                    'Body (HTML)': '',
                    'Vendor': '',
                    'Product Category': '',
                    'Type': '',
                    'Tags': '',
                    'Published': 'FALSE',
                    'Option1 Name': '',
                    'Option1 Value': '',
                    'Option2 Name': '',
                    'Option2 Value': '',
                    'Option3 Name': '',
                    'Option3 Value': '',
                    'SKU': '',
                    'Grams': '',
                    'Weight Unit': '',
                    'Inventory Qty': '',
                    'Inventory Policy': '',
                    'Fulfillment Service': '',
                    'Price': '',
                    'Compare At Price': '',
                    'Requires Shipping': '',
                    'Taxable': '',
                    'Barcode': '',
                    'Image Src': image,
                    'Image Position': (index + 2).toString(),
                    'Image Alt Text': `${product.title} - Image ${index + 2}`,
                    'Gift Card': 'FALSE',
                    'SEO Title': '',
                    'SEO Description': '',
                    'Google Shopping / Google Product Category': '',
                    'Google Shopping / Gender': '',
                    'Google Shopping / Age Group': '',
                    'Google Shopping / MPN': '',
                    'Google Shopping / AdWords Grouping': '',
                    'Google Shopping / AdWords Labels': '',
                    'Google Shopping / Condition': '',
                    'Google Shopping / Custom Product': '',
                    'Google Shopping / Custom Label 0': '',
                    'Google Shopping / Custom Label 1': '',
                    'Google Shopping / Custom Label 2': '',
                    'Google Shopping / Custom Label 3': '',
                    'Google Shopping / Custom Label 4': '',
                    'Variant Image': '',
                    'Variant Weight Unit': '',
                    'Variant Tax Code': '',
                    'Cost per item': '',
                    'Status': 'active'
                };
                shopifyProducts.push(imageRow);
            });
        }
    });
    
    return shopifyProducts;
}

function createShopifyCSV() {
    console.log('Converting to Shopify format...');
    const shopifyProducts = convertToShopifyFormat();
    
    // Create CSV
    const csvData = [SHOPIFY_HEADERS, ...shopifyProducts.map(product => 
        SHOPIFY_HEADERS.map(header => product[header] || '')
    )];
    
    const csv = stringify(csvData);
    
    // Write to file
    fs.writeFileSync('gshandels-shopify-import.csv', csv, 'utf8');
    
    // Create summary
    const summary = {
        generated_at: new Date().toISOString(),
        total_products: rawData.filter(p => p.product && !p.error).length,
        total_rows: shopifyProducts.length,
        products_with_images: shopifyProducts.filter(p => p['Image Src']).length,
        products_with_descriptions: shopifyProducts.filter(p => p['Body (HTML)']).length,
        products_with_prices: shopifyProducts.filter(p => p['Price'] && p['Price'] !== '0').length,
        average_images_per_product: 0,
        product_types: [...new Set(shopifyProducts.map(p => p['Type']).filter(Boolean))],
        materials: [...new Set(rawData.map(p => p.product?.material).filter(Boolean))],
        colors: [...new Set(rawData.map(p => p.product?.color).filter(Boolean))]
    };
    
    // Calculate average images
    const productHandles = [...new Set(shopifyProducts.map(p => p['Handle']).filter(Boolean))];
    const totalImages = shopifyProducts.filter(p => p['Image Src']).length;
    summary.average_images_per_product = (totalImages / productHandles.length).toFixed(2);
    
    fs.writeFileSync('gshandels-shopify-summary.json', JSON.stringify(summary, null, 2), 'utf8');
    
    console.log(`\n========================================`);
    console.log(`Shopify CSV created: gshandels-shopify-import.csv`);
    console.log(`Summary created: gshandels-shopify-summary.json`);
    console.log(`Total products: ${summary.total_products}`);
    console.log(`Total CSV rows: ${summary.total_rows}`);
    console.log(`Products with images: ${summary.products_with_images}`);
    console.log(`Products with descriptions: ${summary.products_with_descriptions}`);
    console.log(`Products with prices: ${summary.products_with_prices}`);
    console.log(`Average images per product: ${summary.average_images_per_product}`);
    console.log(`========================================`);
    
    return summary;
}

// Run the conversion
createShopifyCSV();
