import csv
import re
import json

with open('modu_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print('=== VALIDATION MODU CSVs ===')

for file in ['modu_products_shopify.csv', 'modu_products_gmc.csv']:
    with open(file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    print(f'\n{file}: {len(rows)} rows, {len(reader.fieldnames)} cols')

    if file.endswith('shopify.csv'):
        for col in ['Handle','Title','Body (HTML)','Vendor','Product Category','Variant SKU','Variant Price','Image Src']:
            assert col in reader.fieldnames, f'Missing {col}'
        handles = [r['Handle'] for r in rows]
        print(f'Unique handles: {len(set(handles))}/{len(handles)}')
        prices = [r['Variant Price'] for r in rows]
        valid = [p for p in prices if re.match(r'^\d+[.,]?\d*$', p)]
        print(f'Valid prices: {len(valid)}/{len(prices)}')
    else:
        for col in ['id','title','description','link','image_link','availability','price','brand','mpn','product_type']:
            assert col in reader.fieldnames, f'Missing {col}'
        ids = [r['id'] for r in rows]
        print(f'Unique ids: {len(set(ids))}/{len(ids)}')

print('\n=== PRICE RANGE ===')
prices = [float(p['price'].replace(' EUR','')) for p in products if p.get('price')]
print(f'Min: {min(prices):.2f} EUR | Max: {max(prices):.2f} EUR | Avg: {sum(prices)/len(prices):.2f} EUR')

print('\n=== DELIVERY TIMES ===')
delivery = {}
for p in products:
    d = p.get('deliveryTime', 'N/A')
    delivery[d] = delivery.get(d, 0) + 1
for k, v in delivery.items():
    print(f'  {k or "N/A"}: {v}')
