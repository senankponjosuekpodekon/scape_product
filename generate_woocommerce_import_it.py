#!/usr/bin/env python3
"""
Generate a WooCommerce-importable CSV (Italian content) from the Go2Roues raw scrape JSON.

Input:  go2roues-full-products-raw.json  (or --input=...)
Output: woocommerce-import-it.csv        (or --output=...)

Usage:
  python3 generate_woocommerce_import_it.py
  python3 generate_woocommerce_import_it.py --input=go2roues-full-products-raw.json --output=woocommerce-import-it.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


SHOP_NAME = "Distribuzione Import Export S.R.L."


def clean_text(value: Any) -> str:
  text = "" if value is None else str(value)
  text = text.replace("\u00a0", " ")
  text = re.sub(r"\s+", " ", text).strip()
  return text


def slugify(value: str, max_len: int = 80) -> str:
    value = clean_text(value).lower()
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    if not value:
        return "item"
    return value[:max_len].strip("-")


def strip_sku_prefix(value: str) -> str:
    v = clean_text(value)
    for prefix in (
        "www-go2roues-com-",
        "www-go2roues-com",
        "https-www-go2roues-com-",
        "http-www-go2roues-com-",
    ):
        if v.startswith(prefix):
            v = v[len(prefix) :]
            break
    return v.strip("-")


def price_number(value: str) -> str:
    """
    Convert '8390.00 EUR' -> '8390'
    Keep decimals when needed: '19.50 EUR' -> '19.5'
    """
    value = clean_text(value)
    if not value:
        return ""
    value = value.replace(",", ".")
    value = re.sub(r"[^0-9.]", "", value)
    value = value.strip(".")
    return value


def parse_price_eur(value: str) -> float:
    """
    Parse '8390.00 EUR' -> 8390.0
    """
    value = clean_text(value)
    if not value:
        return 0.0
    value = value.replace(",", ".")
    m = re.search(r"(\d+(?:\.\d+)?)", value)
    if not m:
        return 0.0
    try:
        return float(m.group(1))
    except ValueError:
        return 0.0


def yn_it(value: str) -> str:
    v = clean_text(value).lower()
    if v in {"oui", "yes", "true", "1", "si"}:
        return "Si"
    if v in {"non", "no", "false", "0"}:
        return "No"
    return clean_text(value)


def translate_color(value: str) -> str:
    v = clean_text(value).lower()
    mapping = {
        "bleu": "Blu",
        "gris": "Grigio",
        "noir": "Nero",
        "orange": "Arancione",
        "rouge": "Rosso",
        "vert": "Verde",
        "blanc": "Bianco",
        "marron": "Marrone",
        "beige": "Beige",
        "jaune": "Giallo",
    }
    return mapping.get(v, clean_text(value).title())


SPEC_LABEL_IT = {
    "Autonomie": "Autonomia",
    "Temps de recharge": "Tempo di ricarica",
    "Vitesse Maximale": "Velocita massima",
    "Puissance moteur": "Potenza motore",
    "Puissance maximale": "Potenza massima",
    "Puissance de la batterie": "Capacita batteria",
    "Type de Batterie": "Tipo di batteria",
    "Batterie Amovible": "Batteria rimovibile",
    "Chargeur fourni": "Caricatore incluso",
    "Poids en ordre de marche": "Peso in ordine di marcia",
    "Poids": "Peso",
    "Dimensions": "Dimensioni",
    "Permis": "Patente",
    "Cylindrée": "Equivalenza cilindrata",
    "Catégorie Administrative": "Categoria omologazione",
}


def translate_spec_name(name: str) -> str:
    name = clean_text(name)
    return SPEC_LABEL_IT.get(name, name)


def translate_product_type(product_type: str) -> str:
    """
    Minimal mapping FR -> IT for store taxonomy.
    """
    t = clean_text(product_type)
    t = t.replace("Scooter Electrique", "Scooter elettrici")
    t = t.replace("Moto Electrique", "Moto elettriche")
    t = t.replace("Équipements Pilote", "Abbigliamento e accessori")
    t = t.replace("Accessoires", "Accessori")
    t = t.replace("Pièces détachées", "Ricambi")
    t = t.replace("Top Case", "Bauletti")
    t = t.replace("Support top case", "Supporto bauletto")
    t = t.replace("Maxi-Scooter", "Maxi scooter")
    t = t.replace("Casque", "Caschi")
    t = t.replace("Gants", "Guanti")
    return t


def is_placeholder_image(url: str) -> bool:
    u = clean_text(url).lower()
    return ("woocommerce-placeholder" in u) or ("placeholder" in u)


def normalize_image_url(url: str) -> str:
    """
    Improve WooCommerce CSV import success:
    - force https
    - convert common WordPress webp-cache URLs like *.jpg.webp -> *.jpg
    """
    u = clean_text(url)
    if not u:
        return ""
    u = re.sub(r"^http://", "https://", u, flags=re.IGNORECASE)
    # Common pattern from some WP optimizers: "image.jpg.webp"
    u = re.sub(r"\.(jpg|jpeg|png)\.webp$", r".\1", u, flags=re.IGNORECASE)
    return u


def page_score(page: Dict[str, Any]) -> Dict[str, Any]:
    """
    Heuristic scoring to pick likely best-selling products for Italy.
    We bias toward scooters (core, higher intent) and toward in-stock items with real images.
    """
    product = page.get("product") or {}
    title = clean_text(product.get("title"))
    url = clean_text(page.get("url") or product.get("url"))
    brand = clean_text(product.get("brand"))
    product_type_raw = clean_text(product.get("product_type"))
    product_type_it = translate_product_type(product_type_raw)

    images = product.get("images") or []
    primary_image = clean_text(images[0] if images else "")
    image_ok = bool(primary_image) and not is_placeholder_image(primary_image)

    gmc_rows = page.get("gmc_rows") or []
    in_stock_count = 0
    min_price = 0.0
    max_price = 0.0
    for r in gmc_rows:
        avail = clean_text(r.get("availability"))
        if avail == "in_stock":
            in_stock_count += 1
        p = parse_price_eur(clean_text(r.get("price")))
        if p:
            if not min_price or p < min_price:
                min_price = p
            if p > max_price:
                max_price = p

    variants = len(gmc_rows) if gmc_rows else 1
    availability_raw = clean_text(product.get("availability"))

    score = 0.0

    # Hard gates / big penalties
    if not image_ok:
        score -= 100.0

    # Category bias: scooters first for national acquisition campaigns.
    t = (product_type_raw or product_type_it).lower()
    if "scooter" in t:
        score += 50.0
        if "125" in t:
            score += 20.0
        if "maxi" in t:
            score += 15.0
        if "sans permis" in t:
            score += 10.0
        if "3" in t and "roue" in t:
            score += 8.0
    elif "moto" in t:
        score -= 20.0
    elif "access" in t or "ricambi" in t or "pièce" in t or "equip" in t:
        score -= 30.0

    # Stock matters a lot.
    if in_stock_count:
        score += min(10, in_stock_count) * 5.0
    elif availability_raw == "in_stock":
        score += 10.0
    else:
        score -= 15.0

    # Variants can help conversion (color/finish).
    if variants > 1:
        score += min(10, variants) * 1.0

    # Price sanity for scooters: avoid extremes.
    if "scooter" in t and min_price:
        if 2500 <= min_price <= 9000:
            score += 10.0
        elif min_price > 12000:
            score -= 5.0

    # Basic content completeness.
    desc_len = len(clean_text(product.get("description")))
    if desc_len >= 600:
        score += 4.0
    elif desc_len >= 300:
        score += 2.0

    if brand:
        score += 2.0

    return {
        "url": url,
        "title": title,
        "brand": brand,
        "product_type": product_type_raw,
        "product_type_it": product_type_it,
        "score": round(score, 2),
        "variants": variants,
        "in_stock_variants": in_stock_count,
        "min_price_eur": min_price,
        "max_price_eur": max_price,
        "image_ok": image_ok,
    }


def build_specs_table(details: List[Dict[str, str]]) -> str:
    """
    HTML table grouped by section.
    """
    if not details:
        return ""
    rows_by_section: Dict[str, List[Tuple[str, str]]] = {}
    for d in details:
        section = clean_text(d.get("section") or "Specifiche")
        name = translate_spec_name(clean_text(d.get("name")))
        value = yn_it(clean_text(d.get("value")))
        # Drop France-specific incentives for an Italian shop.
        if name.lower().startswith("bonus"):
            continue
        rows_by_section.setdefault(section, []).append((name, value))

    parts: List[str] = []
    for section, rows in rows_by_section.items():
        parts.append(f"<h3>{clean_text(section).title()}</h3>")
        parts.append("<table>")
        for name, value in rows:
            parts.append(f"<tr><th>{name}</th><td>{value}</td></tr>")
        parts.append("</table>")
    return "".join(parts)


def pick_spec(details: List[Dict[str, str]], name_contains: str) -> str:
    key = name_contains.lower()
    for d in details:
        if key in clean_text(d.get("name")).lower():
            return clean_text(d.get("value"))
    return ""


def build_it_copy(product: Dict[str, Any]) -> Tuple[str, str]:
    """
    Returns (short_description_html, description_html) in Italian.
    """
    title = clean_text(product.get("title"))
    brand = clean_text(product.get("brand"))
    product_type = translate_product_type(product.get("product_type") or "")
    details = product.get("details") or []
    highlights = [clean_text(h) for h in (product.get("highlights") or []) if clean_text(h)]

    autonomia = pick_spec(details, "Autonomie")
    velocita = pick_spec(details, "Vitesse")
    ricarica = pick_spec(details, "recharge")
    batteria = pick_spec(details, "kWh")
    peso = pick_spec(details, "Poids")

    bullets: List[str] = []
    if autonomia:
        bullets.append(f"<li>Autonomia dichiarata: {clean_text(autonomia)}</li>")
    if velocita:
        bullets.append(f"<li>Velocita massima: {clean_text(velocita)}</li>")
    if ricarica:
        bullets.append(f"<li>Tempo di ricarica: {clean_text(ricarica)}</li>")
    if batteria:
        bullets.append(f"<li>Batteria: {clean_text(batteria)}</li>")
    if peso:
        bullets.append(f"<li>Peso: {clean_text(peso)}</li>")

    short_parts: List[str] = []
    maker = f"di {brand}" if brand else ""
    short_parts.append(
        f"<p><strong>{title}</strong> {maker}. <em>Venduto da {SHOP_NAME}</em>.</p>"
    )
    if bullets:
        short_parts.append("<ul>" + "".join(bullets[:5]) + "</ul>")

    desc_parts: List[str] = []
    desc_parts.append(f"<h2>Panoramica</h2>")
    desc_parts.append(
        "<p>"
        "Contenuto riscritto e ottimizzato per una boutique italiana: informazioni chiare, "
        "valori tecnici organizzati e testo pensato per aiutare la decisione d'acquisto."
        "</p>"
    )
    desc_parts.append(f"<p><strong>Venditore:</strong> {SHOP_NAME}</p>")
    if product_type:
        desc_parts.append(f"<p><strong>Categoria:</strong> {clean_text(product_type)}</p>")

    if highlights:
        desc_parts.append("<h2>Punti di forza</h2>")
        desc_parts.append("<ul>" + "".join(f"<li>{h}</li>" for h in highlights[:8]) + "</ul>")

    desc_parts.append("<h2>Scheda tecnica</h2>")
    table = build_specs_table(details)
    if table:
        desc_parts.append(table)

    desc_parts.append("<h2>Note</h2>")
    desc_parts.append(
        "<p>"
        "Disponibilita, prezzi e varianti possono variare. Si consiglia di verificare la configurazione selezionata "
        "prima dell'acquisto."
        "</p>"
    )

    return ("".join(short_parts), "".join(desc_parts))


WOO_COLUMNS = [
    "Type",
    "SKU",
    "Name",
    "Published",
    "Visibility in catalog",
    "Short description",
    "Description",
    "Manage stock?",
    "Stock",
    "Regular price",
    "Sale price",
    "In stock?",
    "Backorders allowed?",
    "Categories",
    "Tags",
    "Images",
    "Parent",
    "Attribute 1 name",
    "Attribute 1 value(s)",
    "Attribute 1 visible",
    "Attribute 1 global",
    "Attribute 2 name",
    "Attribute 2 value(s)",
    "Attribute 2 visible",
    "Attribute 2 global",
    "Brands",
]


def wc_availability(availability: str) -> Tuple[str, str]:
    a = clean_text(availability)
    if a in {"out_of_stock"}:
        return ("no", "no")
    if a in {"preorder", "backorder"}:
        return ("yes", "notify")
    return ("yes", "no")


def join_images(images: List[str]) -> str:
    cleaned = [normalize_image_url(i) for i in images if normalize_image_url(i)]
    return ", ".join(cleaned[:15])

def join_all_images(images: List[str]) -> str:
    cleaned: List[str] = []
    seen = set()
    for img in images:
        u = normalize_image_url(img)
        if not u:
            continue
        if is_placeholder_image(u):
            continue
        if u in seen:
            continue
        seen.add(u)
        cleaned.append(u)
    return ", ".join(cleaned[:30])


def images_from_gmc_rows(gmc_rows: List[Dict[str, Any]]) -> List[str]:
    imgs: List[str] = []
    for r in gmc_rows:
        main = clean_text(r.get("image_link"))
        if main:
            imgs.append(main)
        additional = clean_text(r.get("additional_image_link"))
        if additional:
            for part in additional.split(","):
                p = clean_text(part)
                if p:
                    imgs.append(p)
    return imgs


def make_parent_sku(url: str) -> str:
    u = clean_text(url)
    u = re.sub(r"^https?://", "", u, flags=re.IGNORECASE)
    u = re.sub(r"^www\.go2roues\.com/?", "", u, flags=re.IGNORECASE)
    u = u.strip("/")
    # Prefer product slug-like SKU
    if u.startswith("shop/"):
        u = u[len("shop/") :]
    if not u:
        u = url
    return strip_sku_prefix(slugify(u))


def build_rows(pages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []

    for page in pages:
        product = page.get("product") or {}
        url = clean_text(page.get("url") or product.get("url"))
        if not url:
            continue

        variants = page.get("gmc_rows") or []
        has_variants = len(variants) > 1 and any(clean_text(v.get("item_group_id")) for v in variants)

        title = clean_text(product.get("title")) or clean_text(variants[0].get("title") if variants else "") or url
        brand = clean_text(product.get("brand"))
        categories = translate_product_type(product.get("product_type") or "")

        short_html, desc_html = build_it_copy(product)
        short_html = clean_text(short_html)
        desc_html = clean_text(desc_html)
        images = product.get("images") or []
        images_csv = join_images(images)

        parent_sku = make_parent_sku(url)

        if has_variants:
            # Parent variable product
            options = product.get("options") or {}
            colors = [translate_color(c) for c in (options.get("couleur") or [])]
            finishes = [clean_text(f).replace("Phase", "Fase") for f in (options.get("finition") or [])]

            parent_row = {k: "" for k in WOO_COLUMNS}
            parent_row.update(
                {
                    "Type": "variable",
                    "SKU": parent_sku,
                    "Name": title,
                    "Published": "1",
                    "Visibility in catalog": "visible",
                    "Short description": short_html,
                    "Description": desc_html,
                    "Categories": categories,
                    "Images": images_csv,
                    "Brands": brand,
                    "Attribute 1 name": "Colore",
                    "Attribute 1 value(s)": ", ".join([c for c in colors if c]),
                    "Attribute 1 visible": "1",
                    "Attribute 1 global": "1",
                    "Attribute 2 name": "Finitura",
                    "Attribute 2 value(s)": ", ".join([f for f in finishes if f]),
                    "Attribute 2 visible": "1",
                    "Attribute 2 global": "1",
                }
            )
            rows.append(parent_row)

            # Variations
            for v in variants:
                in_stock, backorders = wc_availability(v.get("availability") or "")
                v_row = {k: "" for k in WOO_COLUMNS}
                v_row.update(
                    {
                        "Type": "variation",
                        "SKU": strip_sku_prefix(clean_text(v.get("id")) or slugify(clean_text(v.get("link") or ""))),
                        "Name": clean_text(v.get("title")) or title,
                        "Published": "1",
                        "Visibility in catalog": "visible",
                        "Regular price": price_number(clean_text(v.get("price"))),
                        "Sale price": price_number(clean_text(v.get("sale_price"))),
                        "In stock?": in_stock,
                        "Backorders allowed?": backorders,
                        "Parent": strip_sku_prefix(parent_sku),
                        "Images": join_images([clean_text(v.get("image_link"))]),
                        "Brands": brand or clean_text(v.get("brand")),
                        "Attribute 1 name": "Colore",
                        "Attribute 1 value(s)": translate_color(clean_text(v.get("color"))),
                        "Attribute 2 name": "Finitura",
                        "Attribute 2 value(s)": clean_text(v.get("size")).replace("phase", "fase"),
                    }
                )
                rows.append(v_row)
        else:
            # Simple product
            best = variants[0] if variants else {}
            in_stock, backorders = wc_availability(best.get("availability") or product.get("availability") or "")

            simple_row = {k: "" for k in WOO_COLUMNS}
            simple_row.update(
                {
                    "Type": "simple",
                    "SKU": strip_sku_prefix(clean_text(best.get("id")) or parent_sku),
                    "Name": clean_text(best.get("title")) or title,
                    "Published": "1",
                    "Visibility in catalog": "visible",
                    "Short description": short_html,
                    "Description": desc_html,
                    "Regular price": price_number(clean_text(best.get("price")) or clean_text(product.get("price"))),
                    "Sale price": price_number(clean_text(best.get("sale_price")) or clean_text(product.get("sale_price"))),
                    "In stock?": in_stock,
                    "Backorders allowed?": backorders,
                    "Categories": categories,
                    "Images": images_csv or join_images([clean_text(best.get("image_link"))]),
                    "Brands": brand or clean_text(best.get("brand")),
                }
            )
            rows.append(simple_row)

    return rows


def pick_default_variation(gmc_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Choose a single variation to represent a variable product when flattening.
    Preference:
      1) in_stock
      2) lowest price
    """
    if not gmc_rows:
        return {}
    candidates = []
    for r in gmc_rows:
        avail = clean_text(r.get("availability"))
        in_stock = 1 if avail == "in_stock" else 0
        price = parse_price_eur(clean_text(r.get("sale_price"))) or parse_price_eur(clean_text(r.get("price")))
        candidates.append((in_stock, price if price else 10**12, r))
    candidates.sort(key=lambda x: (-x[0], x[1]))
    return candidates[0][2] if candidates else gmc_rows[0]


