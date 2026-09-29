/**
 * Fix missing descriptions in GSHandels product data
 */

import fs from 'fs';
import path from 'path';

function generateDescriptionFromTitle(title) {
  const descriptions = {
    'container': 'Hochwertiger Container für Lagerung, Transport oder gewerbliche Nutzung. Robuste Bauweise aus wetterfestem Stahl, wind- und wasserdicht nach ISO-Norm. Vielseitig einsetzbar als Lagercontainer, Bürocontainer oder für spezielle Anforderungen.',
    'bürocontainer': 'Moderner Bürocontainer, sofort einsatzbereit als Arbeitsraum. Mit Isolierung, Elektroinstallation und Beleuchtung ausgestattet. Ideal für Baustellenbüros, temporäre Arbeitsplätze oder als Erweiterung bestehender Büroflächen.',
    'wohncontainer': 'Wohncontainer als flexible Wohnlösung. Voll ausgestattet mit Küche, Bad und Schlafräumen. Perfekt für Baustellenpersonal, temporäre Unterkünfte oder als kostengünstige Wohnalternative.',
    'sanitärcontainer': 'Kompletter Sanitärcontainer mit WC, Waschbecken und Dusche. Hygienische Lösung für Baustellen, Events oder temporäre Standorte. Robust, leicht zu reinigen und den geltenden Hygienestandards entsprechend.',
    'pool': 'Hochwertiger Containerpool für Wellness und Erholung. Komplett mit Filtersystem, Heizung und Abdeckung. Einfache Installation und geringer Wartungsaufwand. Perfekt für Hotels, Wellnessbereiche oder private Nutzung.',
    'sauna': 'Luxuriöse Sauna in Containerbauweise. Fertig montiert und sofort betriebsbereit. Mit hochwertigem Saunaofen, Bänken und Steuerung. Ideal für Wellnessanwendungen, Hotels oder private Wellnessbereiche.',
    'barcontainer': 'Stilvoller Barcontainer für Events und Gastronomie. Mit Theke, Lagerflächen und optionaler Kühleinrichtung. Wetterfest und mobil einsetzbar. Perfekt für Festivals, Märkte oder temporäre Gastronomiekonzepte.',
    'kühlcontainer': 'Professioneller Kühlcontainer für temperaturempfindliche Güter. Präzise Temperaturregelung, zuverlässige Kühlung und energieeffizienter Betrieb. Ideal für Lebensmittel, Pharmazeutika oder andere kühlbedürftige Produkte.',
    'flat-rack': 'Spezialcontainer Flat Rack für sperrige und schwere Güter. Offene Bauweise für einfache Beladung von oben und von der Seite. Stapelbar und für internationalen Transport geeignet. Perfekt für Maschinen, Rohre oder überdimensionale Ladung.',
    'open-top': 'Open Top Container mit abnehmbarem Dach. Ermöglicht Beladung von oben mit Kran oder Hebezeugen. Ideal für hohe Güter, Maschinen oder sperrige Ladung. Robuste Stahlkonstruktion und wetterfest.',
    'high-cube': 'High Cube Container mit extra Innenhöhe für mehr Ladevolumen. 30 cm höher als Standardcontainer für voluminöse Güter. Ideal für Möbel, leichte Waren oder wenn zusätzlicher Stauraum benötigt wird.',
    'tiny-house': 'Modernes Tiny House in Containerbauweise. Effiziente Raumausnutzung mit allen Annehmlichkeiten. Nachhaltig, mobil und kostengünstig. Perfekt als minimalistisches Wohnkonzept oder Ferienhaus.',
    'reefer': 'Kühlcontainer (Reefer) für temperaturempfindliche Fracht. Präzise Temperaturregelung von -25°C bis +25°C. Zuverlässig für Lebensmittel, Pharmazeutika oder chemische Produkte. Weltweit einsetzbar.',
    'lagercontainer': 'Robuster Lagercontainer für sichere Aufbewahrung. Wind- und wasserdicht, einbruchsicher und stapelbar. Vielseitig einsetzbar für Baumaterialien, Warenlager oder als Werkstatt. Lange Lebensdauer und wartungsarm.'
  };

  const lowerTitle = title.toLowerCase();
  
  for (const [key, description] of Object.entries(descriptions)) {
    if (lowerTitle.includes(key)) {
      return description;
    }
  }

  return `Hochwertiger ${title} für professionelle Anforderungen. Robuste Bauweise aus wetterfestem Material, konform mit allen geltenden Normen und Standards. Vielseitig einsetzbar und zuverlässig in der täglichen Nutzung.`;
}

