#!/usr/bin/env python3
import csv
import sys

def to_bool_flag(val):
    if val is None:
        return '0'
    v = str(val).strip().lower()
    if v in ('1','true','yes','y','published'):
        return '1'
    return '0'

def grams_to_kg(g):
    try:
        if g is None or g == '':
            return ''
        return str(float(g)/1000)
    except Exception:
        return ''

def main(infile, outfile):
    with open(infile, newline='', encoding='utf-8') as f, open(outfile, 'w', newline='', encoding='utf-8') as o:
        r = csv.DictReader(f)

        fieldnames = ['Name','SKU','Published','Description','Short description','Regular price','Categories','Tags','Images','Stock','Weight (kg)']
        w = csv.DictWriter(o, fieldnames=fieldnames, extrasaction='ignore')
        w.writeheader()

        for row in r:
            name = row.get('Title') or row.get('Handle') or ''
            sku = row.get('Variant SKU') or row.get('Variant sku') or ''
            published = to_bool_flag(row.get('Published'))
            desc = row.get('Body (HTML)') or row.get('Body (html)') or ''
            short = ''
            price = row.get('Variant Price') or row.get('Variant price') or row.get('Variant Price') or ''
            categories = row.get('Product Category') or row.get('Type') or ''
            tags = row.get('Tags') or ''
            images = row.get('Images') or ''
            stock = row.get('Variant Inventory Qty') or row.get('Variant Inventory Qty') or ''
            weight = grams_to_kg(row.get('Variant Grams') or row.get('Variant grams') or '')

            out = {
                'Name': name,
                'SKU': sku,
                'Published': published,
                'Description': desc,
                'Short description': short,
                'Regular price': price,
                'Categories': categories,
                'Tags': tags,
                'Images': images,
                'Stock': stock,
                'Weight (kg)': weight,
            }
            w.writerow(out)


if __name__ == '__main__':
    infile = sys.argv[1] if len(sys.argv) > 1 else 'conert/products_export_woocommerce_gallery_comma.csv'
    outfile = sys.argv[2] if len(sys.argv) > 2 else 'conert/products_export_wc_import.csv'
    main(infile, outfile)