def flatten_variable_products(rows: List[Dict[str, str]], pages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Convert variable products into simple products (drop variations).
    Adds a note in Italian to specify color/finish in order notes.
    """
    pages_by_parent_sku: Dict[str, Dict[str, Any]] = {}
    for page in pages:
        url = clean_text((page.get("product") or {}).get("url") or page.get("url"))
        if not url:
            continue
        pages_by_parent_sku[make_parent_sku(url)] = page

    out: List[Dict[str, str]] = []
    for row in rows:
        row_type = clean_text(row.get("Type"))
        if row_type == "variation":
            continue
        if row_type != "variable":
            out.append(row)
            continue

        sku = clean_text(row.get("SKU"))
        page = pages_by_parent_sku.get(sku, {})
        gmc_rows = page.get("gmc_rows") or []
        best = pick_default_variation(gmc_rows)

        # Derive available options from product options (colors/finishes) when present.
        options = (page.get("product") or {}).get("options") or {}
        colors = [translate_color(c) for c in (options.get("couleur") or []) if clean_text(c)]
        finishes = [clean_text(f).replace("Phase", "Fase") for f in (options.get("finition") or []) if clean_text(f)]

        note = "<h2>Scelta colore e finitura</h2><p>Indicare nelle note dell'ordine il colore e la finitura desiderati.</p>"
        if colors:
            note += "<p><strong>Colori disponibili:</strong> " + ", ".join(colors) + ".</p>"
        if finishes:
            note += "<p><strong>Finiture disponibili:</strong> " + ", ".join(finishes) + ".</p>"

        new_row = {k: "" for k in WOO_COLUMNS}
        new_row.update(row)  # keep name, descriptions, categories, images, brand
        new_row["Type"] = "simple"
        new_row["Parent"] = ""
        new_row["Attribute 1 name"] = ""
        new_row["Attribute 1 value(s)"] = ""
        new_row["Attribute 1 visible"] = ""
        new_row["Attribute 1 global"] = ""
        new_row["Attribute 2 name"] = ""
        new_row["Attribute 2 value(s)"] = ""
        new_row["Attribute 2 visible"] = ""
        new_row["Attribute 2 global"] = ""

        # Price + stock from chosen variation
        new_row["Regular price"] = price_number(clean_text(best.get("price")))
        new_row["Sale price"] = price_number(clean_text(best.get("sale_price")))
        in_stock, backorders = wc_availability(clean_text(best.get("availability")))
        new_row["In stock?"] = in_stock
        new_row["Backorders allowed?"] = backorders
        new_row["Manage stock?"] = "yes"
        new_row["Stock"] = "15"

        # Merge all images: product images + all variation images (including additional image links)
        merged_images: List[str] = []
        merged_images.extend((page.get("product") or {}).get("images") or [])
        merged_images.extend(images_from_gmc_rows(gmc_rows))
        new_row["Images"] = join_all_images(merged_images) or new_row.get("Images") or ""

        # Put color/finish instruction into the main description (as requested).
        desc = clean_text(new_row.get("Description"))
        new_row["Description"] = clean_text(desc + " " + note)

        out.append(new_row)

    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="go2roues-full-products-raw.json")
    parser.add_argument("--output", default="woocommerce-import-it.csv")
    parser.add_argument("--only_ready", action="store_true", help="Keep only in_stock products with non-placeholder images and a price.")
    parser.add_argument("--excluded_report", default="woocommerce-import-it-excluded.json")
    parser.add_argument(
        "--exclude_category",
        action="append",
        default=[],
        help="Exclude products whose Categories start with this prefix (repeatable).",
    )
    parser.add_argument("--top_n", type=int, default=0, help="Select top N products (heuristic score) before generating CSV.")
    parser.add_argument("--selection_report", default="", help="Write selection ranking JSON to this path.")
    parser.add_argument("--flatten_variations", action="store_true", help="Convert variable products to simple products (drop variations).")
    parser.add_argument("--stock_qty", type=int, default=15, help="Stock quantity to set for imported products (default: 15).")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    pages = json.loads(input_path.read_text(encoding="utf-8"))

    if args.top_n and args.top_n > 0:
        ranked = [page_score(p) for p in pages]
        ranked.sort(key=lambda x: x["score"], reverse=True)
        keep = {r["url"] for r in ranked[: args.top_n] if r.get("url")}
        pages = [p for p in pages if clean_text(p.get("url")) in keep]
        if args.selection_report:
            Path(args.selection_report).write_text(
                json.dumps(ranked, ensure_ascii=False, indent=2), encoding="utf-8"
            )

    rows_all = build_rows(pages)

    excluded: List[Dict[str, str]] = []
    if args.only_ready:
        kept: List[Dict[str, str]] = []
        for row in rows_all:
            row_type = row.get("Type", "")
            price_ok = bool(clean_text(row.get("Regular price")))
            in_stock = clean_text(row.get("In stock?")).lower() in {"yes", "1", "true"}
            images = clean_text(row.get("Images"))
            has_image = bool(images) and ("woocommerce-placeholder" not in images.lower())

            # Parent rows: keep only if at least one variation survives (handled after pass).
            if row_type == "variable":
                kept.append(row)
                continue

            ready = in_stock and has_image and (price_ok or row_type == "variation")
            if ready:
                kept.append(row)
            else:
                excluded.append(
                    {
                        "type": row_type,
                        "sku": clean_text(row.get("SKU")),
                        "name": clean_text(row.get("Name")),
                        "reason": ",".join(
                            [
                                "out_of_stock" if not in_stock else "",
                                "missing_price" if not price_ok and row_type != "variation" else "",
                                "missing_image" if not has_image else "",
                            ]
                        ).strip(","),
                    }
                )

        # Drop variable parents that have no variations left.
        parents_with_variations = {clean_text(r.get("Parent")) for r in kept if r.get("Type") == "variation"}
        final_rows: List[Dict[str, str]] = []
        for row in kept:
            if row.get("Type") == "variable" and clean_text(row.get("SKU")) not in parents_with_variations:
                excluded.append(
                    {
                        "type": "variable",
                        "sku": clean_text(row.get("SKU")),
                        "name": clean_text(row.get("Name")),
                        "reason": "no_sellable_variations",
                    }
                )
                continue
            final_rows.append(row)
        rows = final_rows
    else:
        rows = rows_all

    exclude_prefixes = [clean_text(x) for x in (args.exclude_category or []) if clean_text(x)]
    if exclude_prefixes:
        excluded_parents = set()
        filtered: List[Dict[str, str]] = []
        for row in rows:
            row_type = clean_text(row.get("Type"))
            cats = clean_text(row.get("Categories"))
            sku = clean_text(row.get("SKU"))
            parent = clean_text(row.get("Parent"))

            def is_excluded_category(category_value: str) -> bool:
                if not category_value:
                    return False
                for prefix in exclude_prefixes:
                    if category_value.startswith(prefix):
                        return True
                return False

            if row_type in {"simple", "variable"} and is_excluded_category(cats):
                if row_type == "variable" and sku:
                    excluded_parents.add(sku)
                excluded.append(
                    {
                        "type": row_type,
                        "sku": sku,
                        "name": clean_text(row.get("Name")),
                        "reason": f"excluded_category:{cats}",
                    }
                )
                continue

            filtered.append(row)

        # Remove variations of excluded parents.
        if excluded_parents:
            final_rows: List[Dict[str, str]] = []
            for row in filtered:
                if clean_text(row.get("Type")) == "variation" and clean_text(row.get("Parent")) in excluded_parents:
                    excluded.append(
                        {
                            "type": "variation",
                            "sku": clean_text(row.get("SKU")),
                            "name": clean_text(row.get("Name")),
                            "reason": "excluded_parent_category",
                        }
                    )
                    continue
                final_rows.append(row)
            rows = final_rows
        else:
            rows = filtered

    if args.flatten_variations:
        rows = flatten_variable_products(rows, pages)

    # Apply stock management to all output rows (simple/variable/variation)
    qty = str(int(args.stock_qty)) if args.stock_qty is not None else ""
    if qty:
        for row in rows:
            t = clean_text(row.get("Type"))
            if t in {"simple", "variable", "variation"}:
                row["Manage stock?"] = "yes"
                row["Stock"] = qty

    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=WOO_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

    if excluded:
        Path(args.excluded_report).write_text(json.dumps(excluded, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote {len(rows)} rows to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
