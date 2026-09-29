import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify/sync";

const inputFile =
  process.argv[2] ||
  "/home/josue/Téléchargements/wc-product-export-26-5-2026-1779821334857.csv";
const outputFile =
  process.argv[3] ||
  path.join(
    process.cwd(),
    path.basename(inputFile, ".csv").replace(/^wc-product-export/i, "shopify-products") +
      ".csv"
  );

const SHOPIFY_HEADERS = [
  "Handle",
  "Title",
  "Body (HTML)",
  "Vendor",
  "Product Category",
  "Type",
  "Tags",
  "Published",
  "Option1 Name",
  "Option1 Value",
  "Option2 Name",
  "Option2 Value",
  "Option3 Name",
  "Option3 Value",
  "Variant SKU",
  "Variant Grams",
  "Variant Inventory Tracker",
  "Variant Inventory Qty",
  "Variant Inventory Policy",
  "Variant Fulfillment Service",
  "Variant Price",
  "Variant Compare At Price",
  "Variant Requires Shipping",
  "Variant Taxable",
  "Variant Barcode",
  "Image Src",
  "Image Position",
  "Image Alt Text",
  "Gift Card",
  "SEO Title",
  "SEO Description",
  "Google Shopping / Google Product Category",
  "Google Shopping / Gender",
  "Google Shopping / Age Group",
  "Google Shopping / MPN",
  "Google Shopping / Condition",
  "Google Shopping / Custom Product",
  "Variant Image",
  "Variant Weight Unit",
  "Cost per item",
  "Status",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(value);
      if (row.some((field) => field !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((field) => field !== "")) rows.push(row);
  return rows;
}

function rowObjects(rows) {
  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  return rows.slice(1).map((row) => {
    const object = {};
    headers.forEach((header, index) => {
      object[header] = row[index] || "";
    });
    return object;
  });
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function cleanHtml(value) {
  return String(value || "")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\t+/g, " ")
    .replace(/<p>&nbsp;<\/p>/gi, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripHtml(value) {
  return String(value || "")
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toDecimal(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(",", ".");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : null;
}

function money(value) {
  const number = toDecimal(value);
  return number === null ? "" : number.toFixed(2);
}

function gramsFromKg(value) {
  const kg = toDecimal(value);
  return kg === null ? "" : String(Math.round(kg * 1000));
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function yesNo(value, yes = "TRUE", no = "FALSE") {
  const normalized = String(value || "").trim().toLowerCase();
  return ["1", "yes", "true", "ja", "si", "sí", "y"].includes(normalized) ? yes : no;
}

function pick(product, names) {
  for (const name of names) {
    if (product[name] !== undefined && product[name] !== "") return product[name];
  }
  return "";
}

function buildRows(products) {
  const usedHandles = new Map();
  const rows = [];

  for (const product of products) {
    const id = pick(product, ["ID"]);
    const title = pick(product, ["Name", "Nombre"])?.trim();
    if (!title) continue;

    const baseHandle = slugify(title) || `product-${id}`;
    const count = usedHandles.get(baseHandle) || 0;
    usedHandles.set(baseHandle, count + 1);
    const handle = count === 0 ? baseHandle : `${baseHandle}-${id || count + 1}`;

    const description = cleanHtml(
      pick(product, ["Beschreibung", "Descripción"]) ||
        pick(product, ["Kurzbeschreibung", "Descripción corta"])
    );
    const plainDescription = stripHtml(
      pick(product, ["Kurzbeschreibung", "Descripción corta"]) ||
        pick(product, ["Beschreibung", "Descripción"])
    );
    const seoDescription = plainDescription.slice(0, 320);
    const regularPrice = money(pick(product, ["Regulärer Preis", "Precio normal"]));
    const salePrice = money(pick(product, ["Angebotspreis", "Precio rebajado"]));
    const price = salePrice || regularPrice;
    const compareAt =
      salePrice && regularPrice && Number(salePrice) < Number(regularPrice)
        ? regularPrice
        : "";
    const category = pick(product, ["Kategorien", "Categorías"]);
    const tags = splitList(pick(product, ["Schlagwörter", "Etiquetas"])).join(", ");
    const vendor = pick(product, ["Marken", "Marcas"]) || "Leñas Garros Sl";
    const images = splitList(pick(product, ["Bilder", "Imágenes"]));
    const sku = pick(product, ["Artikelnummer", "SKU"]) || (id ? `WC-${id}` : "");
    const inventoryQty = pick(product, ["Bestand", "Inventario"]);
    const backorders = yesNo(
      pick(product, [
        "Lieferrückstände erlaubt?",
        "¿Permitir reservas de productos agotados?",
      ]),
      "continue",
      "deny"
    );
    const published = yesNo(pick(product, ["Veröffentlicht", "Publicado"]));
    const active = published === "TRUE" ? "active" : "draft";
    const barcode = pick(product, ["GTIN, UPC, EAN oder ISBN", "GTIN, UPC, EAN o ISBN"]);
    const taxStatus = pick(product, ["Steuerstatus", "Estado del impuesto"]);

    const baseRow = Object.fromEntries(SHOPIFY_HEADERS.map((header) => [header, ""]));
    Object.assign(baseRow, {
      Handle: handle,
      Title: title,
      "Body (HTML)": description,
      Vendor: vendor,
      Type: category,
      Tags: tags,
      Published: published,
      "Option1 Name": "Title",
      "Option1 Value": "Default Title",
      "Variant SKU": sku,
      "Variant Grams": gramsFromKg(pick(product, ["Gewicht (kg)", "Peso (kg)"])),
      "Variant Inventory Tracker": "shopify",
      "Variant Inventory Qty": inventoryQty,
      "Variant Inventory Policy": backorders,
      "Variant Fulfillment Service": "manual",
      "Variant Price": price,
      "Variant Compare At Price": compareAt,
      "Variant Requires Shipping": "TRUE",
      "Variant Taxable": yesNo(taxStatus === "taxable" ? "1" : ""),
      "Variant Barcode": barcode,
      "Image Src": images[0] || "",
      "Image Position": images[0] ? "1" : "",
      "Image Alt Text": images[0] ? title : "",
      "Gift Card": "FALSE",
      "SEO Title": title.slice(0, 70),
      "SEO Description": seoDescription,
      "Google Shopping / MPN": sku,
      "Google Shopping / Condition": "new",
      "Google Shopping / Custom Product": barcode ? "FALSE" : "TRUE",
      "Variant Image": images[0] || "",
      "Variant Weight Unit": "kg",
      Status: active,
    });
    rows.push(baseRow);

    images.slice(1).forEach((image, index) => {
      const imageRow = Object.fromEntries(SHOPIFY_HEADERS.map((header) => [header, ""]));
      Object.assign(imageRow, {
        Handle: handle,
        "Image Src": image,
        "Image Position": String(index + 2),
        "Image Alt Text": title,
      });
      rows.push(imageRow);
    });
  }

  return rows;
}

const input = fs.readFileSync(inputFile, "utf8");
const parsed = parseCsv(input);
const products = rowObjects(parsed).filter((product) =>
  ["simple", "variable", "variation", ""].includes(
    String(pick(product, ["Typ", "Tipo"]) || "").toLowerCase()
  )
);
const rows = buildRows(products);
const csv = stringify(rows, {
  header: true,
  columns: SHOPIFY_HEADERS,
  bom: true,
  quoted_string: true,
});

fs.writeFileSync(outputFile, csv, "utf8");

const uniqueProducts = new Set(rows.map((row) => row.Handle).filter(Boolean)).size;
const productsWithoutPrice = rows.filter((row) => row.Title && !row["Variant Price"]).length;
const productsWithoutImage = rows.filter((row) => row.Title && !row["Image Src"]).length;

console.log(`Input: ${inputFile}`);
console.log(`Output: ${outputFile}`);
console.log(`Products: ${uniqueProducts}`);
console.log(`Rows: ${rows.length}`);
console.log(`Missing prices: ${productsWithoutPrice}`);
console.log(`Missing first images: ${productsWithoutImage}`);
