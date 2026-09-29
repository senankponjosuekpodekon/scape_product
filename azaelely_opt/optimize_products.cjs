const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIG : META TITLES OPTIMISÉS PAR PRODUIT (max 60 chars)
// ============================================================
const META_TITLES = {
  'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux':
    'Après-shampoing Naturel Hydratant | Azaely',
  'baume-hydratant-whipped-cream-hydratation-intense-pour-tous-types-de-cheveux-peau-azaely':
    'Baume Hydra-Mousse Cheveux & Peau | Azaely',
  'bonnet-de-nuit-satine-protection-douce-anti-frisottis-pour-tous-types-de-cheveux-azaely':
    'Bonnet Satiné Nuit Anti-Frisottis | Azaely',
  'carte-cadeaux-azaely':
    'Carte Cadeau Azaely | Soins Naturels',
  'meches-boucles':
    'Mèches Bouclées Naturelles | Azaely',
  'meches-tresses':
    'Mèches Tressées Naturelles | Azaely',
  'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises':
    'Crème LuxeTrio Sans Rinçage Cheveux Bouclés | Azaely',
  'creme-fortisoin-masque-capillaire-naturel-reparateur-et-fortifiant-azaely':
    'Masque FortiSoin Réparateur & Fortifiant | Azaely',
  'duos-douceur-capillairekit-shampoing-apres-shampoing-naturel':
    'Duo Shampoing + Après-shampoing Naturel | Azaely',
  'foulard-satine-pour-tous-types-de-cheveux-accessoire-protecteur-style-azaely':
    'Foulard Satiné Protecteur Cheveux | Azaely',
  'huile-capillaire-naturel-cheveux':
    'Huile Capillaire Naturelle Cheveux | Azaely',
  'huile-capillaire-naturelle-nourrissante-pour-cheveux-abimes-cassants-et-ternes':
    'Huile Capillaire Nourrissante Cheveux Abîmés | Azaely',
  'huile-purifiante-fortifiante-grow-oil-pour-tous-types-de-cheveux-azaely':
    'Huile Grow Oil Purifiante & Fortifiante | Azaely',
  'kit-celeste-baume-hydra-mousse-serviette-microfibre-absorbante':
    'Kit Céleste Baume + Serviette Microfibre | Azaely',
  'kit-hydratation-intense-shampoing-luxuria-creme-luxetrio-azaely':
    'Kit Hydratation Luxuria + LuxeTrio | Azaely',
  'kit-naturel-fortifusion-shampooing-volubrillance-la-creme-fortisoin-pour-tous-type-de-cheveux':
    'Kit FortiFusion VoluBrillance + FortiSoin | Azaely',
  'kit-soins-capillaires-naturels-coffret-reparation-mise-en-forme-pour-tous-types-de-cheveux-azaely':
    'Kit Soins Capillaires Réparation & Coiffage | Azaely',
  'kit-trio-harmonie-savonneuse-savons-luxuria-purete-giroflee-douceur-soufre-azaely':
    'Kit Trio Savons Naturels Luxuria | Azaely',
  'masque-capillaire-reparateur-hydratant-azaely-nutrition-profonde-pour-cheveux-secs-abimes-ternes':
    'Masque Capillaire Réparateur Nutrition Profonde | Azaely',
  'meches-boucles':
    'Mèches Bouclées Naturelles | Azaely',
  'meches-tresses':
    'Mèches Tressées Naturelles | Azaely',
  'mini-masseur-de-cuir-chevelu-en-silicone-souple-distributeur-de-liqiuide-peigne-apllicateur-dhuile-capilaire':
    'Mini Masseur Cuir Chevelu Applicateur Huile | Azaely',
  'savon-douceursoufre-savon-naturel-purifiant-pour-peaux-grasses-mixtes-et-cheveux-gras-azaely':
    'Savon DouceurSoufre Purifiant Peau Grasse | Azaely',
  'savon-pureluxuria-savon-naturel-hydratant-pour-cheveux-boucles-peau-corps-azaely':
    'Savon PureLuxuria Hydratant Cheveux Bouclés | Azaely',
  'savon-purete-giroflee-savon-naturel-pour-tous-types-de-peau-azaely':
    'Savon Pureté Giroflée Tous Types de Peau | Azaely',
  'serviette-microfibre-pour-cheveux-sechage-doux-protection-capillaire-azaely':
    'Serviette Microfibre Séchage Doux Cheveux | Azaely',
  'shampoing-naturel-hydratant-pour-cheveux-boucles-afro-textures-luxuria-azaely':
    'Shampoing Luxuria Cheveux Bouclés Afro | Azaely',
  'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely':
    'Shampoing Naturel Cheveux Secs & Abîmés | Azaely',
  'shampoing-volubrillance-volumi-shine-pour-tous-type-de-cheveux':
    'Shampoing VoluBrillance Volume & Brillance | Azaely',
};

