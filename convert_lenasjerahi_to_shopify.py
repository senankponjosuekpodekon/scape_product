#!/usr/bin/env python3
"""
Convertit lenasjerahi_products_woocommerce.csv (format WooCommerce)
vers le format d'import natif Shopify.
"""

import csv
import re

INPUT_FILE = '/home/josue/Projections/scape_product/lenasjerahi_products_woocommerce.csv'
OUTPUT_FILE = '/home/josue/Projections/scape_product/lenasjerahi_shopify_import.csv'

SHOPIFY_HEADERS = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags',
    'Published', 'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
    'Option3 Name', 'Option3 Value', 'Variant SKU', 'Variant Grams',
    'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy',
    'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
    'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode',
    'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card',
    'SEO Title', 'SEO Description',
    'Google Shopping / Google Product Category', 'Google Shopping / Gender',
    'Google Shopping / Age Group', 'Google Shopping / MPN',
    'Google Shopping / Condition', 'Google Shopping / Custom Product',
    'Variant Weight Unit', 'Status'
]

def slugify(text):
    text = text.lower()
    text = re.sub(r'[àáâãäå]', 'a', text)
    text = re.sub(r'[èéêë]', 'e', text)
    text = re.sub(r'[ìíîï]', 'i', text)
    text = re.sub(r'[òóôõö]', 'o', text)
    text = re.sub(r'[ùúûü]', 'u', text)
    text = re.sub(r'ñ', 'n', text)
    text = re.sub(r'ç', 'c', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = re.sub(r'^-+|-+$', '', text)
    return text

def wrap_description_html(description):
    """Transforme la description texte en HTML basique avec paragraphes"""
    if not description:
        return ''
    # Séparer "Características:" et "Ventajas principales:" en sections
    desc = description.strip()

    # Découper avant "Características:" et "Ventajas principales:"
    parts = re.split(r'(Características:|Ventajas principales:)', desc)

    html_parts = []
    if parts:
        # Premier bloc = description narrative
        intro = parts[0].strip()
        if intro:
            html_parts.append(f'<p>{intro}</p>')

        i = 1
        while i < len(parts) - 1:
            label = parts[i]
            content = parts[i + 1].strip()
            html_parts.append(f'<h3>{label.rstrip(":")}</h3>')
            html_parts.append(f'<p>{content}</p>')
            i += 2

    return ''.join(html_parts)

def determine_category(product_type, categories):
    """Détermine la Google Product Category selon le type de produit"""
    text = f"{product_type} {categories}".lower()
    if 'pellet' in text:
        return 'Hardware > Heating, Ventilation & Air Conditioning > Fuel > Wood Pellets & Biomass Fuel'
    if 'leña' in text or 'madera' in text:
        return 'Hardware > Heating, Ventilation & Air Conditioning > Fuel > Firewood'
    if 'estufa' in text:
        return 'Hardware > Heating, Ventilation & Air Conditioning > Heaters > Stoves'
    return 'Hardware > Heating, Ventilation & Air Conditioning > Fuel'

def convert():
    with open(INPUT_FILE, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    shopify_rows = []

    for row in rows:
        name = row.get('Name', '').strip()
        sku = row.get('SKU', '').strip()
        short_desc = row.get('Short description', '').strip()
        description = row.get('Description', '').strip()
        price = row.get('Regular price', '').strip()
        sale_price = row.get('Sale price', '').strip()
        categories = row.get('Categories', '').strip()
        brand = row.get('Brand', '').strip()
        gtin = row.get('GTIN', '').strip()
        image = row.get('Images', '').strip()
        published = row.get('Published', '1').strip()

        if not name:
            continue

        handle = slugify(name)
        body_html = wrap_description_html(description)
        vendor = brand if brand else 'Leñas Jerahi'
        product_type = categories if categories else 'Combustible'
        google_category = determine_category(product_type, categories)

        main_row = {
            'Handle': handle,
            'Title': name,
            'Body (HTML)': body_html,
            'Vendor': vendor,
            'Product Category': google_category,
            'Type': product_type,
            'Tags': categories,
            'Published': 'TRUE' if published == '1' else 'FALSE',
            'Option1 Name': 'Title',
            'Option1 Value': 'Default Title',
            'Option2 Name': '',
            'Option2 Value': '',
            'Option3 Name': '',
            'Option3 Value': '',
            'Variant SKU': sku,
            'Variant Grams': '0',
            'Variant Inventory Tracker': 'shopify',
            'Variant Inventory Qty': '100',
            'Variant Inventory Policy': 'deny',
            'Variant Fulfillment Service': 'manual',
            'Variant Price': price,
            'Variant Compare At Price': sale_price,
            'Variant Requires Shipping': 'TRUE',
            'Variant Taxable': 'TRUE',
            'Variant Barcode': gtin,
            'Image Src': image,
            'Image Position': '1' if image else '',
            'Image Alt Text': name if image else '',
            'Gift Card': 'FALSE',
            'SEO Title': name,
            'SEO Description': short_desc[:320] if short_desc else '',
            'Google Shopping / Google Product Category': google_category,
            'Google Shopping / Gender': '',
            'Google Shopping / Age Group': '',
            'Google Shopping / MPN': sku,
            'Google Shopping / Condition': 'new',
            'Google Shopping / Custom Product': 'FALSE',
            'Variant Weight Unit': 'kg',
            'Status': 'active' if published == '1' else 'draft',
        }
        shopify_rows.append(main_row)

    with open(OUTPUT_FILE, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=SHOPIFY_HEADERS)
        writer.writeheader()
        writer.writerows(shopify_rows)

    return len(shopify_rows)

def main():
    print("=" * 70)
    print("CONVERSION WOOCOMMERCE → SHOPIFY")
    print("=" * 70)
    count = convert()
    print(f"\n✅ {count} produits convertis")
    print(f"📁 Fichier de sortie: {OUTPUT_FILE}")
    print("=" * 70)

if __name__ == '__main__':
    main()
