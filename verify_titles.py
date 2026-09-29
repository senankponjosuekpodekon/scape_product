#!/usr/bin/env python3
import pandas as pd

df = pd.read_csv('/home/josue/Téléchargements/wc-product-export-optimized-GERMANY-LK.csv')
titles = df['Name'].astype(str)

print("="*80)
print("VÉRIFICATION DES TITRES")
print("="*80)

# 1. Format
has_premium = (titles.str.contains('- Premium ID', regex=False)).sum()
print(f"\n✓ Format '- Premium ID': {has_premium}/{len(titles)}")

# 2. Longueur
lengths = titles.str.len()
over_60 = (lengths > 60).sum()
print(f"✓ Titres <= 60 chars: {len(titles) - over_60}/{len(titles)}")

if over_60 > 0:
    print(f"\n❌ {over_60} TITRES TROP LONGS (> 60 chars):")
    for i, (t, l) in enumerate(zip(titles, lengths)):
        if l > 60:
            print(f"   {i+1}. ({l} chars) {t}")

# 3. Doublons
dups = titles.duplicated().sum()
print(f"\n✓ Doublons: {dups}")

if dups > 0:
    print(f"\n❌ TITRES EN DOUBLON:")
    for t in titles[titles.duplicated(keep=False)].unique():
        c = (titles == t).sum()
        if c > 1:
            print(f"   '{t}' (x{c})")

# 4. Stats
print(f"\n📊 STATISTIQUES:")
print(f"   Min: {lengths.min()} | Max: {lengths.max()} | Moyenne: {lengths.mean():.0f}")
print(f"   Titres vides: {(titles == '').sum()}")

# 5. Exemples
print(f"\n📋 EXEMPLES (5 premiers):")
for i in range(5):
    print(f"   {i+1}. ({lengths.iloc[i]:>2} chars) {titles.iloc[i]}")

# Verdict
print("\n" + "="*80)
if has_premium == len(titles) and over_60 == 0 and dups == 0:
    print("✅ TOUS LES CRITÈRES RESPECTÉS")
else:
    print("❌ PROBLÈMES DÉTECTÉS")
print("="*80)