function fixMissingDescriptions() {
  const inputFile = './gshandels-google-merchant-feed.csv';
  const outputFile = './gshandels-google-merchant-feed-fixed.csv';
  
  console.log('Reading CSV file...');
  const content = fs.readFileSync(inputFile, 'utf8');
  const lines = content.split('\n');
  
  const headers = lines[0].split(',');
  const titleIndex = headers.indexOf('title');
  const descriptionIndex = headers.indexOf('description');
  
  if (titleIndex === -1 || descriptionIndex === -1) {
    throw new Error('Required columns not found');
  }
  
  let fixedCount = 0;
  const fixedLines = [lines[0]];
  
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
    
    if (fields.length > descriptionIndex && (!fields[descriptionIndex] || fields[descriptionIndex].trim() === '')) {
      const title = fields[titleIndex] || '';
      const generatedDescription = generateDescriptionFromTitle(title);
      fields[descriptionIndex] = generatedDescription;
      fixedCount++;
    }
    
    // Rebuild the line with proper CSV escaping
    const fixedLine = fields.map(field => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return '"' + field.replace(/"/g, '""') + '"';
      }
      return field;
    }).join(',');
    
    fixedLines.push(fixedLine);
  }
  
  fs.writeFileSync(outputFile, fixedLines.join('\n'), 'utf8');
  console.log(`Fixed ${fixedCount} missing descriptions`);
  console.log(`Saved fixed file: ${outputFile}`);
}

function regenerateValidationReport() {
  const csvFile = './gshandels-google-merchant-feed-fixed.csv';
  const reportFile = './gshandels-validation-report-fixed.json';
  
  console.log('Regenerating validation report...');
  const content = fs.readFileSync(csvFile, 'utf8');
  const lines = content.split('\n');
  
  const headers = lines[0].split(',');
  const required = ['id', 'title', 'description', 'link', 'image_link', 'availability', 'price', 'condition'];
  const headerIndices = {};
  
  headers.forEach((header, index) => {
    headerIndices[header] = index;
  });
  
  const issues = [];
  const seen = new Set();
  
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
    
    const id = fields[headerIndices['id']] || '';
    
    for (const field of required) {
      const value = fields[headerIndices[field]] || '';
      if (!value.trim()) {
        issues.push({
          row: i + 1,
          id: id,
          field: field,
          issue: 'missing_required'
        });
      }
    }
    
    if (id && seen.has(id)) {
      issues.push({
        row: i + 1,
        id: id,
        field: 'id',
        issue: 'duplicate_id'
      });
    }
    if (id) seen.add(id);
    
    const title = fields[headerIndices['title']] || '';
    if (title.length > 150) {
      issues.push({
        row: i + 1,
        id: id,
        field: 'title',
        issue: 'over_150_chars'
      });
    }
    
    const description = fields[headerIndices['description']] || '';
    if (description.length > 5000) {
      issues.push({
        row: i + 1,
        id: id,
        field: 'description',
        issue: 'over_5000_chars'
      });
    }
    
    const price = fields[headerIndices['price']] || '';
    if (price && !/^\d+(\.\d{2})?\s+[A-Z]{3}$/.test(price)) {
      issues.push({
        row: i + 1,
        id: id,
        field: 'price',
        issue: 'invalid_price_format'
      });
    }
    
    const imageLink = fields[headerIndices['image_link']] || '';
    if (imageLink && /placeholder/i.test(imageLink)) {
      issues.push({
        row: i + 1,
        id: id,
        field: 'image_link',
        issue: 'placeholder_image'
      });
    }
  }
  
  const report = {
    generated_at: new Date().toISOString(),
    rows: lines.length - 1,
    issue_count: issues.length,
    issues: issues
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Validation report: ${report.rows} rows, ${report.issue_count} issues`);
  console.log(`Saved report: ${reportFile}`);
}

try {
  fixMissingDescriptions();
  regenerateValidationReport();
  console.log('Data fixing completed successfully!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
