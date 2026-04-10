#!/usr/bin/env python3
import csv
import sys

def main(infile, outfile, sep='|'):
    with open(infile, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)

        # Ensure Images column exists
        if 'Images' not in fieldnames:
            fieldnames.append('Images')

        # If Image Src exists, we'll keep it in header but clear values
        with open(outfile, 'w', newline='', encoding='utf-8') as out:
            writer = csv.DictWriter(out, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            for row in reader:
                # Build gallery from any existing Images or Image Src/Variant Image columns
                images = []
                if row.get('Images'):
                    images = [u for u in row['Images'].split(sep) if u.strip()]
                else:
                    # fallback: collect Image Src and Variant Image
                    for k in ('Image Src', 'Image src', 'Variant Image'):
                        v = row.get(k, '')
                        if v:
                            images.append(v.strip())

                # Keep Images as sep-joined list
                row['Images'] = sep.join(images)
                # Empty Image Src so importer uses Images for featured + gallery
                if 'Image Src' in row:
                    row['Image Src'] = ''
                if 'Image src' in row:
                    row['Image src'] = ''

                writer.writerow(row)


if __name__ == '__main__':
    infile = sys.argv[1] if len(sys.argv) > 1 else 'products_export_woocommerce.csv'
    outfile = sys.argv[2] if len(sys.argv) > 2 else 'products_export_woocommerce_gallery.csv'
    sep = sys.argv[3] if len(sys.argv) > 3 else '|'
    main(infile, outfile, sep)
