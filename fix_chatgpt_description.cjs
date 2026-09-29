const fs = require('fs');

const INPUT_FILE = '/home/josue/Projections/scape_product/products_export_fixed.csv';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_export_final.csv';

// Read file
let content = fs.readFileSync(INPUT_FILE, 'utf-8');
const lines = content.split('\n');

// Find and fix the broken ChatGPT description for "40-fuss-ladencontainer"
const processedLines = [];
let inBrokenProduct = false;
let brokenProductLines = [];
let fixedCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this is the start of the broken product
  if (line.startsWith('40-fuss-ladencontainer-imbissstand-buro-kiosk,40-Fuß Ladencontainer')) {
    inBrokenProduct = true;
    brokenProductLines = [line];
    continue;
  }
  
  // If we're collecting the broken product lines
  if (inBrokenProduct) {
    brokenProductLines.push(line);
    
    // Check if we've reached the end of this product (next product starts or empty line after images)
    if (line.startsWith('sanitarcontainer-4-x-2-m') || 
        (line.trim() === '' && brokenProductLines.length > 10)) {
      inBrokenProduct = false;
      
      // Reconstruct the product with clean description
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
<h3>Innenausbau & Isolierung</h3>
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
      
      // Get the first line (product data) and fix it
      let firstLine = brokenProductLines[0];
      
      // Find and replace the broken description with clean one
      // The description starts after the second comma and goes until the vendor field
      const parts = firstLine.split(',');
      if (parts.length > 2) {
        // Replace the Body (HTML) field (index 2)
        parts[2] = '"' + cleanDescription.replace(/"/g, '""') + '"';
        firstLine = parts.join(',');
        fixedCount++;
      }
      
      processedLines.push(firstLine);
      
      // Add the image rows (lines with empty title but same handle)
      for (let j = 1; j < brokenProductLines.length - 1; j++) {
        if (brokenProductLines[j].startsWith('40-fuss-ladencontainer') || 
            brokenProductLines[j].trim() === '') {
          processedLines.push(brokenProductLines[j]);
        }
      }
      
      // Add the next product line (sanitarcontainer)
      processedLines.push(line);
    }
    continue;
  }
  
  processedLines.push(line);
}

// Write output
fs.writeFileSync(OUTPUT_FILE, processedLines.join('\n'));

console.log(`✅ Fixed ${fixedCount} broken ChatGPT description(s)`);
console.log(`📄 Output: ${OUTPUT_FILE}`);
