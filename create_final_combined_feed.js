import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

// Manually create the 5 pool products from deutsche-boutique data
const poolProducts = [
    {
        'Handle': 'pool-001',
        'Title': 'Container-Spa-Pool 3.0 x 2.5 m mit Whirlpool - Komplettset',
        'Body (HTML)': `<div class="product-description">
  <h1>Container-Spa-Pool 3.0 x 2.5 m mit Whirlpool - Komplettset</h1>
  
  <h2>Premium-Qualitaet fuer deutsche Gaerten</h2>
  <ul>
    <li>Wetterfest und winterfest</li>
    <li>Einfache Selbstmontage</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-gepruefte Sicherheit</li>
    <li>Kostenlose Lieferung nach DE/AT</li>
  </ul>
  
  <h2>Perfekt fuer:</h2>
  <ul>
    <li>Hausgaerten und Terrassen</li>
    <li>Fitness und Erholung</li>
    <li>Familien mit Kindern</li>
    <li>Ganzjaehrige Nutzung</li>
  </ul>
  
  <h2>Technische Daten:</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr><td><strong>Material:</strong></td><td>Stahl-Kunststoff</td></tr>
    <tr><td><strong>Farbe:</strong></td><td>Anthrazit</td></tr>
    <tr><td><strong>Garantie:</strong></td><td>5 Jahre</td></tr>
    <tr><td><strong>Lieferung:</strong></td><td>Kostenlos</td></tr>
  </table>
  
  <p><strong>Hochwertiger Container-Spa-Pool mit integriertem Whirlpool. Perfekt fuer Garten und Terrasse. Inklusive Heizung, Filteranlage und Abdeckung. Einfache Installation, sofort einsatzbereit.</strong></p>
  
  <h2>Unser Service-Paket:</h2>
  <ul>
    <li>Kostenlose Lieferung und Aufbau</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-Zertifizierung</li>
    <li>Deutscher Kundenservice</li>
    <li>30 Tage Rueckgaberecht</li>
  </ul>
</div>`,
        'Vendor': 'GSHandels',
        'Product Category': 'Pools & Spas',
        'Type': 'Container Pool',
        'Tags': 'Pool, Schwimmbad, Garten, Container, Wellness, Fitness, Erholung, Luxus, GSHandels, Stahl Kunststoff, Deutschland, Premium, Qualitaet',
        'Published': 'TRUE',
        'Option1 Name': 'Title',
        'Option1 Value': 'Default Title',
        'Option2 Name': '',
        'Option2 Value': '',
        'Option3 Name': '',
        'Option3 Value': '',
        'SKU': 'pool-001',
        'Grams': '',
        'Weight Unit': '',
        'Inventory Qty': '5',
        'Inventory Policy': 'deny',
        'Fulfillment Service': 'manual',
        'Price': '8999.00',
        'Compare At Price': '',
        'Requires Shipping': 'TRUE',
        'Taxable': 'TRUE',
        'Barcode': '',
        'Image Src': 'https://gshandels.com/wp-content/uploads/2026/02/container-spa-pool-3x2-5.jpg',
        'Image Position': '1',
        'Image Alt Text': 'Container-Spa-Pool 3.0 x 2.5 m mit Whirlpool - Komplettset',
        'Gift Card': 'FALSE',
        'SEO Title': 'Container-Spa-Pool 3.0 x 2.5 m mit Whirlpool - Komplettset | Deutsche Premium-Produkte',
        'SEO Description': 'Hochwertiger Container-Spa-Pool mit integriertem Whirlpool. Perfekt fuer Garten und Terrasse. Inklusive Heizung, Filteranlage und Abdeckung. Einfache Installation, sofort einsatzbereit.',
        'Google Shopping / Google Product Category': '594',
        'Google Shopping / Gender': 'Unisex',
        'Google Shopping / Age Group': 'Adult',
        'Google Shopping / MPN': 'pool-001',
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
    },
    {
        'Handle': 'pool-002',
        'Title': '6.5 m x 2.5 m Polypropylen-Pool mit 4 m Panoramafenster',
        'Body (HTML)': `<div class="product-description">
  <h1>6.5 m x 2.5 m Polypropylen-Pool mit 4 m Panoramafenster</h1>
  
  <h2>Premium-Qualitaet fuer deutsche Gaerten</h2>
  <ul>
    <li>Wetterfest und winterfest</li>
    <li>Einfache Selbstmontage</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-gepruefte Sicherheit</li>
    <li>Kostenlose Lieferung nach DE/AT</li>
  </ul>
  
  <h2>Technische Daten:</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr><td><strong>Material:</strong></td><td>Polypropylen</td></tr>
    <tr><td><strong>Farbe:</strong></td><td>Blau</td></tr>
    <tr><td><strong>Garantie:</strong></td><td>5 Jahre</td></tr>
  </table>
  
  <p><strong>Grosser Polypropylen-Pool mit beeindruckendem 4-Meter-Panoramafenster. Langlebiges Material, einfache Wartung. Ideal fuer Schwimmer und Entspannung. Komplett mit Pumpe und Filter.</strong></p>
  
  <h2>Unser Service-Paket:</h2>
  <ul>
    <li>Kostenlose Lieferung und Aufbau</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-Zertifizierung</li>
    <li>Deutscher Kundenservice</li>
    <li>30 Tage Rueckgaberecht</li>
  </ul>
</div>`,
        'Vendor': 'GSHandels',
        'Product Category': 'Pools & Spas',
        'Type': 'Pool',
        'Tags': 'Pool, Schwimmbad, Garten, Container, Wellness, Fitness, Erholung, Luxus, GSHandels, Polypropylen, Deutschland, Premium, Qualitaet',
        'Published': 'TRUE',
        'Option1 Name': 'Title',
        'Option1 Value': 'Default Title',
        'Option2 Name': '',
        'Option2 Value': '',
        'Option3 Name': '',
        'Option3 Value': '',
        'SKU': 'pool-002',
        'Grams': '',
        'Weight Unit': '',
        'Inventory Qty': '5',
        'Inventory Policy': 'deny',
        'Fulfillment Service': 'manual',
        'Price': '12999.00',
        'Compare At Price': '',
        'Requires Shipping': 'TRUE',
        'Taxable': 'TRUE',
        'Barcode': '',
        'Image Src': 'https://gshandels.com/wp-content/uploads/2026/02/polypropylen-pool-6-5x2-5.jpg',
        'Image Position': '1',
        'Image Alt Text': '6.5 m x 2.5 m Polypropylen-Pool mit 4 m Panoramafenster',
        'Gift Card': 'FALSE',
        'SEO Title': '6.5 m x 2.5 m Polypropylen-Pool mit 4 m Panoramafenster | Deutsche Premium-Produkte',
        'SEO Description': 'Grosser Polypropylen-Pool mit beeindruckendem 4-Meter-Panoramafenster. Langlebiges Material, einfache Wartung. Ideal fuer Schwimmer und Entspannung. Komplett mit Pumpe und Filter.',
        'Google Shopping / Google Product Category': '594',
        'Google Shopping / Gender': 'Unisex',
        'Google Shopping / Age Group': 'Adult',
        'Google Shopping / MPN': 'pool-002',
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
    },
    {
        'Handle': 'pool-003',
        'Title': 'Containerbecken 6.2 x 2.5 m mit Jet Swim Gegenstromanlage',
        'Body (HTML)': `<div class="product-description">
  <h1>Containerbecken 6.2 x 2.5 m mit Jet Swim Gegenstromanlage</h1>
  
  <h2>Premium-Qualitaet fuer deutsche Gaerten</h2>
  <ul>
    <li>Wetterfest und winterfest</li>
    <li>Einfache Selbstmontage</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-gepruefte Sicherheit</li>
    <li>Kostenlose Lieferung nach DE/AT</li>
  </ul>
  
  <h2>Technische Daten:</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr><td><strong>Material:</strong></td><td>Stahl-Fiberglas</td></tr>
    <tr><td><strong>Farbe:</strong></td><td>Grau</td></tr>
    <tr><td><strong>Garantie:</strong></td><td>5 Jahre</td></tr>
  </table>
  
  <p><strong>Modernes Containerbecken mit Jet Swim Gegenstromanlage. Perfekt fuer Fitness-Schwimmen auf kleinem Raum. Hochwertige Verarbeitung und einfache Installation.</strong></p>
  
  <h2>Unser Service-Paket:</h2>
  <ul>
    <li>Kostenlose Lieferung und Aufbau</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-Zertifizierung</li>
    <li>Deutscher Kundenservice</li>
    <li>30 Tage Rueckgaberecht</li>
  </ul>
</div>`,
        'Vendor': 'GSHandels',
        'Product Category': 'Pools & Spas',
        'Type': 'Container Pool',
        'Tags': 'Pool, Schwimmbad, Garten, Container, Wellness, Fitness, Erholung, Luxus, GSHandels, Stahl Fiberglas, Deutschland, Premium, Qualitaet',
        'Published': 'TRUE',
        'Option1 Name': 'Title',
        'Option1 Value': 'Default Title',
        'Option2 Name': '',
        'Option2 Value': '',
        'Option3 Name': '',
        'Option3 Value': '',
        'SKU': 'pool-003',
        'Grams': '',
        'Weight Unit': '',
        'Inventory Qty': '5',
        'Inventory Policy': 'deny',
        'Fulfillment Service': 'manual',
        'Price': '15999.00',
        'Compare At Price': '',
        'Requires Shipping': 'TRUE',
        'Taxable': 'TRUE',
        'Barcode': '',
        'Image Src': 'https://gshandels.com/wp-content/uploads/2026/02/containerbecken-jet-swim.jpg',
        'Image Position': '1',
        'Image Alt Text': 'Containerbecken 6.2 x 2.5 m mit Jet Swim Gegenstromanlage',
        'Gift Card': 'FALSE',
        'SEO Title': 'Containerbecken 6.2 x 2.5 m mit Jet Swim Gegenstromanlage | Deutsche Premium-Produkte',
        'SEO Description': 'Modernes Containerbecken mit Jet Swim Gegenstromanlage. Perfekt fuer Fitness-Schwimmen auf kleinem Raum. Hochwertige Verarbeitung und einfache Installation.',
        'Google Shopping / Google Product Category': '594',
        'Google Shopping / Gender': 'Unisex',
        'Google Shopping / Age Group': 'Adult',
        'Google Shopping / MPN': 'pool-003',
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
    },
    {
        'Handle': 'pool-004',
        'Title': 'Luxus-Poolcontainer 8.0 x 3.0 m mit Überdachung',
        'Body (HTML)': `<div class="product-description">
  <h1>Luxus-Poolcontainer 8.0 x 3.0 m mit Überdachung</h1>
  
  <h2>Premium-Qualitaet fuer deutsche Gaerten</h2>
  <ul>
    <li>Wetterfest und winterfest</li>
    <li>Einfache Selbstmontage</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-gepruefte Sicherheit</li>
    <li>Kostenlose Lieferung nach DE/AT</li>
  </ul>
  
  <h2>Technische Daten:</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr><td><strong>Material:</strong></td><td>Stahl-Verblendung</td></tr>
    <tr><td><strong>Farbe:</strong></td><td>Weiss</td></tr>
    <tr><td><strong>Garantie:</strong></td><td>5 Jahre</td></tr>
  </table>
  
  <p><strong>Grosser Luxus-Poolcontainer mit integrierter Überdachung. Premium-Ausstattung mit Whirlpool, Gegenstromanlage und LED-Beleuchtung. Ideal fuer anspruchsvolle Kunden.</strong></p>
  
  <h2>Unser Service-Paket:</h2>
  <ul>
    <li>Kostenlose Lieferung und Aufbau</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-Zertifizierung</li>
    <li>Deutscher Kundenservice</li>
    <li>30 Tage Rueckgaberecht</li>
  </ul>
</div>`,
        'Vendor': 'GSHandels',
        'Product Category': 'Pools & Spas',
        'Type': 'Container Pool',
        'Tags': 'Pool, Schwimmbad, Garten, Container, Wellness, Fitness, Erholung, Luxus, GSHandels, Stahl Verblendung, Deutschland, Premium, Qualitaet',
        'Published': 'TRUE',
        'Option1 Name': 'Title',
        'Option1 Value': 'Default Title',
        'Option2 Name': '',
        'Option2 Value': '',
        'Option3 Name': '',
        'Option3 Value': '',
        'SKU': 'pool-004',
        'Grams': '',
        'Weight Unit': '',
        'Inventory Qty': '5',
        'Inventory Policy': 'deny',
        'Fulfillment Service': 'manual',
        'Price': '24999.00',
        'Compare At Price': '',
        'Requires Shipping': 'TRUE',
        'Taxable': 'TRUE',
        'Barcode': '',
        'Image Src': 'https://gshandels.com/wp-content/uploads/2026/02/luxus-poolcontainer-8x3.jpg',
        'Image Position': '1',
        'Image Alt Text': 'Luxus-Poolcontainer 8.0 x 3.0 m mit Überdachung',
        'Gift Card': 'FALSE',
        'SEO Title': 'Luxus-Poolcontainer 8.0 x 3.0 m mit Überdachung | Deutsche Premium-Produkte',
        'SEO Description': 'Grosser Luxus-Poolcontainer mit integrierter Überdachung. Premium-Ausstattung mit Whirlpool, Gegenstromanlage und LED-Beleuchtung. Ideal fuer anspruchsvolle Kunden.',
        'Google Shopping / Google Product Category': '594',
        'Google Shopping / Gender': 'Unisex',
        'Google Shopping / Age Group': 'Adult',
        'Google Shopping / MPN': 'pool-004',
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
    },
    {
        'Handle': 'pool-005',
        'Title': 'Kompakt-Pool 4.0 x 2.0 m für kleine Gärten',
        'Body (HTML)': `<div class="product-description">
  <h1>Kompakt-Pool 4.0 x 2.0 m für kleine Gärten</h1>
  
  <h2>Premium-Qualitaet fuer deutsche Gaerten</h2>
  <ul>
    <li>Wetterfest und winterfest</li>
    <li>Einfache Selbstmontage</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-gepruefte Sicherheit</li>
    <li>Kostenlose Lieferung nach DE/AT</li>
  </ul>
  
  <h2>Technische Daten:</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr><td><strong>Material:</strong></td><td>GFK-Fiberglas</td></tr>
    <tr><td><strong>Farbe:</strong></td><td>Türkis</td></tr>
    <tr><td><strong>Garantie:</strong></td><td>5 Jahre</td></tr>
  </table>
  
  <p><strong>Kompakter Pool für kleine Gärten und Terrassen. Hochwertiges GFK-Material, einfache Installation und geringer Platzbedarf. Perfekt fuer Familien und Wellness.</strong></p>
  
  <h2>Unser Service-Paket:</h2>
  <ul>
    <li>Kostenlose Lieferung und Aufbau</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-Zertifizierung</li>
    <li>Deutscher Kundenservice</li>
    <li>30 Tage Rueckgaberecht</li>
  </ul>
</div>`,
        'Vendor': 'GSHandels',
        'Product Category': 'Pools & Spas',
        'Type': 'Pool',
        'Tags': 'Pool, Schwimmbad, Garten, Container, Wellness, Fitness, Erholung, Luxus, GSHandels, GFK Fiberglas, Deutschland, Premium, Qualitaet',
        'Published': 'TRUE',
        'Option1 Name': 'Title',
        'Option1 Value': 'Default Title',
        'Option2 Name': '',
        'Option2 Value': '',
        'Option3 Name': '',
        'Option3 Value': '',
        'SKU': 'pool-005',
        'Grams': '',
        'Weight Unit': '',
        'Inventory Qty': '5',
        'Inventory Policy': 'deny',
        'Fulfillment Service': 'manual',
        'Price': '6999.00',
        'Compare At Price': '',
        'Requires Shipping': 'TRUE',
        'Taxable': 'TRUE',
        'Barcode': '',
        'Image Src': 'https://gshandels.com/wp-content/uploads/2026/02/kompakt-pool-4x2.jpg',
        'Image Position': '1',
        'Image Alt Text': 'Kompakt-Pool 4.0 x 2.0 m für kleine Gärten',
        'Gift Card': 'FALSE',
        'SEO Title': 'Kompakt-Pool 4.0 x 2.0 m für kleine Gärten | Deutsche Premium-Produkte',
        'SEO Description': 'Kompakter Pool für kleine Gärten und Terrassen. Hochwertiges GFK-Material, einfache Installation und geringer Platzbedarf. Perfekt fuer Familien und Wellness.',
        'Google Shopping / Google Product Category': '594',
        'Google Shopping / Gender': 'Unisex',
        'Google Shopping / Age Group': 'Adult',
        'Google Shopping / MPN': 'pool-005',
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
    }
];

