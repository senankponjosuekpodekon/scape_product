/**
 * Create German feed with proper CSV escaping
 */

import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

function createGermanFeed() {
  // Sélection des 5 meilleurs conteneurs piscines de GSHandels
  const containerPools = [
    {
      id: 'pool-001',
      title: 'Container-Spa-Pool 3.0 x 2.5 m mit Whirlpool - Komplettset',
      description: 'Hochwertiger Container-Spa-Pool mit integriertem Whirlpool. Perfekt fuer Garten und Terrasse. Inklusive Heizung, Filteranlage und Abdeckung. Einfache Installation, sofort einsatzbereit.',
      price: '8999.00 EUR',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/container-spa-pool-3x2-5.jpg',
      category: '594',
      product_type: 'Container Pool',
      brand: 'GSHandels',
      material: 'Stahl und Kunststoff',
      color: 'Anthrazit',
      availability: 'in_stock'
    },
    {
      id: 'pool-002',
      title: '6.5 m x 2.5 m Polypropylen-Pool mit 4 m Panoramafenster',
      description: 'Großer Polypropylen-Pool mit beeindruckendem 4-Meter-Panoramafenster. Langlebiges Material, einfache Wartung. Ideal fuer Schwimmer und Entspannung. Komplett mit Pumpe und Filter.',
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
      title: 'Containerbecken 6.2 x 2.5 m mit Jet Swim Gegenstromanlage',
      description: 'Container-Schwimmbad mit leistungsstarker Jet Swim Gegenstromanlage. Perfekt fuer Fitness-Schwimmen auf kleinem Raum. Robuste Bauweise, wetterfest und langlebig.',
      price: '11499.00 EUR',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/container-jet-swim.jpg',
      category: '594',
      product_type: 'Container Schwimmbad',
      brand: 'GSHandels',
      material: 'Stahl und Fiberglas',
      color: 'Grau',
      availability: 'in_stock'
    },
    {
      id: 'pool-004',
      title: 'Containerpool 6.11 x 2.5 m mit Waermepumpe - Premium-Paket',
      description: 'Luxurioeser Containerpool mit effizienter Waermepumpe fuer ganzjaehrige Nutzung. Premium-Ausstattung mit LED-Beleuchtung, automatischer Chlorung und Abdeckrollo.',
      price: '15999.00 EUR',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/containerpool-waermepumpe.jpg',
      category: '594',
      product_type: 'Containerpool',
      brand: 'GSHandels',
      material: 'Stahl und Isolierung',
      color: 'Weiss',
      availability: 'in_stock'
    },
    {
      id: 'pool-005',
      title: 'Mobiler Mini-Schwimmbad-Container 5.25 x 2.55 x 1.26 m',
      description: 'Kompakter mobiler Pool fuer kleine Gaerten und Terrassen. Einfacher Aufbau, winterfest. Perfekt fuer Erholung und leichten Wassersport. Geringer Platzbedarf, maximale Flexibilitaet.',
      price: '6999.00 EUR',
      image: 'https://gshandels.com/wp-content/uploads/2026/02/mini-schwimmbad-container.jpg',
      category: '594',
      product_type: 'Mini Pool',
      brand: 'GSHandels',
      material: 'Kunststoff und Aluminium',
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
      title: 'Boeckmann Duo 2.0 - 2-Pferde-Luxusvan mit Alu-Fussboden',
      description: 'Luxurioeser Boeckmann Duo 2.0 fuer 2 Pferde. Mit Aluminium-Fussboden, Premium-Sattelkammer und modernster Lueftung. Deutsche Markenqualitaet, absolut pferdefreundlich. Baujahr 2021.',
      price: '22900.00 EUR',
      image: 'https://vanducheval.com/wp-content/uploads/bockmann-duo-2.jpg',
      category: '936',
      product_type: 'Luxuspferdetransporter',
      brand: 'Boeckmann',
      material: 'Stahl und Aluminium',
      color: 'Weiss-Blau',
      availability: 'in_stock'
    },
    {
      id: 'van-003',
      title: 'Cheval Liberté Gold 3 - 3-Pferde-Van mit Wohnabteil',
      description: 'Cheval Liberté Gold 3 fuer 3 Pferde mit integriertem Wohnabteil. Franzoesische Premium-Marke bekannt fuer Komfort und Sicherheit. Komplett ausgestattet mit Kueche, Schlafplatz und moderner Technik.',
      price: '28500.00 EUR',
      image: 'https://vanducheval.com/wp-content/uploads/cheval-liberte-gold-3.jpg',
      category: '936',
      product_type: 'Wohnpferdetransporter',
      brand: 'Cheval Liberté',
      material: 'Stahl und Holz',
      color: 'Beige',
      availability: 'in_stock'
    },
    {
      id: 'van-004',
      title: 'Humbaur 2-Pferd-Van mit Schiebetuer - Kompakt und Praktisch',
      description: 'Kompakter Humbaur Van fuer 2 Pferde mit praktischer Schiebetuer. Ideal fuer enge Verhaeltnisse und haeufigen Gebrauch. Deutsche Qualitaet, sehr wendig und wirtschaftlich. Jahrgang 2019, gut gepflegt.',
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
      description: 'Innovativer Fautras Oblic 3 fuer 3 Pferde mit seitlicher Belademoeglichkeit. Franzoesische Handwerkskunst, extrem pferdefreundlich durch seitliche Einstiegsmoeglichkeit. Reduziert Stress fuer Pferde.',
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

  // Préparer les données pour le GMC feed
  const gmcData = allProducts.map(product => ({
    id: product.id,
    title: product.title,
    description: product.description,
    link: `https://deutsche-boutique.de/produkt/${product.id}`,
    image_link: product.image,
    availability: product.availability,
    price: product.price,
    condition: product.brand === 'GSHandels' ? 'new' : 'used',
    brand: product.brand,
    google_product_category: product.category,
    product_type: product.product_type,
    material: product.material,
    color: product.color
  }));

  // Générer le feed GMC avec csv-stringify
  const gmcCsv = stringify([gmcHeaders, ...gmcData], {
    header: false,
    quoted: true,
    quoted_empty: true,
    escape: '"'
  });

  // Sauvegarder le fichier GMC
  fs.writeFileSync('./deutsche-boutique-gmc-feed.csv', gmcCsv, 'utf8');

  console.log('✅ Deutsche Boutique Feed erstellt!');
  console.log(`📊 ${allProducts.length} Produkte (5 Pools + 5 Pferde-Vans)`);
  console.log('📁 deutsche-boutique-gmc-feed.csv');
  
  // Statistiques
  const totalValue = allProducts.reduce((sum, p) => sum + parseFloat(p.price.replace(' EUR', '').replace('.', '')), 0);
  console.log(`💰 Gesamtwert: ${(totalValue/100).toLocaleString('de-DE')} EUR`);
}

try {
  createGermanFeed();
} catch (error) {
  console.error('Fehler:', error.message);
  process.exit(1);
}
