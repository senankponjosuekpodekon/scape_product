import fs from "fs";
import fetch from "node-fetch";
import { stringify } from "csv-stringify/sync";

const SHOP_URL = (process.argv[2] || "https://containergoertz.de/").replace(/\/$/, "");
const OUTPUT_FILE = process.argv[3] || "shopify_products.csv";
const VENDOR_NAME = process.argv[4] || "WE_TEST";

/* =====================
   FETCH PRODUCTS
===================== */

async function fetchProducts(page = 1, products = []) {
  const res = await fetch(
    `${SHOP_URL}/products.json?limit=250&page=${page}`
  );

  if (!res.ok) {
    throw new Error(`Impossible de récupérer /products.json (HTTP ${res.status})`);
  }

  const data = await res.json();
  if (!data.products || data.products.length === 0) return products;

  products.push(...data.products);
  return fetchProducts(page + 1, products);
}

/* =====================
   MAIN
===================== */

(async () => {
  console.log(`🔍 Récupération des produits Shopify depuis ${SHOP_URL}…`);

  const products = await fetchProducts();
  console.log(`✅ ${products.length} produits trouvés`);

  const rows = [];

  for (const product of products) {
    const handle = product.handle;

    const variants =
      Array.isArray(product.variants) && product.variants.length > 0
        ? product.variants
        : [{}];
    const images = Array.isArray(product.images) ? product.images : [];

    variants.forEach((variant, variantIndex) => {
      const firstImage = images[0];
      const firstImageSrc =
        typeof firstImage === "string" ? firstImage : firstImage?.src || "";

      rows.push({
        Handle: handle,
        Title: variantIndex === 0 ? product.title : "",
        "Body (HTML)": variantIndex === 0 ? product.body_html : "",
        Vendor: variantIndex === 0 ? VENDOR_NAME : "",
        Type: variantIndex === 0 ? product.product_type : "",
        Tags: variantIndex === 0 ? product.tags : "",
        Published: "TRUE",

        "Variant Price": variant?.price || "",
        "Variant Compare At Price": variant?.compare_at_price || "",

        "Variant SKU": variant?.sku || "",
        "Variant Inventory Qty": variant?.inventory_quantity ?? "",

        "Image Src": variantIndex === 0 ? firstImageSrc : "",
        "Image Position": variantIndex === 0 && firstImageSrc ? 1 : "",
      });
    });

    // Add remaining images as image-only rows for the same product handle.
    for (let i = 1; i < images.length; i++) {
      const img = images[i];
      const src = typeof img === "string" ? img : img?.src || "";
      if (!src) continue;

      rows.push({
        Handle: handle,
        Title: "",
        "Body (HTML)": "",
        Vendor: "",
        Type: "",
        Tags: "",
        Published: "TRUE",
        "Variant Price": "",
        "Variant Compare At Price": "",
        "Variant SKU": "",
        "Variant Inventory Qty": "",
        "Image Src": src,
        "Image Position": i + 1,
      });
    }
  }

  const csv = stringify(rows, { header: true });
  fs.writeFileSync(OUTPUT_FILE, csv, "utf8");

  console.log(`✅ Export Shopify terminé : ${OUTPUT_FILE}`);
})();

