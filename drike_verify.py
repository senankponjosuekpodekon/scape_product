import json
import csv
import os

with open('drike_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print('=== DRiKE SCRAPING RESULT ===')
print(f'Total products: {len(products)}')
print(f'Products with images: {sum(1 for p in products if p["images"])}')
print(f'Products with SKU: {sum(1 for p in products if p["sku"])}')
print(f'Products with price: {sum(1 for p in products if p["price"])}')

with open('drike_products_shopify.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f'\nShopify CSV rows: {len(rows)}')
print(f'Columns: {len(reader.fieldnames)}')

print('\n=== SAMPLE PRODUCTS ===')
for p in products[:3]:
    print(f'\nTitle: {p["title"]}')
    print(f'Price: {p["price"]}')
    print(f'SKU: {p["sku"]}')
    print(f'Category: {p["productType"]}')
    print(f'Brand: {p["brand"]}')
    print(f'Stock: {p["availability"]}')
    print(f'Images: {len(p["images"])}')
    print(f'Description (first 200): {p["description"][:200]}...')

for file in ['drike_products.json', 'drike_products_shopify.csv', 'drike_products_gmc.csv']:
    size = os.path.getsize(file)
    print(f'\n{file}: {size} bytes')
