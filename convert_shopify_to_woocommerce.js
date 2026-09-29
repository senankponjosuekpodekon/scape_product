import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify/sync";

const inputFile = process.argv[2];
const outputFile =
  process.argv[3] ||
  path.join(
    process.cwd(),
    path.basename(inputFile || "products_export.csv", ".csv") + "_woocommerce.csv"
  );

if (!inputFile) {
  console.error("Usage: node convert_shopify_to_woocommerce.js input.csv [output.csv]");
  process.exit(1);
}

const WOO_HEADERS = [
  "Type",
  "SKU",
  "Name",
  "Published",
  "Is featured?",
  "Visibility in catalog",
  "Short description",
  "Description",
  "Date sale price starts",
  "Date sale price ends",
  "Tax status",
  "Tax class",
  "In stock?",
  "Stock",
  "Low stock amount",
  "Backorders allowed?",
  "Sold individually?",
  "Weight (kg)",
  "Length (cm)",
  "Width (cm)",
  "Height (cm)",
  "Allow customer reviews?",
  "Purchase note",
  "Sale price",
  "Regular price",
  "Categories",
  "Tags",
  "Shipping class",
  "Images",
  "Download limit",
  "Download expiry days",
  "Parent",
  "Grouped products",
  "Upsells",
  "Cross-sells",
  "External URL",
  "Button text",
  "Position",
  "Brands",
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

function cleanHtml(value) {
  return String(value || "")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripHtml(value) {
  return String(value || "")
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

function money(value) {
  const number = Number.parseFloat(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number.toFixed(2) : "";
}

function kgFromGrams(value, displayUnit) {
  const number = Number.parseFloat(String(value || "").replace(",", "."));
  if (!Number.isFinite(number) || number <= 0) return "";

  const unit = String(displayUnit || "").toLowerCase();
  if (unit === "kg") return String(number);
  if (unit === "lb" || unit === "lbs") return (number * 0.45359237).toFixed(3);
  if (unit === "oz") return (number * 0.0283495231).toFixed(3);
  return (number / 1000).toFixed(3);
}

function yesNoShopify(value) {
  return ["true", "1", "yes", "active"].includes(String(value || "").toLowerCase());
}

function firstPresent(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== "") return row[name];
  }
  return "";
}

function splitCsvList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferBrand(productRows) {
  const first = productRows[0];
  const vendor = first.Vendor || "";
  if (vendor) return vendor;

  const title = first.Title || "";
  const firstWord = title.split(/\s+/)[0];
  return firstWord || "";
}

function toWooProducts(shopifyRows) {
  const groups = new Map();
  for (const row of shopifyRows) {
    const handle = row.Handle || row["URL handle"];
    if (!handle) continue;
    if (!groups.has(handle)) groups.set(handle, []);
    groups.get(handle).push(row);
  }

  const products = [];

  for (const [handle, rows] of groups) {
    const main = rows.find((row) => row.Title || row["Variant Price"] || row["Image Src"]) || rows[0];
    const images = [
      ...new Set(
        rows
          .flatMap((row) => [row["Image Src"], row["Product image URL"], row["Variant Image"]])
          .filter(Boolean)
      ),
    ];
    const compareAt = money(main["Variant Compare At Price"]);
    const price = money(main["Variant Price"] || main.Price);
    const salePrice = compareAt && price && Number(price) < Number(compareAt) ? price : "";
    const regularPrice = salePrice ? compareAt : price;
    const stock = firstPresent(main, ["Variant Inventory Qty", "Inventory quantity"]);
    const tags = splitCsvList(main.Tags).join(", ");
    const title = main.Title || handle;
    const description = cleanHtml(main["Body (HTML)"] || main.Description);
    const shortDescription =
      firstPresent(main, ["SEO Description", "SEO description"]) ||
      stripHtml(description).slice(0, 300);

    const product = Object.fromEntries(WOO_HEADERS.map((header) => [header, ""]));
    Object.assign(product, {
      Type: "simple",
      SKU: main["Variant SKU"] || main.SKU || handle,
      Name: title,
      Published: yesNoShopify(main.Published || main["Published on online store"] || main.Status)
        ? "1"
        : "0",
      "Is featured?": "0",
      "Visibility in catalog": "visible",
      "Short description": shortDescription,
      Description: description,
      "Tax status": yesNoShopify(main["Variant Taxable"] || main["Charge tax"]) ? "taxable" : "none",
      "In stock?": stock === "" || Number(stock) > 0 ? "1" : "0",
      Stock: stock,
      "Backorders allowed?":
        String(main["Variant Inventory Policy"] || "").toLowerCase() === "continue" ? "1" : "0",
      "Sold individually?": "0",
      "Weight (kg)": kgFromGrams(main["Variant Grams"], main["Variant Weight Unit"]),
      "Allow customer reviews?": "1",
      "Sale price": salePrice,
      "Regular price": regularPrice,
      Categories: main.Type || main["Product Category"] || main["Product category"] || "Uncategorized",
      Tags: tags,
      Images: images.join(", "),
      Position: "0",
      Brands: inferBrand(rows),
    });

    products.push(product);
  }

  return products;
}

const input = fs.readFileSync(inputFile, "utf8");
const rows = rowObjects(parseCsv(input));
const products = toWooProducts(rows);
const csv = stringify(products, {
  header: true,
  columns: WOO_HEADERS,
  bom: true,
  quoted_string: true,
});

fs.writeFileSync(outputFile, csv, "utf8");

const missingName = products.filter((product) => !product.Name).length;
const missingPrice = products.filter((product) => !product["Regular price"]).length;
const missingImages = products.filter((product) => !product.Images).length;

console.log(`Input: ${inputFile}`);
console.log(`Output: ${outputFile}`);
console.log(`Products: ${products.length}`);
console.log(`Missing names: ${missingName}`);
console.log(`Missing regular prices: ${missingPrice}`);
console.log(`Missing images: ${missingImages}`);