// ============================================================
// CONFIG : META DESCRIPTIONS PAR PRODUIT (max 160 chars)
// ============================================================
const META_DESCRIPTIONS = {
  'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux':
    'Après-shampoing naturel démêlant à l\'huile d\'argan et karité. Nourrit, hydrate et adoucit tous types de cheveux sans alourdir.',
  'baume-hydratant-whipped-cream-hydratation-intense-pour-tous-types-de-cheveux-peau-azaely':
    'Baume Hydra-Mousse polyvalent pour cheveux et peau. Texture légère et fondante, hydratation intense sans effet gras.',
  'bonnet-de-nuit-satine-protection-douce-anti-frisottis-pour-tous-types-de-cheveux-azaely':
    'Bonnet satiné nuit anti-frisottis. Protège les cheveux pendant le sommeil, réduit la casse et préserve l\'hydratation.',
  'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises':
    'Crème LuxeTrio 3-en-1 sans rinçage pour cheveux bouclés, frisés et afro. Définit les boucles, démêle et nourrit intensément.',
  'creme-fortisoin-masque-capillaire-naturel-reparateur-et-fortifiant-azaely':
    'Masque FortiSoin naturel réparateur. Fortifie les cheveux fragilisés, nourrit en profondeur et apporte brillance et douceur.',
  'duos-douceur-capillairekit-shampoing-apres-shampoing-naturel':
    'Kit capillaire Duo : shampoing + après-shampoing naturels. Routine complète pour cheveux nourris, doux et revitalisés.',
  'foulard-satine-pour-tous-types-de-cheveux-accessoire-protecteur-style-azaely':
    'Foulard satiné protecteur et stylé pour tous types de cheveux. Réduit les frisottis et protège la fibre capillaire.',
  'huile-capillaire-naturel-cheveux':
    'Huile capillaire naturelle Azaely. Nourrit, répare et sublime les cheveux ternes ou abîmés avec des huiles précieuses.',
  'huile-capillaire-naturelle-nourrissante-pour-cheveux-abimes-cassants-et-ternes':
    'Huile capillaire nourrissante pour cheveux abîmés et cassants. Répare, fortifie et apporte brillance et vitalité.',
  'huile-purifiante-fortifiante-grow-oil-pour-tous-types-de-cheveux-azaely':
    'Huile Grow Oil purifiante et fortifiante pour tous cheveux. Stimule la pousse, purifie le cuir chevelu et fortifie.',
  'kit-celeste-baume-hydra-mousse-serviette-microfibre-absorbante':
    'Kit Céleste : Baume Hydra-Mousse + Serviette Microfibre. Duo parfait pour une hydratation et un séchage doux.',
  'kit-hydratation-intense-shampoing-luxuria-creme-luxetrio-azaely':
    'Kit Hydratation Intense : Shampoing Luxuria + Crème LuxeTrio. Routine complète pour cheveux bouclés hydratés et définis.',
  'kit-naturel-fortifusion-shampooing-volubrillance-la-creme-fortisoin-pour-tous-type-de-cheveux':
    'Kit FortiFusion : Shampoing VoluBrillance + Masque FortiSoin. Cheveux fortifiés, volumineux et brillants.',
  'kit-soins-capillaires-naturels-coffret-reparation-mise-en-forme-pour-tous-types-de-cheveux-azaely':
    'Coffret soins capillaires réparation et coiffage. Routine naturelle complète pour tous types de cheveux.',
  'kit-trio-harmonie-savonneuse-savons-luxuria-purete-giroflee-douceur-soufre-azaely':
    'Kit Trio de savons naturels Azaely : Luxuria, Pureté Giroflée, DouceurSoufre. Coffret idéal pour peau et cheveux.',
  'masque-capillaire-reparateur-hydratant-azaely-nutrition-profonde-pour-cheveux-secs-abimes-ternes':
    'Masque capillaire réparateur et hydratant. Nutrition profonde pour cheveux secs, abîmés et ternes. Brillance retrouvée.',
  'mini-masseur-de-cuir-chevelu-en-silicone-souple-distributeur-de-liqiuide-peigne-apllicateur-dhuile-capilaire':
    'Mini masseur cuir chevelu silicone avec applicateur d\'huile intégré. Stimule la circulation et facilite l\'application.',
  'savon-douceursoufre-savon-naturel-purifiant-pour-peaux-grasses-mixtes-et-cheveux-gras-azaely':
    'Savon DouceurSoufre naturel purifiant pour peaux grasses, mixtes et cheveux gras. Régule le sébum en douceur.',
  'savon-pureluxuria-savon-naturel-hydratant-pour-cheveux-boucles-peau-corps-azaely':
    'Savon PureLuxuria hydratant pour cheveux bouclés, peau et corps. Formule naturelle douce pour toute la famille.',
  'savon-purete-giroflee-savon-naturel-pour-tous-types-de-peau-azaely':
    'Savon Pureté Giroflée naturel pour tous types de peau. Purifie, apaise et laisse la peau douce et nette.',
  'serviette-microfibre-pour-cheveux-sechage-doux-protection-capillaire-azaely':
    'Serviette microfibre Azaely pour cheveux. Séchage ultra-doux, anti-frisottis, réduit la casse et le temps de séchage.',
  'shampoing-naturel-hydratant-pour-cheveux-boucles-afro-textures-luxuria-azaely':
    'Shampoing Luxuria naturel sans sulfates pour cheveux bouclés, afro et texturés. Nettoie, hydrate et définit les boucles.',
  'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely':
    'Shampoing naturel sans sulfates pour cheveux secs et abîmés. Nettoyage doux, hydratation intense, fibre renforcée.',
  'shampoing-volubrillance-volumi-shine-pour-tous-type-de-cheveux':
    'Shampoing VoluBrillance naturel pour tous cheveux. Donne volume, brillance et légèreté à chaque lavage.',
};

// ============================================================
// TEMPLATES FAQ PAR CATÉGORIE
// ============================================================

const FAQ_APRES_SHAMPOING = `
<h2>Questions fréquentes</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Dois-je rincer l'après-shampoing ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, rincez abondamment après 2 à 3 minutes de pose. Pour un soin sans rinçage, optez pour notre Crème LuxeTrio.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Convient-il aux cheveux fins ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, appliquez une petite quantité uniquement sur les longueurs et pointes pour nourrir sans alourdir les cheveux fins.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on l'appliquer sur le cuir chevelu ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Concentrez-vous sur les longueurs et pointes. Évitez les racines pour ne pas surcharger le cuir chevelu.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Combien de temps laisser poser ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Laissez poser 2 à 3 minutes pour une nutrition optimale. Pour un soin plus intense, prolongez jusqu'à 5 minutes sous une charlotte chauffante.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">À quelle fréquence utiliser cet après-shampoing ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Utilisez-le après chaque shampoing pour maintenir une hydratation optimale et faciliter le démêlage au quotidien.</p>
    </div>
  </div>
</div>`.trim();

const FAQ_SHAMPOING = `
<h2>Questions fréquentes</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">À quelle fréquence utiliser ce shampoing ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Utilisez ce shampoing 2 à 3 fois par semaine pour un nettoyage doux sans décaper vos cheveux. Il convient également à un usage plus fréquent grâce à sa formule douce sans sulfates.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Convient-il aux cheveux colorés ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, sa formule sans sulfates respecte la couleur et aide à préserver l'éclat de votre coloration tout en nettoyant en douceur.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Fait-il mousser beaucoup ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Comme tout shampoing naturel sans sulfates, il mousse moins qu'un shampoing conventionnel. C'est normal et signe d'une formule douce. Appliquez en deux fois si vous souhaitez plus de mousse.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Est-il adapté aux cheveux bouclés ou afro ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Absolument. Sa formule hydratante respecte la texture des cheveux bouclés, frisés et afro en les nettoyant sans les déshydrater ni perturber leur structure naturelle.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on l'utiliser sur les enfants ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Sa formule douce sans sulfates, silicones ni parabènes le rend adapté à toute la famille. Évitez le contact avec les yeux.</p>
    </div>
  </div>
</div>`.trim();

const FAQ_MASQUE = `
<h2>Questions fréquentes</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Combien de temps laisser poser le masque ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Laissez poser 10 à 20 minutes pour une action intensive. Pour un soin express, 5 minutes suffisent pour un boost d'hydratation. Pour un soin profond, laissez poser toute la nuit sous une charlotte.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">À quelle fréquence l'utiliser ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Utilisez ce masque 1 à 2 fois par semaine pour maintenir l'hydratation et la réparation. Pour cheveux très abîmés, 2 fois par semaine pendant le premier mois est recommandé.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Remplace-t-il l'après-shampoing ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Le masque est un soin profond hebdomadaire. Pour un démêlage quotidien, associez-le à notre après-shampoing naturel pour une routine complète.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Convient-il aux cheveux très abîmés ou traités chimiquement ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, ce masque est spécialement formulé pour réparer les cheveux abîmés, cassants, colorés ou traités chimiquement grâce à ses actifs nourrissants et fortifiants.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on l'appliquer sur cheveux secs ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Pour une meilleure pénétration des actifs, appliquez sur cheveux propres et humides. Sur cheveux secs, il peut être utilisé comme bain d'huile avant shampoing.</p>
    </div>
  </div>
</div>`.trim();

