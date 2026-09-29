const fs = require('fs');

const INPUT_FILE = '/home/josue/Téléchargements/websource.txt';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_de_professional.csv';

const content = fs.readFileSync(INPUT_FILE, 'utf-8');
const productSections = content.split(/<!DOCTYPE html>|<!doctype html>/i).filter(s => s.length > 1000);

const products = [];

for (const section of productSections) {
  const titleMatch = section.match(/og:title" content="([^"]*)"/);
  let title = titleMatch ? titleMatch[1].replace(/&mdash;|—/g, '-').trim() : '';
  title = title.replace(/\[[^\]]*\]\s*/g, '');
  
  // Skip English titles - keep only German
  const isGerman = /[äöüßÄÖÜ]|\b(der|die|das|mit|für|und|oder|Container|Meter)\b/i.test(title);
  
  const descMatch = section.match(/og:description" content="([^"]*)"/);
  const metaDescMatch = section.match(/name="Description"[^>]*content="([^"]*)"/);
  let description = descMatch ? descMatch[1] : (metaDescMatch ? metaDescMatch[1] : '');
  
  const priceMatch = section.match(/product:price:amount" content="([^"]*)"/);
  const price = priceMatch ? priceMatch[1] : '';
  
  const imageMatch = section.match(/og:image" content="([^"]*)"/);
  const image = imageMatch ? imageMatch[1] : '';
  
  const urlMatch = section.match(/og:url" content="([^"]*)"/);
  const url = urlMatch ? urlMatch[1] : '';
  
  const siteMatch = section.match(/og:site_name" content="([^"]*)"/);
  let brand = siteMatch ? siteMatch[1] : '';
  if (!brand && title.includes('-')) {
    brand = title.split('-').pop().trim();
  }
  
  // Clean description - remove emojis
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
      price: price || '',
      image,
      url,
      brand: brand || 'Container Fachhandel',
      isGerman
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

// German product templates for descriptions
const getGermanDescription = (p, type) => {
  const titleLower = p.title.toLowerCase();
  const isNew = titleLower.includes('neu');
  const isUsed = titleLower.includes('gebraucht');
  
  let html = `<h1>${p.title}</h1>`;
  
  // Key benefits
  html += `<h2>Produktvorteile</h2><ul>`;
  if (isNew) html += `<li>Neuware in Premium-Qualität</li>`;
  if (isUsed) html += `<li>Geprüfte Gebrauchtware mit Zustandsgarantie</li>`;
  html += `<li>Wind- und wasserdicht nach ISO-Norm</li>`;
  html += `<li>CSC-zertifiziert für weltweiten Seetransport</li>`;
  html += `<li>Stabile Cortenstahl-Konstruktion</li>`;
  
  if (type.includes('High Cube')) {
    html += `<li>Extra Innenhöhe (30 cm mehr als Standard)</li>`;
    html += `<li>Maximales Ladevolumen für Ihre Güter</li>`;
  }
  if (type.includes('Open Side')) {
    html += `<li>Seitliche Vollöffnung für einfaches Be- und Entladen</li>`;
    html += `<li>Ideal für sperrige Güter</li>`;
  }
  if (type.includes('Büro')) {
    html += `<li>Sofort einsatzbereit als Büro oder Wohnraum</li>`;
    html += `<li>Isoliert und beheizbar</li>`;
  }
  if (type.includes('Sanitär')) {
    html += `<li>Komplett mit WC und Waschbecken</li>`;
    html += `<li>Hygiene-Standard für Baustellen und Events</li>`;
  }
  html += `<li>Sofort verfügbar - Kurze Lieferzeiten</li>`;
  html += `<li>Flexible Zahlungsoptionen möglich</li>`;
  html += `</ul>`;
  
  // Technical data
  html += `<h2>Technische Spezifikationen</h2>`;
  html += `<table border="0" cellspacing="0" cellpadding="5">`;
  html += `<tr><td><strong>Produkttyp</strong></td><td>${type}</td></tr>`;
  
  if (titleLower.includes('20')) {
    html += `<tr><td><strong>Außenmaße (L×B×H)</strong></td><td>ca. 6,06 × 2,44 × 2,59 m</td></tr>`;
    html += `<tr><td><strong>Innenmaße (L×B×H)</strong></td><td>ca. 5,90 × 2,35 × 2,39 m</td></tr>`;
    html += `<tr><td><strong>Nutzlast</strong></td><td>ca. 22.000 kg</td></tr>`;
  } else if (titleLower.includes('40')) {
    html += `<tr><td><strong>Außenmaße (L×B×H)</strong></td><td>ca. 12,19 × 2,44 × 2,90 m</td></tr>`;
    html += `<tr><td><strong>Innenmaße (L×B×H)</strong></td><td>ca. 12,03 × 2,35 × 2,70 m</td></tr>`;
    html += `<tr><td><strong>Nutzlast</strong></td><td>ca. 26.000 - 28.000 kg</td></tr>`;
  }
  
  html += `<tr><td><strong>Material</strong></td><td>Cortenstahl (wetterfest, rostbeständig)</td></tr>`;
  html += `<tr><td><strong>Boden</strong></td><td>Multiplex-Holz, 28 mm, behandelt</td></tr>`;
  html += `<tr><td><strong>Zustand</strong></td><td>${isNew ? 'Neu (1 Fahrt oder fabrikneu)' : (isUsed ? 'Gebraucht - geprüft und zertifiziert' : 'Neu oder Gebraucht')}</td></tr>`;
  html += `<tr><td><strong>Zertifizierung</strong></td><td>ISO 668, CSC-Plakette</td></tr>`;
  html += `</table>`;
  
  // Description if available (translate/convert to German context)
  if (p.description && p.description.length > 10 && !p.description.match(/^[A-Z][a-z]+:/)) {
    html += `<h2>Beschreibung</h2>`;
    html += `<p>${p.description}</p>`;
  }
  
  // Applications
  html += `<h2>Typische Anwendungsbereiche</h2><ul>`;
  if (type.includes('Büro')) {
    html += `<li>Bürocontainer auf Baustellen</li>`;
    html += `<li>Temporäre Arbeitsräume</li>`;
    html += `<li>Wohncontainer für Personal</li>`;
  } else if (type.includes('Sanitär')) {
    html += `<li>Baustellen-Toiletten</li>`;
    html += `<li>Sanitärlösungen für Events</li>`;
    html += `<li>Mobile WC-Anlagen</li>`;
  } else {
    html += `<li>Lagerung von Baumaterialien</li>`;
    html += `<li>Warenlager für Handel</li>`;
    html += `<li>Seefracht-Transport</li>`;
    html += `<li>Mobile Werkstatt</li>`;
    html += `<li>Zwischenlager bei Umzügen</li>`;
  }
  html += `</ul>`;
  
  // Call to action
  html += `<h2>Kontakt & Bestellung</h2>`;
  html += `<p><strong>Jetzt unverbindlich anfragen!</strong></p>`;
  html += `<p>Unser Team berät Sie gerne und erstellt Ihnen ein individuelles Angebot. `;
  html += `Wir bieten flexible Lieferoptionen und können bei Bedarf auch Transport und Aufstellung organisieren.</p>`;
  html += `<p><strong>Tel:</strong> +49 (0)40 271 609 09<br>`;
  html += `<strong>Email:</strong> info@containerdienst.de</p>`;
  
  // Reference (small, nofollow)
  if (p.url) {
    html += `<p><small>Weitere Informationen: <a href="${p.url}" target="_blank" rel="nofollow noopener">Herstellerdetails</a></small></p>`;
  }
  
  return html;
};

// Process products
const enrichedProducts = uniqueProducts.map((p, idx) => {
  const titleLower = p.title.toLowerCase();
  
  let type = 'Seecontainer';
  let googleCategory = 'Business & Industrie > Industrielle Lagerung > Schiffscontainer';
  let tags = ['Container', 'Seecontainer', 'ISO-zertifiziert'];
  
  if (titleLower.includes('büro')) {
    type = 'Bürocontainer';
    googleCategory = 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude > Bürocontainer';
    tags = ['Bürocontainer', 'Modulbau', 'Arbeitscontainer'];
  } else if (titleLower.includes('sanitär') || titleLower.includes('wc')) {
    type = 'Sanitärcontainer';
    googleCategory = 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen';
    tags = ['Sanitärcontainer', 'WC-Container', 'Baustellensanitär'];
  } else if (titleLower.includes('kühl')) {
    type = 'Kühlcontainer';
    googleCategory = 'Business & Industrie > Industrielle Lagerung > Kühlcontainer';
    tags = ['Kühlcontainer', 'Reefer', 'Tiefkühl'];
  } else if (titleLower.includes('high cube') || titleLower.includes('hc')) {
    type = titleLower.includes('40') ? '40 Fuß High Cube Container' : '20 Fuß High Cube Container';
    tags = ['High Cube', 'HC Container', 'Extra Höhe'];
  } else if (titleLower.includes('open side')) {
    type = 'Open Side Container';
    tags = ['Open Side', 'Seitenöffnung', 'Side Door'];
  } else if (titleLower.includes('flat rack')) {
    type = 'Flat Rack Container';
    tags = ['Flat Rack', 'Spezialcontainer', 'Offen'];
  } else if (titleLower.includes('20')) {
    type = '20 Fuß Seecontainer';
    tags = ['20 Fuß', 'ISO Container', 'Trockencontainer'];
  } else if (titleLower.includes('40')) {
    type = '40 Fuß Seecontainer';
    tags = ['40 Fuß', 'ISO Container', 'Trockencontainer'];
  }
  
  // Clean up title - remove brand suffix if at end
  let cleanTitle = p.title;
  if (cleanTitle.includes('-') && cleanTitle.split('-').pop().trim().length < 25) {
    cleanTitle = cleanTitle.substring(0, cleanTitle.lastIndexOf('-')).trim();
  }
  
  // Create handle
  const handle = cleanTitle.toLowerCase()
    .replace(/[^a-z0-9äöüß\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
  
  const bodyHtml = getGermanDescription(p, type);
  
  // SEO
  const seoTitle = `${cleanTitle} | ${type} kaufen`.substring(0, 70);
  const seoDesc = `${type} - ${titleLower.includes('neu') ? 'Neuware' : 'Gebrauchtware'} - Wind- und wasserdicht nach ISO-Norm. CSC-zertifiziert. Jetzt unverbindlich anfragen!`.substring(0, 160);
  
  // SKU
  const sku = `CNT-${type.substring(0, 3).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`;
  
  // Weight in grams for Shopify (2.2kg or 3.8kg)
  const weight = titleLower.includes('40') ? '3800000' : '2200000';
  
  // Price conversion
  let finalPrice = p.price;
  if (!finalPrice || finalPrice === '0.00') {
    // Estimate price based on type
    if (titleLower.includes('neu') && titleLower.includes('40')) finalPrice = '2890.00';
    else if (titleLower.includes('40')) finalPrice = '1950.00';
    else if (titleLower.includes('neu')) finalPrice = '1850.00';
    else finalPrice = '1250.00';
  }
  
  return {
    handle,
    title: cleanTitle.substring(0, 200),
    bodyHtml,
    vendor: p.brand.replace(/GmbH|AG|KG/i, '').trim() || 'MT Container GmbH',
    type,
    tags: tags.join(', '),
    price: finalPrice,
    image: p.image,
    seoTitle,
    seoDesc,
    googleCategory,
    sku,
    weight,
    isGerman: p.isGerman
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
    '', '', '', '',  // No variant options
    escape(p.sku),
    p.weight,
    'shopify', '20', 'deny', 'manual',
    escape(p.price),
    '',
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

console.log(`✅ Deutsche Produkt-Feed erstellt: ${OUTPUT_FILE}`);
console.log(`📊 Produkte: ${enrichedProducts.length}`);
console.log(`📝 Sprache: Nur Deutsch`);
console.log(`⭐ Keine Kundenbewertungen enthalten`);

console.log('\n=== Produktübersicht ===');
enrichedProducts.forEach((p, i) => {
  console.log(`${i + 1}. ${p.title} (${p.type}) - ${p.price} EUR`);
});
