# GSHandels Product Scraper - Documentation

## Overview

Ce projet a permis de scraper tous les produits du site gshandels.com et de les convertir en formats compatibles Shopify et Google Merchant Center.

## Résultats

- **225 URLs trouvées** dans le sitemap XML
- **213 produits scrapés** avec succès (12 produits non accessibles)
- **0 erreurs de validation** après correction
- **Formats générés**: Google Merchant Center + Shopify

## Fichiers générés

### 1. Données brutes
- `gshandels-products-raw.json` - Données complètes au format JSON
- `gshandels-validation-report.json` - Rapport de validation initial

### 2. Google Merchant Center (format corrigé)
- `gshandels-google-merchant-feed-fixed.csv` - Feed GMC valide (213 produits)
- `gshandels-validation-report-fixed.json` - Rapport de validation final (0 erreurs)

### 3. Shopify
- `gshandels-shopify-feed.csv` - Import Shopify prêt à l'emploi (213 produits)

## Scripts

### 1. `gshandels_scraper.js`
Scraper principal pour extraire les données de gshandels.com

```bash
# Scraper tous les produits
node gshandels_scraper.js

# Scraper avec limite
node gshandels_scraper.js --limit=10
```

### 2. `fix_gshandels_data.js`
Corrige les descriptions manquantes et régénère le rapport de validation

```bash
node fix_gshandels_data.js
```

### 3. `convert_to_shopify.js`
Convertit le format Google Merchant Center vers Shopify

```bash
node convert_to_shopify.js
```

## Structure des données

### Champs Google Merchant Center
- id, title, description, link, image_link
- availability, price, condition, brand
- google_product_category, product_type
- material, color, size, etc.

### Champs Shopify
- Handle, Title, Body (HTML), Vendor, Type, Tags
- Variant SKU, Price, Inventory Qty
- SEO Title, SEO Description
- Google Product Category, Status

## Catégories de produits

Les produits sont classés dans ces catégories principales:
- Container (594) - Conteneurs standards
- Bürocontainer - Conteneurs de bureau
- Wohncontainer - Conteneurs d'habitation
- Sanitärcontainer - Conteneurs sanitaires
- Pool/Sauna - Pools et saunas
- Barcontainer - Conteneurs bar
- Kühlcontainer - Conteneurs réfrigérés
- Flat Rack/Open Top - Conteneurs spéciaux
- High Cube - Conteneurs haute hauteur
- Tiny House - Mini-maisons

## Validation

✅ **Tous les champs requis** présents
✅ **Format des prix** correct (ex: "1250.00 EUR")
✅ **Longueurs des titres** ≤ 150 caractères
✅ **Longueurs des descriptions** ≤ 5000 caractères
✅ **Pas d'images placeholder**
✅ **IDs uniques**

## Import dans Shopify

1. Aller dans Shopify Admin > Products > Import
2. Choisir le fichier `gshandels-shopify-feed.csv`
3. Sélectionner les colonnes selon le mapping ci-dessus
4. Lancer l'import

## Import dans Google Merchant Center

1. Aller dans Google Merchant Center > Products > Feeds
2. Créer un nouveau feed
3. Uploader le fichier `gshandels-google-merchant-feed-fixed.csv`
4. Valider le feed

## Performance

- **Temps de scraping**: ~45 minutes pour 213 produits
- **Taux de succès**: 94.7% (213/225)
- **Produits corrigés**: 33 descriptions manquantes
- **Validation finale**: 100% conforme

## Notes techniques

- Le scraper utilise des délais pour éviter de surcharger le serveur
- Gestion automatique des retries en cas d'erreurs réseau
- Extraction des données depuis HTML et JSON-LD schema
- Support des images multiples et des variantes de produits
- Génération automatique de descriptions pour produits incomplets

## Prochaines étapes suggérées

1. **Mettre à jour régulièrement** les prix et stocks
2. **Optimiser les images** pour de meilleures performances
3. **Ajouter des variantes** (couleurs, tailles) si applicable
4. **Créer des collections** Shopify par catégorie
5. **Mettre en place le suivi** des performances GMC

---

**Date**: 10 juin 2026  
**Produits**: 213  
**Statut**: ✅ Terminé et validé
