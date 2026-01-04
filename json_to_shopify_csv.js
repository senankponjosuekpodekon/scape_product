import fs from "fs";
import { Parser } from "json2csv";

const INPUT_FILE = "products.json";
const OUTPUT_FILE = "products_shopify.csv";

/* =====================
   UTILS
===================== */

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function cleanPrice(price) {
  if (!price) return "";
  return price.replace(/[^\d,.]/g, "").replace(",", ".");
}

/* =====================
   MAIN
===================== */

const products = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
const rows = [];

for (const product of products) {
  const handle = slugify(product.title);

  product.images.forEach((image, index) => {
    rows.push({
      Handle: handle,
      Title: index === 0 ? product.title : "",
      "Body (HTML)": index === 0 ? product.description : "",
      Vendor: "Maderas y Palets San Cristobal Sl",
      Type: "Pellets",
      Tags: "pellets,biomasse,chauffage",
      Published: "TRUE",

      "Option1 Name": "Titre",
      "Option1 Value": "Par défaut",

      "Variant Price": index === 0 ? cleanPrice(product.price) : "",
      "Variant Inventory Tracker": "",
      "Variant Inventory Qty": "",
      "Variant Inventory Policy": "deny",
      "Variant Fulfillment Service": "manual",
      "Variant Requires Shipping": "TRUE",
      "Variant Taxable": "TRUE",
      "Variant Weight": "",
      "Variant Weight Unit": "kg",

      "Image Src": image,
      "Image Position": index + 1,
    });
  });
}

const parser = new Parser({ delimiter: "," });
const csv = parser.parse(rows);

fs.writeFileSync(OUTPUT_FILE, csv, "utf8");

console.log("CSV Shopify généré :", OUTPUT_FILE);

