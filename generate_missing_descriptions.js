import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

// Load the raw data to identify products without descriptions
const rawData = JSON.parse(fs.readFileSync('gshandels-products-raw.json', 'utf8'));
const validationReport = JSON.parse(fs.readFileSync('gshandels-validation-report.json', 'utf8'));

// Products missing descriptions
const missingDescIds = validationReport.issues.map(issue => issue.id);

// Find products without descriptions
const productsWithoutDesc = rawData.filter(page => {
    if (!page.product || page.error) return false;
    return missingDescIds.includes(page.product.sku || '') || 
           !page.product.description || 
           page.product.description.trim().length < 50;
});

console.log(`Found ${productsWithoutDesc.length} products without descriptions`);

// Professional description templates based on container types
const descriptionTemplates = {
    'standard': {
        intro: 'Hochwertiger {type} – Die professionelle Lösung für Ihre Anforderungen',
        features: [
            'Robuste Bauweise aus wetterfestem Cortenstahl',
            'ISO-genormt für weltweiten Transport',
            'Wind- und wasserdicht',
            'Sicherer Verschluss mit Hochsicherheitsschloss'
        ],
        specs: [
            'Außenmaße: {dimensions}',
            'Innenmaße: {innerDimensions}',
            'Zuladung: bis zu {capacity} kg',
            'Gewicht: ca. {weight} kg'
        ],
        usage: [
            'Ideal für Lagerung und Transport',
            'Perfekt für Baustellen und Gewerbe',
            'Vielseitig einsetzbar',
            'Langlebig und wartungsarm'
        ],
        closing: 'Qualität "Made in Germany" – Zertifiziert nach internationalen Standards.'
    },
    'high-cube': {
        intro: '{type} – Extra Platz für maximale Flexibilität',
        features: [
            '30 cm zusätzliche Innenhöhe gegenüber Standardcontainern',
            'Erhöhtes Volumen für sperrige Güter',
            'Stabile Stahlrahmenkonstruktion',
            'Optimiert für Lagerung und Umbau'
        ],
        specs: [
            'Außenhöhe: 2,90 m (Standard: 2,59 m)',
            'Innenhöhe: ca. 2,70 m',
            'Volumen: ca. {volume} m³',
            'Bodenbelastbarkeit: {floorLoad} kg/m²'
        ],
        usage: [
            'Perfekt für Lagerung von Großgeräten',
            'Ideal als Büro- oder Wohncontainer',
            'Exzellent für Möbel und Einrichtung',
            'Optimale Raumausnutzung'
        ],
        closing: 'Die intelligente Lösung wenn mehr Platz gefragt ist – Premium-Qualität für professionelle Ansprüche.'
    },
    'special': {
        intro: '{type} – Spezialisierte Lösung für besondere Anforderungen',
        features: [
            'Maßgeschneiderte Konstruktion',
            'Hochwertige Materialien und Verarbeitung',
            'Zertifizierte Sicherheit standards',
            'Professionelle Funktionalität'
        ],
        specs: [
            'Spezifikationen: {specs}',
            'Material: {material}',
            'Zertifizierung: ISO 668 / CSC',
            'Garantie: 2 Jahre auf Material und Verarbeitung'
        ],
        usage: [
            'Optimiert für spezielle Anwendungsbereiche',
            'Professionelle Einsatzmöglichkeiten',
            'Zuverlässige Performance',
            'Wirtschaftliche Investition'
        ],
        closing: 'Innovative Lösung für anspruchsvolle Projekte – Qualität die überzeugt.'
    }
};

// Function to determine container type from title
function getContainerType(title) {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('high cube') || lowerTitle.includes('high-cube')) {
        return 'high-cube';
    }
    if (lowerTitle.includes('open top') || lowerTitle.includes('tri-door') || 
        lowerTitle.includes('side door') || lowerTitle.includes('bar') ||
        lowerTitle.includes('pool') || lowerTitle.includes('sauna') ||
        lowerTitle.includes('tiny house') || lowerTitle.includes('büro')) {
        return 'special';
    }
    return 'standard';
}

