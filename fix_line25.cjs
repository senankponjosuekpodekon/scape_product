const fs = require('fs');

const INPUT_FILE = '/home/josue/Projections/scape_product/products_export_clean.csv';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_export_ready.csv';

// Read the entire file
let content = fs.readFileSync(INPUT_FILE, 'utf-8');

// Find and extract the problematic product section
// The product "40-fuss-ladencontainer" has a broken multi-line description

// Pattern to find the start of this product
const productStart = '40-fuss-ladencontainer-imbissstand-buro-kiosk,40-Fuß Ladencontainer';
const productEnd = 'sanitarcontainer-4-x-2-m-mit-dusche-und-doppel-wc';

// Find positions
const startIdx = content.indexOf(productStart);
const endIdx = content.indexOf(productEnd);

if (startIdx === -1) {
  console.log('Product not found, copying file as-is');
  fs.copyFileSync(INPUT_FILE, OUTPUT_FILE);
  process.exit(0);
}

console.log(`Found product at position ${startIdx}, ends at ${endIdx}`);

// Extract the problematic section
const beforeProduct = content.substring(0, startIdx);
const productSection = content.substring(startIdx, endIdx);
const afterProduct = content.substring(endIdx);

// Clean the product section - remove all ChatGPT divs and keep only clean HTML
let cleanedSection = productSection;

// Replace the entire broken description with a clean one
const cleanDescription = `<h2>40-Fuß Ladencontainer – Imbissstand / Büro / Kiosk</h2>
<p>Dieser 40-Fuß-Container (First Voyage) wurde zu einem vielseitigen Ladencontainer umgebaut und eignet sich ideal als Imbissstand, Büro, Verkaufsstand oder Kiosk. Durch seine durchdachte Ausstattung und moderne Optik ist er sofort einsatzbereit für gewerbliche Nutzung.</p>
<h3>Abmessungen</h3>
<ul>
<li>Länge: 12 m</li>
<li>Breite: 2,45 m</li>
<li>Höhe: 2,60 m</li>
</ul>
<h3>Öffnungen</h3>
<ul>
<li>1 × Gasdruckfeder-Markise 2000 × 1200 mm</li>
<li>1 × Gasdruckfeder-Markise 3000 × 1200 mm</li>
<li>1 × Zugangstür 800 × 2000 mm</li>
</ul>
<h3>Theken</h3>
<ul>
<li>1 × Klapptheke 2000 × 300 mm</li>
<li>1 × Klapptheke 3000 × 300 mm</li>
</ul>
<h3>Elektrische Installation</h3>
<ul>
<li>1 × einreihiger Elektroverteiler</li>
<li>3 × wasserdichte LED-Leuchten</li>
<li>4 × 16A Steckdosen mit Schutzkontakt</li>
<li>1 × Lichtschalter</li>
<li>1 × Schnellanschlussdose</li>
</ul>
<h3>Innenausbau &amp; Isolierung</h3>
<ul>
<li>40 mm Lebensmittel-Sandwichpaneele (weiß)</li>
<li>Vollständige Innenisolierung für ganzjährigen Einsatz</li>
</ul>
<h3>Außenverarbeitung</h3>
<ul>
<li>Komplettlackierung in RAL 7016 (Anthrazitgrau)</li>
<li>Holzverkleidung rund um den gesamten Container für eine moderne und ansprechende Optik</li>
</ul>
<p>Ein hochwertiger, sofort einsatzbereiter Verkaufscontainer für Gastronomie, Handel oder mobile Geschäftskonzepte.</p>`;

// Find where the description starts (after the second comma) and ends (before "Containerdienst")
const firstComma = productSection.indexOf(',');
const secondComma = productSection.indexOf(',', firstComma + 1);
const vendorStart = productSection.indexOf('Containerdienst ASL GmbH');

if (secondComma !== -1 && vendorStart !== -1) {
  // Replace the description part
  const beforeDesc = productSection.substring(0, secondComma + 1);
  const afterDesc = productSection.substring(vendorStart);
  
  // Escape quotes for CSV
  const escapedDesc = '"' + cleanDescription.replace(/"/g, '""') + '"';
  
  cleanedSection = beforeDesc + escapedDesc + afterDesc;
  
  console.log('Description replaced successfully');
}

// Write the new file
const finalContent = beforeProduct + cleanedSection + afterProduct;
fs.writeFileSync(OUTPUT_FILE, finalContent);

console.log(`✅ File saved: ${OUTPUT_FILE}`);
console.log(`📊 Size: ${finalContent.length} characters`);
