const fs = require('fs');
const path = require('path');

const INPUT_FILE = '/home/josue/Téléchargements/products_export_1 (12).csv';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_export_google_ready.csv';

// Google Merchant Center recommended product types for containers
const GOOGLE_PRODUCT_TYPES = {
  'Containeranhänger': 'Fahrzeuge & Teile > Fahrzeuganhänger & Zubehör > Nutzfahrzeuganhänger',
  'Container BAR/CAFÉ': 'Business & Industrie > Gastronomie > Food Trucks & Imbissstände',
  'Sanitärcontainer': 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen',
  'SANITÄREINHEIT': 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen',
  'SANITÄRCONTAINER': 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen',
  'SANITÄRCONTAINER - MINI-TOILETTE': 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen',
  'Bürocontainer': 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude > Bürocontainer',
  'BÜROCONTAINER': 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude > Bürocontainer',
  'Bürocontainer mit WC': 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude > Bürocontainer',
  'Wohncontainer': 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude > Wohncontainer',
  'Lagercontainer': 'Business & Industrie > Industrielle Lagerung > Schiffscontainer',
  '20 Fuß Container': 'Business & Industrie > Industrielle Lagerung > Schiffscontainer',
  '40 Fuß Container': 'Business & Industrie > Industrielle Lagerung > Schiffscontainer',
  'High Cube Container': 'Business & Industrie > Industrielle Lagerung > Schiffscontainer',
  'Open Side Container': 'Business & Industrie > Industrielle Lagerung > Schiffscontainer',
  'Reefer Container': 'Business & Industrie > Industrielle Lagerung > Kühlcontainer',
  'Trockencontainer': 'Business & Industrie > Industrielle Lagerung > Schiffscontainer',
  'Kühlcontainer': 'Business & Industrie > Industrielle Lagerung > Kühlcontainer',
  'Modulcontainer': 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude',
  'SANITÄRBLOCK': 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen',
  'DUSCHCONTAINER': 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen',
  'SCHULCONTAINER': 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude > Spezialcontainer',
  'VERKAUFSCONTAINER': 'Business & Industrie > Gastronomie > Verkaufsstände & Märkte',
  'LAGERCONTAINER': 'Business & Industrie > Industrielle Lagerung > Schiffscontainer',
  'KÜHLCONTAINER': 'Business & Industrie > Industrielle Lagerung > Kühlcontainer',
};

// Clean description - remove ChatGPT HTML
function cleanDescription(html) {
  if (!html || html.trim() === '') return '';
  
  // Check if it contains ChatGPT interface HTML
  if (html.includes('text-token-text-primary') || 
      html.includes('R6Vx5W_threadScrollVars') ||
      html.includes('data-message-model-slug') ||
      html.includes('data-message-author-role')) {
    
    // Extract only the clean text content between actual HTML tags we want to keep
    // Remove all ChatGPT divs and interface elements
    let cleaned = html
      .replace(/<div[^>]*class="[^"]*(?:text-token|R6Vx5W|markdown|flex|min-h-8|agent-turn)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<section[^>]*class="[^"]*(?:text-token|R6Vx5W)[^"]*"[^>]*>[\s\S]*?<\/section>/gi, '')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '');
    
    // Remove data attributes
    cleaned = cleaned.replace(/\sdata-[a-z-]+="[^"]*"/g, '');
    cleaned = cleaned.replace(/\sdata-[a-z-]+=[^\s>]*/g, '');
    
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
    
    // Clean up
    cleaned = cleaned.replace(/<div\s*>/g, '');
    cleaned = cleaned.replace(/<div>/g, '');
    cleaned.replace(/\n\s*\n/g, '\n');
    cleaned = cleaned.replace(/<p><br><\/p>/g, '');
    cleaned = cleaned.replace(/<br><\/div>/g, '');
    
    return cleaned.trim();
  }
  
  // Remove data attributes from all HTML
  let cleaned = html.replace(/\sdata-[a-z-]+="[^"]*"/g, '');
  cleaned = cleaned.replace(/\sdata-[a-z-]+=[^\s>]*/g, '');
  
  return cleaned;
}

// Fix title
function fixTitle(title) {
  if (!title) return '';
  
  let fixed = title;
  
  // Fix case issues
  fixed = fixed.replace(/(\d)\s+M\s+(mit|x)/g, '$1 m $2');
  fixed = fixed.replace(/urinar\b/gi, 'Urinal');
  fixed = fixed.replace(/abfalltank\b/gi, 'Abfalltank');
  fixed = fixed.replace(/Sanit\s+Sanitär/gi, 'Sanitär');
  fixed = fixed.replace(/Doppelter\s+Sanit\s+Container/gi, 'Doppelter Sanitärcontainer');
  fixed = fixed.replace(/weissem\b/gi, 'weißem');
  fixed = fixed.replace(/(\d)\s*X\s*(\d)/g, '$1 x $2');
  
  return fixed;
}

// Escape CSV field
function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // Replace newlines with spaces to keep CSV flat
  const flatStr = str.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ');
  
  if (flatStr.includes(',') || flatStr.includes('"') || flatStr.includes('\n')) {
    return '"' + flatStr.replace(/"/g, '""') + '"';
  }
  return flatStr;
}

