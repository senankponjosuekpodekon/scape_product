const fs = require('fs');
const path = require('path');

const INPUT_FILE = '/home/josue/Téléchargements/products_export_1 (12).csv';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_export_clean.csv';

// Clean description - remove ChatGPT HTML
function cleanDescription(html) {
  if (!html || html.trim() === '') return '';
  
  // Check if it contains ChatGPT interface HTML
  if (html.includes('text-token-text-primary') || 
      html.includes('R6Vx5W_threadScrollVars') ||
      html.includes('data-message-model-slug') ||
      html.includes('data-message-author-role')) {
    
    // Extract clean text content only
    // Remove all div, section with classes
    let cleaned = html
      .replace(/<div[^>]*class="[^"]*(?:text-token|R6Vx5W|markdown|flex|min-h-8)[^"]*"[^>]*>/gi, '')
      .replace(/<\/div>/gi, '')
      .replace(/<section[^>]*class="[^"]*(?:text-token|R6Vx5W)[^"]*"[^>]*>/gi, '')
      .replace(/<\/section>/gi, '')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<div\s+class=[^>]*>/gi, '');
    
    // Remove data attributes
    cleaned = cleaned.replace(/\sdata-[a-z-]+="[^"]*"/g, '');
    cleaned = cleaned.replace(/\sdata-[a-z-]+=[^\s>]*/g, '');
    cleaned = cleaned.replace(/\sdata-[a-z-]+='[^']*'/g, '');
    
    // Remove specific ChatGPT classes but keep content
    cleaned = cleaned.replace(/class="min-h-8 text-message[^"]*"/g, '');
    cleaned = cleaned.replace(/class="flex w-full flex-col gap-1[^"]*"/g, '');
    cleaned = cleaned.replace(/class="markdown prose[^"]*"/g, '');
    cleaned = cleaned.replace(/class="text-base my-auto[^"]*"/g, '');
    cleaned = cleaned.replace(/class="\[--thread-content-max-width[^"]*"/g, '');
    cleaned = cleaned.replace(/class="z-0 flex[^"]*"/g, '');
    cleaned = cleaned.replace(/class="mt-3 w-full[^"]*"/g, '');
    cleaned = cleaned.replace(/class="text-center"[^>]*>[^<]*<br><\/div>/g, '');
    cleaned = cleaned.replace(/class="pointer-events-none[^"]*"/g, '');
    cleaned = cleaned.replace(/class="rah-static[^"]*"/g, '');
    cleaned = cleaned.replace(/class="ulKuLk[^"]*"/g, '');
    cleaned = cleaned.replace(/class="zp8uy2"[^>]*>/g, '');
    cleaned = cleaned.replace(/aria-hidden="[^"]*"/g, '');
    cleaned = cleaned.replace(/tabindex="[^"]*"/g, '');
    cleaned = cleaned.replace(/data-turn-start-message="[^"]*"/g, '');
    cleaned = cleaned.replace(/data-hook="[^"]*"/g, '');
    cleaned = cleaned.replace(/dir="[^"]*"/g, '');
    
    // Clean up empty tags and excessive whitespace
    cleaned = cleaned.replace(/<div\s*>/g, '');
    cleaned = cleaned.replace(/<div>/g, '');
    cleaned = cleaned.replace(/<\/div>/g, '');
    cleaned.replace(/\n\s*\n/g, '\n');
    cleaned = cleaned.replace(/<p><br><\/p>/g, '');
    cleaned = cleaned.replace(/<br><\/div>/g, '');
    cleaned = cleaned.replace(/<div[^>]*\>\s*<br>\s*<\/div>/g, '');
    
    // Remove lines that are just <div ...> with attributes but no content
    cleaned = cleaned.replace(/<div\s[^>]*>\s*<\/div>/g, '');
    
    return cleaned.trim();
  }
  
  return html;
}

