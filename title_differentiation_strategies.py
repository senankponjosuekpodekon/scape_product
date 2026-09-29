#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Title Differentiation Strategies for Google Merchant Center
Multiple options to make titles unique and avoid duplicate violations
"""

import pandas as pd
import re

def strategy_company_prefix(df: pd.DataFrame, company_name: str = "ProGarden") -> pd.DataFrame:
    """Strategy 1: Add company prefix"""
    df_copy = df.copy()

    def modify_title(title: str) -> str:
        if pd.isna(title) or title.strip() == "":
            return title
        return f"{company_name} {title.strip()}"

    df_copy['Name'] = df_copy['Name'].apply(modify_title)
    return df_copy

def strategy_professional_suffix(df: pd.DataFrame, suffix: str = "Professional") -> pd.DataFrame:
    """Strategy 2: Add professional suffix"""
    df_copy = df.copy()

    def modify_title(title: str) -> str:
        if pd.isna(title) or title.strip() == "":
            return title
        return f"{title.strip()} - {suffix}"

    df_copy['Name'] = df_copy['Name'].apply(modify_title)
    return df_copy

def strategy_location_based(df: pd.DataFrame, location: str = "Deutschland") -> pd.DataFrame:
    """Strategy 3: Add location/region"""
    df_copy = df.copy()

    def modify_title(title: str) -> str:
        if pd.isna(title) or title.strip() == "":
            return title
        return f"{title.strip()} - {location}"

    df_copy['Name'] = df_copy['Name'].apply(modify_title)
    return df_copy

def strategy_quality_indicator(df: pd.DataFrame, quality: str = "Premium") -> pd.DataFrame:
    """Strategy 4: Add quality indicator"""
    df_copy = df.copy()

    def modify_title(title: str) -> str:
        if pd.isna(title) or title.strip() == "":
            return title
        return f"{quality} {title.strip()}"

    df_copy['Name'] = df_copy['Name'].apply(modify_title)
    return df_copy

def strategy_combined(df: pd.DataFrame, company: str = "ProGarden", quality: str = "Premium") -> pd.DataFrame:
    """Strategy 5: Combined approach"""
    df_copy = df.copy()

    def modify_title(title: str) -> str:
        if pd.isna(title) or title.strip() == "":
            return title
        return f"{company} {quality} {title.strip()}"

    df_copy['Name'] = df_copy['Name'].apply(modify_title)
    return df_copy

def show_title_comparison(df_original: pd.DataFrame, df_modified: pd.DataFrame, strategy_name: str):
    """Show before/after comparison of titles"""
    print(f"\n🔄 STRATÉGIE: {strategy_name}")
    print("="*60)

    original_titles = df_original['Name'].fillna('').astype(str)
    modified_titles = df_modified['Name'].fillna('').astype(str)

    print("📋 EXEMPLES DE CHANGEMENT:")
    for i in range(min(5, len(original_titles))):
        orig = original_titles.iloc[i][:50]
        modif = modified_titles.iloc[i][:50]
        print(f"   {i+1}. \"{orig}...\"")
        print(f"      → \"{modif}...\"")

    # Check for duplicates within the modified titles
    duplicates = modified_titles.duplicated().sum()
    print(f"\n⚠️  DOUBLONS dans les nouveaux titres: {duplicates}")

    # Check length compliance
    over_60 = (modified_titles.str.len() > 60).sum()
    print(f"📏 Titres > 60 caractères: {over_60}")

if __name__ == "__main__":
    # Load the current optimized file
    input_file = "/home/josue/Téléchargements/wc-product-export-optimized-GERMANY-K.csv"

    if not pd.io.common.file_exists(input_file):
        print(f"❌ Fichier introuvable: {input_file}")
        exit(1)

    df = pd.read_csv(input_file)

    print("🎯 STRATÉGIES DE DIFFÉRENCIATION DES TITRES")
    print("="*80)
    print("Problème: Les titres actuels sont déjà utilisés par une autre boutique")
    print("Solution: Ajouter des éléments uniques pour différenciation")
    print("="*80)

    # Strategy 1: Company Prefix
    df_strategy1 = strategy_company_prefix(df, "ProGarden")
    show_title_comparison(df, df_strategy1, "1. PRÉFIXE ENTREPRISE (ProGarden)")

    # Strategy 2: Professional Suffix
    df_strategy2 = strategy_professional_suffix(df, "Professional")
    show_title_comparison(df, df_strategy2, "2. SUFFIXE PROFESSIONNEL (- Professional)")

    # Strategy 3: Location Based
    df_strategy3 = strategy_location_based(df, "Deutschland")
    show_title_comparison(df, df_strategy3, "3. LOCALISATION (- Deutschland)")

    # Strategy 4: Quality Indicator
    df_strategy4 = strategy_quality_indicator(df, "Premium")
    show_title_comparison(df, df_strategy4, "4. INDICATEUR QUALITÉ (Premium)")

    # Strategy 5: Combined
    df_strategy5 = strategy_combined(df, "ProGarden", "Premium")
    show_title_comparison(df, df_strategy5, "5. COMBINÉ (ProGarden Premium)")

    print(f"\n" + "="*80)
    print("💡 RECOMMANDATIONS:")
    print("   • Choisissez la stratégie qui correspond à votre marque")
    print("   • Remplacez 'ProGarden' par votre vrai nom d'entreprise")
    print("   • Vérifiez que les nouveaux titres sont uniques sur Google Merchant")
    print("   • Testez avec un petit échantillon avant upload complet")
    print("="*80)

    # Ask user which strategy to apply
    print("\n🔧 Quelle stratégie voulez-vous appliquer ? (1-5)")
    choice = input("Votre choix (ou 'q' pour quitter): ").strip()

    if choice in ['1', '2', '3', '4', '5']:
        strategy_map = {
            '1': ('company_prefix', df_strategy1, 'ProGarden'),
            '2': ('professional_suffix', df_strategy2, 'Professional'),
            '3': ('location_based', df_strategy3, 'Deutschland'),
            '4': ('quality_indicator', df_strategy4, 'Premium'),
            '5': ('combined', df_strategy5, 'ProGarden Premium')
        }

        strategy_name, df_selected, param = strategy_map[choice]

        output_file = f"/home/josue/Téléchargements/wc-product-export-unique-{strategy_name}-K.csv"
        df_selected.to_csv(output_file, sep=',', quotechar='"', encoding='utf-8', index=False)

        print(f"\n✅ Fichier sauvegardé: {output_file}")
        print(f"   Stratégie appliquée: {strategy_name} ({param})")
        print(f"   Prêt pour upload sur Google Merchant Center")

    elif choice.lower() == 'q':
        print("Au revoir!")
    else:
        print("Choix invalide. Au revoir!")