// Read CSV properly handling multi-line fields
function readCSV(filename) {
  const content = fs.readFileSync(filename, 'utf-8');
  const lines = content.split('\n');
  
  const records = [];
  let currentRecord = '';
  let inQuotes = false;
  let quoteCount = 0;
  
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        quoteCount++;
        if (quoteCount % 2 === 0) {
          // Even number of quotes - we're exiting a quoted section
          inQuotes = false;
        } else {
          // Odd number of quotes - entering or inside quoted section
          inQuotes = true;
        }
      }
      currentRecord += char;
    }
    
    if (!inQuotes) {
      // End of record
      if (currentRecord.trim()) {
        records.push(currentRecord);
      }
      currentRecord = '';
      quoteCount = 0;
    } else {
      // Still in quoted field, add newline
      currentRecord += '\n';
    }
  }
  
  // Add last record if exists
  if (currentRecord.trim()) {
    records.push(currentRecord);
  }
  
  return records;
}

// Parse single CSV line
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
        i++;
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

// Get Google Product Type
function getGoogleProductType(shopifyType, shopifyCategory) {
  // First try to match by Shopify Type
  if (shopifyType && GOOGLE_PRODUCT_TYPES[shopifyType]) {
    return GOOGLE_PRODUCT_TYPES[shopifyType];
  }
  
  // Try to infer from category
  if (shopifyCategory) {
    if (shopifyCategory.includes('Sanitär') || shopifyCategory.includes('Toilet')) {
      return 'Business & Industrie > Baugewerbe > Baustellenausstattung > Mobile Sanitäranlagen';
    }
    if (shopifyCategory.includes('Büro') || shopifyCategory.includes('Office')) {
      return 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude > Bürocontainer';
    }
    if (shopifyCategory.includes('Shipping') || shopifyCategory.includes('Lager')) {
      return 'Business & Industrie > Industrielle Lagerung > Schiffscontainer';
    }
    if (shopifyCategory.includes('Trailer')) {
      return 'Fahrzeuge & Teile > Fahrzeuganhänger & Zubehör > Nutzfahrzeuganhänger';
    }
  }
  
  return shopifyType || 'Business & Industrie > Baugewerbe > Modulare & Fertiggebäude';
}

// Main processing
function processCSV() {
  console.log('Reading CSV with multi-line support...');
  const records = readCSV(INPUT_FILE);
  
  if (records.length === 0) {
    console.error('No records found');
    return;
  }
  
  console.log(`Found ${records.length} records`);
  
  // Parse header
  const header = parseCSVLine(records[0]);
  const titleIndex = header.indexOf('Title');
  const handleIndex = header.indexOf('Handle');
  const bodyIndex = header.indexOf('Body (HTML)');
  const typeIndex = header.indexOf('Type');
  const categoryIndex = header.indexOf('Product Category');
  const skuIndex = header.indexOf('Variant SKU');
  const googleProductTypeIndex = header.indexOf('Google Product Category');
  
  console.log(`Columns: Title=${titleIndex}, Body=${bodyIndex}, Type=${typeIndex}, Category=${categoryIndex}`);
  
  // Add Google Product Category column if not exists
  if (googleProductTypeIndex === -1) {
    header.push('Google Product Category');
  }
  
  const processedRecords = [header.join(',')];
  const corrections = [];
  const titleMap = new Map();
  
  for (let i = 1; i < records.length; i++) {
    const fields = parseCSVLine(records[i]);
    
    if (fields.length < 2) continue;
    
    const handle = fields[handleIndex] || '';
    const title = fields[titleIndex] || '';
    const sku = fields[skuIndex] || '';
    const type = fields[typeIndex] || '';
    const category = fields[categoryIndex] || '';
    
    // Skip rows with empty title (image rows) - keep them
    if (!title && handle) {
      // Add empty Google Product Category for image rows
      if (googleProductTypeIndex === -1) {
        fields.push('');
      }
      processedRecords.push(fields.map(escapeCSVField).join(','));
      continue;
    }
    
    if (!title) continue;
    
    // Fix title
    const originalTitle = title;
    let fixedTitle = fixTitle(title);
    
    // Check duplicates
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
    const originalBody = fields[bodyIndex] || '';
    const fixedBody = cleanDescription(originalBody);
    if (originalBody !== fixedBody && originalBody.length > 100) {
      corrections.push({
        line: i + 1,
        handle,
        change: `Cleaned ChatGPT HTML`,
        original: originalBody.substring(0, 50) + '...',
        fixed: fixedBody.substring(0, 50) + '...'
      });
    }
    
    // Add Google Product Type
    const googleProductType = getGoogleProductType(type, category);
    if (googleProductTypeIndex === -1) {
      fields.push(googleProductType);
    } else {
      fields[googleProductTypeIndex] = googleProductType;
    }
    
    // Update fields
    fields[titleIndex] = fixedTitle;
    fields[bodyIndex] = fixedBody;
    
    // Rebuild record
    processedRecords.push(fields.map(escapeCSVField).join(','));
  }
  
  // Write output
  fs.writeFileSync(OUTPUT_FILE, processedRecords.join('\n'));
  
  // Print report
  console.log('\n=== CORRECTIONS ===\n');
  corrections.slice(0, 20).forEach((c, i) => {
    console.log(`${i + 1}. Line ${c.line} (${c.handle})`);
    console.log(`   ${c.change}`);
    if (c.change === 'Spelling/case fixed') {
      console.log(`   "${c.original}" → "${c.fixed}"`);
    }
    console.log('');
  });
  
  if (corrections.length > 20) {
    console.log(`... and ${corrections.length - 20} more corrections`);
  }
  
  console.log(`\n✅ Total corrections: ${corrections.length}`);
  console.log(`✅ Records processed: ${processedRecords.length}`);
  console.log(`📄 Output: ${OUTPUT_FILE}`);
  console.log(`📊 Added Google Product Category column`);
}

processCSV();
