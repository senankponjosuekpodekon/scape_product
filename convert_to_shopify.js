/**
 * Convert GSHandels Google Merchant Center feed to Shopify CSV format
 */

import fs from 'fs';
import path from 'path';

function generateShopifyDescription(title, description) {
  const shopifyDescription = `
<div class="product-description">
  <h1>${title}</h1>
  
  <h2>Produktvorteile</h2>
  <ul>
    <li>Wind- und wasserdicht nach ISO-Norm</li>
    <li>CSC-zertifiziert für weltweiten Seetransport</li>
    <li>Stabile Stahlkonstruktion</li>
    <li>Sofort verfügbar - Kurze Lieferzeiten</li>
    <li>Flexible Zahlungsoptionen möglich</li>
  </ul>
  
  <h2>Technische Spezifikationen</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr>
      <td><strong>Material</strong></td>
      <td>Hochwertiger Stahl / Cortenstahl</td>
    </tr>
    <tr>
      <td><strong>Zustand</strong></td>
      <td>Neu oder Gebraucht</td>
    </tr>
    <tr>
      <td><strong>Zertifizierung</strong></td>
      <td>ISO 668, CSC-Plakette</td>
    </tr>
    <tr>
      <td><strong>Verfügbarkeit</strong></td>
      <td>Sofort lieferbar</td>
    </tr>
  </table>
  
  <h2>Beschreibung</h2>
  <p>${description}</p>
  
  <h2>Typische Anwendungsbereiche</h2>
  <ul>
    <li>Lagerung von Baumaterialien</li>
    <li>Warenlager für Handel</li>
    <li>Seefracht-Transport</li>
    <li>Mobile Werkstatt</li>
    <li>Zwischenlager bei Umzügen</li>
  </ul>
  
  <h2>Unsere Serviceleistungen</h2>
  <ul>
    <li>Kostenlose Lieferung (auf Anfrage)</li>
    <li>Professionelle Beratung</li>
    <li>Finanzierung möglich</li>
    <li>30 Tage Rückgabegarantie</li>
  </ul>
</div>
  `.trim();
  
  return shopifyDescription;
}

function generateSEOTitle(title) {
  return `${title} | GSHandels - Professionelle Containerlösungen`;
}

function generateSEODescription(title) {
  return `Hochwertiger ${title} von GSHandels. Professionelle Containerlösungen für Lagerung, Transport und gewerbliche Nutzung. Jetzt unverbindlich anfragen!`;
}

