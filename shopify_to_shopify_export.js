import fs from "fs";
import fetch from "node-fetch";
import { stringify } from "csv-stringify/sync";

const SHOP_URL = "https://holzwarme.shop"; // ou domaine custom
const VENDOR_NAME = "WE_TEST";

/* =====================
   FETCH PRODUCTS
===================== */

async function fetchProducts(page = 1, products = []) {
  const res = await fetch(
    `${SHOP_URL}/products.json?limit=250&page=${page}`
  );

  if (!res.ok) return products;

  const data = await res.json();
  if (!data.products || data.products.length === 0) return products;

  products.push(...data.products);
  return fetchProducts(page + 1, products);
}

/* =====================
   MAIN
===================== */

(async () => {
  console.log("🔍 Récupération des produits Shopify…");

  const products = await fetchProducts();
  console.log(`✅ ${products.length} produits trouvés`);

  const rows = [];

  for (const product of products) {
    const handle = product.handle;

    product.images.forEach((img, i) => {
      const variant = product.variants[0]; // variante principale

      rows.push({
        Handle: handle,
        Title: i === 0 ? product.title : "",
        "Body (HTML)": i === 0 ? product.body_html : "",
        Vendor: i === 0 ? VENDOR_NAME : "",
        Type: i === 0 ? product.product_type : "",
        Tags: i === 0 ? product.tags : "",
        Published: "TRUE",

        "Variant Price": i === 0 ? variant.price : "",
        "Variant Compare At Price":
          i === 0 ? variant.compare_at_price || "" : "",

        "Variant SKU": i === 0 ? variant.sku : "",
        "Variant Inventory Qty": i === 0 ? variant.inventory_quantity : "",

        "Image Src": img.src,
        "Image Position": i + 1,
      });
    });
  }

  const csv = stringify(rows, { header: true });
  fs.writeFileSync("shopify_products.csv", csv, "utf8");

  console.log("✅ Export Shopify terminé : shopify_products.csv");
})();

