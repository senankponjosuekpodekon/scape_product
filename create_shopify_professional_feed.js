/**
 * Create Professional Shopify feed without emojis
 */

import fs from 'fs';

function createShopifyFeed() {
  // Sélection des 5 meilleurs conteneurs piscines de GSHandels
  const containerPools = [
    {
      id: 'pool-001',
      title: 'Container-Spa-Pool 3.0 x 2.5 m mit Whirlpool - Komplettset',
      description: 'Hochwertiger Container-Spa-Pool mit integriertem Whirlpool. Perfekt fuer Garten und Terrasse. Inklusive Heizung, Filteranlage und Abdeckung. Einfache Installation, sofort einsatzbereit.',
      price: '8999.00',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/container-spa-pool-3x2-5.jpg',
      category: '594',
      product_type: 'Container Pool',
      brand: 'GSHandels',
      material: 'Stahl-Kunststoff',
      color: 'Anthrazit',
      availability: 'in_stock'
    },
    {
      id: 'pool-002',
      title: '6.5 m x 2.5 m Polypropylen-Pool mit 4 m Panoramafenster',
      description: 'Grosser Polypropylen-Pool mit beeindruckendem 4-Meter-Panoramafenster. Langlebiges Material, einfache Wartung. Ideal fuer Schwimmer und Entspannung. Komplett mit Pumpe und Filter.',
      price: '12999.00',
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
      title: 'Containerbecken 6.2 x 2.5 m mit Jet Swim Gegenstromanlage',
      description: 'Container-Schwimmbad mit leistungsstarker Jet Swim Gegenstromanlage. Perfekt fuer Fitness-Schwimmen auf kleinem Raum. Robuste Bauweise, wetterfest und langlebig.',
      price: '11499.00',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/container-jet-swim.jpg',
      category: '594',
      product_type: 'Container Schwimmbad',
      brand: 'GSHandels',
      material: 'Stahl-Fiberglas',
      color: 'Grau',
      availability: 'in_stock'
    },
    {
      id: 'pool-004',
      title: 'Containerpool 6.11 x 2.5 m mit Waermepumpe - Premium-Paket',
      description: 'Luxurioeser Containerpool mit effizienter Waermepumpe fuer ganzjaehrige Nutzung. Premium-Ausstattung mit LED-Beleuchtung, automatischer Chlorung und Abdeckrollo.',
      price: '15999.00',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/containerpool-waermepumpe.jpg',
      category: '594',
      product_type: 'Containerpool',
      brand: 'GSHandels',
      material: 'Stahl-Isolierung',
      color: 'Weiss',
      availability: 'in_stock'
    },
    {
      id: 'pool-005',
      title: 'Mobiler Mini-Schwimmbad-Container 5.25 x 2.55 x 1.26 m',
      description: 'Kompakter mobiler Pool fuer kleine Gaerten und Terrassen. Einfacher Aufbau, winterfest. Perfekt fuer Erholung und leichten Wassersport. Geringer Platzbedarf, maximale Flexibilitaet.',
      price: '6999.00',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/mini-schwimmbad-container.jpg',
      category: '594',
      product_type: 'Mini Pool',
      brand: 'GSHandels',
      material: 'Kunststoff-Aluminium',
      color: 'Blau',
      availability: 'in_stock'
    }
  ];

  // Sélection des 5 meilleurs vans équestres de VanDuCheval
  const horseVans = [
    {
      id: 'van-001',
      title: 'Ifor Williams HB 506 - 2-Pferd-Van Premium',
      description: 'Hochwertiger Ifor Williams HB 506 Van fuer 2 Pferde. Spitzenqualitaet aus Wales, extrem robust und langlebig. Ausgestattet mit Lueftungssystem, Trennwand und hochwertiger Bremse. Jahrgang 2020, sehr guter Zustand.',
      price: '18500.00',
      image: 'https://vanducheval.com/wp-content/uploads/ifor-williams-hb506.jpg',
      category: '936',
      product_type: 'Pferdetransporter',
      brand: 'Ifor Williams',
      material: 'Stahl-verzinkt',
      color: 'Silber',
      availability: 'in_stock'
    },
    {
      id: 'van-002',
      title: 'Boeckmann Duo 2.0 - 2-Pferde-Luxusvan mit Alu-Fussboden',
      description: 'Luxurioeser Boeckmann Duo 2.0 fuer 2 Pferde. Mit Aluminium-Fussboden, Premium-Sattelkammer und modernster Lueftung. Deutsche Markenqualitaet, absolut pferdefreundlich. Baujahr 2021.',
      price: '22900.00',
      image: 'https://vanducheval.com/wp-content/uploads/bockmann-duo-2.jpg',
      category: '936',
      product_type: 'Luxuspferdetransporter',
      brand: 'Boeckmann',
      material: 'Stahl-Aluminium',
      color: 'Weiss-Blau',
      availability: 'in_stock'
    },
    {
      id: 'van-003',
      title: 'Cheval Liberté Gold 3 - 3-Pferde-Van mit Wohnabteil',
      description: 'Cheval Liberté Gold 3 fuer 3 Pferde mit integriertem Wohnabteil. Franzoesische Premium-Marke bekannt fuer Komfort und Sicherheit. Komplett ausgestattet mit Kueche, Schlafplatz und moderner Technik.',
      price: '28500.00',
      image: 'https://vanducheval.com/wp-content/uploads/cheval-liberte-gold-3.jpg',
      category: '936',
      product_type: 'Wohnpferdetransporter',
      brand: 'Cheval Liberté',
      material: 'Stahl-Holz',
      color: 'Beige',
      availability: 'in_stock'
    },
    {
      id: 'van-004',
      title: 'Humbaur 2-Pferd-Van mit Schiebetuer - Kompakt und Praktisch',
      description: 'Kompakter Humbaur Van fuer 2 Pferde mit praktischer Schiebetuer. Ideal fuer enge Verhaeltnisse und haeufigen Gebrauch. Deutsche Qualitaet, sehr wendig und wirtschaftlich. Jahrgang 2019, gut gepflegt.',
      price: '14900.00',
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
      description: 'Innovativer Fautras Oblic 3 fuer 3 Pferde mit seitlicher Belademoeglichkeit. Franzoesische Handwerkskunst, extrem pferdefreundlich durch seitliche Einstiegsmoeglichkeit. Reduziert Stress fuer Pferde.',
      price: '19900.00',
      image: 'https://vanducheval.com/wp-content/uploads/fautras-oblic-3.jpg',
      category: '936',
      product_type: 'Seitlicher Pferdetransporter',
      brand: 'Fautras',
      material: 'Stahl-verzinkt',
      color: 'Grau',
      availability: 'in_stock'
    }
  ];

  const allProducts = [...containerPools, ...horseVans];

  // En-têtes Shopify
  const shopifyHeaders = 'Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Grams,Variant Inventory Tracker,Variant Inventory Qty,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Variant Barcode,Image Src,Image Position,Image Alt Text,Gift Card,SEO Title,SEO Description,Google Product Category,Status';
  
  // Créer les lignes CSV Shopify
  const csvLines = [shopifyHeaders];
  
  allProducts.forEach(product => {
    const handle = product.id.replace(/[^a-z0-9]+/g, '-');
    const body = generateProfessionalBody(product);
    const tags = generateTags(product);
    const inventory = product.availability === 'in_stock' ? '5' : '0';
    
    // Échapper les guillemets dans les champs texte
    const title = product.title.replace(/"/g, '""');
    const bodyHtml = body.replace(/"/g, '""');
    const vendor = product.brand.replace(/"/g, '""');
    const productType = product.product_type.replace(/"/g, '""');
    const tagsField = tags.replace(/"/g, '""');
    const seoTitle = `${product.title} | Deutsche Premium-Produkte`.replace(/"/g, '""');
    const seoDescription = `${product.description.substring(0, 160)}...`.replace(/"/g, '""');
    const altText = product.title.replace(/"/g, '""');
    
    const csvLine = `${handle},"${title}","${bodyHtml}","${vendor}","${productType}","${tagsField}",true,Title,Default,${product.id},,shopify,${inventory},deny,manual,${product.price},,true,true,,${product.image},1,"${altText}",false,"${seoTitle}","${seoDescription}",${product.category},active`;
    csvLines.push(csvLine);
  });

  // Sauvegarder le fichier Shopify
  const csvContent = csvLines.join('\n');
  fs.writeFileSync('./deutsche-boutique-shopify-feed.csv', csvContent, 'utf8');

  console.log('✅ Professioneller Shopify Feed erstellt!');
  console.log(`📊 ${allProducts.length} Produkte (5 Pools + 5 Pferde-Vans)`);
  console.log('📁 deutsche-boutique-shopify-feed.csv');
  
  // Statistiques
  const totalValue = allProducts.reduce((sum, p) => sum + parseFloat(p.price), 0);
  console.log(`💰 Gesamtwert: ${totalValue.toLocaleString('de-DE')} EUR`);
}

function generateProfessionalBody(product) {
  const isPool = product.category === '594';
  
  if (isPool) {
    return `<div class="product-description">
  <h1>${product.title}</h1>
  
  <h2>Premium-Qualitaet fuer deutsche Gaerten</h2>
  <ul>
    <li>Wetterfest und winterfest</li>
    <li>Einfache Selbstmontage</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-gepruefte Sicherheit</li>
    <li>Kostenlose Lieferung nach DE/AT</li>
  </ul>
  
  <h2>Perfekt fuer:</h2>
  <ul>
    <li>Hausgaerten und Terrassen</li>
    <li>Fitness und Erholung</li>
    <li>Familien mit Kindern</li>
    <li>Ganzjaehrige Nutzung</li>
  </ul>
  
  <h2>Technische Daten:</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr><td><strong>Material:</strong></td><td>${product.material}</td></tr>
    <tr><td><strong>Farbe:</strong></td><td>${product.color}</td></tr>
    <tr><td><strong>Garantie:</strong></td><td>5 Jahre</td></tr>
    <tr><td><strong>Lieferung:</strong></td><td>Kostenlos</td></tr>
  </table>
  
  <p><strong>${product.description}</strong></p>
  
  <h2>Unser Service-Paket:</h2>
  <ul>
    <li>Kostenlose Lieferung und Aufbau</li>
    <li>5 Jahre Herstellergarantie</li>
    <li>TUEV-Zertifizierung</li>
    <li>Deutscher Kundenservice</li>
    <li>30 Tage Rueckgaberecht</li>
  </ul>
</div>`;
  } else {
    return `<div class="product-description">
  <h1>${product.title}</h1>
  
  <h2>Premium-Pferdetransport fuer deutsche Pferdebesitzer</h2>
  <ul>
    <li>TUEV-gepruefte Sicherheit</li>
    <li>Pferdefreundliches Design</li>
    <li>Deutsche Markenqualitaet</li>
    <li>Voll ausgestattet</li>
    <li>Sofort einsatzbereit</li>
  </ul>
  
  <h2>Ideal fuer:</h2>
  <ul>
    <li>Turniersportler</li>
    <li>Pferdehalter</li>
    <li>Reitstaelle</li>
    <li>Transportunternehmen</li>
  </ul>
  
  <h2>Fahrzeugdaten:</h2>
  <table border="0" cellspacing="0" cellpadding="5">
    <tr><td><strong>Marke:</strong></td><td>${product.brand}</td></tr>
    <tr><td><strong>Material:</strong></td><td>${product.material}</td></tr>
    <tr><td><strong>Farbe:</strong></td><td>${product.color}</td></tr>
    <tr><td><strong>Zustand:</strong></td><td>Geprueft und bereit</td></tr>
    <tr><td><strong>Zulassung:</strong></td><td>Vollstaendig</td></tr>
  </table>
  
  <p><strong>${product.description}</strong></p>
  
  <h2>Unser Kauf-Paket:</h2>
  <ul>
    <li>TUEV-Pruefung und Ueberfuehrung</li>
    <li>3 Monate Gewaehrleistung</li>
    <li>Finanzierung moeglich</li>
    <li>Lieferung ganz Deutschland</li>
    <li>24/7 Pannenhilfe</li>
  </ul>
</div>`;
  }
}

function generateTags(product) {
  const isPool = product.category === '594';
  const baseTags = isPool ? 
    ['Pool', 'Schwimmbad', 'Garten', 'Container', 'Wellness', 'Fitness', 'Erholung', 'Luxus'] :
    ['Pferdetransporter', 'Pferde', 'Transport', 'Reitsport', 'Turnier', 'Luxus'];
  
  const brandTags = [product.brand];
  const materialTags = [product.material.replace('-', ' ')];
  
  return [...baseTags, ...brandTags, ...materialTags, 'Deutschland', 'Premium', 'Qualitaet'].join(', ');
}

try {
  createShopifyFeed();
} catch (error) {
  console.error('Fehler:', error.message);
  process.exit(1);
}
