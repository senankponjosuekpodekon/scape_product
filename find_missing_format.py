#!/usr/bin/env python3
import pandas as pd

df = pd.read_csv('/home/josue/Téléchargements/wc-product-export-optimized-GERMANY-K.csv')
titles = df['Name'].astype(str)

# Titres sans le format
missing_format = titles[~titles.str.contains('- Premium ID', regex=False)]

print("❌ TITRES SANS LE FORMAT '- Premium ID':\n")
print(f"Total manquant: {len(missing_format)}\n")

for idx, (i, row) in enumerate(missing_format.items(), 1):
    product_id = df['ID'].iloc[i]
    title = df['Name'].iloc[i]
    sku = df['Artikelnummer'].iloc[i]
    print(f"{idx}. ID={product_id} | SKU={sku}")
    print(f"   Titre: '{title}'")
    print()
