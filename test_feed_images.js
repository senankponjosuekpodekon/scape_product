/**
 * Test all image URLs in the main feeds
 */

import fs from 'fs';
import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

async function testImageUrl(url) {
  try {
    const response = await axios.head(url, { 
      timeout: 5000,
      headers: HEADERS
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function analyzeFeedImages(feedFile, feedName) {
  console.log(`\n🔍 Analyse du feed: ${feedName}`);
  console.log(`📁 Fichier: ${feedFile}`);
  
  try {
    const content = fs.readFileSync(feedFile, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.log('❌ Feed vide ou invalide');
      return;
    }
    
    const headers = lines[0].split(',');
    const imageLinkIndex = headers.findIndex(h => h.trim() === 'image_link');
    const additionalImageIndex = headers.findIndex(h => h.trim() === 'additional_image_link');
    
    if (imageLinkIndex === -1) {
      console.log('❌ Colonne image_link non trouvée');
      return;
    }
    
    console.log(`📊 Total produits: ${lines.length - 1}`);
    
    let totalImages = 0;
    let workingImages = 0;
    let brokenImages = 0;
    const productsWithImages = [];
    
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].match(/(?:[^,"']+|"[^"]*"|'[^']*')+/g) || [];
      
      if (columns.length > imageLinkIndex) {
        const mainImage = columns[imageLinkIndex].replace(/"/g, '');
        const additionalImages = additionalImageIndex !== -1 && columns[additionalImageIndex] 
          ? columns[additionalImageIndex].replace(/"/g, '').split(',').filter(img => img.trim())
          : [];
        
        const allImages = [mainImage, ...additionalImages].filter(img => img && img.startsWith('http'));
        const productImages = {
          line: i,
          mainImage,
          additionalImages,
          total: allImages.length,
          working: 0,
          broken: 0,
          details: []
        };
        
        console.log(`\n📦 Produit ligne ${i}:`);
        console.log(`   Image principale: ${mainImage}`);
        
        // Test main image
        if (mainImage && mainImage.startsWith('http')) {
          totalImages++;
          const works = await testImageUrl(mainImage);
          if (works) {
            workingImages++;
            productImages.working++;
            console.log(`   ✅ Image principale: OK`);
          } else {
            brokenImages++;
            productImages.broken++;
            console.log(`   ❌ Image principale: ERREUR 404`);
          }
          productImages.details.push({ url: mainImage, works });
        }
        
        // Test additional images
        for (let j = 0; j < additionalImages.length; j++) {
          const img = additionalImages[j].trim();
          if (img && img.startsWith('http')) {
            totalImages++;
            const works = await testImageUrl(img);
            if (works) {
              workingImages++;
              productImages.working++;
              console.log(`   ✅ Image additionnelle ${j+1}: OK`);
            } else {
              brokenImages++;
              productImages.broken++;
              console.log(`   ❌ Image additionnelle ${j+1}: ERREUR 404`);
            }
            productImages.details.push({ url: img, works });
          }
        }
        
        console.log(`   📊 Total images: ${allImages.length} (${productImages.working} OK, ${productImages.broken} KO)`);
        productsWithImages.push(productImages);
      }
    }
    
    console.log(`\n📈 RÉSULTATS ${feedName}:`);
    console.log(`   📦 Produits analysés: ${productsWithImages.length}`);
    console.log(`   🖼️ Total images testées: ${totalImages}`);
    console.log(`   ✅ Images fonctionnelles: ${workingImages}`);
    console.log(`   ❌ Images cassées (404): ${brokenImages}`);
    console.log(`   📊 Taux de réussite: ${totalImages > 0 ? ((workingImages/totalImages)*100).toFixed(1) : 0}%`);
    
    // Show products with most images
    const sortedByImageCount = productsWithImages
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    
    console.log(`\n🏆 Top 3 produits avec le plus d'images:`);
    sortedByImageCount.forEach((product, index) => {
      console.log(`   ${index + 1}. Ligne ${product.line}: ${product.total} images (${product.working} OK)`);
    });
    
    return {
      feedName,
      totalProducts: productsWithImages.length,
      totalImages,
      workingImages,
      brokenImages,
      successRate: totalImages > 0 ? (workingImages/totalImages)*100 : 0,
      productsWithImages
    };
    
  } catch (error) {
    console.error(`❌ Erreur lecture ${feedFile}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Test des URLs d\'images dans les feeds principaux...\n');
  
  const results = [];
  
  // Test GSHandels feed
  const gshandelsResult = await analyzeFeedImages('gshandels-google-merchant-feed-fixed.csv', 'GSHandels');
  if (gshandelsResult) results.push(gshandelsResult);
  
  // Test VanDuCheval feed  
  const vanduchevalResult = await analyzeFeedImages('vanducheval-google-merchant-feed.csv', 'VanDuCheval');
  if (vanduchevalResult) results.push(vanduchevalResult);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ COMPARATIF');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    console.log(`\n🏢 ${result.feedName}:`);
    console.log(`   📦 Produits: ${result.totalProducts}`);
    console.log(`   🖼️ Images totales: ${result.totalImages}`);
    console.log(`   ✅ Fonctionnelles: ${result.workingImages}`);
    console.log(`   ❌ Cassées: ${result.brokenImages}`);
    console.log(`   📊 Succès: ${result.successRate.toFixed(1)}%`);
    console.log(`   📈 Images/produit: ${result.totalProducts > 0 ? (result.totalImages/result.totalProducts).toFixed(1) : 0}`);
  });
  
  // Save detailed results
  fs.writeFileSync('./feed_image_analysis_results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Résultats détaillés sauvegardés dans: feed_image_analysis_results.json');
}

main().catch(console.error);
