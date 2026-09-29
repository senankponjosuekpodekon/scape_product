#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Optimize WooCommerce Product Feed for German Market (Google Merchant)
- Add "-LK" suffix to SKU
- Optimize titles for SEO (German keywords)
- Generate unique meta descriptions (120-160 chars)
- Restructure descriptions
- Extract GTIN from descriptions if missing
- Add 'condition' column = 'new'
"""

import pandas as pd
import re
from typing import Tuple
import os

def extract_gtin_from_text(text: str) -> str:
    """Extract GTIN/EAN from description text using regex"""
    if pd.isna(text):
        return ""
    text = str(text)
    # Look for 13-digit GTIN/EAN
    match = re.search(r'\b(\d{13})\b', text)
    if match:
        return match.group(1)
    # Look for GTIN: pattern
    match = re.search(r'GTIN[:\s]+(\d{13})', text, re.IGNORECASE)
    if match:
        return match.group(1)
    return ""

def optimize_title(row: pd.Series) -> str:
    """
    Optimize title for Google Shopping with mixed Option B+C
    (quality suffix + unique reference code)
    """
    title = str(row['Name']).strip()
    quality = "Premium"

    # Unique tag from ID or SKU to avoid duplicate titles
    unique_tag = ""
    if 'ID' in row and pd.notna(row['ID']):
        unique_tag = f"ID{int(row['ID'])}"
    elif pd.notna(row['Artikelnummer']):
        sku = str(row['Artikelnummer']).strip()
        unique_tag = sku.replace('-K', '').replace('-L', '').replace(' ', '')[-6:]
        unique_tag = f"K{unique_tag}"

    # If title already contains a model or type, keep as much as possible
    base_title = title
    suffix = f" - {quality}"
    if unique_tag:
        suffix += f" {unique_tag}"

    optimized = base_title
    if len(optimized + suffix) <= 60:
        optimized = optimized + suffix
    else:
        # Try shorter version: keep the title, add only quality
        if len(base_title + f" - {quality}") <= 60:
            optimized = base_title + f" - {quality}"
        else:
            # Fallback to model + quality + unique tag
            model_match = re.search(r'GHX-[A-Z0-9]+', title)
            if model_match:
                model = model_match.group(0)
            else:
                # Try to fit as much of the original title as possible
                # while preserving the quality and unique ID
                suffix_full = f" - {quality} {unique_tag}" if unique_tag else f" - {quality}"
                available_space = 60 - len(suffix_full)
                
                if available_space >= len(title):
                    # Full title fits
                    model = title
                else:
                    # Truncate title intelligently
                    # Remove trailing units/numbers (W, V, kW, etc.)
                    cleaned = re.sub(r'\s+\d+(\.\d+)?\s*(W|V|kW|A|Hz|mm|kg|l|L)$', '', title)
                    model = cleaned[:available_space].rsplit(' ', 1)[0] if len(cleaned) > available_space else cleaned
            
            optimized = f"{model} - {quality}"
            if unique_tag and len(optimized + f" {unique_tag}") <= 60:
                optimized = optimized + f" {unique_tag}"

    return optimized[:60]

def generate_meta_description(row: pd.Series) -> str:
    """
    Generate unique, SEO-friendly meta description (120-160 chars)
    """
    title = str(row['Name']).strip()
    category = str(row['Kategorien']).lower() if pd.notna(row['Kategorien']) else "gartenwerkzeug"
    desc = str(row['Beschreibung']).lower() if pd.notna(row['Beschreibung']) else ""
    short_desc = str(row['Kurzbeschreibung']).lower() if pd.notna(row['Kurzbeschreibung']) else ""
    
    # Extract key features
    features = []
    
    # Power/Performance
    kw_match = re.search(r'(\d+[,\.]\d+)\s*kW', desc)
    ps_match = re.search(r'(\d+)\s*PS', desc)
    motor_match = re.search(r'motor[:\s]+([\w\s]+)(?:\n|,)', desc, re.IGNORECASE)
    
    if kw_match:
        features.append(f"{kw_match.group(1)} kW")
    elif ps_match:
        features.append(f"{ps_match.group(1)} PS")
    
    # Size/width
    breite_match = re.search(r'breite[:\s]+(\d+)\s*mm', desc, re.IGNORECASE)
    if breite_match:
        features.append(f"{breite_match.group(1)}mm")
    
    # Material cutting
    astdm = re.search(r'astdurchmesser[:\s]+(\d+)\s*cm', desc, re.IGNORECASE)
    if astdm:
        features.append(f"bis {astdm.group(1)}cm")
    
    # Build description
    if len(features) > 0:
        meta_desc = f"{title} | {', '.join(features[:2])}. Professionelle Qualität für den {category}."
    else:
        meta_desc = f"{title} - Hochwertige Ausführung für optimale Ergebnisse im Garten."
    
    # Trim to 160 chars
    if len(meta_desc) > 160:
        meta_desc = meta_desc[:157] + "..."
    
    return meta_desc

def restructure_description(row: pd.Series) -> str:
    """
    Reformulate description for better SEO while keeping similar length
    """
    desc = str(row['Beschreibung']).strip() if pd.notna(row['Beschreibung']) else ""
    title = str(row['Name']).strip()

    if len(desc) < 50:
        return f"<p>{title} - Professionelle Qualität und zuverlässige Leistung für optimale Ergebnisse.</p>"

    # Extract key information for reformulation
    specs = {}

    # Motor information
    motor_match = re.search(r'Motor[:\s]+([\w\s]+?)(?:\n|,|$)', desc, re.IGNORECASE)
    if motor_match:
        specs['motor'] = motor_match.group(1).strip()

    # Power
    power_match = re.search(r'([\d,\.]+\s*kW)', desc)
    if power_match:
        specs['power'] = power_match.group(1)

    # Width
    width_match = re.search(r'(\d+)\s*mm.*[Bb]reite', desc, re.IGNORECASE)
    if width_match:
        specs['width'] = f"{width_match.group(1)} mm"

    # Max cutting diameter
    diam_match = re.search(r'[Aa]stdurchmesser[:\s]+(\d+)\s*cm', desc, re.IGNORECASE)
    if diam_match:
        specs['diameter'] = f"{diam_match.group(1)} cm"

    # Weight
    weight_match = re.search(r'(\d+)\s*kg.*[Gg]ewicht', desc, re.IGNORECASE)
    if weight_match:
        specs['weight'] = f"{weight_match.group(1)} kg"

    # Build reformulated description
    result = f"<h3>{title}</h3>\n"

    # Introduction paragraph - reformulate first part
    intro_text = "Entdecken Sie die professionelle Leistung dieses hochwertigen Gartenwerkzeugs. "
    if specs.get('motor'):
        intro_text += f"Ausgestattet mit einem leistungsstarken {specs['motor']}-Motor "
    if specs.get('power'):
        intro_text += f"mit {specs['power']} Leistung "
    intro_text += "bietet dieses Gerät optimale Ergebnisse für anspruchsvolle Gartenarbeiten."

    result += f"<p>{intro_text}</p>\n"

    # Technical features paragraph
    features = []
    if specs.get('width'):
        features.append(f"kompakte Arbeitsbreite von nur {specs['width']}")
    if specs.get('diameter'):
        features.append(f"maximaler Astdurchmesser bis {specs['diameter']}")
    if specs.get('weight'):
        features.append(f"praktisches Gewicht von {specs['weight']}")

    if features:
        result += f"<p>Durch seine {', '.join(features)} zeichnet sich dieses Modell besonders aus. "
        result += "Die durchdachte Konstruktion ermöglicht effiziente Arbeitsabläufe und professionelle Ergebnisse.</p>\n"

    # Additional features from original text with more detail
    if "hydraulisch" in desc.lower():
        result += "<p>Das hydraulische Selbstfahrsystem sorgt für komfortable Manövrierbarkeit und einfache Positionierung am Einsatzort. "
        result += "Diese Funktion erleichtert den Transport erheblich und ermöglicht einen flexiblen Einsatz an verschiedenen Arbeitsstellen ohne großen Kraftaufwand.</p>\n"

    if "No-Stress" in desc or "no-stress" in desc.lower():
        result += "<p>Die elektronische No-Stress-Steuerung schützt den Motor vor Überlastung und gewährleistet eine lange Lebensdauer. "
        result += "Dieses intelligente System passt die Leistung automatisch an das zu verarbeitende Material an und verhindert so unnötige Abnutzung oder Schäden am Antrieb.</p>\n"

    if "Einzugswalzen" in desc:
        result += "<p>Das 3-Gang-Einzugswalzen-System ermöglicht eine optimale Materialzuführung für unterschiedliche Materialarten. "
        result += "Die berührungsempfindlichen Tasten zur Steuerung der Einzugsdrehrichtung erlauben eine präzise Kontrolle über den Arbeitsprozess und eine schnelle Anpassung an verschiedene Materialien.</p>\n"

    # Cutting system details
    if "Messer" in desc and "Hämmer" in desc:
        result += "<p>Das kombinierte Schneidsystem mit Messern und Hämmern gewährleistet eine optimale Zerkleinerung sowohl von Grüngut als auch von faserigem Material. "
        result += "Je nach Materialart kann flexibel zwischen verschiedenen Schneidkonfigurationen gewählt werden, um beste Ergebnisse zu erzielen und die Effizienz zu maximieren.</p>\n"

    # Maintenance and operation
    result += "<p>Die einfache Öffnung des Häckselwerks ermöglicht eine schnelle und unkomplizierte Wartung des Rotors. "
    result += "Regelmäßige Wartung ist wichtig für die Langlebigkeit und Zuverlässigkeit des Geräts und stellt sicher, dass die Leistung über viele Jahre hinweg konstant bleibt.</p>\n"

    # Additional benefits
    result += "<p>Dieses professionelle Gerät überzeugt durch seine robuste Bauweise und die durchdachten technischen Lösungen. "
    result += "Die Kombination aus hoher Leistung, intelligenter Steuerung und benutzerfreundlichem Design macht es zur idealen Wahl für anspruchsvolle Garten- und Landschaftspflegearbeiten.</p>\n"

    # Technical specifications section
    if specs:
        result += "<h4>Technische Highlights:</h4>\n<ul>\n"
        if specs.get('motor'):
            result += f"  <li><strong>Motor:</strong> {specs['motor']} - Zuverlässiger Antrieb für höchste Ansprüche</li>\n"
        if specs.get('power'):
            result += f"  <li><strong>Leistung:</strong> {specs['power']} - Optimale Power für professionelle Anwendungen</li>\n"
        if specs.get('width'):
            result += f"  <li><strong>Arbeitsbreite:</strong> {specs['width']} - Kompakt und wendig für verschiedene Einsatzbereiche</li>\n"
        if specs.get('diameter'):
            result += f"  <li><strong>Max. Astdurchmesser:</strong> {specs['diameter']} - Verarbeitung auch größerer Äste ohne Probleme</li>\n"
        if specs.get('weight'):
            result += f"  <li><strong>Gewicht:</strong> {specs['weight']} - Ausgewogenes Verhältnis von Stabilität und Mobilität</li>\n"
        result += "</ul>\n"

    # Closing paragraph with more emphasis
    category = str(row['Kategorien']).split(',')[0] if pd.notna(row['Kategorien']) else "Gartenwerkzeug"
    result += f"<p><strong>Investieren Sie in Qualität und Professionalität - dieses hochwertige {category} überzeugt durch erstklassige Verarbeitung, innovative Technik und außergewöhnliche Zuverlässigkeit. "
    result += "Perfekt geeignet für anspruchsvolle Garten- und Landschaftspflegeprojekte, bei denen nur das Beste gut genug ist. "
    result += "Mit diesem Gerät sind Sie optimal ausgestattet für alle Herausforderungen moderner Gartenarbeit.</strong></p>"

    return result

def add_sku_suffix(sku: str) -> str:
    """Add -LK suffix to SKU"""
    if pd.isna(sku) or sku == "":
        return ""
    return str(sku).strip() + "-LK"

def process_feed(input_file: str, output_file: str) -> None:
    """Main processing function"""
    
    print(f"📖 Chargement du fichier: {input_file}")
    df = pd.read_csv(input_file, sep=',', quotechar='"', encoding='utf-8')
    
    print(f"✅ {len(df)} produits chargés")
    
    # 1. Add -L to SKU
    print("🔧 1️⃣ Ajout du suffixe '-K' aux SKU...")
    df['Artikelnummer'] = df['Artikelnummer'].apply(add_sku_suffix)
    
    # 2. Optimize titles
    print("🔧 2️⃣ Optimisation des titres...")
    df['Name'] = df.apply(optimize_title, axis=1)
    
    # 3. Generate meta descriptions
    print("🔧 3️⃣ Génération des meta descriptions...")
    df['Kurzbeschreibung'] = df.apply(generate_meta_description, axis=1)
    
    # 4. Restructure descriptions
    print("🔧 4️⃣ Restructuration des descriptions...")
    df['Beschreibung'] = df.apply(restructure_description, axis=1)
    
    # 5. Extract/Fix GTIN
    print("🔧 5️⃣ Extraction des GTIN...")
    # Convert GTIN column to string first
    df['GTIN, UPC, EAN oder ISBN'] = df['GTIN, UPC, EAN oder ISBN'].astype(str)
    for idx, row in df.iterrows():
        if pd.isna(row['GTIN, UPC, EAN oder ISBN']) or str(row['GTIN, UPC, EAN oder ISBN']).strip() == "" or str(row['GTIN, UPC, EAN oder ISBN']).lower() == "nan":
            extracted_gtin = extract_gtin_from_text(row['Beschreibung'])
            if extracted_gtin:
                df.at[idx, 'GTIN, UPC, EAN oder ISBN'] = extracted_gtin
    
    # 6. Add 'condition' column
    print("🔧 6️⃣ Ajout de la colonne 'condition'...")
    # Insert condition after Marken (last column)
    df['Condition'] = 'new'
    
    # Reorder columns to have Condition at the end
    cols = list(df.columns)
    if 'Condition' in cols:
        cols.remove('Condition')
        cols.append('Condition')
        df = df[cols]
    
    # 7. Save
    print(f"\n💾 Sauvegarde vers: {output_file}")
    df.to_csv(output_file, sep=',', quotechar='"', encoding='utf-8', index=False)
    
    print(f"\n✅ Optimisation terminée!")
    print(f"📊 Statistiques:")
    print(f"   - Produits traités: {len(df)}")
    print(f"   - SKU avec '-LK': {df['Artikelnummer'].str.endswith('-LK').sum()}")
    print(f"   - GTIN extraits: {df['GTIN, UPC, EAN oder ISBN'].notna().sum()}")
    print(f"   - Condition='new': {(df['Condition'] == 'new').sum()}")
    print(f"\n📁 Fichier prêt: {output_file}")

if __name__ == "__main__":
    # Paths
    input_file = "/home/josue/Téléchargements/wc-product-export-3-5-2026-1777786004202.csv"
    output_file = "/home/josue/Téléchargements/wc-product-export-optimized-GERMANY-LK.csv"
    
    # Check if input exists
    if not os.path.exists(input_file):
        print(f"❌ Erreur: {input_file} introuvable")
        exit(1)
    
    # Process
    process_feed(input_file, output_file)
