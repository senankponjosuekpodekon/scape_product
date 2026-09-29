#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Optimise les titres et descriptions de manière clean et professionnelle.
"""

import csv
import re
from pathlib import Path
import html as html_lib

def clean_text(text):
    """Nettoie le texte de tous les artefacts HTML."""
    if not text:
        return ""
    
    # Décode les entités HTML
    text = html_lib.unescape(text)
    
    # Supprime toutes les balises HTML
    text = re.sub(r'<[^>]+>', ' ', text)
    
    # Supprime les guillemets
    text = re.sub(r'[„"„""«»]', '', text)
    
    # Supprime les sauts de ligne échappés
    text = text.replace('\\n', ' ').replace('\n', ' ').replace('\r', ' ')
    
    # Supprime les tabulations
    text = text.replace('\t', ' ')
    
    # Nettoie les espaces multiples
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def optimize_title(title):
    """Rend le titre plus court et percutant."""
    title = clean_text(title)
    
    # Si > 80 chars, garde la partie principale
    if len(title) > 80:
        parts = title.split(' – ')
        if len(parts) > 1:
            title = parts[0].strip()
        else:
            parts = title.split(' , ')
            if len(parts) > 1:
                title = parts[0].strip()
    
    return title

def extract_first_sentences(text, num_sentences=2):
    """Extrait les premières phrases cohérentes."""
    # Nettoie le texte
    text = clean_text(text)
    
    if not text or len(text) < 40:
        return ""
    
    # Divise en phrases
    sentences = []
    for sent in re.split(r'[.!?]+', text):
        sent = sent.strip()
        if sent and len(sent) > 20:
            sentences.append(sent)
    
    if not sentences:
        return text[:200] + ('...' if len(text) > 200 else '')
    
    # Prend les N meilleures phrases
    result = '. '.join(sentences[:num_sentences])
    
    # Ajoute un point final
    if not result.endswith('.'):
        result += '.'
    
    # Limite à 250 caractères
    if len(result) > 250:
        result = result[:247] + '...'
    
    return result.strip()

def main():
    input_file = '/home/josue/Projections/scape_product/wc-product-export-4-5-2026-1777888274695.csv'
    output_file = '/home/josue/Projections/scape_product/wc-product-export-optimized.csv'
    
    # Lire
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Traiter chaque produit
    for i, row in enumerate(rows, 1):
        # Optimiser le titre
        old_title = row.get('Name', '')
        row['Name'] = optimize_title(old_title)
        
        # Optimiser la description courte (à partir de la longue)
        long_desc = row.get('Beschreibung', '')
        row['Kurzbeschreibung'] = extract_first_sentences(long_desc, 2)
        
        print(f"✓ {i:2}. {row['Name'][:65]}")
    
    # Sauvegarder
    fieldnames = list(rows[0].keys()) if rows else []
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n✅ {len(rows)} produits optimisés et sauvegardés")
    print(f"📁 Fichier: {output_file}")

if __name__ == '__main__':
    main()
