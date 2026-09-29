import json

with open('drike_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print('=== CATEGORIES ===')
cats = {}
for p in products:
    c = p.get('productType', 'N/A')
    cats[c] = cats.get(c, 0) + 1
for k, v in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {k}: {v}')

print('\n=== PRODUCTS PER CATEGORY (first 1 each) ===')
seen = set()
for p in products:
    c = p.get('productType', 'N/A')
    if c not in seen:
        seen.add(c)
        print(f'{c}: {p["title"]} (SKU: {p["sku"]})')

print('\n=== PRICE RANGE ===')
prices = [float(p['price'].replace(' EUR','')) for p in products if p.get('price')]
print(f'Min: {min(prices):.2f} EUR | Max: {max(prices):.2f} EUR | Avg: {sum(prices)/len(prices):.2f} EUR')

print('\n=== IMAGE COUNTS ===')
for p in products[:5]:
    print(f'{p["title"][:50]}... : {len(p["images"])} images')

print('\n=== DELIVERY TIMES ===')
delivery = {}
for p in products:
    d = p.get('deliveryTime', 'N/A')
    delivery[d] = delivery.get(d, 0) + 1
for k, v in delivery.items():
    print(f'  {k or "N/A"}: {v}')

print('\n=== SKU PRESENCE ===')
print(f'All products have SKU: {all(p.get("sku") for p in products)}')

print('\n=== FULL DESCRIPTION SAMPLE (product 100019) ===')
p = products[0]
print(f'Title: {p["title"]}')
print(f'Description length: {len(p["description"])} chars')
print(p['description'][:500])
