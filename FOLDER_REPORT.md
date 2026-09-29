# Scape Product Folder Report

Generated: 2026-05-19

## Executive Summary

This folder is an ecommerce product-data workspace. It contains product exports for WooCommerce, Shopify, and Google Merchant Center, plus scraper/converter/optimizer scripts and a complete Shopify theme export.

I reviewed the project files while excluding generated dependency/environment folders (`node_modules`, `.venv`, `.git`, `.agents`, `.codex`). The reviewed project area contains 577 files, about 15 MB of project data and source files, plus an 82 MB `node_modules` folder and a Python virtual environment.

Main finding: this folder is useful but messy. It has many duplicate/intermediate CSV exports, several scripts that appear to represent different stages of the same product-import pipeline, and very little documentation beyond the folder name.

## Folder Inventory

| Area | Files | Approx. size | Purpose |
|---|---:|---:|---|
| Root project files | 88 | 9.6 MB | Main product CSV/JSON/XML data and scripts |
| `conert/` | 23 | 866 KB | Container product exports and WooCommerce conversion variants |
| `scripts/` | 6 | 20 KB | Luminaire scrape/convert and WooCommerce helper scripts |
| `theme_export_woodbywillbergoy_fi_minimog_5_7_0_07AUG2025_0941am/` | 460 | 4.0 MB | Extracted Shopify Minimog theme |
| `theme_export_woodbywillbergoy_fi_minimog_5_7_0_07AUG2025_0941am.zip` | 1 | 1.0 MB | Original Shopify theme zip |
| `node_modules/` | many | 82 MB | Installed Node dependencies, generated |
| `.venv/` | many | not counted in report | Python virtual environment, generated |

## File Types

| Type | Count |
|---|---:|
| `.liquid` | 219 |
| `.js` | 99 |
| `.json` | 86 |
| `.css` | 80 |
| `.csv` | 54 |
| `.py` | 15 |
| `.xml` | 11 |
| `.jsonl` | 5 |
| `.svg` | 3 |
| `.png` | 2 |
| `.zip` | 1 |
| `.md` | 1 |

## Main Product Data

### Active WooCommerce Export

`wc-product-export-4-5-2026-1777888274695.csv` appears to be a German WooCommerce product export.

| Metric | Value |
|---|---:|
| Rows | 34 |
| Columns | 41 |
| Title field | `Name` |
| Non-empty product names | 34 |
| Regular price field | `Regulärer Preis` |
| Price range | 189.00 to 2,350.00 |
| Matching optimized file | `wc-product-export-optimized.csv` |

The optimized file has the same row and column count, suggesting it is a processed version of the active WooCommerce export.

### Major CSV Datasets

| File | Rows | Columns | Format / likely use |
|---|---:|---:|---|
| `shopify_products.csv` | 6,597 | 20 | Shopify import/export format |
| `shopify_products copy.csv` | 2,421 | 20 | Shopify duplicate/intermediate |
| `shopify_products_new_format.csv` | 2,421 | 57 | New Shopify export format |
| `products_export_1 (8).csv` | 510 | 55 | Shopify product export |
| `products_export_1 (8)-optimized.csv` | 510 | 55 | Optimized version |
| `shopify_from_luminaire.csv` | 930 | 20 | Luminaire Shopify conversion |
| `shopify_from_luminaire_priced.csv` | 1,118 | 20 | Luminaire products with pricing |
| `duvary_products_export_ready.csv` | 216 | 16 | WooCommerce-ready Duvary products |
| `containergoertz_products.csv` | 223 | 13 | Shopify-style container products |
| `lenasjerahi_products_woocommerce.csv` | 36 | 16 | WooCommerce-ready Lenasjerahi products |
| `lenasjerahi_products_gmc.csv` | 36 | 14 | Google Merchant Center feed |
| `gmc-compliant-products.csv` | 7 | 13 | GMC product feed |
| `wc-product-export-11-5-2026-1778532600056.csv` | 87 | 41 | German WooCommerce export |
| `wc-product-export-11-5-2026-1778532886725.csv` | 7 | 41 | German WooCommerce export subset |
| `pellets_portugal_shopify.csv` | 3 | 20 | Small Shopify product set |
| `products.csv` | 0 | 12 | Empty Shopify template |

### `conert/` CSVs

The `conert/` folder contains shipping-container product data in multiple conversion stages:

| Group | Files | Notes |
|---|---:|---|
| Shopify-style exports | `products_export*.csv` | 55-column Shopify product format |
| WooCommerce import variants | `*_wc_import.csv` | 11-column WooCommerce import format |
| Gallery variants | `*_woocommerce_gallery*.csv` | Versions with image gallery formatting |
| Template | `product_template (1).csv` | 57-column Shopify template |

The same product batches appear repeated across variants `8`, `10`, and `11`, so this folder should be treated as conversion work-in-progress rather than a clean final dataset.

## JSON, JSONL, and XML Data

| File / group | Summary |
|---|---|
| `products.json` | Empty JSON array/object-sized file, only 2 bytes |
| `products_wp.json` | WordPress product data |
| `luminaire_products.jsonl` | 5-line JSONL product scrape data |
| `luminaire_products_http.jsonl` | Larger HTTP scrape result, 197 KB |
| `luminaire_http.jsonl` | Smaller HTTP scrape result |
| `test.jsonl`, `test_desc.jsonl` | Test/sample JSONL files |
| `wp-sitemap.xml` | Sitemap index with 10 child sitemaps |
| `wp-sitemap-posts-product-1.xml` | 519 product URLs from `warmholzgmbh.de` |
| Other `wp-sitemap-*.xml` | Pages, posts, taxonomy, user, and template sitemap exports |