// Read vanducheval data and get first 5 products
const vanduchevalData = fs.readFileSync('vanducheval-shopify-import.csv', 'utf8');

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

const vanducheval = parseCSV(vanduchevalData);
const vanduchevalProducts = vanducheval.products
    .filter(product => product.Title && product.Title.trim() !== '')
    .slice(0, 5);

// Combine all products
const allProducts = [...poolProducts, ...vanduchevalProducts];

// Define the final headers (Shopify format)
const finalHeaders = [
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

// Normalize vanducheval products to match the headers
const normalizedVanducheval = vanduchevalProducts.map(product => {
    const normalized = {};
    finalHeaders.forEach(header => {
        normalized[header] = product[header] || '';
    });
    
    // Set defaults for vanducheval products
    if (!normalized['Product Category']) normalized['Product Category'] = 'Trailers & Vehicle Parts';
    if (!normalized.Published) normalized.Published = 'TRUE';
    if (!normalized['Option1 Name']) {
        normalized['Option1 Name'] = 'Title';
        normalized['Option1 Value'] = 'Default Title';
    }
    if (!normalized['Inventory Qty']) normalized['Inventory Qty'] = '1';
    if (!normalized['Inventory Policy']) normalized['Inventory Policy'] = 'deny';
    if (!normalized['Fulfillment Service']) normalized['Fulfillment Service'] = 'manual';
    if (!normalized['Requires Shipping']) normalized['Requires Shipping'] = 'TRUE';
    if (!normalized.Taxable) normalized.Taxable = 'TRUE';
    if (!normalized['Gift Card']) normalized['Gift Card'] = 'FALSE';
    if (!normalized['Google Shopping / Google Product Category']) normalized['Google Shopping / Google Product Category'] = '972';
    if (!normalized['Google Shopping / Gender']) normalized['Google Shopping / Gender'] = 'Unisex';
    if (!normalized['Google Shopping / Age Group']) normalized['Google Shopping / Age Group'] = 'Adult';
    if (!normalized['Google Shopping / Condition']) normalized['Google Shopping / Condition'] = 'new';
    if (!normalized.Status) normalized.Status = 'active';
    
    return normalized;
});

// Final combined products
const finalProducts = [...poolProducts, ...normalizedVanducheval];

// Create CSV
const csvData = [finalHeaders, ...finalProducts.map(product => 
    finalHeaders.map(header => product[header] || '')
)];

const csv = stringify(csvData);

// Write files
fs.writeFileSync('final-combined-shopify-feed.csv', csv, 'utf8');

// Create summary
const summary = {
    generated_at: new Date().toISOString(),
    total_products: finalProducts.length,
    pool_products: poolProducts.length,
    vanducheval_products: normalizedVanducheval.length,
    products: finalProducts.map(product => ({
        handle: product.Handle,
        title: product.Title,
        vendor: product.Vendor,
        type: product.Type,
        price: product.Price,
        category: product['Product Category']
    }))
};

fs.writeFileSync('final-combined-feed-summary.json', JSON.stringify(summary, null, 2), 'utf8');

console.log('✅ Final combined feed created successfully!');
console.log(`📊 Total products: ${finalProducts.length}`);
console.log(`🏊 Pool products: ${poolProducts.length}`);
console.log(`🐴 VanDuCheval products: ${normalizedVanducheval.length}`);
console.log(`📁 Files created:`);
console.log(`  - final-combined-shopify-feed.csv`);
console.log(`  - final-combined-feed-summary.json`);

// Display product list
console.log('\n📋 Product List:');
finalProducts.forEach((product, index) => {
    const isPool = product.Handle.startsWith('pool-') ? '🏊' : '🐴';
    console.log(`${index + 1}. ${isPool} ${product.Title} (${product.Vendor}) - ${product.Price}`);
});
