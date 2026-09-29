import csv
import re
import json

with open('neubach_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print('=== VALIDATION NEUBACH CSVs ===')

for file in ['neubach_products_shopify.csv', 'neubach_products_gmc.csv']:
    with open(file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    print(f'\n{file}: {len(rows)} rows, {len(reader.fieldnames)} cols')

    if file.endswith('shopify.csv'):
        for col in ['Handle','Title','Body (HTML)','Vendor','Product Category','Variant SKU','Variant Price','Image Src']:
            assert col in reader.fieldnames, f'Missing {col}'
        handles = [r['Handle'] for r in rows]
        print(f'Unique handles: {len(set(handles))}/{len(rows) - len([r for r in rows if r["Variant SKU"]])}')
        # base rows have Variant SKU
        price_rows = [r for r in rows if r.get('Variant SKU')]
        prices = [r['Variant Price'] for r in price_rows]
        valid = [p for p in prices if re.match(r'^\d+[.,]?\d*$', p)]
        print(f'Valid prices: {len(valid)}/{len(prices)}')
    else:
        for col in ['id','title','description','link','image_link','availability','brand','mpn','product_type']:
            assert col in reader.fieldnames, f'Missing {col}'
        ids = [r['id'] for r in rows]
        print(f'Unique ids: {len(set(ids))}/{len(rows)}')

print('\n=== PRICE RANGE ===')
prices = [float(p['price'].replace(' EUR','')) for p in products if p.get('price')]
if prices:
    print(f'Min: {min(prices):.2f} EUR | Max: {max(prices):.2f} EUR | Avg: {sum(prices)/len(prices):.2f} EUR')
else:
    print('No prices found')

print('\n=== STOCK ===')
stock = {}
for p in products:
    stock[p.get('availability','N/A')] = stock.get(p.get('availability','N/A'), 0) + 1
for k, v in stock.items():
    print(f'  {k}: {v}')
