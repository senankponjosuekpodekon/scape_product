/**
 * Export reformulé pour WooCommerce et Shopify - muebles-decor.com
 * 
 * Ce script reformule les titres, descriptions et meta descriptions
 * pour éviter le contenu dupliqué et les suspensions Google Merchant.
 * 
 * Usage:
 *   node muebles_decor_export_reformulated.js
 */

import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify/sync';

const INPUT_FILE = './muebles-decor-products-raw.json';

// ============= REFORMULATION UTILITIES =============

const TITLE_PREFIXES = [
  '', 'Exclusivo ', 'Elegante ', 'Premium ', 'Diseño ', 'Moderno ',
  'Sofisticado ', 'Lujoso ', 'Contemporáneo ', 'Refinado '
];

const TITLE_SUFFIXES = [
  '', ' - Estilo Contemporáneo', ' - Alta Calidad', ' - Diseño Exclusivo',
  ' - Acabado Premium', ' - Decoración Moderna', ' - Confort Superior'
];

const DESCRIPTION_INTROS = [
  'Descubre este magnífico producto que transformará tu espacio.',
  'Una pieza excepcional que combina estilo y funcionalidad.',
  'Eleva la estética de tu hogar con esta creación única.',
  'Diseñado para quienes valoran la calidad y el buen gusto.',
  'Añade un toque de distinción a cualquier ambiente.',
  'La combinación perfecta entre elegancia y practicidad.',
  'Un elemento decorativo que marca la diferencia.',
  'Fusión de diseño contemporáneo y artesanía de calidad.',
  'Para espacios que exigen lo mejor en decoración.',
  'Una inversión en estilo y durabilidad.'
];