const FAQ_HUILE = `
<h2>Questions fréquentes</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Sur cheveux secs ou humides ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Vous pouvez l'appliquer sur cheveux humides pour sceller l'hydratation (méthode LOC), ou sur cheveux secs en finition pour ajouter de la brillance et dompter les frisottis.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Quelle quantité utiliser ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Commencez par 3 à 4 gouttes et augmentez selon vos besoins. La règle : moins c'est plus. Concentrez-vous sur les longueurs et pointes en évitant les racines.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-elle alourdir les cheveux ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">En quantité raisonnable, cette huile nourrit sans alourdir. Évitez les racines et les excès. Pour les cheveux fins, préférez une application sur les pointes uniquement.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on l'utiliser en bain d'huile avant shampoing ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, c'est l'une des meilleures utilisations. Appliquez généreusement sur cheveux secs, massez le cuir chevelu, laissez poser 1 heure ou toute la nuit, puis shampouinez normalement.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Convient-elle à tous les types de cheveux ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, cette huile est adaptée à tous les types de cheveux : lisses, bouclés, frisés, afro, secs ou normaux. Ajustez simplement la quantité selon votre texture.</p>
    </div>
  </div>
</div>`.trim();

const FAQ_CREME_SANS_RINCAGE = `
<h2>Questions fréquentes</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Dois-je rincer ce soin ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Non, c'est un soin sans rinçage. Appliquez-le sur cheveux humides ou secs et coiffez comme d'habitude. Il agit toute la journée pour nourrir et définir.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Quand l'appliquer ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Après le shampoing sur cheveux humides pour définir les boucles, ou entre deux lavages sur cheveux secs pour raviver les boucles et lutter contre les frisottis.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Convient-elle aux cheveux fins ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, utilisez une petite quantité et évitez les racines pour ne pas alourdir les cheveux fins. Sa texture légère est adaptée à toutes les densités capillaires.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Aide-t-elle à définir les boucles ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, c'est l'un de ses atouts principaux. Elle définit et discipline les boucles tout en réduisant les frisottis pour un résultat naturel et durable.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on l'utiliser comme conditionneur sans rinçage ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, c'est exactement son rôle. Appliquée après le shampoing sur cheveux humides, elle agit comme un conditionneur sans rinçage qui nourrit et facilite le démêlage.</p>
    </div>
  </div>
</div>`.trim();

const FAQ_BAUME = `
<h2>Questions fréquentes</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Ce baume convient-il aux peaux sensibles ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, sa formulation naturelle et douce est adaptée aux peaux sensibles et délicates. Sans parfum synthétique, silicones ni parabènes.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on l'utiliser sur cheveux et peau simultanément ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, c'est sa force principale. Ce baume polyvalent hydrate la peau et nourrit les cheveux avec la même formule ultra-nourrissante.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on l'utiliser tous les jours ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, sa formule légère convient à un usage quotidien. Appliquez une petite quantité sur les longueurs et pointes pour nourrir sans alourdir.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Remplace-t-il ma crème hydratante corps ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, il peut être utilisé comme crème hydratante pour le corps. Pour le visage, appliquez en petite quantité et évitez le contour des yeux.</p>
    </div>
  </div>
</div>`.trim();

const FAQ_KIT = `
<h2>Questions fréquentes</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Est-ce économique par rapport à l'achat séparé ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, le kit est proposé à un tarif avantageux par rapport à l'achat des produits individuellement. C'est aussi l'occasion de découvrir plusieurs produits Azaely en une seule commande.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Convient-il aux débutants avec les soins naturels ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Absolument, ce kit est conçu pour offrir une routine simple et efficace, parfaite pour découvrir les soins naturels Azaely avec des produits complémentaires.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on offrir ce kit en cadeau ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, ce kit fait un excellent cadeau avec son contenu complet. Vous pouvez également commander une carte cadeau Azaely pour laisser le choix.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Les produits du kit peuvent-ils être utilisés séparément ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, chaque produit du kit est également disponible à l'achat séparé. Le kit permet simplement de les tester ensemble pour une routine complète et cohérente.</p>
    </div>
  </div>
</div>`.trim();

const FAQ_ACCESSOIRE = `
<h2>Questions fréquentes</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Comment entretenir cet accessoire ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Lavez à la main ou en machine sur cycle délicat avec un détergent doux. Séchez à l'air libre pour préserver la qualité du tissu et prolonger sa durée de vie.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Convient-il à tous les types de cheveux ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, cet accessoire est conçu pour protéger tous les types de cheveux : lisses, ondulés, bouclés, frisés ou afro.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Quels sont les bénéfices par rapport au coton ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Le satin et la microfibre génèrent beaucoup moins de frottements que le coton. Résultat : moins de frisottis, moins de casse, une meilleure conservation de l'hydratation et du coiffage.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Quelle taille choisir ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">La taille standard convient à la majorité des coiffures. Pour des cheveux très volumineux ou des locks, choisissez la taille la plus grande disponible.</p>
    </div>
  </div>
</div>`.trim();

const FAQ_SAVON = `
<h2>Questions fréquentes</h2>
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Ce savon convient-il aux peaux sensibles ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Sa formule naturelle sans sulfates ni parabènes est adaptée aux peaux sensibles. En cas de peau très réactive, testez sur une petite zone avant usage complet.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on l'utiliser sur le visage ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Oui, il est doux enough pour le visage. Évitez le contour des yeux et rincez abondamment.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Peut-on l'utiliser sur les cheveux ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Certains de nos savons sont formulés pour cheveux et corps. Consultez la description pour confirmer l'usage capillaire recommandé pour ce produit spécifique.</p>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Comment conserver ce savon pour qu'il dure longtemps ?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Conservez-le sur un porte-savon drainant entre chaque utilisation. Évitez de le laisser dans l'eau. Un savon bien drainé dure deux fois plus longtemps.</p>
    </div>
  </div>
</div>`.trim();

// ============================================================
// MAPPING CATÉGORIE → FAQ
// ============================================================
const CATEGORY_FAQ_MAP = {
  'apres-shampooing': FAQ_APRES_SHAMPOING,
  'shampoing': FAQ_SHAMPOING,
  'masque': FAQ_MASQUE,
  'creme-fortisoin': FAQ_MASQUE,
  'huile': FAQ_HUILE,
  'creme-capillaire': FAQ_CREME_SANS_RINCAGE,
  'baume': FAQ_BAUME,
  'kit': FAQ_KIT,
  'bonnet': FAQ_ACCESSOIRE,
  'foulard': FAQ_ACCESSOIRE,
  'serviette': FAQ_ACCESSOIRE,
  'savon': FAQ_SAVON,
};

function getFAQForHandle(handle) {
  for (const [key, faq] of Object.entries(CATEGORY_FAQ_MAP)) {
    if (handle.startsWith(key) || handle.includes(key)) return faq;
  }
  return '';
}

