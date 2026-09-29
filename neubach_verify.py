import json
import csv

with open('neubach_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print('=== NEUBACH SCRAPING RESULT ===')
print(f'Total products: {len(products)}')
print(f'Products with images: {sum(1 for p in products if p["images"])}')
print(f'Products with SKU: {sum(1 for p in products if p["sku"])}')
print(f'Products with price: {sum(1 for p in products if p["price"])}')

# Categories
cats = {}
for p in products:
    c = p.get('productType', 'N/A')
    cats[c] = cats.get(c, 0) + 1
print('\n=== CATEGORIES ===')
for k, v in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {k}: {v}')

# Products without price
print('\n=== PRODUCTS WITHOUT PRICE ===')
for p in products:
    if not p.get('price'):
        print(f'  {p["title"]} | SKU: {p["sku"]} | URL: {p["link"]}')

# Image counts
print('\n=== IMAGE COUNTS ===')
img_counts = [len(p['images']) for p in products]
print(f'Min: {min(img_counts)} | Max: {max(img_counts)} | Avg: {sum(img_counts)/len(img_counts):.1f}')

# Sample products
print('\n=== SAMPLE PRODUCTS ===')
for p in products[:3]:
    print(f'\nTitle: {p["title"]}')
    print(f'Price: {p["price"]}')
    print(f'SKU: {p["sku"]}')
    print(f'Category: {p["productType"]}')
    print(f'Stock: {p["availability"]}')
    print(f'Images: {len(p["images"])}')
    print(f'Description (first 200): {p["description"][:200]}...')

# CSV check
for file in ['neubach_products_shopify.csv', 'neubach_products_gmc.csv']:
    with open(file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    print(f'\n{file}: {len(rows)} rows, {len(reader.fieldnames)} cols')