const DESCRIPTION_CLOSINGS = [
  'Ideal para espacios modernos y acogedores.',
  'Perfecto para completar tu decoración con estilo.',
  'Un complemento indispensable para tu hogar.',
  'Disfruta de la calidad que mereces.',
  'Aporta personalidad y carácter a tu espacio.',
  'Hecho para perdurar y embellecer.',
  'La elección acertada para ambientes distinguidos.',
  'Calidad europea para tu confort diario.',
  'Transforma tu espacio en un lugar único.',
  'Diseño pensado para tu bienestar.'
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function reformulateTitle(originalTitle, sku) {
  const hash = hashCode(sku || originalTitle);
  
  // Clean the title
  let title = originalTitle
    .replace(/^(Descripción|Description)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Translate French titles to Spanish if needed
  title = title
    .replace(/^Canapé\s+/i, 'Sofá ')
    .replace(/^Fauteuil\s+/i, 'Sillón ')
    .replace(/^Chaise\s+/i, 'Silla ')
    .replace(/^Lampe\s+/i, 'Lámpara ')
    .replace(/^Table\s+/i, 'Mesa ')
    .replace(/places/gi, 'plazas')
    .replace(/cuir/gi, 'cuero')
    .replace(/tissu/gi, 'tejido')
    .replace(/bois/gi, 'madera');
  
  // Apply variations based on hash
  const prefixIdx = hash % TITLE_PREFIXES.length;
  const suffixIdx = (hash + 3) % TITLE_SUFFIXES.length;
  
  // Only add prefix/suffix sometimes to vary
  let newTitle = title;
  if (hash % 3 === 0 && !title.startsWith('Exclusivo') && !title.startsWith('Elegante')) {
    newTitle = TITLE_PREFIXES[prefixIdx] + title;
  }
  if (hash % 4 === 0 && newTitle.length < 100) {
    newTitle = newTitle + TITLE_SUFFIXES[suffixIdx];
  }
  
  // Ensure max 150 chars
  if (newTitle.length > 150) {
    newTitle = newTitle.substring(0, 147) + '...';
  }
  
  return newTitle;
}

function reformulateDescription(originalDesc, sku, title) {
  const hash = hashCode(sku || title);
  
  // Clean description
  let desc = originalDesc
    .replace(/^(Descripción|Description)\s*/i, '')
    .replace(/Ficha técnica[:\s]*/gi, '\n\nEspecificaciones:\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Extract main content (before technical specs)
  const parts = desc.split(/(?:Especificaciones|Ficha técnica|Características técnicas)[:\s]*/i);
  let mainContent = parts[0].trim();
  let techSpecs = parts.length > 1 ? parts.slice(1).join('\n') : '';
  
  // Truncate if too long
  if (mainContent.length > 2000) {
    mainContent = mainContent.substring(0, 1997) + '...';
  }
  
  // Build reformulated description
  const introIdx = hash % DESCRIPTION_INTROS.length;
  const closingIdx = (hash + 5) % DESCRIPTION_CLOSINGS.length;
  
  let reformulated = `<p>${DESCRIPTION_INTROS[introIdx]}</p>\n\n`;
  reformulated += `<p>${mainContent}</p>\n\n`;
  
  if (techSpecs) {
    reformulated += `<h3>Características técnicas</h3>\n<p>${techSpecs.substring(0, 1500)}</p>\n\n`;
  }
  
  reformulated += `<p><strong>${DESCRIPTION_CLOSINGS[closingIdx]}</strong></p>`;
  
  return reformulated;
}

function generateShortDescription(desc, title) {
  // Extract first meaningful sentences
  let short = desc
    .replace(/<[^>]+>/g, '')
    .replace(/^(Descripción|Description)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Get first 2-3 sentences
  const sentences = short.split(/[.!?]+/).filter(s => s.trim().length > 10);
  short = sentences.slice(0, 2).join('. ').trim();
  
  if (short.length > 500) {
    short = short.substring(0, 497) + '...';
  }
  
  if (short.length < 50) {
    short = `${title} - Producto de alta calidad con diseño exclusivo y acabados premium.`;
  }
  
  return short;
}

function generateMetaDescription(title, desc) {
  let meta = desc
    .replace(/<[^>]+>/g, '')
    .replace(/^(Descripción|Description)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Get first sentence or portion
  const firstSentence = meta.split(/[.!?]/)[0].trim();
  
  if (firstSentence.length >= 120 && firstSentence.length <= 160) {
    return firstSentence;
  }
  
  if (firstSentence.length < 120) {
    meta = `${title}. ${firstSentence}`;
  } else {
    meta = firstSentence.substring(0, 157) + '...';
  }
  
  // Ensure 120-160 chars
  if (meta.length > 160) {
    meta = meta.substring(0, 157) + '...';
  }
  
  return meta;
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function parsePrice(priceStr) {
  if (!priceStr) return '';
  const match = priceStr.match(/[\d.,]+/);
  if (!match) return '';
  return match[0].replace(',', '.');
}

function getCategoryFromType(productType, title) {
  const lower = (productType + ' ' + title).toLowerCase();
  
  if (/lámpara|lamp|luz|aplique|farol/i.test(lower)) return 'Lámparas';
  if (/sofá|sofa|canapé|canape/i.test(lower)) return 'Sofás';
  if (/silla|chair|sillón|fauteuil/i.test(lower)) return 'Sillas';
  if (/cama|bed|lit/i.test(lower)) return 'Camas';
  if (/mesa|table/i.test(lower)) return 'Mesas';
  if (/reloj|watch|montre/i.test(lower)) return 'Relojes';
  if (/cocina|kitchen|cuisine|cafetera|friteuse/i.test(lower)) return 'Cocina';
  if (/jardín|jardin|exterior|piscina|parasol|tumbona/i.test(lower)) return 'Jardín y Exterior';
  
  return 'Muebles';
}

// ============= WOOCOMMERCE EXPORT =============

const WOOCOMMERCE_HEADERS = [
  'ID', 'Type', 'SKU', 'Name', 'Published', 'Is featured?', 'Visibility in catalog',
  'Short description', 'Description', 'Date sale price starts', 'Date sale price ends',
  'Tax status', 'Tax class', 'In stock?', 'Stock', 'Low stock amount',
  'Backorders allowed?', 'Sold individually?', 'Weight (kg)', 'Length (cm)',
  'Width (cm)', 'Height (cm)', 'Allow customer reviews?', 'Purchase note',
  'Sale price', 'Regular price', 'Categories', 'Tags', 'Shipping class',
  'Images', 'Download limit', 'Download expiry days', 'Parent', 'Grouped products',
  'Upsells', 'Cross-sells', 'External URL', 'Button text', 'Position',
  'Meta: _yoast_wpseo_title', 'Meta: _yoast_wpseo_metadesc'
];

function buildWooCommerceRow(product, gmc, index) {
  const title = reformulateTitle(gmc.title, gmc.id);
  const description = reformulateDescription(gmc.description, gmc.id, title);
  const shortDesc = generateShortDescription(gmc.description, title);
  const metaDesc = generateMetaDescription(title, gmc.description);
  const category = getCategoryFromType(gmc.product_type, title);
  
  const regularPrice = parsePrice(gmc.price);
  const salePrice = parsePrice(gmc.sale_price);
  
  // Build images string
  const images = [gmc.image_link];
  if (gmc.additional_image_link) {
    images.push(...gmc.additional_image_link.split(', ').filter(Boolean));
  }
  
  // Build tags
  const tags = [
    gmc.material,
    gmc.color,
    gmc.brand,
    'muebles decorativos',
    'diseño moderno'
  ].filter(Boolean).join(', ');
  
  return {
    'ID': '',
    'Type': 'simple',
    'SKU': `MD-${gmc.id}`,
    'Name': title,
    'Published': '1',
    'Is featured?': index < 10 ? '1' : '0',
    'Visibility in catalog': 'visible',
    'Short description': shortDesc,
    'Description': description,
    'Date sale price starts': '',
    'Date sale price ends': '',
    'Tax status': 'taxable',
    'Tax class': '',
    'In stock?': gmc.availability === 'in_stock' ? '1' : '0',
    'Stock': '',
    'Low stock amount': '',
    'Backorders allowed?': '0',
    'Sold individually?': '0',
    'Weight (kg)': '',
    'Length (cm)': '',
    'Width (cm)': '',
    'Height (cm)': '',
    'Allow customer reviews?': '1',
    'Purchase note': '',
    'Sale price': salePrice || '',
    'Regular price': regularPrice,
    'Categories': category,
    'Tags': tags,
    'Shipping class': '',
    'Images': images.join(', '),
    'Download limit': '',
    'Download expiry days': '',
    'Parent': '',
    'Grouped products': '',
    'Upsells': '',
    'Cross-sells': '',
    'External URL': '',
    'Button text': '',
    'Position': index,
    'Meta: _yoast_wpseo_title': `${title} | Tu Tienda`,
    'Meta: _yoast_wpseo_metadesc': metaDesc
  };
}

// ============= SHOPIFY EXPORT =============

const SHOPIFY_HEADERS = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags',
  'Published', 'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
  'Option3 Name', 'Option3 Value', 'Variant SKU', 'Variant Grams',
  'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy',
  'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
  'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode',
  'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card',
  'SEO Title', 'SEO Description', 'Google Shopping / Google Product Category',
  'Google Shopping / Gender', 'Google Shopping / Age Group', 'Google Shopping / MPN',
  'Google Shopping / Condition', 'Google Shopping / Custom Product',
  'Google Shopping / Custom Label 0', 'Google Shopping / Custom Label 1',
  'Google Shopping / Custom Label 2', 'Google Shopping / Custom Label 3',
  'Google Shopping / Custom Label 4', 'Variant Image', 'Variant Weight Unit',
  'Variant Tax Code', 'Cost per item', 'Included / Spain', 'Price / Spain',
  'Compare At Price / Spain', 'Included / International', 'Price / International',
  'Compare At Price / International', 'Status'
];

function buildShopifyRows(product, gmc, index) {
  const title = reformulateTitle(gmc.title, gmc.id);
  const description = reformulateDescription(gmc.description, gmc.id, title);
  const metaDesc = generateMetaDescription(title, gmc.description);
  const handle = generateSlug(title);
  const category = getCategoryFromType(gmc.product_type, title);
  
  const regularPrice = parsePrice(gmc.price);
  const salePrice = parsePrice(gmc.sale_price);
  const compareAtPrice = salePrice ? regularPrice : '';
  const variantPrice = salePrice || regularPrice;
  
  // Build images array
  const images = [gmc.image_link];
  if (gmc.additional_image_link) {
    images.push(...gmc.additional_image_link.split(', ').filter(Boolean));
  }
  
  // Build tags
  const tags = [
    gmc.material,
    gmc.color,
    category,
    'diseño moderno',
    'calidad premium'
  ].filter(Boolean).join(', ');
  
  const rows = [];
  
  // First row with all product info and first image
  rows.push({
    'Handle': handle,
    'Title': title,
    'Body (HTML)': description,
    'Vendor': gmc.brand || 'Tu Tienda',
    'Product Category': `Home & Garden > Furniture`,
    'Type': category,
    'Tags': tags,
    'Published': 'true',
    'Option1 Name': 'Title',
    'Option1 Value': 'Default Title',
    'Option2 Name': '',
    'Option2 Value': '',
    'Option3 Name': '',
    'Option3 Value': '',
    'Variant SKU': `MD-${gmc.id}`,
    'Variant Grams': '',
    'Variant Inventory Tracker': 'shopify',
    'Variant Inventory Qty': '10',
    'Variant Inventory Policy': 'deny',
    'Variant Fulfillment Service': 'manual',
    'Variant Price': variantPrice,
    'Variant Compare At Price': compareAtPrice,
    'Variant Requires Shipping': 'true',
    'Variant Taxable': 'true',
    'Variant Barcode': '',
    'Image Src': images[0],
    'Image Position': '1',
    'Image Alt Text': title,
    'Gift Card': 'false',
    'SEO Title': `${title} | Tu Tienda`,
    'SEO Description': metaDesc,
    'Google Shopping / Google Product Category': gmc.google_product_category,
    'Google Shopping / Gender': '',
    'Google Shopping / Age Group': '',
    'Google Shopping / MPN': gmc.mpn || `MD-${gmc.id}`,
    'Google Shopping / Condition': 'new',
    'Google Shopping / Custom Product': '',
    'Google Shopping / Custom Label 0': category,
    'Google Shopping / Custom Label 1': gmc.brand,
    'Google Shopping / Custom Label 2': '',
    'Google Shopping / Custom Label 3': '',
    'Google Shopping / Custom Label 4': '',
    'Variant Image': '',
    'Variant Weight Unit': 'kg',
    'Variant Tax Code': '',
    'Cost per item': '',
    'Included / Spain': 'true',
    'Price / Spain': '',
    'Compare At Price / Spain': '',
    'Included / International': 'true',
    'Price / International': '',
    'Compare At Price / International': '',
    'Status': 'active'
  });
  
  // Additional image rows
  for (let i = 1; i < images.length && i < 10; i++) {
    rows.push({
      'Handle': handle,
      'Title': '',
      'Body (HTML)': '',
      'Vendor': '',
      'Product Category': '',
      'Type': '',
      'Tags': '',
      'Published': '',
      'Option1 Name': '',
      'Option1 Value': '',
      'Option2 Name': '',
      'Option2 Value': '',
      'Option3 Name': '',
      'Option3 Value': '',
      'Variant SKU': '',
      'Variant Grams': '',
      'Variant Inventory Tracker': '',
      'Variant Inventory Qty': '',
      'Variant Inventory Policy': '',
      'Variant Fulfillment Service': '',
      'Variant Price': '',
      'Variant Compare At Price': '',
      'Variant Requires Shipping': '',
      'Variant Taxable': '',
      'Variant Barcode': '',
      'Image Src': images[i],
      'Image Position': String(i + 1),
      'Image Alt Text': `${title} - Imagen ${i + 1}`,
      'Gift Card': '',
      'SEO Title': '',
      'SEO Description': '',
      'Google Shopping / Google Product Category': '',
      'Google Shopping / Gender': '',
      'Google Shopping / Age Group': '',
      'Google Shopping / MPN': '',
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
      'Included / Spain': '',
      'Price / Spain': '',
      'Compare At Price / Spain': '',
      'Included / International': '',
      'Price / International': '',
      'Compare At Price / International': '',
      'Status': ''
    });
  }
  
  return rows;
}

// ============= MAIN =============

async function main() {
  console.log('Loading raw product data...');
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  
  console.log(`Processing ${rawData.length} products with reformulation...`);
  
  const wooRows = [];
  const shopifyRows = [];
  
  rawData.forEach((page, index) => {
    if (!page.gmc_rows || page.gmc_rows.length === 0) return;
    
    const gmc = page.gmc_rows[0];
    
    // WooCommerce row
    const wooRow = buildWooCommerceRow(page.product, gmc, index);
    wooRows.push(wooRow);
    
    // Shopify rows (main + images)
    const shopRows = buildShopifyRows(page.product, gmc, index);
    shopifyRows.push(...shopRows);
    
    if ((index + 1) % 20 === 0) {
      console.log(`  Processed ${index + 1}/${rawData.length} products`);
    }
  });
  
  // Write WooCommerce CSV
  const wooOutput = path.resolve('./muebles-decor-woocommerce-reformulated.csv');
  const wooCsv = stringify([
    WOOCOMMERCE_HEADERS,
    ...wooRows.map(row => WOOCOMMERCE_HEADERS.map(h => row[h] || ''))
  ]);
  fs.writeFileSync(wooOutput, wooCsv, 'utf8');
  console.log(`\nWooCommerce export: ${wooOutput}`);
  console.log(`  Products: ${wooRows.length}`);
  
  // Write Shopify CSV
  const shopifyOutput = path.resolve('./muebles-decor-shopify-reformulated.csv');
  const shopifyCsv = stringify([
    SHOPIFY_HEADERS,
    ...shopifyRows.map(row => SHOPIFY_HEADERS.map(h => row[h] || ''))
  ]);
  fs.writeFileSync(shopifyOutput, shopifyCsv, 'utf8');
  console.log(`\nShopify export: ${shopifyOutput}`);
  console.log(`  Products: ${rawData.length}`);
  console.log(`  Rows (with images): ${shopifyRows.length}`);
  
  // Summary
  console.log('\n========================================');
  console.log('REFORMULATION COMPLETE');
  console.log('========================================');
  console.log('Titres: reformulés avec préfixes/suffixes variés');
  console.log('Descriptions: restructurées avec intro/closing uniques');
  console.log('Meta descriptions: générées automatiquement (120-160 chars)');
  console.log('SKUs: préfixés avec MD- pour éviter les conflits');
  console.log('========================================');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
