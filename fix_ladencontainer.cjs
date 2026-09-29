const fs = require('fs');

const INPUT_FILE = '/home/josue/Projections/scape_product/products_export_google_ready.csv';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_export_FINAL.csv';

const correctDescription = `<h2>40-Fuß Ladencontainer – Imbissstand / Büro / Kiosk</h2> <p>Dieser 40-Fuß-Container (First Voyage) wurde zu einem vielseitigen Ladencontainer umgebaut und eignet sich ideal als Imbissstand, Büro, Verkaufsstand oder Kiosk. Durch seine durchdachte Ausstattung und moderne Optik ist er sofort einsatzbereit für gewerbliche Nutzung.</p> <h3>Abmessungen</h3> <ul> <li>Länge: 12 m</li> <li>Breite: 2,45 m</li> <li>Höhe: 2,60 m</li> </ul> <h3>Öffnungen</h3> <ul> <li>1 × Gasdruckfeder-Markise 2000 × 1200 mm</li> <li>1 × Gasdruckfeder-Markise 3000 × 1200 mm</li> <li>1 × Zugangstür 800 × 2000 mm</li> </ul> <h3>Theken</h3> <ul> <li>1 × Klapptheke 2000 × 300 mm</li> <li>1 × Klapptheke 3000 × 300 mm</li> </ul> <h3>Elektrische Installation</h3> <ul> <li>1 × einreihiger Elektroverteiler</li> <li>3 × wasserdichte LED-Leuchten</li> <li>4 × 16A Steckdosen mit Schutzkontakt</li> <li>1 × Lichtschalter</li> <li>1 × Schnellanschlussdose</li> </ul> <h3>Innenausbau &amp; Isolierung</h3> <ul> <li>40 mm Lebensmittel-Sandwichpaneele (weiß)</li> <li>Vollständige Innenisolierung für ganzjährigen Einsatz</li> </ul> <h3>Außenverarbeitung</h3> <ul> <li>Komplettlackierung in RAL 7016 (Anthrazitgrau)</li> <li>Holzverkleidung rund um den gesamten Container für eine moderne und ansprechende Optik</li> </ul> <p>Ein hochwertiger, sofort einsatzbereiter Verkaufscontainer für Gastronomie, Handel oder mobile Geschäftskonzepte.</p>`;

// Read file
let content = fs.readFileSync(INPUT_FILE, 'utf-8');
const lines = content.split('\n');

// Fix line 3 (index 2)
if (lines[2] && lines[2].startsWith('40-fuss-ladencontainer')) {
  const parts = lines[2].split(',');
  // parts[0] = Handle
  // parts[1] = Title  
  // parts[2] = Body (HTML) - this needs to be replaced
  if (parts.length > 2) {
    parts[2] = '"' + correctDescription.replace(/"/g, '""') + '"';
    lines[2] = parts.join(',');
    console.log('✅ Fixed line 3 (40-fuss-ladencontainer)');
  }
}

// Write output
fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));

console.log(`📄 Output: ${OUTPUT_FILE}`);
console.log(`📊 Total lines: ${lines.length}`);
