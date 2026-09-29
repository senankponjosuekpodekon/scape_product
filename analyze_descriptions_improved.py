import pandas as pd

# Charger les deux fichiers
df_original = pd.read_csv('/home/josue/Téléchargements/wc-product-export-3-5-2026-1777786004202.csv')
df_optimized = pd.read_csv('/home/josue/Téléchargements/wc-product-export-optimized-GERMANY-L.csv')

print('='*80)
print('ANALYSE DES LONGUEURS DE DESCRIPTIONS - VERSION AMÉLIORÉE')
print('='*80)

# Calculer les longueurs
original_lengths = df_original['Beschreibung'].fillna('').str.len()
optimized_lengths = df_optimized['Beschreibung'].fillna('').str.len()

print(f'\n📊 Statistiques générales:')
print(f'   Produits: {len(df_original)}')
print(f'   Descriptions originales vides: {(original_lengths == 0).sum()}')
print(f'   Descriptions optimisées vides: {(optimized_lengths == 0).sum()}')

print(f'\n📏 Longueurs moyennes:')
print(f'   Original: {original_lengths.mean():.0f} caractères')
print(f'   Optimisé: {optimized_lengths.mean():.0f} caractères')
print(f'   Différence: {optimized_lengths.mean() - original_lengths.mean():.0f} caractères')
print(f'   Ratio: {optimized_lengths.mean() / original_lengths.mean():.2f}')

print(f'\n📈 Longueurs extrêmes:')
print(f'   Original - Min: {original_lengths.min()} | Max: {original_lengths.max()}')
print(f'   Optimisé - Min: {optimized_lengths.min()} | Max: {optimized_lengths.max()}')

print(f'\n🔍 Exemples (premiers 3 produits):')
print(f'\nProduit Original Optimisé Ratio')
print('-'*35)

for i in range(min(3, len(df_original))):
    orig_len = len(str(df_original['Beschreibung'].iloc[i]))
    opt_len = len(str(df_optimized['Beschreibung'].iloc[i]))
    ratio = opt_len / orig_len if orig_len > 0 else 0
    print(f'{i+1:<7} {orig_len:<9} {opt_len:<9} {ratio:.2f}')

print(f'\n📝 Exemple complet - Produit 1:')
print(f'   ORIGINAL ({len(str(df_original["Beschreibung"].iloc[0]))} chars):')
print(f'   {str(df_original["Beschreibung"].iloc[0])[:300]}...')
print(f'\n   OPTIMISÉ ({len(str(df_optimized["Beschreibung"].iloc[0]))} chars):')
print(f'   {str(df_optimized["Beschreibung"].iloc[0])}')

print('\n' + '='*80)