// Fix title spelling and case
function fixTitle(title, handle, sku) {
  if (!title) return '';
  
  let fixed = title;
  
  // Fix "M" -> "m" in dimensions
  fixed = fixed.replace(/(\d)\s+M\s+(mit|x)/g, '$1 m $2');
  
  // Fix "urinar" -> "Urinal"
  fixed = fixed.replace(/urinar\b/gi, 'Urinal');
  
  // Fix "abfalltank" -> "Abfalltank" 
  fixed = fixed.replace(/abfalltank\b/gi, 'Abfalltank');
  
  // Fix double "Sanit"
  fixed = fixed.replace(/Sanit\s+Sanitär/gi, 'Sanitär');
  fixed = fixed.replace(/Doppelter\s+Sanit\s+Container/gi, 'Doppelter Sanitärcontainer');
  
  // Fix "weissem" -> "weißem"
  fixed = fixed.replace(/weissem\b/gi, 'weißem');
  
  // Fix X in dimensions
  fixed = fixed.replace(/(\d)\s*X\s*(\d)/g, '$1 x $2');
  
  return fixed;
}

// Properly escape CSV field
function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  
  // If field contains quotes, commas, or newlines, wrap in quotes and double existing quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Parse CSV properly
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

// Main processing
function processCSV() {
  console.log('Reading CSV...');
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
  const typeIndex = headers.indexOf('Type');
  const categoryIndex = headers.indexOf('Product Category');
  
  console.log(`Columns: Title=${titleIndex}, Handle=${handleIndex}, SKU=${skuIndex}, Body=${bodyIndex}, Type=${typeIndex}, Category=${categoryIndex}`);
  
  const processedLines = [];
  const corrections = [];
  const titleMap = new Map(); // Track titles for duplicates
  
  // Add header
  processedLines.push(header);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      processedLines.push(line);
      continue;
    }
    
    const fields = parseCSVLine(line);
    
    // Handle rows with empty title (image rows) - keep as is
    if (!fields[titleIndex] && fields[handleIndex]) {
      processedLines.push(line);
      continue;
    }
    
    if (fields.length < Math.max(titleIndex, handleIndex) + 1) {
      processedLines.push(line);
      continue;
    }
    
    const originalTitle = fields[titleIndex] || '';
    const handle = fields[handleIndex] || '';
    const sku = fields[skuIndex] || '';
    let originalBody = fields[bodyIndex] || '';
    
    // Skip if no title (secondary rows)
    if (!originalTitle && !handle) {
      processedLines.push(line);
      continue;
    }
    if (!originalTitle) {
      processedLines.push(line);
      continue;
    }
    
    // Fix title
    let fixedTitle = fixTitle(originalTitle, handle, sku);
    
    // Check for duplicates and make unique
    const baseTitle = fixedTitle.toLowerCase().trim();
    if (titleMap.has(baseTitle)) {
      const existing = titleMap.get(baseTitle);
      if (sku) {
        fixedTitle = `${fixedTitle} – ${sku}`;
      } else {
        fixedTitle = `${fixedTitle} – ${handle}`;
      }
      corrections.push({
        line: i + 1,
        handle,
        change: `Duplicate title - added suffix`,
        original: originalTitle,
        fixed: fixedTitle
      });
    } else {
      titleMap.set(baseTitle, { handle, sku });
      if (originalTitle !== fixedTitle) {
        corrections.push({
          line: i + 1,
          handle,
          change: `Spelling/case fixed`,
          original: originalTitle,
          fixed: fixedTitle
        });
      }
    }
    
    // Clean body
    let fixedBody = cleanDescription(originalBody);
    if (originalBody !== fixedBody && fixedBody !== originalBody) {
      corrections.push({
        line: i + 1,
        handle,
        change: `Cleaned ChatGPT HTML`,
        original: originalBody.substring(0, 50) + '...',
        fixed: fixedBody.substring(0, 50) + '...'
      });
    }
    
    // Update fields
    fields[titleIndex] = fixedTitle;
    fields[bodyIndex] = fixedBody;
    
    // Rebuild line with proper CSV escaping
    const newLine = fields.map(escapeCSVField).join(',');
    processedLines.push(newLine);
  }
  
  // Write output
  fs.writeFileSync(OUTPUT_FILE, processedLines.join('\n'));
  
  // Print report
  console.log('\n=== CORRECTIONS ===\n');
  corrections.forEach((c, i) => {
    console.log(`${i + 1}. Line ${c.line} (${c.handle})`);
    console.log(`   ${c.change}`);
    if (c.change === 'Spelling/case fixed') {
      console.log(`   "${c.original}" → "${c.fixed}"`);
    }
    console.log('');
  });
  
  console.log(`\nTotal: ${corrections.length} corrections`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`Lines: ${processedLines.length}`);
}

processCSV();
