const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = '/home/josue/Téléchargements/products_export_1 (12).csv';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_export_fixed.csv';

// Title corrections mapping
const TITLE_CORRECTIONS = {
  // Fix case and spelling errors
  'M': 'm',  // "2,00 x 2,00 M" -> "2,00 x 2,00 m"
  'urinar': 'Urinal',
  'abfalltank': 'Abfalltank',
  'Abfalltank': 'Abfalltank', // ensure consistent
};

// Function to fix common spelling/case issues
function fixSpellingAndCase(title) {
  let corrected = title;
  
  // Fix " X " dimensions (should be lowercase " x ")
  corrected = corrected.replace(/(\d+)\s*X\s*(\d+)/g, '$1 x $2');
  
  // Fix " M " at end of dimensions
  corrected = corrected.replace(/(\d)\s+M\s+mit/g, '$1 m mit');
  corrected = corrected.replace(/(\d)\s+M\s+mit/gi, '$1 m mit');
  
  // Fix "urinar" -> "Urinal"
  corrected = corrected.replace(/urinar\b/gi, 'Urinal');
  
  // Fix "abfalltank" -> "Abfalltank"
  corrected = corrected.replace(/abfalltank\b/gi, 'Abfalltank');
  
  // Fix double "Sanit" -> "Sanitär"
  corrected = corrected.replace(/Sanit\s+Sanitär/gi, 'Sanitär');
  corrected = corrected.replace(/Doppelter\s+Sanit\s+Container/gi, 'Doppelter Sanitärcontainer');
  
  // Fix "weissem" -> "weißem" (optional, German spelling)
  corrected = corrected.replace(/weissem\b/gi, 'weißem');
  
  return corrected;
}

// Function to standardize title case
function toTitleCase(str) {
  // Don't lowercase German nouns that should be capitalized
  const minorWords = ['mit', 'und', 'für', 'den', 'von', 'im', 'bei', 'der', 'die', 'das'];
  
  return str.split(' ').map((word, index) => {
    if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
    if (minorWords.includes(word.toLowerCase())) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// Parse CSV line (handling quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Escape CSV field
function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Main processing function
function processCSV() {
  console.log('Reading CSV file...');
  const content = fs.readFileSync(INPUT_FILE, 'utf-8');
  const lines = content.split('\n');
  
  if (lines.length === 0) {
    console.error('Empty file');
    return;
  }
  
  // Get header
  const header = lines[0];
  const headers = parseCSVLine(header);
  const titleIndex = headers.indexOf('Title');
  const handleIndex = headers.indexOf('Handle');
  const skuIndex = headers.indexOf('Variant SKU');
  const bodyIndex = headers.indexOf('Body (HTML)');
  
  if (titleIndex === -1 || handleIndex === -1) {
    console.error('Required columns not found');
    return;
  }
  
  console.log(`Found columns: Title at ${titleIndex}, Handle at ${handleIndex}, SKU at ${skuIndex}`);
  
  // Track titles for duplicate detection
  const titleCount = {};
  const processedLines = [header];
  const corrections = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const fields = parseCSVLine(line);
    if (fields.length < Math.max(titleIndex, handleIndex) + 1) {
      processedLines.push(line);
      continue;
    }
    
    let title = fields[titleIndex] || '';
    const handle = fields[handleIndex] || '';
    const sku = fields[skuIndex] || '';
    let body = fields[bodyIndex] || '';
    
    const originalTitle = title;
    
    // Skip lines without title (image rows)
    if (!title && !handle) {
      processedLines.push(line);
      continue;
    }
    
    // Skip if no title (secondary image rows)
    if (!title) {
      processedLines.push(line);
      continue;
    }
    
    // Fix spelling and case
    title = fixSpellingAndCase(title);
    
    // Check for duplicates and add SKU if needed
    const baseTitle = title;
    if (titleCount[baseTitle]) {
      // Title exists, append SKU to make unique
      if (sku) {
        title = `${baseTitle} – ${sku}`;
      } else {
        title = `${baseTitle} – ${handle}`;
      }
      corrections.push({
        handle,
        original: originalTitle,
        corrected: title,
        reason: 'Duplicate title - added SKU suffix'
      });
    } else {
      // Check if spelling was corrected
      if (originalTitle !== title) {
        corrections.push({
          handle,
          original: originalTitle,
          corrected: title,
          reason: 'Spelling/case correction'
        });
      }
    }
    
    titleCount[baseTitle] = (titleCount[baseTitle] || 0) + 1;
    
    // Fix broken ChatGPT HTML in description
    if (body.includes('text-token-text-primary') || 
        body.includes('R6Vx5W_threadScrollVars') ||
        body.includes('data-message-model-slug')) {
      // Extract clean text content only
      body = cleanChatGPTHTML(body);
      corrections.push({
        handle,
        original: '[ChatGPT HTML garbage]',
        corrected: '[Cleaned HTML]',
        reason: 'Removed ChatGPT interface HTML'
      });
    }
    
    // Update fields
    fields[titleIndex] = title;
    fields[bodyIndex] = body;
    
    // Rebuild line
    const newLine = fields.map(escapeCSVField).join(',');
    processedLines.push(newLine);
  }
  
  // Write output
  fs.writeFileSync(OUTPUT_FILE, processedLines.join('\n'));
  
  // Print report
  console.log('\n=== CORRECTIONS MADE ===\n');
  corrections.forEach((c, i) => {
    console.log(`${i + 1}. Handle: ${c.handle}`);
    console.log(`   Original: ${c.original}`);
    console.log(`   Corrected: ${c.corrected}`);
    console.log(`   Reason: ${c.reason}`);
    console.log('');
  });
  
  console.log(`\nTotal corrections: ${corrections.length}`);
  console.log(`Output written to: ${OUTPUT_FILE}`);
}

// Clean ChatGPT interface HTML from description
function cleanChatGPTHTML(html) {
  // Remove ChatGPT-specific classes and attributes
  let cleaned = html;
  
  // Remove data attributes
  cleaned = cleaned.replace(/\sdata-[a-z-]+="[^"]*"/g, '');
  
  // Remove ChatGPT CSS classes
  cleaned = cleaned.replace(/\sclass="[^"]*text-token[^"]*"/g, '');
  cleaned = cleaned.replace(/\sclass="[^"]*R6Vx5W[^"]*"/g, '');
  cleaned = cleaned.replace(/\sclass="[^"]*prose[^"]*"/g, ' class="prose"');
  
  // Keep only essential HTML tags (h2, h3, p, ul, li, strong)
  cleaned = cleaned.replace(/<div[^>]*>/g, '');
  cleaned = cleaned.replace(/<\/div>/g, '');
  cleaned = cleaned.replace(/<section[^>]*>/g, '');
  cleaned = cleaned.replace(/<\/section>/g, '');
  
  // Clean up empty tags and excessive whitespace
  cleaned = cleaned.replace(/\n\s*\n/g, '\n');
  cleaned = cleaned.replace(/<p><br><\/p>/g, '');
  
  return cleaned;
}

// Run the script
processCSV();