function convertToShopifyFormat() {
  const inputFile = './gshandels-google-merchant-feed-fixed.csv';
  const outputFile = './gshandels-shopify-feed.csv';
  
  console.log('Converting to Shopify format...');
  const content = fs.readFileSync(inputFile, 'utf8');
  const lines = content.split('\n');
  
  const gmcHeaders = lines[0].split(',');
  const gmcHeaderIndices = {};
  gmcHeaders.forEach((header, index) => {
    gmcHeaderIndices[header] = index;
  });
  
  const shopifyHeaders = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Option2 Name',
    'Option2 Value',
    'Option3 Name',
    'Option3 Value',
    'Variant SKU',
    'Variant Grams',
    'Variant Inventory Tracker',
    'Variant Inventory Qty',
    'Variant Inventory Policy',
    'Variant Fulfillment Service',
    'Variant Price',
    'Variant Compare At Price',
    'Variant Requires Shipping',
    'Variant Taxable',
    'Variant Barcode',
    'Image Src',
    'Image Position',
    'Image Alt Text',
    'Gift Card',
    'SEO Title',
    'SEO Description',
    'Google Product Category',
    'Status'
  ];
  
  const shopifyLines = [shopifyHeaders.join(',')];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const gmcFields = [];
    let inQuotes = false;
    let current = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        gmcFields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    gmcFields.push(current);
    
    const id = gmcFields[gmcHeaderIndices['id']] || '';
    const title = gmcFields[gmcHeaderIndices['title']] || '';
    const description = gmcFields[gmcHeaderIndices['description']] || '';
    const link = gmcFields[gmcHeaderIndices['link']] || '';
    const imageLink = gmcFields[gmcHeaderIndices['image_link']] || '';
    const price = gmcFields[gmcHeaderIndices['price']] || '';
    const availability = gmcFields[gmcHeaderIndices['availability']] || '';
    const brand = gmcFields[gmcHeaderIndices['brand']] || 'GSHandels';
    const productType = gmcFields[gmcHeaderIndices['product_type']] || 'Container';
    const googleCategory = gmcFields[gmcHeaderIndices['google_product_category']] || '594';
    const mpn = gmcFields[gmcHeaderIndices['mpn']] || '';
    
    const handle = id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const shopifyDescription = generateShopifyDescription(title, description);
    const seoTitle = generateSEOTitle(title);
    const seoDescription = generateSEODescription(title);
    
    const priceAmount = price.replace(/[^\d,.-]/g, '').replace(',', '.');
    const priceNumber = parseFloat(priceAmount) || 0;
    
    const tags = generateTags(title, productType);
    const status = availability === 'in_stock' ? 'active' : 'draft';
    
    const shopifyRow = [
      handle,                                    // Handle
      `"${title.replace(/"/g, '""')}"`,         // Title
      `"${shopifyDescription.replace(/"/g, '""')}"`, // Body (HTML)
      brand,                                    // Vendor
      `"${productType}"`,                       // Type
      `"${tags}"`,                              // Tags
      'true',                                   // Published
      'Title',                                  // Option1 Name
      'Default Title',                          // Option1 Value
      '',                                       // Option2 Name
      '',                                       // Option2 Value
      '',                                       // Option3 Name
      '',                                       // Option3 Value
      mpn || id,                                // Variant SKU
      '',                                       // Variant Grams
      'shopify',                                // Variant Inventory Tracker
      availability === 'in_stock' ? '10' : '0', // Variant Inventory Qty
      'deny',                                   // Variant Inventory Policy
      'manual',                                 // Variant Fulfillment Service
      priceNumber.toFixed(2),                   // Variant Price
      '',                                       // Variant Compare At Price
      'true',                                   // Variant Requires Shipping
      'true',                                   // Variant Taxable
      '',                                       // Variant Barcode
      imageLink,                                // Image Src
      '1',                                      // Image Position
      `"${title.replace(/"/g, '""')}"`,         // Image Alt Text
      'false',                                  // Gift Card
      `"${seoTitle.replace(/"/g, '""')}"`,     // SEO Title
      `"${seoDescription.replace(/"/g, '""')}"`, // SEO Description
      googleCategory,                           // Google Product Category
      status                                    // Status
    ];
    
    shopifyLines.push(shopifyRow.join(','));
  }
  
  fs.writeFileSync(outputFile, shopifyLines.join('\n'), 'utf8');
  console.log(`Converted ${lines.length - 1} products to Shopify format`);
  console.log(`Saved Shopify feed: ${outputFile}`);
}

function generateTags(title, productType) {
  const tags = [productType, 'GSHandels', 'Container', 'Lagerung', 'Transport'];
  
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('neu')) tags.push('Neu');
  if (titleLower.includes('gebraucht')) tags.push('Gebraucht');
  if (titleLower.includes('high-cube') || titleLower.includes('high cube')) tags.push('High Cube');
  if (titleLower.includes('büro') || titleLower.includes('office')) tags.push('Bürocontainer');
  if (titleLower.includes('wohn') || titleLower.includes('living')) tags.push('Wohncontainer');
  if (titleLower.includes('sanitär') || titleLower.includes('wc')) tags.push('Sanitärcontainer');
  if (titleLower.includes('pool')) tags.push('Pool');
  if (titleLower.includes('sauna')) tags.push('Sauna');
  if (titleLower.includes('bar')) tags.push('Barcontainer');
  if (titleLower.includes('kühl') || titleLower.includes('reefer')) tags.push('Kühlcontainer');
  if (titleLower.includes('flat-rack') || titleLower.includes('flat rack')) tags.push('Flat Rack');
  if (titleLower.includes('open-top') || titleLower.includes('open top')) tags.push('Open Top');
  if (titleLower.includes('tiny-house') || titleLower.includes('tiny house')) tags.push('Tiny House');
  
  if (titleLower.includes('20-fuß') || titleLower.includes('20 fuss') || titleLower.includes('20ft')) tags.push('20 Fuß');
  if (titleLower.includes('40-fuß') || titleLower.includes('40 fuss') || titleLower.includes('40ft')) tags.push('40 Fuß');
  if (titleLower.includes('10-fuß') || titleLower.includes('10 fuss') || titleLower.includes('10ft')) tags.push('10 Fuß');
  
  return unique(tags).join(', ');
}

function unique(array) {
  return [...new Set(array)];
}

try {
  convertToShopifyFormat();
  console.log('Shopify conversion completed successfully!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
