#!/usr/bin/env python3
import csv
import sys
from collections import OrderedDict

def main(infile, outfile):
    with open(infile, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames) if reader.fieldnames else []

        image_field = None
        for candidate in ['Image Src', 'Image src', 'Images', 'images']:
            if candidate in fieldnames:
                image_field = candidate
                break

        groups = OrderedDict()
        first_row = {}

        for row in reader:
            handle = row.get('Handle', '').strip()
            if not handle:
                continue
            img = ''
            if image_field:
                img = (row.get(image_field) or '').strip()
            if handle not in groups:
                groups[handle] = []
                first_row[handle] = row.copy()
            if img:
                groups[handle].append(img)

    out_fieldnames = list(fieldnames)
    if 'Images' not in out_fieldnames:
        out_fieldnames.append('Images')

    with open(outfile, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=out_fieldnames, extrasaction='ignore')
        writer.writeheader()

        for handle, imgs in groups.items():
            row = first_row.get(handle, {})
            # remove empty and duplicates, keep order
            seen = set()
            uniq = []
            for u in imgs:
                if not u:
                    continue
                if u in seen:
                    continue
                seen.add(u)
                uniq.append(u)
            row_out = {k: row.get(k, '') for k in out_fieldnames}
            row_out['Images'] = '|'.join(uniq)
            writer.writerow(row_out)


if __name__ == '__main__':
    infile = sys.argv[1] if len(sys.argv) > 1 else 'products_export (8).csv'
    outfile = sys.argv[2] if len(sys.argv) > 2 else 'products_export_woocommerce.csv'
    main(infile, outfile)