The XML files appear to come from `warmholzgmbh.de` and are probably used by scraping/conversion scripts.

## Scripts and Pipelines

The project uses Node.js and Python scripts. `package.json` defines the project as an ES module package and includes dependencies for scraping and conversion:

`axios`, `cheerio`, `csv-stringify`, `json2csv`, `node-fetch`, `puppeteer`, and `xml2js`.

There is no real test command: `npm test` currently exits with `Error: no test specified`.

### Scrapers

| Script | Role |
|---|---|
| `duvary_scraper.js` | Scrapes Duvary products and exports WooCommerce-ready data |
| `lenasjerahi_scraper.js` | Scrapes Lenasjerahi products and creates WooCommerce/GMC outputs |
| `lenasjerahi_scraper_woocommerce.js` | WooCommerce-focused Lenasjerahi scraper |
| `scripts/scrape_luminaire.js` | Luminaire scraper |
| `scripts/scrape_luminaire_http.js` | HTTP-based Luminaire scraper |
| `shopify_export.js` | Sitemap/JSONL to Shopify export |
| `woocommerce_export.js`, `woocommerce_export_1.js`, `woocommerce_export_optimized.js` | WooCommerce export variants |

### Converters and Fixers

| Script | Role |
|---|---|
| `json_to_shopify_csv.js` | Converts JSON to Shopify CSV |
| `scripts/jsonl_to_shopify_csv.js` | Converts JSONL product data to Shopify CSV |
| `shopify_to_shopify_export.js` | Converts Shopify CSV between formats |
| `convert_to_new_format.js` | Converts Shopify data to the newer 57-column format |
| `fix_csv.js`, `fix_new_format.js`, `fix_prices.js`, `fix_titles.py`, `fix_variant_duplicates.js` | Cleanup and correction utilities |
| `update_prices_from_jsonl.js` | Updates prices from JSONL source data |
| `scripts/generate_woocommerce_import.py` | Generates WooCommerce import CSV |
| `scripts/merge_shopify_images.py` | Merges image fields for Shopify data |
| `scripts/prepare_woocommerce_gallery.py` | Prepares gallery image fields for WooCommerce |

### Optimizers and Validators

| Script | Role |
|---|---|
| `optimize_feed_product.py` | Feed/product SEO and WooCommerce optimization |
| `optimize_product_final.py`, `optimize_product_v2.py` | Product optimization versions |
| `optimize_shopify_export.py` | Shopify export optimization |
| `optimize_titles_descriptions.py` | Title/description optimization |
| `title_differentiation_strategies.py` | Title uniqueness strategies |
| `analyze_descriptions.py`, `analyze_descriptions_improved.py` | Description analysis |
| `analyze_prices.js`, `check_prices.js` | Price checking |
| `validate_csv.js`, `validate_final.js`, `validate_new_format.js` | CSV validation |
| `verify_titles.py`, `find_missing_format.py` | Title/format checks |
| `check_sitemap.js` | Sitemap inspection |
| `compare_formats.js` | Format comparison |
| `translate_to_pt.py` | Portuguese translation/conversion helper |

## Shopify Theme Export

The theme folder is a Shopify theme export:

| Detail | Value |
|---|---|
| Theme | Minimog - OS 2.0 |
| Version | 5.7.0 |
| Author | FoxEcom |
| Assets | 160 |
| Config files | 2 |
| Layouts | 2 |
| Locales | 31 |
| Sections | 94 |
| Snippets | 121 |
| Templates | 50 |

The extracted theme and the zip are both present. Keep both only if you need the original archive for backup.

## Data Quality Notes

1. There are many duplicate or staged CSV files. Examples include `shopify_from_luminaire.csv` and `shopify_from_luminaire copy.csv`, plus several `duvary_products_export*` and `products_export*` variants.
2. Some files are clearly templates or empty placeholders, including `products.csv` with zero rows and `products.json` with only 2 bytes.
3. Several pipelines seem to overlap: Shopify exports, WooCommerce exports, GMC feeds, image-gallery conversions, SEO optimizations, and scraper outputs.
4. The active WooCommerce export uses German column names, while most conversion scripts expect English WooCommerce/Shopify columns. That mismatch needs care when reusing scripts.
5. `README.md` only contains the project name, so the folder has no documented workflow or final-output guidance.
6. `npm test` is a placeholder. There are validators, but no unified test/validation command.
7. The folder name `conert` may be a typo for `convert` or `container`; this can cause confusion.

## Recommended Cleanup

1. Create a `data/raw/`, `data/intermediate/`, and `data/final/` structure.
2. Move final import-ready files into `data/final/`, especially:
   - `wc-product-export-optimized.csv`
   - `duvary_products_export_ready.csv`
   - `lenasjerahi_products_woocommerce.csv`
   - `gmc-compliant-products-final.csv`
3. Move duplicates and old attempts into `archive/` with dates.
4. Rename `conert/` to a clearer name after confirming what it means.
5. Add a real README with:
   - source site
   - script to run
   - input file
   - output file
   - final file to import into WooCommerce/Shopify/GMC
6. Add one validation command, for example `npm run validate`, that runs the relevant CSV checks.
7. Keep either the extracted Shopify theme or the zip as canonical, and archive the other.

## Suggested Final Workflow

For product data, the clean workflow should be:

1. Scrape or receive raw product data.
2. Save raw data unchanged.
3. Convert to target platform format.
4. Optimize titles/descriptions/prices/images.
5. Validate row counts, required fields, prices, images, and duplicate handles/SKUs.
6. Save only the import-ready file in `data/final/`.

This folder already has most of the tools needed. The main missing piece is organization and a single documented path from source data to final import file.
