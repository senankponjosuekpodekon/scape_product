#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pandas as pd
import re
from html import unescape

INPUT_FILE = '/home/josue/Projections/scape_product/products_export_1 (8).csv'
OUTPUT_FILE = '/home/josue/Projections/scape_product/products_export_1 (8)-optimized.csv'

EMOJI_PATTERN = re.compile(
    '['
    '\U0001F600-\U0001F64F'  # emoticons
    '\U0001F300-\U0001F5FF'  # symbols & pictographs
    '\U0001F680-\U0001F6FF'  # transport & map symbols
    '\U0001F1E0-\U0001F1FF'  # flags
    '\U00002702-\U000027B0'
    '\U000024C2-\U0001F251'
    ']+',
    flags=re.UNICODE,
)

HTML_ATTR_PATTERN = re.compile(r'\sdata-(?:start|end|section-id)="[^"]*"', flags=re.IGNORECASE)
META_TAG_PATTERN = re.compile(r'<meta[^>]*>', flags=re.IGNORECASE)
EMPTY_CLASS_PATTERN = re.compile(r'\sclass=""', flags=re.IGNORECASE)
EXTRA_SPACES = re.compile(r'\s{2,}')


def remove_emojis(text: str) -> str:
    if not isinstance(text, str):
        return text
    return EMOJI_PATTERN.sub('', text)


def clean_html(html: str) -> str:
    if not isinstance(html, str):
        return html
    cleaned = html
    cleaned = remove_emojis(cleaned)
    cleaned = EXTRA_SPACES.sub(' ', cleaned)
    return cleaned.strip()


def normalize_title(title: str) -> str:
    if not isinstance(title, str):
        return title
    text = remove_emojis(title)
    text = text.replace('–', '-').replace('—', '-')
    text = re.sub(r'\s*\(\s*Ref\s*[:]?\s*([^\)]+)\s*\)', r' Ref \1', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*\(\s*R[eé]f\s*[:]?\s*([^\)]+)\s*\)', r' Ref \1', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+\.', '.', text)
    text = re.sub(r'\s+\,', ',', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\s*-\s*', ' - ', text)
    text = text.strip(' -')
    return text


def strip_html_tags(html: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', html)
    text = unescape(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def smart_truncate(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    words = text.split()
    result = ''
    for word in words:
        if len(result) + len(word) + (1 if result else 0) > max_len:
            break
        result = f"{result} {word}".strip()
    if not result:
        result = text[:max_len].rstrip()
    return result.rstrip(' ,.-')


def generate_seo_description(title: str, body_html: str) -> str:
    if not isinstance(title, str):
        title = ''
    text = strip_html_tags(body_html) if isinstance(body_html, str) else ''
    if text:
        text = remove_emojis(text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    return title


def normalize_sku(sku: str) -> str:
    if not isinstance(sku, str) or not sku.strip():
        return sku
    sku = sku.strip().upper().replace(' ', '-')
    if not sku.endswith('-LK'):
        sku = f'{sku}-LK'
    return sku


def main() -> None:
    df = pd.read_csv(INPUT_FILE, sep=',', quotechar='"', encoding='utf-8', low_memory=False)
    for col in ['Title', 'Body (HTML)', 'Variant SKU', 'SEO Title', 'SEO Description']:
        if col in df.columns:
            df[col] = df[col].fillna('').astype(str)

    updated_rows = 0
    updated_skus = 0
    optimized_titles = 0
    optimized_bodies = 0
    seo_updated = 0

    for idx, row in df.iterrows():
        updated = False

        # SKU
        sku = row.get('Variant SKU')
        if isinstance(sku, str) and sku.strip():
            new_sku = normalize_sku(sku)
            if new_sku != sku:
                df.at[idx, 'Variant SKU'] = new_sku
                updated_skus += 1
                updated = True

        # Title
        title = row.get('Title')
        if isinstance(title, str) and title.strip():
            new_title = normalize_title(title)
            if new_title != title:
                df.at[idx, 'Title'] = new_title
                optimized_titles += 1
                updated = True

        # Body HTML
        body = row.get('Body (HTML)')
        new_body = body if isinstance(body, str) else ''

        # SEO Title
        seo_title = row.get('SEO Title')
        if isinstance(new_title, str) and new_title:
            if not seo_title.strip() or seo_title.strip() != new_title:
                df.at[idx, 'SEO Title'] = new_title
                seo_updated += 1
                updated = True

        # SEO Description
        seo_description = row.get('SEO Description')
        new_seo = generate_seo_description(new_title or '', new_body or '')
        if new_seo and seo_description.strip() != new_seo:
            df.at[idx, 'SEO Description'] = new_seo
            seo_updated += 1
            updated = True

        if updated:
            updated_rows += 1

    df.to_csv(OUTPUT_FILE, sep=',', quotechar='"', encoding='utf-8', index=False)

    print(f'Fichier optimisé enregistré dans: {OUTPUT_FILE}')
    print(f'Rangées modifiées: {updated_rows}')
    print(f'SKUs normalisés: {updated_skus}')
    print(f'Titres optimisés: {optimized_titles}')
    print(f'Descriptions nettoyées: {optimized_bodies}')
    print(f'SEO mis à jour: {seo_updated}')


if __name__ == '__main__':
    main()
