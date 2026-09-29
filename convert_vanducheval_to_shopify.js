/**
 * Convert VanDuCheval Google Merchant Center feed to Shopify CSV format
 */

import fs from 'fs';
import path from 'path';

function generateShopifyDescription(title, description) {
  const shopifyDescription = `
<div class="product-description">
  <h1>${title}</h1>
  
  <h2>Avantages du produit</h2>
  <ul>
    <li>Construction robuste et durable</li>
    <li>Conçu pour le transport équestre</li>
    <li>Sécurité optimale pour les chevaux</li>
    <li>Facilité d'attelage et de manœuvre</li>
    <li>Entretien minimal</li>
  </ul>
  
  <h2>Caractéristiques techniques</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr>
      <td><strong>Matériau</strong></td>
      <td>Acier galvanisé ou Aluminium</td>
    </tr>
    <tr>
      <td><strong>État</strong></td>
      <td>Occasion - État vérifié</td>
    </tr>
    <tr>
      <td><strong>Capacité</strong></td>
      <td>1 à 4 places selon modèle</td>
    </tr>
    <tr>
      <td><strong>Homologation</strong></td>
      <td>Conforme aux normes européennes</td>
    </tr>
  </table>
  
  <h2>Description</h2>
  <p>${description}</p>
  
  <h2>Points à vérifier</h2>
  <ul>
    <li>État général de la caisse</li>
    <li>Fonctionnement du système de freinage</li>
    <li>État des suspensions</li>
    <li>État du plancher</li>
    <li>Étanchéité de la toiture</li>
  </ul>
  
  <h2>Nos services</h2>
  <ul>
    <li>Garantie 3 mois sur les pièces mécaniques</li>
    <li>Possibilité de financement</li>
    <li>Livraison possible sur demande</li>
    <li>Contrôle technique inclus</li>
  </ul>
</div>
  `.trim();
  
  return shopifyDescription;
}

function generateSEOTitle(title) {
  return `${title} | VanDuCheval - Spécialiste des vans équestres`;
}

function generateSEODescription(title) {
  return `Découvrez notre ${title} d'occasion chez VanDuCheval. Vans et remorques équestres de qualité professionnelle. Visitez notre site !`;
}

function convertToShopifyFormat() {
  const inputFile = './vanducheval-google-merchant-feed.csv';
  const outputFile = './vanducheval-shopify-feed.csv';
  
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
    const brand = gmcFields[gmcHeaderIndices['brand']] || 'VanDuCheval';
    const productType = gmcFields[gmcHeaderIndices['product_type']] || 'Van équestre';
    const googleCategory = gmcFields[gmcHeaderIndices['google_product_category']] || '936';
    const mpn = gmcFields[gmcHeaderIndices['mpn']] || '';
    
    const handle = id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const shopifyDescription = generateShopifyDescription(title, description);
    const seoTitle = generateSEOTitle(title);
    const seoDescription = generateSEODescription(title);
    
    const priceAmount = price.replace(/[^\d,.-]/g, '').replace(',', '.');
    const priceNumber = parseFloat(priceAmount) || 0;
    
    const tags = generateTags(title, productType, brand);
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
      availability === 'in_stock' ? '1' : '0',  // Variant Inventory Qty
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

function generateTags(title, productType, brand) {
  const tags = [productType, brand, 'Van équestre', 'Remorque', 'Transport', 'Occasion'];
  
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('van')) tags.push('Van');
  if (titleLower.includes('remorque')) tags.push('Remorque');
  if (titleLower.includes('hippomobile')) tags.push('Hippomobile');
  
  // Marques
  if (titleLower.includes('ifor-williams')) tags.push('Ifor Williams');
  if (titleLower.includes('bockmann')) tags.push('Böckmann');
  if (titleLower.includes('fautras')) tags.push('Fautras');
  if (titleLower.includes('cheval-liberte')) tags.push('Cheval Liberté');
  if (titleLower.includes('humbaur')) tags.push('Humbaur');
  if (titleLower.includes('westfalia')) tags.push('Westfalia');
  if (titleLower.includes('barbot')) tags.push('Barbot');
  if (titleLower.includes('hotra')) tags.push('Hotra');
  if (titleLower.includes('atec')) tags.push('Atec');
  if (titleLower.includes('aceko')) tags.push('Aceko');
  if (titleLower.includes('desforges')) tags.push('Desforges');
  if (titleLower.includes('saris')) tags.push('Saris');
  if (titleLower.includes('renault')) tags.push('Renault');
  if (titleLower.includes('imara')) tags.push('Imara');
  if (titleLower.includes('jms')) tags.push('JMS');
  if (titleLower.includes('mustang')) tags.push('Mustang');
  
  // Capacités
  if (titleLower.includes('1 place') || titleLower.includes('1-place')) tags.push('1 place');
  if (titleLower.includes('1,5 place') || titleLower.includes('1-5-place')) tags.push('1,5 places');
  if (titleLower.includes('2 places') || titleLower.includes('2-places')) tags.push('2 places');
  if (titleLower.includes('3 places') || titleLower.includes('3-places')) tags.push('3 places');
  if (titleLower.includes('4 places') || titleLower.includes('4-places')) tags.push('4 places');
  if (titleLower.includes('15 places') || titleLower.includes('1,5-places')) tags.push('1,5 places');
  
  // Caractéristiques
  if (titleLower.includes('oblic')) tags.push('Oblic');
  if (titleLower.includes('duo')) tags.push('Duo');
  if (titleLower.includes('maxi')) tags.push('Maxi');
  if (titleLower.includes('multimax')) tags.push('Multimax');
  if (titleLower.includes('optimax')) tags.push('Optimax');
  if (titleLower.includes('minimax')) tags.push('Minimax');
  if (titleLower.includes('gold')) tags.push('Gold');
  if (titleLower.includes('touring')) tags.push('Touring');
  if (titleLower.includes('uno')) tags.push('Uno');
  if (titleLower.includes('champion')) tags.push('Champion');
  if (titleLower.includes('comfort') || titleLower.includes('confort')) tags.push('Confort');
  if (titleLower.includes('provan')) tags.push('Provan');
  if (titleLower.includes('porte-caleche') || titleLower.includes('porte caleche')) tags.push('Porte calèche');
  
  // Années récentes
  if (titleLower.includes('2023')) tags.push('2023');
  if (titleLower.includes('2022')) tags.push('2022');
  if (titleLower.includes('2021')) tags.push('2021');
  if (titleLower.includes('2020')) tags.push('2020');
  if (titleLower.includes('2019')) tags.push('2019');
  if (titleLower.includes('2018')) tags.push('2018');
  
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
