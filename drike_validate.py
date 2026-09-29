import csv
import re

print('=== VALIDATION SHOPIFY CSV ===')
with open('drike_products_shopify.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    shopify_rows = list(reader)
print(f'Rows: {len(shopify_rows)} | Cols: {len(reader.fieldnames)}')

for col in ['Handle','Title','Body (HTML)','Vendor','Product Category','Variant SKU','Variant Price','Image Src','Google Shopping / Google Product Category']:
    assert col in reader.fieldnames, f'Missing {col}'
print('Columns OK')

handles = [r['Handle'] for r in shopify_rows]
print(f'Unique handles: {len(set(handles))} / {len(handles)}')

prices = [r['Variant Price'] for r in shopify_rows]
valid_prices = [p for p in prices if re.match(r'^\d+([.,]\d+)?$', p)]
print(f'Valid prices: {len(valid_prices)}/{len(prices)}')

print('\n=== VALIDATION GMC CSV ===')
with open('drike_products_gmc.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    gmc_rows = list(reader)
print(f'Rows: {len(gmc_rows)} | Cols: {len(reader.fieldnames)}')

for col in ['id','title','description','link','image_link','availability','price','brand','mpn','product_type']:
    assert col in reader.fieldnames, f'Missing {col}'
print('Columns OK')

print('\n=== SAMPLE SHOPIFY ROW ===')
print(shopify_rows[0])
