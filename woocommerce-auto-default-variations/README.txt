WooCommerce Auto Default Variations

Goal
  During CSV import, automatically set a default variation so users can click "Add to cart"
  without seeing: "Seleziona le opzioni del prodotto..."

Install
  1) Copy this folder into: wp-content/plugins/woocommerce-auto-default-variations/
  2) Activate the plugin in WordPress admin.
  3) Run your WooCommerce CSV import as usual.

What It Does
  - For each variable product imported, it picks the first in-stock (and purchasable) variation
    and sets its attributes as the product's default attributes.
  - If the parent product is imported before its variations, it retries once ~20 seconds later.

Optional Backfill (WP-CLI)
  wp wadp backfill --limit=500

