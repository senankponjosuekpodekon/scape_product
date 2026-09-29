const fs = require('fs');

const INPUT_FILE = '/home/josue/Téléchargements/websource.txt';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_professional.csv';

// Read file
const content = fs.readFileSync(INPUT_FILE, 'utf-8');

// Extract products
const products = [];
const productSections = content.split(/<!DOCTYPE html>|<!doctype html>/i).filter(s => s.length > 1000);

for (let i = 0; i < productSections.length; i++) {
  const section = productSections[i];
  
  const titleMatch = section.match(/og:title" content="([^"]*)"/);
  let title = titleMatch ? titleMatch[1].replace(/&mdash;|—/g, '-').trim() : '';
  // Remove [Hot Item] prefixes
  title = title.replace(/\[[^\]]*\]\s*/g, '');
  
  const descMatch = section.match(/og:description" content="([^"]*)"/);
  const metaDescMatch = section.match(/name="Description"[^>]*content="([^"]*)"/);
  let description = descMatch ? descMatch[1] : (metaDescMatch ? metaDescMatch[1] : '');
  
  const priceMatch = section.match(/product:price:amount" content="([^"]*)"/);
  const price = priceMatch ? priceMatch[1] : '';
  
  const currencyMatch = section.match(/product:price:currency" content="([^"]*)"/);
  const currency = currencyMatch ? currencyMatch[1] : 'EUR';
  
  const imageMatch = section.match(/og:image" content="([^"]*)"/);
  const image = imageMatch ? imageMatch[1] : '';
  
  const urlMatch = section.match(/og:url" content="([^"]*)"/);
  const url = urlMatch ? urlMatch[1] : '';
  
  const siteMatch = section.match(/og:site_name" content="([^"]*)"/);
  let brand = siteMatch ? siteMatch[1] : '';
  
  // Extract from title if brand not found
  if (!brand && title.includes('-')) {
    brand = title.split('-').pop().trim();
  }
  
  // Clean description
  description = description
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .trim();
  
  if (title && (price || description)) {
    products.push({
      title,
      description,
      price: price || '0.00',
      currency,
      image,
      url,
      brand: brand || 'Container Fachhandel'
    });
  }
}

// Remove duplicates
const uniqueProducts = [];
const seen = new Set();
for (const p of products) {
  if (!seen.has(p.title)) {
    seen.add(p.title);
    uniqueProducts.push(p);
  }
}

// Product data enrichment
const enrichedProducts = uniqueProducts.map((p, idx) => {
  const titleLower = p.title.toLowerCase();
  
  // Determine category and type
  let type = 'Schiffscontainer';
  let googleCategory = 'Business & Industrie > Industrielle Lagerung > Schiffscontainer';
  let tags = [];
  
  if (titleLower.includes('büro') || titleLower.includes('office')) {
    type = 'Bürocontainer';
    googleCategory = 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude > Bürocontainer';
    tags = ['Büro', 'Arbeitscontainer', 'Modulbau'];
  } else if (titleLower.includes('sanitär') || titleLower.includes('wc') || titleLower.includes('toilet')) {
    type = 'Sanitärcontainer';
    googleCategory = 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen';
    tags = ['Sanitär', 'WC', 'Baustelle'];
  } else if (titleLower.includes('kühl') || titleLower.includes('reefer')) {
    type = 'Kühlcontainer';
    googleCategory = 'Business & Industrie > Industrielle Lagerung > Kühlcontainer';
    tags = ['Kühlung', 'Tiefkühl', 'Lebensmittel'];
  } else if (titleLower.includes('20') || titleLower.includes('40')) {
    if (titleLower.includes('high cube') || titleLower.includes('hc')) {
      type = 'High Cube Container';
      tags = ['High Cube', 'HC', 'Extra Höhe'];
    } else if (titleLower.includes('open side')) {
      type = 'Open Side Container';
      tags = ['Open Side', 'Seitenöffnung', 'Vollöffnung'];
    } else if (titleLower.includes('flat rack')) {
      type = 'Flat Rack Container';
      tags = ['Flat Rack', 'Spezialcontainer', 'Übergröße'];
    } else {
      type = titleLower.includes('40') ? '40 Fuß Container' : '20 Fuß Container';
      tags = ['Seecontainer', 'ISO', 'CSC'];
    }
  }
  
  // Create professional HTML description
  let htmlDesc = `<h2>${p.title}</h2>`;
  
  // Add key benefits section
  htmlDesc += `<h3>Produktvorteile</h3><ul>`;
  if (titleLower.includes('neu')) {
    htmlDesc += `<li>Neuware in Premiumqualität</li>`;
  } else if (titleLower.includes('gebraucht')) {
    htmlDesc += `<li>Geprüfte Gebrauchtware - Kostengünstig</li>`;
  }
  htmlDesc += `<li>Wind- und wasserdicht nach ISO-Norm</li>`;
  htmlDesc += `<li>CSC-zertifiziert für den weltweiten Transport</li>`;
  if (type.includes('High Cube')) {
    htmlDesc += `<li>Extra Innenhöhe für maximales Ladevolumen</li>`;
  }
  if (type.includes('Open Side')) {
    htmlDesc += `<li>Seitliche Vollöffnung für einfaches Be- und Entladen</li>`;
  }
  htmlDesc += `<li>Sofort verfügbar - Schnelle Lieferung</li>`;
  htmlDesc += `</ul>`;
  
  // Add original description
  if (p.description && p.description.length > 10) {
    htmlDesc += `<h3>Beschreibung</h3><p>${p.description}</p>`;
  }
  
  // Add specifications placeholder
  htmlDesc += `<h3>Technische Daten</h3>`;
  htmlDesc += `<table>`;
  htmlDesc += `<tr><td><strong>Typ</strong></td><td>${type}</td></tr>`;
  if (titleLower.includes('20')) {
    htmlDesc += `<tr><td><strong>Länge</strong></td><td>ca. 6,06 m (20 Fuß)</td></tr>`;
  } else if (titleLower.includes('40')) {
    htmlDesc += `<tr><td><strong>Länge</strong></td><td>ca. 12,19 m (40 Fuß)</td></tr>`;
  }
  htmlDesc += `<tr><td><strong>Material</strong></td><td>Cortenstahl (wetterfest)</td></tr>`;
  htmlDesc += `<tr><td><strong>Zustand</strong></td><td>${titleLower.includes('neu') ? 'Neu' : (titleLower.includes('gebraucht') ? 'Gebraucht - geprüft' : 'Neu oder gebraucht')}</td></tr>`;
  htmlDesc += `</table>`;
  
  // Add CTA
  htmlDesc += `<p><strong>Jetzt anfragen - Unser Team berät Sie gerne!</strong></p>`;
  
  // Add source link
  if (p.url) {
    htmlDesc += `<p><small>Referenz: <a href="${p.url}" target="_blank" rel="nofollow">Originalquelle</a></small></p>`;
  }
  
  // Create handle
  const handle = p.title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60);
  
  // SEO
  const seoTitle = p.title.substring(0, 70);
  const seoDesc = (p.description || `${type} - Hochwertige Qualität, sofort verfügbar`).substring(0, 160);
  
  // Create SKU
  const sku = `CNT-${String(idx + 1).padStart(3, '0')}-${Math.floor(Math.random() * 1000)}`;
  
  return {
    handle,
    title: p.title.substring(0, 200),
    bodyHtml: htmlDesc,
    vendor: p.brand,
    type,
    tags: tags.join(', '),
    price: p.price,
    currency: p.currency,
    image: p.image,
    seoTitle,
    seoDesc,
    googleCategory,
    sku,
    weight: titleLower.includes('40') ? '3800' : '2200' // Approximate weight in grams (for shipping)
  };
});

// Build CSV
const headers = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
  'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
  'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price',
  'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
  'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card', 'SEO Title',
  'SEO Description', 'Google Product Category', 'Status'
];

const escape = (field) => {
  if (!field) return '';
  const str = String(field).replace(/"/g, '""');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str}"`;
  }
  return str;
};

const rows = [headers.join(',')];

for (const p of enrichedProducts) {
  const row = [
    escape(p.handle),
    escape(p.title),
    escape(p.bodyHtml),
    escape(p.vendor),
    escape(p.type),
    escape(p.tags),
    'true',
    'Title', 'Default Title', '', '',
    escape(p.sku),
    p.weight,
    'shopify', '15', 'deny', 'manual',
    escape(p.price),
    '', // Compare at price
    'true', 'true',
    escape(p.image),
    '1', escape(p.title), 'false',
    escape(p.seoTitle),
    escape(p.seoDesc),
    escape(p.googleCategory),
    'active'
  ];
  rows.push(row.join(','));
}

fs.writeFileSync(OUTPUT_FILE, rows.join('\n'));

console.log(`✅ Professional CSV created: ${OUTPUT_FILE}`);
console.log(`📊 Products: ${enrichedProducts.length}`);
console.log('\n=== Categories ===');
const cats = {};
enrichedProducts.forEach(p => {
  cats[p.type] = (cats[p.type] || 0) + 1;
});
Object.entries(cats).forEach(([cat, count]) => {
  console.log(`  • ${cat}: ${count}`);
});

console.log('\n=== Sample Product ===');
const sample = enrichedProducts[0];
console.log(`Title: ${sample.title}`);
console.log(`Type: ${sample.type}`);
console.log(`Price: ${sample.price} ${sample.currency}`);
console.log(`Google Category: ${sample.googleCategory}`);
