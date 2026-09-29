#!/usr/bin/env python3
import pandas as pd

df = pd.read_csv('/home/josue/Téléchargements/wc-product-export-optimized-GERMANY-LK.csv')

# IDs des produits avec format incomplet
ids_to_fix = [1627, 1739, 1759, 1769, 1954, 1968, 1996]

for product_id in ids_to_fix:
    idx = df[df['ID'] == product_id].index[0]
    current_title = df.loc[idx, 'Name']
    
    # Supprimer " - Premium" s'il existe
    if current_title.endswith(' - Premium'):
        base_title = current_title[:-10]  # Enlever " - Premium"
    else:
        base_title = current_title
    
    # Ajouter " - Premium IDxxxx"
    new_title = f"{base_title} - Premium ID{product_id}"
    
    # Vérifier que ça fait pas > 60 caractères
    if len(new_title) > 60:
        # Si trop long, trouver une version plus courte
        base_title = base_title[:40]  # Couper base
        new_title = f"{base_title}... - Premium ID{product_id}"
    
    # Limiter à 60 caractères max
    new_title = new_title[:60]
    
    df.loc[idx, 'Name'] = new_title
    print(f"ID {product_id}: '{current_title}' → '{new_title}' ({len(new_title)} chars)")

# Sauvegarder
df.to_csv('/home/josue/Téléchargements/wc-product-export-optimized-GERMANY-LK.csv', 
          sep=',', quotechar='"', encoding='utf-8', index=False)

print("\n✅ Fichier mis à jour")
