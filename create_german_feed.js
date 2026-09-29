/**
 * Create German feed with 5 container pools and 5 horse vans
 * Optimized for German market
 */

import fs from 'fs';

function createGermanFeed() {
  // Sélection des 5 meilleurs conteneurs piscines de GSHandels
  const containerPools = [
    {
      id: 'pool-001',
      title: 'Container-Spa-Pool 3,0 x 2,5 m mit Whirlpool - Komplettset',
      description: 'Hochwertiger Container-Spa-Pool mit integriertem Whirlpool. Perfekt für Garten und Terrasse. Inklusive Heizung, Filteranlage und Abdeckung. Einfache Installation, sofort einsatzbereit.',
      price: '8999.00 EUR',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/container-spa-pool-3x2-5.jpg',
      category: '594',
      product_type: 'Container Pool',
      brand: 'GSHandels',
      material: 'Stahl, Kunststoff',
      color: 'Anthrazit',
      availability: 'in_stock'
    },
    {
      id: 'pool-002',
      title: '6,5 m x 2,5 m Polypropylen-Pool mit 4 m Panoramafenster',
      description: 'Großer Polypropylen-Pool mit beeindruckendem 4-Meter-Panoramafenster. Langlebiges Material, einfache Wartung. Ideal für Schwimmer und Entspannung. Komplett mit Pumpe und Filter.',
      price: '12999.00 EUR',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/polypropylen-pool-6-5x2-5.jpg',
      category: '594',
      product_type: 'Pool',
      brand: 'GSHandels',
      material: 'Polypropylen',
      color: 'Blau',
      availability: 'in_stock'
    },
    {
      id: 'pool-003',
      title: 'Containerbecken 6,2 x 2,5 m mit Jet Swim Gegenstromanlage',
      description: 'Container-Schwimmbad mit leistungsstarker Jet Swim Gegenstromanlage. Perfekt für Fitness-Schwimmen auf kleinem Raum. Robuste Bauweise, wetterfest und langlebig.',
      price: '11499.00 EUR',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/container-jet-swim.jpg',
      category: '594',
      product_type: 'Container Schwimmbad',
      brand: 'GSHandels',
      material: 'Stahl, Fiberglas',
      color: 'Grau',
      availability: 'in_stock'
    },
    {
      id: 'pool-004',
      title: 'Containerpool 6,11 x 2,5 m mit Wärmepumpe - Premium-Paket',
      description: 'Luxuriöser Containerpool mit effizienter Wärmepumpe für ganzjährige Nutzung. Premium-Ausstattung mit LED-Beleuchtung, automatischer Chlorung und Abdeckrollo.',
      price: '15999.00 EUR',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/containerpool-waermepumpe.jpg',
      category: '594',
      product_type: 'Containerpool',
      brand: 'GSHandels',
      material: 'Stahl, Isolierung',
      color: 'Weiß',
      availability: 'in_stock'
    },
    {
      id: 'pool-005',
      title: 'Mobiler Mini-Schwimmbad-Container 5,25 x 2,55 x 1,26 m',
      description: 'Kompakter mobiler Pool für kleine Gärten und Terrassen. Einfacher Aufbau, winterfest. Perfekt für Erholung und leichten Wassersport. Geringer Platzbedarf, maximale Flexibilität.',
      price: '6999.00 EUR',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/mini-schwimmbad-container.jpg',
      category: '594',
      product_type: 'Mini Pool',
      brand: 'GSHandels',
      material: 'Kunststoff, Aluminium',
      color: 'Blau',
      availability: 'in_stock'
    }
  ];

  // Sélection des 5 meilleurs vans équestres de VanDuCheval
  const horseVans = [
    {
      id: 'van-001',
      title: 'Ifor Williams HB 506 - 2-Pferd-Van Premium',
      description: 'Hochwertiger Ifor Williams HB 506 Van für 2 Pferde. Spitzenqualität aus Wales, extrem robust und langlebig. Ausgestattet mit Lüftungssystem, Trennwand und hochwertiger Bremse. Jahrgang 2020, sehr guter Zustand.',
      price: '18500.00 EUR',
      image: 'https://vanducheval.com/wp-content/uploads/ifor-williams-hb506.jpg',
      category: '936',
      product_type: 'Pferdetransporter',
      brand: 'Ifor Williams',
      material: 'Stahl verzinkt',
      color: 'Silber',
      availability: 'in_stock'
    },
    {
      id: 'van-002',
      title: 'Böckmann Duo 2.0 - 2-Pferde-Luxusvan mit Alu-Fußboden',
      description: 'Luxuriöser Böckmann Duo 2.0 für 2 Pferde. Mit Aluminium-Fußboden, Premium-Sattelkammer und modernster Lüftung. Deutsche Markenqualität, absolut pferdefreundlich. Baujahr 2021.',
      price: '22900.00 EUR',
      image: 'https://vanducheval.com/wp-content/uploads/bockmann-duo-2.jpg',
      category: '936',
      product_type: 'Luxuspferdetransporter',
      brand: 'Böckmann',
      material: 'Stahl, Aluminium',
      color: 'Weiß/Blau',
      availability: 'in_stock'
    },
    {
      id: 'van-003',
      title: 'Cheval Liberté Gold 3 - 3-Pferde-Van mit Wohnabteil',
      description: 'Cheval Liberté Gold 3 für 3 Pferde mit integriertem Wohnabteil. Französische Premium-Marke bekannt für Komfort und Sicherheit. Komplett ausgestattet mit Küche, Schlafplatz und moderner Technik.',
      price: '28500.00 EUR',
      image: 'https://vanducheval.com/wp-content/uploads/cheval-liberte-gold-3.jpg',
      category: '936',
      product_type: 'Wohnpferdetransporter',
      brand: 'Cheval Liberté',
      material: 'Stahl, Holz',
      color: 'Beige',
      availability: 'in_stock'
    },
    {
      id: 'van-004',
      title: 'Humbaur 2-Pferd-Van mit Schiebetür - Kompakt & Praktisch',
      description: 'Kompakter Humbaur Van für 2 Pferde mit praktischer Schiebetür. Ideal für enge Verhältnisse und häufigen Gebrauch. Deutsche Qualität, sehr wendig und wirtschaftlich. Jahrgang 2019, gut gepflegt.',
      price: '14900.00 EUR',
      image: 'https://vanducheval.com/wp-content/uploads/humbaur-2-pferde.jpg',
      category: '936',
      product_type: 'Kompakter Pferdetransporter',
      brand: 'Humbaur',
      material: 'Stahl',
      color: 'Rot',
      availability: 'in_stock'
    },
    {
      id: 'van-005',
      title: 'Fautras Oblic 3 - 3-Pferde-Van mit seitlicher Beladung',
      description: 'Innovativer Fautras Oblic 3 für 3 Pferde mit seitlicher Belademöglichkeit. Französische Handwerkskunst, extrem pferdefreundlich durch seitliche Einstiegsmöglichkeit. Reduziert Stress für Pferde.',
      price: '19900.00 EUR',
      image: 'https://vanducheval.com/wp-content/uploads/fautras-oblic-3.jpg',
      category: '936',
      product_type: 'Seitlicher Pferdetransporter',
      brand: 'Fautras',
      material: 'Stahl verzinkt',
      color: 'Grau',
      availability: 'in_stock'
    }
  ];

  const allProducts = [...containerPools, ...horseVans];

  // En-têtes Google Merchant Center
  const gmcHeaders = [
    'id',
    'title',
    'description',
    'link',
    'image_link',
    'availability',
    'price',
    'condition',
    'brand',
    'google_product_category',
    'product_type',
    'material',
    'color'
  ];

  // En-têtes Shopify
  const shopifyHeaders = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Variant SKU',
    'Variant Price',
    'Variant Inventory Qty',
    'Image Src',
    'SEO Title',
    'SEO Description',
    'Google Product Category',
    'Status'
  ];

  // Générer le feed Google Merchant Center
  const gmcRows = [gmcHeaders.join(',')];
  allProducts.forEach(product => {
    const row = [
      product.id,
      `"${product.title.replace(/"/g, '""')}"`,
      `"${product.description.replace(/"/g, '""')}"`,
      `https://deutsche-boutique.de/produkt/${product.id}`,
      product.image,
      product.availability,
      product.price,
      product.brand === 'GSHandels' ? 'new' : 'used',
      product.brand,
      product.category,
      `"${product.product_type.replace(/"/g, '""')}"`,
      `"${product.material.replace(/"/g, '""')}"`,
      `"${product.color.replace(/"/g, '""')}"`
    ];
    gmcRows.push(row.join(','));
  });

  // Générer le feed Shopify
  const shopifyRows = [shopifyHeaders.join(',')];
  allProducts.forEach(product => {
    const handle = product.id.replace(/[^a-z0-9]+/g, '-');
    const body = generateShopifyBody(product);
    const tags = generateTags(product);
    const inventory = product.availability === 'in_stock' ? '5' : '0';
    
    const row = [
      handle,
      `"${product.title}"`,
      `"${body}"`,
      product.brand,
      `"${product.product_type}"`,
      `"${tags}"`,
      'true',
      'Title',
      'Default',
      product.id,
      product.price.replace(' EUR', ''),
      inventory,
      product.image,
      `"${product.title} | Deutsche Premium-Produkte"`,
      `"${product.description.substring(0, 160)}..."`,
      product.category,
      'active'
    ];
    shopifyRows.push(row.join(','));
  });

  // Sauvegarder les fichiers
  fs.writeFileSync('./deutsche-boutique-gmc-feed.csv', gmcRows.join('\n'), 'utf8');
  fs.writeFileSync('./deutsche-boutique-shopify-feed.csv', shopifyRows.join('\n'), 'utf8');

  console.log('✅ Deutsche Boutique Feed erstellt!');
  console.log(`📊 ${allProducts.length} Produkte (5 Pools + 5 Pferde-Vans)`);
  console.log('📁 deutsche-boutique-gmc-feed.csv');
  console.log('📁 deutsche-boutique-shopify-feed.csv');
  
  // Statistiques
  const totalValue = allProducts.reduce((sum, p) => sum + parseFloat(p.price.replace(' EUR', '').replace('.', '')), 0);
  console.log(`💰 Gesamtwert: ${(totalValue/100).toLocaleString('de-DE')} EUR`);
}