// ============================================================
// SECTION RÉSULTATS ATTENDUS PAR PRODUIT
// ============================================================
const RESULTATS_MAP = {
  'apres-shampooing-naturel': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cheveux plus doux et démêlage facilité</li>
<li><strong>Après 2 semaines :</strong> fibre capillaire visiblement plus nourrie et souple</li>
<li><strong>Après 1 mois :</strong> cheveux plus brillants, moins cassants, coiffage simplifié</li>
</ul>`,
  'shampoing-naturel': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cheveux propres, doux et sans résidu</li>
<li><strong>Après 2 semaines :</strong> cuir chevelu équilibré, cheveux plus hydratés</li>
<li><strong>Après 1 mois :</strong> fibre capillaire renforcée, éclat naturel retrouvé</li>
</ul>`,
  'shampoing-volubrillance': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cheveux propres, volumineux et brillants</li>
<li><strong>Après 2 semaines :</strong> volume maintenu plus longtemps, brillance naturelle</li>
<li><strong>Après 1 mois :</strong> fibre renforcée, cheveux légers et éclatants</li>
</ul>`,
  'huile-capillaire': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> brillance immédiate, frisottis réduits</li>
<li><strong>Après 2 semaines :</strong> cheveux plus souples et nourris visiblement</li>
<li><strong>Après 1 mois :</strong> fibre capillaire renforcée, longueurs préservées</li>
</ul>`,
  'huile-purifiante': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cuir chevelu purifié, brillance retrouvée</li>
<li><strong>Après 2 semaines :</strong> pousse stimulée, fibre fortifiée</li>
<li><strong>Après 1 mois :</strong> cheveux plus denses, cuir chevelu équilibré</li>
</ul>`,
  'creme-fortisoin': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cheveux plus doux et réparés visiblement</li>
<li><strong>Après 2 semaines (2x/semaine) :</strong> fibre renforcée, moins de casse</li>
<li><strong>Après 1 mois :</strong> cheveux réparés, brillants et résistants</li>
</ul>`,
  'masque-capillaire': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> nutrition profonde, cheveux plus doux</li>
<li><strong>Après 2 semaines :</strong> fibre renforcée, ternes disparaissent</li>
<li><strong>Après 1 mois :</strong> cheveux restaurés, brillants et hydratés durablement</li>
</ul>`,
  'bonnet-de-nuit': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère nuit :</strong> moins de frisottis et cheveux préservés au réveil</li>
<li><strong>Après 1 semaine :</strong> réduction visible de la casse nocturne</li>
<li><strong>Après 1 mois :</strong> coiffage simplifié, hydratation mieux conservée</li>
</ul>`,
  'foulard-satine': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> protection immédiate contre les frottements</li>
<li><strong>Après 1 semaine :</strong> frisottis réduits, coiffure mieux conservée</li>
<li><strong>Après 1 mois :</strong> cheveux plus sains, moins cassants</li>
</ul>`,
  'serviette-microfibre': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> séchage 2x plus rapide, frisottis réduits</li>
<li><strong>Après 2 semaines :</strong> moins de casse post-douche, boucles mieux définies</li>
<li><strong>Après 1 mois :</strong> fibre capillaire moins fragilisée, routine optimisée</li>
</ul>`,
  'savon': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> peau nette, douce et fraîche</li>
<li><strong>Après 2 semaines :</strong> peau plus équilibrée, impuretés réduites</li>
<li><strong>Après 1 mois :</strong> teint unifié, peau nourrie et purifiée durablement</li>
</ul>`,
  'kit-celeste': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère semaine :</strong> duo parfait, hydratation et séchage optimisés</li>
<li><strong>Après 2 semaines :</strong> synergie baume + microfibre, résultats amplifiés</li>
<li><strong>Après 1 mois :</strong> routine simplifiée, cheveux et peau transformés</li>
</ul>`,
  'kit-hydratation': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère semaine :</strong> cheveux bouclés hydratés et définis</li>
<li><strong>Après 2 semaines :</strong> boucles régulières, frisottis maîtrisés</li>
<li><strong>Après 1 mois :</strong> routine complète, cheveux transformés</li>
</ul>`,
  'kit-naturel': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère semaine :</strong> cheveux fortifiés et brillants</li>
<li><strong>Après 2 semaines :</strong> volume retrouvé, fibre renforcée</li>
<li><strong>Après 1 mois :</strong> cheveux résistants et lumineux</li>
</ul>`,
  'kit-soins': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère semaine :</strong> routine complète, cheveux propres et nourris</li>
<li><strong>Après 2 semaines :</strong> réparation visible, coiffage facilité</li>
<li><strong>Après 1 mois :</strong> cheveux transformés, soyeux et résistants</li>
</ul>`,
  'kit-trio': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> peau et cheveux propres et doux</li>
<li><strong>Après 2 semaines :</strong> trio complémentaire, peau équilibrée</li>
<li><strong>Après 1 mois :</strong> routine savons naturels ancrée, peau purifiée</li>
</ul>`,
  'duos-douceur': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cheveux propres, démêlés et doux</li>
<li><strong>Après 2 semaines :</strong> fibre nourrie, lavage agréable</li>
<li><strong>Après 1 mois :</strong> routine naturelle complète, cheveux revitalisés</li>
</ul>`,
  'mini-masseur': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> application d'huile facilitée, massage relaxant</li>
<li><strong>Après 2 semaines :</strong> cuir chevelu stimulé, absorption des soins améliorée</li>
<li><strong>Après 1 mois :</strong> pousse stimulée, soins mieux pénétrés</li>
</ul>`,
  'masque-UNUSED': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cheveux visiblement plus doux et hydratés</li>
<li><strong>Après 2 semaines (2x/semaine) :</strong> fibre renforcée, moins de casse</li>
<li><strong>Après 1 mois :</strong> cheveux réparés, brillants et résistants</li>
</ul>`,
  'huile-UNUSED': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> brillance immédiate et frisottis réduits</li>
<li><strong>Après 2 semaines :</strong> cheveux plus souples et nourrissage visible</li>
<li><strong>Après 1 mois :</strong> fibre capillaire renforcée, longueurs préservées</li>
</ul>`,
  'baume-hydratant': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> peau et cheveux immédiatement plus doux</li>
<li><strong>Après 1 semaine :</strong> hydratation durable tout au long de la journée</li>
<li><strong>Après 1 mois :</strong> peau et fibre capillaire nettement nourries et protégées</li>
</ul>`,
  'creme-capillaire-naturelle': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> boucles définies et frisottis maîtrisés</li>
<li><strong>Après 2 semaines :</strong> cheveux plus hydratés, boucles mieux formées</li>
<li><strong>Après 1 mois :</strong> routine capillaire simplifiée, boucles régulières et soyeuses</li>
</ul>`,
  'kit-UNUSED': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère semaine :</strong> routine simplifiée et cheveux visiblement plus beaux</li>
<li><strong>Après 2 semaines :</strong> synergie des produits, résultats amplifiés</li>
<li><strong>Après 1 mois :</strong> cheveux transformés, brillants, nourris et protégés</li>
</ul>`,
};

function getResultatsForHandle(handle) {
  // Priorité aux clés les plus longues (plus spécifiques)
  const sorted = Object.entries(RESULTATS_MAP).sort((a,b) => b[0].length - a[0].length);
  for (const [key, section] of sorted) {
    if (key.includes('UNUSED')) continue;
    if (handle.startsWith(key) || handle.includes(key)) return section;
  }
  return '';
}

// ============================================================
// PARSER CSV MANUEL (compatible avec champs multi-lignes)
// ============================================================
function parseCSV(content) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if (ch === '\n' && !inQuotes) {
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
    } else {
      current += ch;
    }
  }
  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

function serializeCSV(rows) {
  return rows.map(row =>
    row.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return '"' + cell.replace(/"/g, '""') + '"';
      }
      return cell;
    }).join(',')
  ).join('\n');
}

// ============================================================
// P1 — CATÉGORIES CORRIGÉES (Google Shopping taxonomy)
// ============================================================
const CATEGORIES_FIXED = {
  'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises':
    'Health & Beauty > Personal Care > Hair Care',
  'huile-capillaire-naturel-cheveux':
    'Health & Beauty > Personal Care > Hair Care',
  'huile-purifiante-fortifiante-grow-oil-pour-tous-types-de-cheveux-azaely':
    'Health & Beauty > Personal Care > Hair Care',
  'kit-naturel-fortifusion-shampooing-volubrillance-la-creme-fortisoin-pour-tous-type-de-cheveux':
    'Health & Beauty > Personal Care > Hair Care',
  'serviette-microfibre-pour-cheveux-sechage-doux-protection-capillaire-azaely':
    'Health & Beauty > Personal Care > Hair Care',
  'mini-masseur-de-cuir-chevelu-en-silicone-souple-distributeur-de-liqiuide-peigne-apllicateur-dhuile-capilaire':
    'Health & Beauty > Personal Care > Hair Care',
  'meches-boucles':
    'Health & Beauty > Personal Care > Hair Care',
  'meches-tresses':
    'Health & Beauty > Personal Care > Hair Care',
};

// ============================================================
// P2 — ALT TEXT IMAGES OPTIMISÉS
// ============================================================
const ALT_TEXT_MAP = {
  'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux':
    'Après-shampoing naturel Azaely – Flacon 250ml hydratant démêlant',
  'baume-hydratant-whipped-cream-hydratation-intense-pour-tous-types-de-cheveux-peau-azaely':
    'Baume Hydra-Mousse Azaely – Soin polyvalent cheveux et peau',
  'bonnet-de-nuit-satine-protection-douce-anti-frisottis-pour-tous-types-de-cheveux-azaely':
    'Bonnet de nuit satiné Azaely – Protection anti-frisottis toutes textures',
  'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises':
    'Crème LuxeTrio Azaely – Soin sans rinçage cheveux bouclés afro frisés',
  'creme-fortisoin-masque-capillaire-naturel-reparateur-et-fortifiant-azaely':
    'Masque FortiSoin Azaely – Réparation et fortification cheveux abîmés',
  'duos-douceur-capillairekit-shampoing-apres-shampoing-naturel':
    'Duo Douceur Capillaire Azaely – Kit shampoing et après-shampoing naturels',
  'foulard-satine-pour-tous-types-de-cheveux-accessoire-protecteur-style-azaely':
    'Foulard satiné Azaely – Accessoire protecteur stylé tous types de cheveux',
  'huile-capillaire-naturel-cheveux':
    'Huile capillaire naturelle Azaely – Brillance et nutrition cheveux ternes',
  'huile-capillaire-naturelle-nourrissante-pour-cheveux-abimes-cassants-et-ternes':
    'Huile nourrissante Azaely – Réparation cheveux abîmés cassants et ternes',
  'huile-purifiante-fortifiante-grow-oil-pour-tous-types-de-cheveux-azaely':
    'Huile Grow Oil Azaely – Purification et fortification tous cheveux',
  'kit-celeste-baume-hydra-mousse-serviette-microfibre-absorbante':
    'Kit Céleste Azaely – Baume Hydra-Mousse et serviette microfibre',
  'kit-hydratation-intense-shampoing-luxuria-creme-luxetrio-azaely':
    'Kit Hydratation Intense Azaely – Shampoing Luxuria et Crème LuxeTrio',
  'kit-naturel-fortifusion-shampooing-volubrillance-la-creme-fortisoin-pour-tous-type-de-cheveux':
    'Kit FortiFusion Azaely – Shampoing VoluBrillance et Masque FortiSoin',
  'kit-soins-capillaires-naturels-coffret-reparation-mise-en-forme-pour-tous-types-de-cheveux-azaely':
    'Coffret soins capillaires Azaely – Réparation et mise en forme complète',
  'kit-trio-harmonie-savonneuse-savons-luxuria-purete-giroflee-douceur-soufre-azaely':
    'Kit Trio Savons Azaely – Luxuria, Pureté Giroflée et DouceurSoufre',
  'masque-capillaire-reparateur-hydratant-azaely-nutrition-profonde-pour-cheveux-secs-abimes-ternes':
    'Masque Azaely Réparateur Hydratant – Nutrition profonde cheveux secs abîmés',
  'mini-masseur-de-cuir-chevelu-en-silicone-souple-distributeur-de-liqiuide-peigne-apllicateur-dhuile-capilaire':
    'Mini masseur cuir chevelu Azaely – Applicateur huile silicone souple',
  'savon-douceursoufre-savon-naturel-purifiant-pour-peaux-grasses-mixtes-et-cheveux-gras-azaely':
    'Savon DouceurSoufre Azaely – Purifiant naturel peaux grasses et mixtes',
  'savon-pureluxuria-savon-naturel-hydratant-pour-cheveux-boucles-peau-corps-azaely':
    'Savon PureLuxuria Azaely – Hydratant naturel cheveux bouclés peau et corps',
  'savon-purete-giroflee-savon-naturel-pour-tous-types-de-peau-azaely':
    'Savon Pureté Giroflée Azaely – Naturel pour tous types de peau',
  'serviette-microfibre-pour-cheveux-sechage-doux-protection-capillaire-azaely':
    'Serviette microfibre Azaely – Séchage doux anti-frisottis protection capillaire',
  'shampoing-naturel-hydratant-pour-cheveux-boucles-afro-textures-luxuria-azaely':
    'Shampoing Luxuria Azaely – Naturel hydratant cheveux bouclés afro texturés',
  'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely':
    'Shampoing naturel Azaely – Hydratant cheveux secs abîmés et cassants',
  'shampoing-volubrillance-volumi-shine-pour-tous-type-de-cheveux':
    'Shampoing VoluBrillance Azaely – Volume et brillance tous types de cheveux',
};

// ============================================================
// P3 — INCI PAR PRODUIT (liste officielle ingrédients)
// ============================================================
const INCI_MAP = {
  'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux':
    'Aqua, Cetearyl Alcohol, Behentrimonium Chloride, Argania Spinosa Kernel Oil, Cocos Nucifera Oil, Simmondsia Chinensis Seed Oil, Butyrospermum Parkii Butter, Aloe Barbadensis Leaf Juice, Oryza Sativa Extract, Panthenol, Glycerin, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.',
  'shampoing-naturel-hydratant-pour-cheveux-boucles-afro-textures-luxuria-azaely':
    'Aqua, Sodium Cocoyl Isethionate, Cocamidopropyl Betaine, Argania Spinosa Kernel Oil, Cocos Nucifera Oil, Aloe Barbadensis Leaf Juice, Oryza Sativa Extract, Panthenol, Glycerin, Guar Hydroxypropyltrimonium Chloride, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.',
  'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely':
    'Aqua, Sodium Cocoyl Isethionate, Cocamidopropyl Betaine, Butyrospermum Parkii Butter, Argania Spinosa Kernel Oil, Cocos Nucifera Oil, Aloe Barbadensis Leaf Juice, Panthenol, Glycerin, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.',
  'shampoing-volubrillance-volumi-shine-pour-tous-type-de-cheveux':
    'Aqua, Sodium Cocoyl Isethionate, Cocamidopropyl Betaine, Hydrolyzed Keratin, Panthenol, Argania Spinosa Kernel Oil, Glycerin, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.',
  'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises':
    'Aqua, Abelmoschus Esculentus Fruit Extract, Butyrospermum Parkii Butter, Vegetable Oils Blend (Argania Spinosa, Simmondsia Chinensis, Cocos Nucifera), Glycerin, Cetearyl Alcohol, Panthenol, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.',
  'creme-fortisoin-masque-capillaire-naturel-reparateur-et-fortifiant-azaely':
    'Aqua, Butyrospermum Parkii Butter, Argania Spinosa Kernel Oil, Simmondsia Chinensis Seed Oil, Aloe Barbadensis Leaf Juice, Cocos Nucifera Oil, Cetearyl Alcohol, Glycerin, Panthenol, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.',
  'masque-capillaire-reparateur-hydratant-azaely-nutrition-profonde-pour-cheveux-secs-abimes-ternes':
    'Aqua, Butyrospermum Parkii Butter, Argania Spinosa Kernel Oil, Aloe Barbadensis Leaf Juice, Cocos Nucifera Oil, Hydrolyzed Keratin, Cetearyl Alcohol, Glycerin, Panthenol, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.',
  'baume-hydratant-whipped-cream-hydratation-intense-pour-tous-types-de-cheveux-peau-azaely':
    'Butyrospermum Parkii Butter, Theobroma Cacao Seed Butter, Adansonia Digitata Seed Oil, Persea Gratissima Oil, Cocos Nucifera Oil, Glycerin, Cetearyl Alcohol, Aqua, Phenoxyethanol, Ethylhexylglycerin.',
  'huile-capillaire-naturel-cheveux':
    'Argania Spinosa Kernel Oil, Cocos Nucifera Oil, Ricinus Communis Seed Oil, Simmondsia Chinensis Seed Oil, Adansonia Digitata Seed Oil, Tocopherol.',
  'huile-capillaire-naturelle-nourrissante-pour-cheveux-abimes-cassants-et-ternes':
    'Argania Spinosa Kernel Oil, Cocos Nucifera Oil, Ricinus Communis Seed Oil, Adansonia Digitata Seed Oil, Persea Gratissima Oil, Tocopherol.',
  'huile-purifiante-fortifiante-grow-oil-pour-tous-types-de-cheveux-azaely':
    'Cocos Nucifera Oil, Ricinus Communis Seed Oil, Azadirachta Indica Seed Oil, Argania Spinosa Kernel Oil, Simmondsia Chinensis Seed Oil, Rosmarinus Officinalis Leaf Oil, Tocopherol.',
};

// ============================================================
// P4 — COÛT PAR UTILISATION
// ============================================================
const COUT_USAGE_MAP = {
  'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux':
    { cout: '0,58 €', usage: 'par utilisation', nb: '~50 utilisations pour 250ml' },
  'shampoing-naturel-hydratant-pour-cheveux-boucles-afro-textures-luxuria-azaely':
    { cout: '0,38 €', usage: 'par lavage', nb: '~50 lavages pour 250ml' },
  'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely':
    { cout: '0,56 €', usage: 'par lavage', nb: '~50 lavages pour 250ml' },
  'shampoing-volubrillance-volumi-shine-pour-tous-type-de-cheveux':
    { cout: '0,32 €', usage: 'par lavage', nb: '~50 lavages pour 250ml' },
  'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises':
    { cout: '0,57 €', usage: 'par utilisation', nb: '~40 utilisations pour 250ml' },
  'creme-fortisoin-masque-capillaire-naturel-reparateur-et-fortifiant-azaely':
    { cout: '1,10 €', usage: 'par masque', nb: '~20 masques pour 200ml' },
  'masque-capillaire-reparateur-hydratant-azaely-nutrition-profonde-pour-cheveux-secs-abimes-ternes':
    { cout: '1,45 €', usage: 'par masque', nb: '~20 masques pour 200ml' },
  'baume-hydratant-whipped-cream-hydratation-intense-pour-tous-types-de-cheveux-peau-azaely':
    { cout: '0,71 €', usage: 'par utilisation', nb: '~40 utilisations pour 200ml' },
  'huile-capillaire-naturel-cheveux':
    { cout: '0,15 €', usage: 'par utilisation', nb: '~80 utilisations pour 100ml' },
  'huile-capillaire-naturelle-nourrissante-pour-cheveux-abimes-cassants-et-ternes':
    { cout: '0,19 €', usage: 'par utilisation', nb: '~80 utilisations pour 100ml' },
  'huile-purifiante-fortifiante-grow-oil-pour-tous-types-de-cheveux-azaely':
    { cout: '0,22 €', usage: 'par utilisation', nb: '~80 utilisations pour 100ml' },
};

function getCoutUsageBlock(handle) {
  const c = COUT_USAGE_MAP[handle];
  if (!c) return '';
  return `<p><strong>Economique :</strong> seulement <strong>${c.cout} ${c.usage}</strong> (${c.nb}).</p>`;
}

// ============================================================
// P5 — CROSS-SELLS PAR PRODUIT
// ============================================================
const CROSS_SELLS_MAP = {
  'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux': [
    { title: 'Shampoing Luxuria', handle: 'shampoing-naturel-hydratant-pour-cheveux-boucles-afro-textures-luxuria-azaely', role: 'nettoie avant votre soin' },
    { title: 'Crème LuxeTrio', handle: 'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises', role: 'soin sans rinçage complémentaire' },
    { title: 'Masque FortiSoin', handle: 'creme-fortisoin-masque-capillaire-naturel-reparateur-et-fortifiant-azaely', role: 'traitement profond 1x/semaine' },
  ],
  'shampoing-naturel-hydratant-pour-cheveux-boucles-afro-textures-luxuria-azaely': [
    { title: 'Après-shampoing naturel', handle: 'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux', role: 'nourrit après le lavage' },
    { title: 'Crème LuxeTrio', handle: 'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises', role: 'définit et hydrate sans rinçage' },
    { title: 'Kit Hydratation Intense', handle: 'kit-hydratation-intense-shampoing-luxuria-creme-luxetrio-azaely', role: 'duo complet en kit avantageux' },
  ],
  'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely': [
    { title: 'Après-shampoing naturel', handle: 'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux', role: 'démêle et nourrit en complément' },
    { title: 'Masque FortiSoin', handle: 'creme-fortisoin-masque-capillaire-naturel-reparateur-et-fortifiant-azaely', role: 'réparation profonde 1x/semaine' },
    { title: 'Huile capillaire nourrissante', handle: 'huile-capillaire-naturelle-nourrissante-pour-cheveux-abimes-cassants-et-ternes', role: 'scelle l\'hydratation en finition' },
  ],
  'shampoing-volubrillance-volumi-shine-pour-tous-type-de-cheveux': [
    { title: 'Après-shampoing naturel', handle: 'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux', role: 'nourrit sans alourdir' },
    { title: 'Kit FortiFusion', handle: 'kit-naturel-fortifusion-shampooing-volubrillance-la-creme-fortisoin-pour-tous-type-de-cheveux', role: 'duo complet volume + soin' },
  ],
  'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises': [
    { title: 'Shampoing Luxuria', handle: 'shampoing-naturel-hydratant-pour-cheveux-boucles-afro-textures-luxuria-azaely', role: 'nettoyage doux avant application' },
    { title: 'Huile Grow Oil', handle: 'huile-purifiante-fortifiante-grow-oil-pour-tous-types-de-cheveux-azaely', role: 'scelle l\'hydratation sur les pointes' },
    { title: 'Kit Hydratation Intense', handle: 'kit-hydratation-intense-shampoing-luxuria-creme-luxetrio-azaely', role: 'kit complet à prix réduit' },
  ],
  'creme-fortisoin-masque-capillaire-naturel-reparateur-et-fortifiant-azaely': [
    { title: 'Shampoing naturel', handle: 'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely', role: 'prépare les cheveux avant le masque' },
    { title: 'Après-shampoing naturel', handle: 'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux', role: 'démêle après rinçage du masque' },
    { title: 'Huile capillaire nourrissante', handle: 'huile-capillaire-naturelle-nourrissante-pour-cheveux-abimes-cassants-et-ternes', role: 'finition nutritive sur pointes' },
  ],
  'masque-capillaire-reparateur-hydratant-azaely-nutrition-profonde-pour-cheveux-secs-abimes-ternes': [
    { title: 'Shampoing naturel', handle: 'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely', role: 'prépare les cheveux avant le masque' },
    { title: 'Après-shampoing naturel', handle: 'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux', role: 'entretien entre les masques' },
    { title: 'Huile capillaire nourrissante', handle: 'huile-capillaire-naturelle-nourrissante-pour-cheveux-abimes-cassants-et-ternes', role: 'scelle le soin en finition' },
  ],
  'huile-capillaire-naturel-cheveux': [
    { title: 'Shampoing naturel', handle: 'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely', role: 'nettoie avant le bain d\'huile' },
    { title: 'Après-shampoing naturel', handle: 'apres-shampooing-naturel-hydratant-pour-tous-types-de-cheveux', role: 'complète la routine hydratation' },
  ],
  'huile-capillaire-naturelle-nourrissante-pour-cheveux-abimes-cassants-et-ternes': [
    { title: 'Masque FortiSoin', handle: 'creme-fortisoin-masque-capillaire-naturel-reparateur-et-fortifiant-azaely', role: 'réparation profonde en synergie' },
    { title: 'Shampoing naturel', handle: 'shampoing-naturel-hydratant-pour-cheveux-secs-abimes-et-cassants-azaely', role: 'nettoie avant le bain d\'huile' },
  ],
  'huile-purifiante-fortifiante-grow-oil-pour-tous-types-de-cheveux-azaely': [
    { title: 'Shampoing Luxuria', handle: 'shampoing-naturel-hydratant-pour-cheveux-boucles-afro-textures-luxuria-azaely', role: 'prépare le cuir chevelu' },
    { title: 'Crème LuxeTrio', handle: 'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises', role: 'hydrate et définit les boucles' },
  ],
  'baume-hydratant-whipped-cream-hydratation-intense-pour-tous-types-de-cheveux-peau-azaely': [
    { title: 'Serviette microfibre', handle: 'serviette-microfibre-pour-cheveux-sechage-doux-protection-capillaire-azaely', role: 'séchage doux avant application' },
    { title: 'Kit Céleste', handle: 'kit-celeste-baume-hydra-mousse-serviette-microfibre-absorbante', role: 'duo baume + serviette à prix réduit' },
  ],
  'bonnet-de-nuit-satine-protection-douce-anti-frisottis-pour-tous-types-de-cheveux-azaely': [
    { title: 'Foulard satiné', handle: 'foulard-satine-pour-tous-types-de-cheveux-accessoire-protecteur-style-azaely', role: 'protection stylée au quotidien' },
    { title: 'Serviette microfibre', handle: 'serviette-microfibre-pour-cheveux-sechage-doux-protection-capillaire-azaely', role: 'séchage doux anti-frisottis' },
    { title: 'Crème LuxeTrio', handle: 'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises', role: 'hydrate avant de mettre le bonnet' },
  ],
  'foulard-satine-pour-tous-types-de-cheveux-accessoire-protecteur-style-azaely': [
    { title: 'Bonnet satiné', handle: 'bonnet-de-nuit-satine-protection-douce-anti-frisottis-pour-tous-types-de-cheveux-azaely', role: 'protection nocturne complète' },
    { title: 'Serviette microfibre', handle: 'serviette-microfibre-pour-cheveux-sechage-doux-protection-capillaire-azaely', role: 'séchage doux après le lavage' },
  ],
  'serviette-microfibre-pour-cheveux-sechage-doux-protection-capillaire-azaely': [
    { title: 'Bonnet satiné', handle: 'bonnet-de-nuit-satine-protection-douce-anti-frisottis-pour-tous-types-de-cheveux-azaely', role: 'protection nocturne en complément' },
    { title: 'Kit Céleste', handle: 'kit-celeste-baume-hydra-mousse-serviette-microfibre-absorbante', role: 'kit baume + serviette à prix réduit' },
    { title: 'Crème LuxeTrio', handle: 'creme-capillaire-naturelle-luxetrio-soin-sans-rincage-demelant-pour-cheveux-boucles-afro-et-frises', role: 'hydrate après le séchage' },
  ],
};

function getCrossSelleBlock(handle) {
  const items = CROSS_SELLS_MAP[handle];
  if (!items || items.length === 0) return '';
  const lis = items.map(i =>
    `<li><a href="/products/${i.handle}"><strong>${i.title}</strong></a> – ${i.role}</li>`
  ).join('\n');
  return `<h2>Complétez votre routine Azaely</h2>
<ul>
${lis}
</ul>`;
}

// ============================================================
// NETTOYAGE EMOJIS (sauf étoiles avis)
// ============================================================
function cleanEmojis(text) {
  // Supprimer les emojis courants sauf ★
  return text
    .replace(/♻️/g, '')
    .replace(/🌿/g, '')
    .replace(/✅/g, '')
    .replace(/👉/g, '')
    .replace(/💧/g, '')
    .replace(/⭐/g, '★')
    .replace(/\u{1F91D}|\u{1F3ED}|\u{1F4A1}|\u{2B50}|\u{1F914}|\u{1F68C}|\u{1F304}|\u{1F618}/gu, '')
    .trim();
}

// ============================================================
// TRANSFORMATION PRINCIPALE
// ============================================================
function transformRow(row, headers, isFirstVariant) {
  if (!isFirstVariant) return row;

  const idx = name => headers.indexOf(name);
  const handle = row[idx('Handle')];

  if (!handle || handle === 'Handle') return row;

  // P1 — Catégorie corrigée
  const fixedCat = CATEGORIES_FIXED[handle];
  if (fixedCat) {
    row[idx('Product Category')] = fixedCat;
  }

  // P2 — Alt text image (toutes les lignes du même handle via isFirstVariant=false géré en dehors)
  const altText = ALT_TEXT_MAP[handle];
  if (altText && row[idx('Image Alt Text')] !== undefined) {
    row[idx('Image Alt Text')] = altText;
  }

  // Meta Title optimisé
  const newTitle = META_TITLES[handle];
  if (newTitle) row[idx('SEO Title')] = newTitle;

  // Meta Description optimisée
  const newDesc = META_DESCRIPTIONS[handle];
  if (newDesc) row[idx('SEO Description')] = newDesc;

  // Body HTML
  const bodyIdx = idx('Body (HTML)');
  let body = row[bodyIdx];

  if (body && body.trim()) {
    // Nettoyer emojis
    body = cleanEmojis(body);

    // P3 — INCI : ajouter après la section ingrédients
    const inci = INCI_MAP[handle];
    if (inci && !body.includes('INCI')) {
      const inciBlock = `<h2>Liste INCI complète</h2>\n<p><small>${inci}</small></p>`;
      if (body.includes('<h2>Mode d\'utilisation')) {
        body = body.replace('<h2>Mode d\'utilisation', inciBlock + '\n<h2>Mode d\'utilisation');
      } else if (body.includes('<h2>Nos engagements')) {
        body = body.replace(/<h2>Nos engagements/, inciBlock + '\n<h2>Nos engagements');
      } else {
        body += '\n' + inciBlock;
      }
    }

    // P4 — Coût par utilisation : insérer après le 1er <p> intro
    const coutBlock = getCoutUsageBlock(handle);
    if (coutBlock && !body.includes('Economique')) {
      body = body.replace(/(<\/p>\s*)(<h2>)/, `$1${coutBlock}\n$2`);
    }

    // Résultats attendus
    const resultats = getResultatsForHandle(handle);
    if (resultats && !body.includes('Résultats attendus')) {
      if (body.includes('<h2>Nos engagements')) {
        body = body.replace(/<h2>Nos engagements/, resultats + '\n<h2>Nos engagements');
      } else if (body.includes('<h2>Questions fréquentes</h2>')) {
        body = body.replace('<h2>Questions fréquentes</h2>', resultats + '\n<h2>Questions fréquentes</h2>');
      } else if (body.includes('<h2>Avis clientes</h2>')) {
        body = body.replace('<h2>Avis clientes</h2>', resultats + '\n<h2>Avis clientes</h2>');
      } else {
        body += '\n' + resultats;
      }
    }

    // FAQ schema
    const faq = getFAQForHandle(handle);
    if (faq) {
      if (body.includes('<h2>Questions fréquentes</h2>')) {
        body = body.replace(
          /<h2>Questions fréquentes<\/h2>[\s\S]*?(?=<h2>Avis clientes|$)/,
          faq + '\n'
        );
      } else if (body.includes('<h2>Avis clientes</h2>')) {
        body = body.replace('<h2>Avis clientes</h2>', faq + '\n<h2>Avis clientes</h2>');
      } else {
        body += '\n' + faq;
      }
    }

    // P5 — Cross-sells : juste avant avis clientes ou en fin
    const crossSell = getCrossSelleBlock(handle);
    if (crossSell && !body.includes('Complétez votre routine')) {
      if (body.includes('<h2>Avis clientes</h2>')) {
        body = body.replace('<h2>Avis clientes</h2>', crossSell + '\n<h2>Avis clientes</h2>');
      } else {
        body += '\n' + crossSell;
      }
    }

    row[bodyIdx] = body;
  }

  return row;
}

// Appliquer alt text sur toutes les variantes image (pas seulement la première)
function transformAltTextAllVariants(row, headers) {
  const idx = name => headers.indexOf(name);
  const handle = row[idx('Handle')];
  if (!handle) return row;
  const altText = ALT_TEXT_MAP[handle];
  if (altText && row[idx('Image Alt Text')] !== undefined) {
    row[idx('Image Alt Text')] = altText;
  }
  return row;
}

// ============================================================
// MAIN
// ============================================================
const inputPath = path.join(__dirname, 'products_export.csv');
const outputPath = path.join(__dirname, 'products_export_optimized.csv');

const content = fs.readFileSync(inputPath, 'utf8');
const rows = parseCSV(content);
const headers = rows[0];

const seenHandles = new Set();
const transformedRows = rows.map((row, i) => {
  if (i === 0) return row;
  const handle = row[headers.indexOf('Handle')];
  const isFirst = !seenHandles.has(handle);
  if (handle) seenHandles.add(handle);
  const r = isFirst
    ? transformRow([...row], headers, true)
    : transformAltTextAllVariants([...row], headers);
  return r;
});

const output = serializeCSV(transformedRows);
fs.writeFileSync(outputPath, output, 'utf8');

// Stats
const statsHandles = new Set();
let cats = 0, alts = 0, inci = 0, cout = 0, cross = 0, faq = 0, res = 0;
transformedRows.slice(1).forEach(row => {
  const h = row[headers.indexOf('Handle')];
  if (!h || statsHandles.has(h)) return;
  statsHandles.add(h);
  const b = row[headers.indexOf('Body (HTML)')] || '';
  if (CATEGORIES_FIXED[h]) cats++;
  if (ALT_TEXT_MAP[h]) alts++;
  if (b.includes('INCI')) inci++;
  if (b.includes('Economique')) cout++;
  if (b.includes('Complétez votre routine')) cross++;
  if (b.includes('schema.org/FAQPage')) faq++;
  if (b.includes('Résultats attendus')) res++;
});

console.log('✅ CSV optimisé généré : products_export_optimized.csv');
console.log(`   P1 Catégories corrigées  : ${cats} produits`);
console.log(`   P2 Alt text images        : ${alts} produits`);
console.log(`   P3 INCI ajouté            : ${inci} produits`);
console.log(`   P4 Coût par utilisation   : ${cout} produits`);
console.log(`   P5 Cross-sells            : ${cross} produits`);
console.log(`   FAQ schema markup         : ${faq} produits`);
console.log(`   Résultats attendus        : ${res} produits`);
console.log(`   Total lignes CSV          : ${transformedRows.length - 1}`);
