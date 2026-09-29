#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Optimise les titres et descriptions des produits de chauffage.
Version améliorée avec meilleur nettoyage du texte HTML.
"""

import csv
import re
from pathlib import Path
import html

def clean_html_to_text(html_content):
    """Convertit le contenu HTML en texte pur et lisible."""
    if not html_content or not html_content.strip():
        return ""
    
    # Décode les entités HTML
    text = html.unescape(html_content)
    
    # Supprime les balises HTML
    text = re.sub(r'<[^>]+>', ' ', text)
    
    # Supprime les guillemets
    text = re.sub(r'„|"', '', text)
    
    # Remplace tous les sauts de ligne et caractères de contrôle
    text = text.replace('\\n', ' ').replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    
    # Nettoie les espaces multiples
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def optimize_title(original_title):
    """Optimise le titre - le rend plus concis."""
    title = original_title.strip('"').strip()
    
    # Si trop long, garde seulement la partie principale
    if len(title) > 80:
        parts = title.split(' – ')
        if len(parts) > 1:
            title = parts[0].strip()
        else:
            parts = title.split(' , ')
            if len(parts) > 1:
                title = parts[0].strip()
    
    return ' '.join(title.split())

def optimize_description(html_description, title):
    """Reformule la description de façon synthétique."""
    text = clean_html_to_text(html_description)
    
    if not text or len(text) < 30:
        return ""
    
    # Divise en phrases
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    
    # Cherche les meilleures phrases (longueur modérée)
    good_sentences = []
    for sent in sentences:
        length = len(sent)
        if 40 < length < 200:
            good_sentences.append(sent)
    
    # Si pas assez, prendre n'importe quoi
    if len(good_sentences) < 2:
        good_sentences = [s for s in sentences if len(s) > 20][:2]
    
    # Combine les 2 premières
    if good_sentences:
        desc = ' '.join(good_sentences[:2])
    else:
        desc = text[:200] if len(text) > 200 else text
    
    # Limite à ~250 caractères
    if len(desc) > 250:
        desc = desc[:250].rsplit('.', 1)[0] + '.'
    elif not desc.endswith('.'):
        desc += '.'
    
    return desc.strip()

def main():
    input_file = Path('/home/josue/Projections/scape_product/wc-product-export-4-5-2026-1777888274695.csv')
    output_file = Path('/home/josue/Projections/scape_product/wc-product-export-optimized.csv')
    
    # Lire le CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Optimiser chaque produit
    for i, row in enumerate(rows, 1):
        title = row.get('Name', '')
        desc_html = row.get('Beschreibung', '')
        
        # Optimiser
        row['Name'] = optimize_title(title)
        row['Kurzbeschreibung'] = optimize_description(desc_html, title)
        
        print(f"✓ Produit {i}: {row['Name'][:60]}")
    
    # Sauvegarder
    fieldnames = list(rows[0].keys()) if rows else []
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n✅ {len(rows)} produits optimisés")
    print(f"📁 Fichier: {output_file}")

if __name__ == '__main__':
    main()
