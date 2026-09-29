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
    'Carte Cadeau Soins Naturels | Azaely',
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
  'apres-shampooing': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cheveux plus doux et démêlage facilité</li>
<li><strong>Après 2 semaines :</strong> fibre capillaire visiblement plus nourrie et souple</li>
<li><strong>Après 1 mois :</strong> cheveux plus brillants, moins cassants, coiffage simplifié</li>
</ul>`,
  'shampoing': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cheveux propres, doux et sans résidu</li>
<li><strong>Après 2 semaines :</strong> cuir chevelu équilibré, cheveux plus hydratés</li>
<li><strong>Après 1 mois :</strong> fibre capillaire renforcée, éclat naturel retrouvé</li>
</ul>`,
  'masque': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> cheveux visiblement plus doux et hydratés</li>
<li><strong>Après 2 semaines (2x/semaine) :</strong> fibre renforcée, moins de casse</li>
<li><strong>Après 1 mois :</strong> cheveux réparés, brillants et résistants</li>
</ul>`,
  'huile': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> brillance immédiate et frisottis réduits</li>
<li><strong>Après 2 semaines :</strong> cheveux plus souples et nourrissage visible</li>
<li><strong>Après 1 mois :</strong> fibre capillaire renforcée, longueurs préservées</li>
</ul>`,
  'baume': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> peau et cheveux immédiatement plus doux</li>
<li><strong>Après 1 semaine :</strong> hydratation durable tout au long de la journée</li>
<li><strong>Après 1 mois :</strong> peau et fibre capillaire nettement nourries et protégées</li>
</ul>`,
  'creme-capillaire': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère utilisation :</strong> boucles définies et frisottis maîtrisés</li>
<li><strong>Après 2 semaines :</strong> cheveux plus hydratés, boucles mieux formées</li>
<li><strong>Après 1 mois :</strong> routine capillaire simplifiée, boucles régulières et soyeuses</li>
</ul>`,
  'kit': `<h2>Résultats attendus</h2>
<ul>
<li><strong>Dès la 1ère semaine :</strong> routine simplifiée et cheveux visiblement plus beaux</li>
<li><strong>Après 2 semaines :</strong> synergie des produits, résultats amplifiés</li>
<li><strong>Après 1 mois :</strong> cheveux transformés, brillants, nourris et protégés</li>
</ul>`,
};

function getResultatsForHandle(handle) {
  for (const [key, section] of Object.entries(RESULTATS_MAP)) {
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
// TRANSFORMATION PRINCIPALE
// ============================================================
function transformRow(row, headers, isFirstVariant) {
  if (!isFirstVariant) return row;

  const idx = name => headers.indexOf(name);
  const handle = row[idx('Handle')];

  if (!handle || handle === 'Handle') return row;

  // 1. Meta Title optimisé
  const newTitle = META_TITLES[handle];
  if (newTitle) {
    row[idx('SEO Title')] = newTitle;
  }

  // 2. Meta Description optimisée
  const newDesc = META_DESCRIPTIONS[handle];
  if (newDesc) {
    row[idx('SEO Description')] = newDesc;
  }

  // 3. Body HTML : ajouter FAQ + Résultats attendus
  const bodyIdx = idx('Body (HTML)');
  let body = row[bodyIdx];

  if (body && body.trim()) {
    // Injecter résultats attendus avant la section engagements
    const resultats = getResultatsForHandle(handle);
    if (resultats && !body.includes('Résultats attendus')) {
      body = body.replace(/<h2>Nos engagements/, resultats + '\n<h2>Nos engagements');
    }

    // Remplacer la FAQ existante ou ajouter si absente
    const faq = getFAQForHandle(handle);
    if (faq) {
      if (body.includes('<h2>Questions fréquentes</h2>')) {
        // Remplacer la FAQ existante par la version enrichie avec schema
        body = body.replace(
          /<h2>Questions fréquentes<\/h2>[\s\S]*?(?=<h2>Avis clientes|$)/,
          faq + '\n'
        );
      } else {
        // Ajouter la FAQ avant les avis ou en fin de body
        if (body.includes('<h2>Avis clientes</h2>')) {
          body = body.replace('<h2>Avis clientes</h2>', faq + '\n<h2>Avis clientes</h2>');
        } else {
          body += '\n' + faq;
        }
      }
    }

    row[bodyIdx] = body;
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

// Tracker le premier variant par handle
const seenHandles = new Set();
const transformedRows = rows.map((row, i) => {
  if (i === 0) return row; // header
  const handle = row[headers.indexOf('Handle')];
  const isFirst = !seenHandles.has(handle);
  if (handle) seenHandles.add(handle);
  return transformRow([...row], headers, isFirst);
});

const output = serializeCSV(transformedRows);
fs.writeFileSync(outputPath, output, 'utf8');

// Stats
let titlesUpdated = 0;
let faqsAdded = 0;
let resultatsAdded = 0;
transformedRows.slice(1).forEach(row => {
  const h = row[headers.indexOf('Handle')];
  if (META_TITLES[h]) titlesUpdated++;
  if (getFAQForHandle(h)) faqsAdded++;
  if (getResultatsForHandle(h)) resultatsAdded++;
});

console.log('✅ CSV optimisé généré : products_export_optimized.csv');
console.log(`   📝 Meta titles optimisés : ${titlesUpdated} produits`);
console.log(`   ❓ FAQ avec schema markup : ${faqsAdded} produits`);
console.log(`   📊 Résultats attendus : ${resultatsAdded} produits`);
console.log(`   📄 Total lignes : ${transformedRows.length - 1}`);
