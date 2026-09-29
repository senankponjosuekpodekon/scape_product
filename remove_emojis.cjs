const fs = require('fs');

const INPUT_FILE = '/home/josue/Projections/scape_product/products_export_FINAL.csv';
const OUTPUT_FILE = '/home/josue/Projections/scape_product/products_export_no_emojis.csv';

// Function to remove emojis from text
function removeEmojis(text) {
  if (!text) return '';
  
  return text
    // Remove emoji ranges
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1F018}-\u{1F270}]/gu, '') // Chess, arrows, etc
    .replace(/[\u{238C}-\u{2454}]/gu, '')   // Misc technical
    .replace(/[\u{20D0}-\u{20FF}]/gu, '')   // Combining Diacritical Marks for Symbols
    .replace(/[\u{2B50}-\u{2B55}]/gu, '')   // Stars and other symbols
    .replace(/[\u{2190}-\u{21FF}]/gu, '')   // Arrows
    .trim();
}

// Read file
const content = fs.readFileSync(INPUT_FILE, 'utf-8');
const lines = content.split('\n');

let emojiCount = 0;
const processedLines = [];

for (const line of lines) {
  const cleanedLine = removeEmojis(line);
  if (cleanedLine !== line) {
    emojiCount++;
  }
  processedLines.push(cleanedLine);
}

// Write output
fs.writeFileSync(OUTPUT_FILE, processedLines.join('\n'));

console.log(`✅ Emojis removed: ${emojiCount} lines affected`);
console.log(`📄 Output: ${OUTPUT_FILE}`);
