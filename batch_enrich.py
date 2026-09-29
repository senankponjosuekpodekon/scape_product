import csv
import re
import html
from html import escape

INFILE = 'products_export_1 (38).csv'
OUTFILE = 'products_export_1 (38)_enriched.csv'


def strip_html(text):
    if not text:
        return ''
    t = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    t = re.sub(r'</p>', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'<li>', '\n- ', t, flags=re.IGNORECASE)
    t = re.sub(r'</li>', '', t, flags=re.IGNORECASE)
    t = re.sub(r'<[^>]+>', '', t)
    t = html.unescape(t)
    t = re.sub(r'\n\s*\n', '\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()


def extract_specs(body_text):
    specs = {}
    # Dimensions
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*m', body_text, re.IGNORECASE)
    if m:
        specs['dimensions'] = f"{m.group(1)} × {m.group(2)} × {m.group(3)} m"
    # Weights
    for pat in [r'Leergewicht[:\s]+([\d.]+)\s*kg', r'Gewicht[:\s]+([\d.]+)\s*kg', r'([\d.]+)\s*kg', r'([\d.]+)\s*KG']:
        m = re.search(pat, body_text, re.IGNORECASE)
        if m:
            specs['weight'] = m.group(1) + ' kg'
            break
    # Colors
    m = re.search(r'Farbe(?:n)?[:\s]+([^\n<]+)', body_text, re.IGNORECASE)
    if m:
        specs['color'] = m.group(1).strip().rstrip('.')
    # Year
    m = re.search(r'Baujahr[:\s]+(\d{4})', body_text, re.IGNORECASE)
    if m:
        specs['year'] = m.group(1)
    # Condition
    if 'neu' in body_text.lower() or 'Neu' in body_text:
        specs['condition'] = 'Neu'
    elif 'gebraucht' in body_text.lower():
        specs['condition'] = 'Gebraucht'
    else:
        specs['condition'] = 'Neu'
    # Capacity / count
    m = re.search(r'(\d+)\s*(?:Pferde|Plätze|Kabinen|Module|Container)', body_text, re.IGNORECASE)
    if m:
        specs['capacity'] = m.group(1)
    # Delivery
    if 'Lieferzeit auf Anfrage' in body_text:
        specs['delivery'] = 'Lieferzeit auf Anfrage'
    elif re.search(r'Lieferzeit[:\s]+[^\n]+', body_text):
        specs['delivery'] = re.search(r'Lieferzeit[:\s]+([^\n]+)', body_text).group(1).strip()
    return specs


def as_html(text):
    if not text:
        return ''
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    return ''.join(f'<p>{escape(p).replace(chr(10), "<br>")}</p>' for p in paragraphs)


def make_intro(type_, title, specs):
    type_lower = type_.lower() if type_ else ''
    if 'sanitär' in type_lower or 'wc' in type_lower or 'dusch' in type_lower:
        return (f"Der <strong>{title}</strong> bietet eine hygienische, robuste und sofort einsatzbereite "
                f"Lösung für Baustellen, Veranstaltungen, Camping und industrielle Einsätze. "
                f"Hochwertige Verarbeitung, einfacher Transport und schnelle Installation machen ihn zur "
                f"idealen Wahl für professionelle Sanitärlösungen.")
    elif 'büro' in type_lower:
        return (f"Der <strong>{title}</strong> ist ein vielseitig einsetzbarer Raumcontainer für Baustellen, "
                f"Wachdienste, Messestände und temporäre Büros. Robust, isoliert und sofort einsatzbereit.")
    elif 'lager' in type_lower:
        return (f"Der <strong>{title}</strong> bietet sicheren und wetterfesten Stauraum für Werkzeuge, "
                f"Materialien und Güter. Solide Stahlblechkonstruktion, einfacher Transport und schnelle Aufstellung.")
    elif 'see' in type_lower or 'versand' in type_lower:
        return (f"Der <strong>{title}</strong> ist ein hochwertiger See- und Lagercontainer für den sicheren "
                f"Transport und die Lagerung Ihrer Güter. Wind-, wasser- und diebstahlsicher.")
    elif 'anlage' in type_lower:
        return (f"Die <strong>{title}</strong> ist eine komplette modulare Containeranlage für anspruchsvolle "
                f"Baustellen- oder Gewerbeanforderungen. Flexibel, skalierbar und sofort einsatzbereit.")
    elif 'pferd' in type_lower or 'anhäng' in type_lower or 'cheval' in type_lower:
        return (f"Der <strong>{title}</strong> vereint maximale Sicherheit, Komfort und Flexibilität für den "
                f"Transport von Pferden. Hochwertige Materialien, durchdachte Belüftung und modulare Trennwände.")
    else:
        return (f"Der <strong>{title}</strong> ist eine robuste, hochwertige und sofort einsatzbereite "
                f"Containerlösung für vielfältige Einsatzzwecke in Industrie, Bau und Logistik.")


def make_benefits(type_, specs):
    type_lower = type_.lower() if type_ else ''
    benefits = []
    if 'sanitär' in type_lower or 'wc' in type_lower or 'dusch' in type_lower:
        benefits = [
            "Hygienische und robuste Sanitärlösung für Innen- und Außenbereich",
            "Schnelle Lieferung und einfache Aufstellung",
            "Witterungsbeständige Stahlblechkonstruktion",
            "Komplett ausgestattet und sofort einsatzbereit",
        ]
    elif 'büro' in type_lower:
        benefits = [
            "Sofort einsatzbereiter Büro- und Mannschaftsraum",
            "Gut isoliert und wetterfest",
            "Flexible Aufstellmöglichkeiten auf Baustellen und Events",
            "Komfortable Ausstattung für mehrere Personen",
        ]
    elif 'lager' in type_lower:
        benefits = [
            "Sichere und wetterfeste Lagerung",
            "Robuste Stahlblechkonstruktion",
            "Einfacher Transport und schnelle Aufstellung",
            "Vielseitig einsetzbar für Baustellen und Logistik",
        ]
    elif 'see' in type_lower or 'versand' in type_lower:
        benefits = [
            "ISO-zertifizierte Containerqualität",
            "Wasserdicht und winddicht für Transport und Lagerung",
            "Stabile Bodenkonstruktion für schwere Lasten",
            "Schnelle Verfügbarkeit und Lieferung",
        ]
    elif 'anlage' in type_lower:
        benefits = [
            "Modulare Komplettlösung aus mehreren Containern",
            "Skalierbar und flexibel erweiterbar",
            "Schnelle Lieferung und Montage",
            "Ideal für große Baustellen oder Gewerbeprojekte",
        ]
    elif 'pferd' in type_lower or 'anhäng' in type_lower or 'cheval' in type_lower:
        benefits = [
            "Maximale Sicherheit und Komfort für Pferde",
            "Modulare Aluminium-Trennwände",
            "Optimale Belüftung und Tageslichteintrag",
            "Robustes Polyesterdach und aerodynamisches Design",
        ]
    else:
        benefits = [
            "Robuste und langlebige Containerkonstruktion",
            "Sofort einsatzbereit und einfach zu transportieren",
            "Flexible Nutzungsmöglichkeiten",
            "Wetterfest und sicher",
        ]
    return benefits


def build_body(original_body, title, type_, price, sku, specs):
    plain = strip_html(original_body)
    intro = make_intro(type_, title, specs)
    benefits = make_benefits(type_, specs)

    # Extract additional bullet points from existing body
    existing_bullets = []
    for line in plain.split('\n'):
        line = line.strip().strip('-').strip('>').strip()
        if len(line) > 10 and not line.lower().startswith('technische details') and not line.lower().startswith('description'):
            existing_bullets.append(line)

    # Build specs list
    specs_html = ''
    if specs:
        items = []
        if 'dimensions' in specs:
            items.append(f"Maße (L×B×H): {specs['dimensions']}")
        if 'weight' in specs:
            items.append(f"Gewicht: {specs['weight']}")
        if 'color' in specs:
            items.append(f"Farbe: {specs['color']}")
        if 'year' in specs:
            items.append(f"Baujahr: {specs['year']}")
        if 'condition' in specs:
            items.append(f"Zustand: {specs['condition']}")
        if 'capacity' in specs:
            items.append(f"Kapazität: {specs['capacity']}")
        if 'delivery' in specs:
            items.append(f"Lieferung: {specs['delivery']}")
        if items:
            specs_html = '<h3>Technische Daten</h3>\n<ul>' + ''.join(f'<li>{escape(item)}</li>' for item in items) + '</ul>'

    # Unique selling points from existing body (avoid duplicates, keep top 6)
    usp_html = ''
    unique_bullets = []
    for b in existing_bullets[:6]:
        if b not in unique_bullets and len(b) < 120:
            unique_bullets.append(b)
    if unique_bullets:
        usp_html = '<h3>Ausstattung &amp; Highlights</h3>\n<ul>' + ''.join(f'<li>{escape(b)}</li>' for b in unique_bullets) + '</ul>'

    html_parts = [
        '<p><strong>' + escape(title) + '</strong></p>',
        '<p><em>' + escape('Sofort einsatzbereit, robust und flexibel – für professionelle Ansprüche.') + '</em></p>',
        '<p>' + intro + '</p>',
        '<h3>Vorteile auf einen Blick</h3>',
        '<ul>' + ''.join(f'<li>{escape(b)}</li>' for b in benefits) + '</ul>',
    ]
    if usp_html:
        html_parts.append(usp_html)
    html_parts.append(specs_html)
    html_parts.append('<p><strong>Artikelnr.:</strong> ' + escape(sku) + '<br><strong>Preis:</strong> ' + escape(price) + ' € (zzgl. MwSt.)<br>' + escape('Lieferzeit auf Anfrage') + '</p>')
    html_parts.append('<p><strong>👉 Jetzt anfragen und individuelles Angebot erhalten!</strong></p>')

    return '\n'.join(html_parts)


def make_seo_title(title, sku):
    t = re.sub(r'\s*\([^)]*\)$', '', title).strip()
    base = f"{t} | {sku}"
    if len(base) > 70:
        base = base[:67] + '...'
    return base


def make_seo_description(title, type_, sku):
    return f"{title} – hochwertiger {type_} sofort einsatzbereit. Artikelnr. {sku}. Jetzt anfragen!"


def main():
    with open(INFILE, 'r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    updated = 0
    for r in rows:
        # Only base product rows (not image rows)
        if not (r.get('Title') and r['Title'].strip() and r.get('Variant SKU') and r['Variant SKU'].strip()):
            continue

        original_title = r['Title'].strip()
        # Append SKU for differentiation
        if r['Variant SKU'] not in original_title:
            new_title = f"{original_title} ({r['Variant SKU']})"
        else:
            new_title = original_title

        specs = extract_specs(r.get('Body (HTML)', '') + ' ' + r.get('SEO Description', ''))
        new_body = build_body(r.get('Body (HTML)', ''), r['Title'].strip(), r.get('Type', ''), r.get('Variant Price', ''), r['Variant SKU'], specs)

        r['Title'] = new_title
        r['Body (HTML)'] = new_body
        r['SEO Title'] = make_seo_title(new_title, r['Variant SKU'])
        r['SEO Description'] = make_seo_description(r['Title'].strip(), r.get('Type', ''), r['Variant SKU'])
        r['Image Alt Text'] = r['Title'].strip()
        r['Google Shopping / MPN'] = r['Variant SKU']
        updated += 1

    with open(OUTFILE, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f'✅ {updated} fiches produits enrichies dans {OUTFILE}')


if __name__ == '__main__':
    main()