function generateShopifyBody(product) {
  const isPool = product.category === '594';
  
  if (isPool) {
    return `
<div class="product-description">
  <h1>${product.title}</h1>
  
  <h2>✅ Premium-Qualität für deutsche Gärten</h2>
  <ul>
    <li>✅ Wetterfest und winterfest</li>
    <li>✅ Einfache Selbstmontage</li>
    <li>✅ 5 Jahre Herstellergarantie</li>
    <li>✅ TÜV-geprüfte Sicherheit</li>
    <li>✅ Kostenlose Lieferung nach DE/AT</li>
  </ul>
  
  <h2>🏊‍♂️ Perfekt für:</h2>
  <ul>
    <li>🏡 Hausgärten und Terrassen</li>
    <li>🏊‍♀️ Fitness und Erholung</li>
    <li>👨‍👩‍👧‍👦 Familien mit Kindern</li>
    <li>💪 Ganzjährige Nutzung</li>
  </ul>
  
  <h2>📋 Technische Daten:</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr><td><strong>Material:</strong></td><td>${product.material}</td></tr>
    <tr><td><strong>Farbe:</strong></td><td>${product.color}</td></tr>
    <tr><td><strong>Garantie:</strong></td><td>5 Jahre</td></tr>
    <tr><td><strong>Lieferung:</strong></td><td>Kostenlos</td></tr>
  </table>
  
  <p><strong>${product.description}</strong></p>
  
  <h2>🎁 Unser Service-Paket:</h2>
  <ul>
    <li>✔️ Kostenlose Lieferung und Aufbau</li>
    <li>✔️ 5 Jahre Herstellergarantie</li>
    <li>✔️ TÜV-Zertifizierung</li>
    <li>✔️ Deutscher Kundenservice</li>
    <li>✔️ 30 Tage Rückgaberecht</li>
  </ul>
</div>
    `.trim();
  } else {
    return `
<div class="product-description">
  <h1>${product.title}</h1>
  
  <h2>🐴 Premium-Pferdetransport für deutsche Pferdebesitzer</h2>
  <ul>
    <li>✅ TÜV-geprüfte Sicherheit</li>
    <li>✅ Pferdefreundliches Design</li>
    <li>✅ Deutsche Markenqualität</li>
    <li>✅ Voll ausgestattet</li>
    <li>✅ Sofort einsatzbereit</li>
  </ul>
  
  <h2>🚛 Ideal für:</h2>
  <ul>
    <li>🏇 Turniersportler</li>
    <li>🐎 Pferdehalter</li>
    <li>🏆 Reitställe</li>
    <li>📦 Transportunternehmen</li>
  </ul>
  
  <h2>📋 Fahrzeugdaten:</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr><td><strong>Marke:</strong></td><td>${product.brand}</td></tr>
    <tr><td><strong>Material:</strong></td><td>${product.material}</td></tr>
    <tr><td><strong>Farbe:</strong></td><td>${product.color}</td></tr>
    <tr><td><strong>Zustand:</strong></td><td>Geprüft und bereit</td></tr>
    <tr><td><strong>Zulassung:</strong></td><td>Vollständig</td></tr>
  </table>
  
  <p><strong>${product.description}</strong></p>
  
  <h2>🎁 Unser Kauf-Paket:</h2>
  <ul>
    <li>✔️ TÜV-Prüfung und Überführung</li>
    <li>✔️ 3 Monate Gewährleistung</li>
    <li>✔️ Finanzierung möglich</li>
    <li>🚚 Lieferung ganz Deutschland</li>
    <li>📞 24/7 Pannenhilfe</li>
  </ul>
</div>
    `.trim();
  }
}

function generateTags(product) {
  const isPool = product.category === '594';
  const baseTags = isPool ? 
    ['Pool', 'Schwimmbad', 'Garten', 'Container', 'Wellness', 'Fitness', 'Erholung', 'Luxus'] :
    ['Pferdetransporter', 'Pferde', 'Transport', 'Reitsport', 'Turnier', 'Luxus'];
  
  const brandTags = [product.brand];
  const materialTags = [product.material];
  
  return [...baseTags, ...brandTags, ...materialTags, 'Deutschland', 'Premium', 'Qualität'].join(', ');
}

try {
  createGermanFeed();
} catch (error) {
  console.error('Fehler:', error.message);
  process.exit(1);
}
