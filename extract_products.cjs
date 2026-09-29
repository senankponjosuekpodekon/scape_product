const fs = require('fs');

const INPUT_FILE = '/home/josue/Téléchargements/websource.txt';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_from_web.csv';

// Read file
const content = fs.readFileSync(INPUT_FILE, 'utf-8');

// Extract all products using regex patterns
const products = [];

// Split by product sections (each product seems to be separated by HTML document boundaries)
const productSections = content.split(/<!DOCTYPE html>|<!doctype html>/i).filter(s => s.length > 1000);

console.log(`Found ${productSections.length} potential product sections`);

for (let i = 0; i < productSections.length; i++) {
  const section = productSections[i];
  
  // Extract title
  const titleMatch = section.match(/og:title" content="([^"]*)"/);
  const title = titleMatch ? titleMatch[1].replace(/&mdash;|—/g, '-').trim() : '';
  
  // Extract description
  const descMatch = section.match(/og:description" content="([^"]*)"/);
  const metaDescMatch = section.match(/name="Description"[^>]*content="([^"]*)"/);
  let description = descMatch ? descMatch[1] : (metaDescMatch ? metaDescMatch[1] : '');
  
  // Extract price
  const priceMatch = section.match(/product:price:amount" content="([^"]*)"/);
  const price = priceMatch ? priceMatch[1] : '';
  
  // Extract currency
  const currencyMatch = section.match(/product:price:currency" content="([^"]*)"/);
  const currency = currencyMatch ? currencyMatch[1] : 'EUR';
  
  // Extract image
  const imageMatch = section.match(/og:image" content="([^"]*)"/);
  const image = imageMatch ? imageMatch[1] : '';
  
  // Extract URL
  const urlMatch = section.match(/og:url" content="([^"]*)"/);
  const url = urlMatch ? urlMatch[1] : '';
  
  // Extract availability
  const availabilityMatch = section.match(/og:availability" content="([^"]*)"/);
  const availability = availabilityMatch ? availabilityMatch[1] : 'instock';
  
  // Extract brand/site name
  const siteMatch = section.match(/og:site_name" content="([^"]*)"/);
  const brand = siteMatch ? siteMatch[1] : '';
  
  // Extract additional data from JSON-LD if present
  const jsonLdMatch = section.match(/<script type="application\/ld\+json">([^<]*)<\/script>/);
  let jsonData = {};
  if (jsonLdMatch) {
    try {
      jsonData = JSON.parse(jsonLdMatch[1]);
    } catch (e) {}
  }
  
  // Determine product type for Google Merchant
  let productType = 'Business & Industrie > Industrielle Lagerung > Schiffscontainer';
  let googleCategory = 'Business & Industrie > Industrielle Lagerung > Schiffscontainer';
  
  const titleLower = title.toLowerCase();
  if (titleLower.includes('büro') || titleLower.includes('office')) {
    productType = 'Bürocontainer';
    googleCategory = 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude > Bürocontainer';
  } else if (titleLower.includes('sanitär') || titleLower.includes('wc') || titleLower.includes('toilet')) {
    productType = 'Sanitärcontainer';
    googleCategory = 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen';
  } else if (titleLower.includes('kühl') || titleLower.includes('reefer')) {
    productType = 'Kühlcontainer';
    googleCategory = 'Business & Industrie > Industrielle Lagerung > Kühlcontainer';
  } else if (titleLower.includes('20') || titleLower.includes('40')) {
    if (titleLower.includes('high cube') || titleLower.includes('hc')) {
      productType = 'High Cube Container';
    } else if (titleLower.includes('open side')) {
      productType = 'Open Side Container';
    } else {
      productType = titleLower.includes('40') ? '40 Fuß Container' : '20 Fuß Container';
    }
  }
  
  // Create handle from title
  const handle = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  // Clean description - remove emojis and normalize
  description = description
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .trim();
  
  if (title && (price || description)) {
    products.push({
      handle,
      title: title.replace(/\[[^\]]*\]\s*/g, ''), // Remove [Hot Item] prefixes
      description,
      price: price || '0.00',
      currency,
      image,
      url,
      brand,
      availability,
      productType,
      googleCategory,
      tags: productType
    });
  }
}

// Remove duplicates by title
const uniqueProducts = [];
const seen = new Set();
for (const p of products) {
  if (!seen.has(p.title)) {
    seen.add(p.title);
    uniqueProducts.push(p);
  }
}

console.log(`Extracted ${uniqueProducts.length} unique products`);

// Create Shopify CSV
const headers = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker',
  'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service',
  'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
  'Image Src', 'SEO Title', 'SEO Description', 'Google Product Category', 'Status'
];

const rows = [headers.join(',')];

for (const p of uniqueProducts) {
  // Create professional HTML description
  let htmlDescription = `<h2>${p.title}</h2>`;
  if (p.description) {
    htmlDescription += `<p>${p.description}</p>`;
  }
  if (p.url) {
    htmlDescription += `<p><strong>Quelle:</strong> <a href="${p.url}" target="_blank">${p.brand || 'Hersteller'}</a></p>`;
  }
  
  // Escape for CSV
  const escape = (field) => {
    if (!field) return '';
    const str = String(field).replace(/"/g, '""');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str}"`;
    }
    return str;
  };
  
  const row = [
    escape(p.handle),
    escape(p.title),
    escape(htmlDescription),
    escape(p.brand || 'Containerdienst'),
    escape(p.productType),
    escape(p.tags),
    'true', // Published
    'Title',
    'Default Title',
    '', // SKU
    '0.0', // Grams
    'shopify',
    '10', // Inventory
    'deny',
    'manual',
    escape(p.price),
    '', // Compare at price
    'true', // Requires shipping
    'true', // Taxable
    escape(p.image),
    escape(p.title),
    escape(p.description.substring(0, 160)),
    escape(p.googleCategory),
    'active'
  ];
  
  rows.push(row.join(','));
}

fs.writeFileSync(OUTPUT_FILE, rows.join('\n'));
console.log(`✅ CSV created: ${OUTPUT_FILE}`);
console.log(`📊 Products: ${uniqueProducts.length}`);

// Print summary
console.log('\n=== Products ===');
uniqueProducts.forEach((p, i) => {
  console.log(`${i + 1}. ${p.title} (${p.price} ${p.currency})`);
});
