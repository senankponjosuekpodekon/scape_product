/**
 * Fix image URLs in German Shopify feed
 */

import fs from 'fs';

function fixImageUrls() {
  const inputFile = './deutsche-boutique-shopify-feed.csv';
  const outputFile = './deutsche-boutique-shopify-feed-fixed.csv';
  
  console.log('Fixing image URLs...');
  const content = fs.readFileSync(inputFile, 'utf8');
  const lines = content.split('\n');
  
  const shopifyHeaders = lines[0].split(',');
  const shopifyHeaderIndices = {};
  shopifyHeaders.forEach((header, index) => {
    shopifyHeaderIndices[header] = index;
  });
  
  const fixedLines = [lines[0]]; // Keep header
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const fields = [];
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
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);
    
    const productId = fields[shopifyHeaderIndices['Variant SKU']] || '';
    const title = fields[shopifyHeaderIndices['Title']] || '';
    const isPool = productId.startsWith('pool');
    
    // Generate valid image URLs
    let imageUrl = '';
    if (isPool) {
      // Use placeholder images for pools
      const poolImages = {
        'pool-001': 'https://picsum.photos/seed/pool-spa-001/800/600.jpg',
        'pool-002': 'https://picsum.photos/seed/pool-panorama-002/800/600.jpg',
        'pool-003': 'https://picsum.photos/seed/pool-jetswim-003/800/600.jpg',
        'pool-004': 'https://picsum.photos/seed/pool-premium-004/800/600.jpg',
        'pool-005': 'https://picsum.photos/seed/pool-mini-005/800/600.jpg'
      };
      imageUrl = poolImages[productId] || 'https://picsum.photos/seed/pool-default/800/600.jpg';
    } else {
      // Use placeholder images for horse vans
      const vanImages = {
        'van-001': 'https://picsum.photos/seed/van-ifor-001/800/600.jpg',
        'van-002': 'https://picsum.photos/seed/van-boeckmann-002/800/600.jpg',
        'van-003': 'https://picsum.photos/seed/van-cheval-003/800/600.jpg',
        'van-004': 'https://picsum.photos/seed/van-humbaur-004/800/600.jpg',
        'van-005': 'https://picsum.photos/seed/van-fautras-005/800/600.jpg'
      };
      imageUrl = vanImages[productId] || 'https://picsum.photos/seed/van-default/800/600.jpg';
    }
    
    // Update the image URL field
    fields[shopifyHeaderIndices['Image Src']] = imageUrl;
    
    // Rebuild the CSV line
    const fixedLine = fields.map((field, index) => {
      const needsQuotes = field.includes(',') || field.includes('"') || field.includes('\n');
      return needsQuotes ? `"${field.replace(/"/g, '""')}"` : field;
    }).join(',');
    
    fixedLines.push(fixedLine);
  }
  
  fs.writeFileSync(outputFile, fixedLines.join('\n'), 'utf8');
  console.log(`Fixed ${lines.length - 1} products with valid image URLs`);
  console.log(`Saved fixed file: ${outputFile}`);
}

try {
  fixImageUrls();
  console.log('Image URLs fixed successfully!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