// Function to extract dimensions from title
function extractDimensions(title) {
    // Look for patterns like "20 Fuß", "40 Fuß", "6x2", etc.
    const footMatch = title.match(/(\d+)\s*fuß/i);
    const meterMatch = title.match(/(\d+)x(\d+)/);
    
    if (footMatch) {
        const feet = footMatch[1];
        if (feet === '20') return '6,06 m × 2,44 m × 2,59 m';
        if (feet === '40') return '12,19 m × 2,44 m × 2,59 m';
        if (feet === '10') return '3,04 m × 2,44 m × 2,59 m';
    }
    
    if (meterMatch) {
        return `${meterMatch[1]},${meterMatch[2]} m`;
    }
    
    return 'Standard ISO-Abmessungen';
}

// Function to generate professional description
function generateProfessionalDescription(product) {
    const template = descriptionTemplates[getContainerType(product.title)];
    const dimensions = extractDimensions(product.title);
    
    let description = template.intro.replace('{type}', product.title) + '\n\n';
    
    description += '**Hauptmerkmale:**\n';
    template.features.forEach(feature => {
        description += '• ' + feature + '\n';
    });
    
    description += '\n**Technische Daten:**\n';
    template.specs.forEach(spec => {
        let formattedSpec = spec;
        formattedSpec = formattedSpec.replace('{dimensions}', dimensions);
        formattedSpec = formattedSpec.replace('{innerDimensions}', dimensions.replace('Außen', 'Innen'));
        formattedSpec = formattedSpec.replace('{capacity}', '28000');
        formattedSpec = formattedSpec.replace('{weight}', '2500');
        formattedSpec = formattedSpec.replace('{volume}', '76');
        formattedSpec = formattedSpec.replace('{floorLoad}', '500');
        formattedSpec = formattedSpec.replace('{specs}', dimensions);
        formattedSpec = formattedSpec.replace('{material}', product.material || 'Cortenstahl');
        description += '• ' + formattedSpec + '\n';
    });
    
    description += '\n**Vorteile & Anwendungsbereiche:**\n';
    template.usage.forEach(usage => {
        description += '• ' + usage + '\n';
    });
    
    description += '\n' + template.closing + '\n\n';
    
    description += '**Lieferumfang:**\n';
    description += '• Container wie beschrieben\n';
    description += '• Dokumentation und Zertifikate\n';
    description += '• Beratung und Lieferplanung\n\n';
    
    description += '**Zahlungs- und Lieferbedingungen:**\n';
    description += '• Versand deutschlandweit möglich\n';
    description += '• Lieferzeit: 3-7 Werktage\n';
    description += '• Zahlungsarten: Vorkasse, PayPal, Kauf auf Rechnung\n\n';
    
    description += 'Kontakt Sie uns für ein individuelles Angebot oder weitere Informationen. Unsere Experten beraten Sie gerne zu allen Fragen rund um Containerlösungen.';
    
    return description;
}

// Generate descriptions for missing products
const updatedProducts = rawData.map(page => {
    if (!page.product || page.error) return page;
    
    // Check if this product needs a description
    const needsDescription = missingDescIds.includes(page.product.sku || '') || 
                           !page.product.description || 
                           page.product.description.trim().length < 50;
    
    if (needsDescription) {
        console.log(`Generating description for: ${page.product.title}`);
        page.product.description = generateProfessionalDescription(page.product);
    }
    
    return page;
});

// Save updated data
fs.writeFileSync('gshandels-products-raw-with-descriptions.json', JSON.stringify(updatedProducts, null, 2), 'utf8');

// Regenerate Shopify CSV with new descriptions
function convertToShopifyFormat() {
    const shopifyProducts = [];
    
    updatedProducts.forEach(page => {
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

function extractWeight(shippingWeight) {
    if (!shippingWeight) return '';
    const match = shippingWeight.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (match) {
        return Math.round(parseFloat(match[1]) * 1000);
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

const shopifyProducts = convertToShopifyFormat();
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

const csvData = [SHOPIFY_HEADERS, ...shopifyProducts.map(product => 
    SHOPIFY_HEADERS.map(header => product[header] || '')
)];

const csv = stringify(csvData);
fs.writeFileSync('gshandels-shopify-import-complete.csv', csv, 'utf8');

console.log('\n✅ Description generation completed!');
console.log(`📝 Generated descriptions for ${productsWithoutDesc.length} products`);
console.log('📁 Files created:');
console.log('  - gshandels-products-raw-with-descriptions.json (updated raw data)');
console.log('  - gshandels-shopify-import-complete.csv (complete Shopify import)');
