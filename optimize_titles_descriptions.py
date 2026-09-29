#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Optimise les titres et descriptions des produits de chauffage.
- Titres: rend plus concis et percutant
- Descriptions: extrait le texte du HTML et reformule de façon synthétique
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
    
    # Supprime les caractères de contrôle et les espaces inutiles
    text = re.sub(r'[\r\n\t\\]+', ' ', text)
    text = re.sub(r'&[a-z]+;', ' ', text)  # Enlève les entités restantes
    
    # Nettoie les espaces multiples
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Enlève les points/tirets orphelins
    text = re.sub(r'[.•\-]\s*$', '', text)
    
    return text

def optimize_title(original_title):
    """Optimise le titre en le rendant plus concis et percutant."""
    # Supprime les répétitions de mots-clés
    # Supprime les guillemets inutiles
    title = original_title.strip('"').strip()
    
    # Réduit la longueur si trop long (> 80 caractères)
    if len(title) > 80:
        # Garde seulement les informations essentielles
        parts = title.split(' – ')
        if len(parts) > 1:
            title = parts[0].strip()
        else:
            parts = title.split(' , ')
            if len(parts) > 1:
                title = parts[0].strip()
    
    # Nettoie les espaces inutiles
    title = ' '.join(title.split())
    
    return title

def optimize_description(html_description, title):
    """
    Reformule la description en la rendant plus synthétique et percutante.
    """
    # Convertit HTML en texte
    text = clean_html_to_text(html_description)
    
    if not text:
        return ""
    
    # Extrait les informations clés
    lines = [line.strip() for line in text.split(' ') if line.strip()]
    
    # Crée une description concise (max 3-4 phrases, ~200-250 caractères)
    # Cherche les points clés: caractéristiques, avantages, usages
    key_points = []
    
    # Récupère les 2-3 premières phrases pertinentes
    text_sentences = re.split(r'[.!?]+', text)
    
    for sentence in text_sentences[:3]:
        sentence = sentence.strip()
        if len(sentence) > 20 and len(sentence) < 150:
            # Supprime les caractères résiduels
            sentence = sentence.replace('\\n', ' ').replace('\n', ' ')
            sentence = re.sub(r'\bn\s', ' ', sentence)  # Enlève les 'n' isolés
            sentence = re.sub(r'\s+', ' ', sentence).strip()
            key_points.append(sentence)
    
    # Si on a des points clés, les combine
    if key_points:
        optimized = '. '.join(key_points[:2]) + '.'
    else:
        # Fallback: prendre les 150 premiers caractères
        optimized = text[:150]
        if len(text) > 150:
            optimized = optimized.rsplit(' ', 1)[0] + '.'
    
    # Nettoyage final
    optimized = optimized.replace('\\n', ' ').replace('\n', ' ')
    optimized = re.sub(r'\bn\s', ' ', optimized)
    optimized = re.sub(r'\s+', ' ', optimized).strip()
    
    return optimized.strip()

def main():
    input_file = Path('/home/josue/Projections/scape_product/wc-product-export-4-5-2026-1777888274695.csv')
    output_file = Path('/home/josue/Projections/scape_product/wc-product-export-optimized.csv')
    
    products_updated = 0
    
    # Lecture du CSV original
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Optimisation de chaque produit
    for row in rows:
        original_title = row.get('Name', '')
        original_short_desc = row.get('Kurzbeschreibung', '')
        original_long_desc = row.get('Beschreibung', '')
        
        # Optimise le titre
        optimized_title = optimize_title(original_title)
        row['Name'] = optimized_title
        
        # Optimise la description courte
        optimized_short_desc = optimize_description(original_long_desc, original_title)
        row['Kurzbeschreibung'] = optimized_short_desc
        
        # Garde la description longue en HTML mais peut la nettoyer
        # Pour l'instant, la maintient pour compatibilité
        
        products_updated += 1
        print(f"✓ {optimized_title[:60]}")
    
    # Écriture du fichier optimisé
    fieldnames = list(rows[0].keys()) if rows else []
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n✅ {products_updated} produits optimisés")
    print(f"📁 Fichier sauvegardé: {output_file}")

if __name__ == '__main__':
    main()
