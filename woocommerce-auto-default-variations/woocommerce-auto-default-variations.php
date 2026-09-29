<?php
/**
 * Plugin Name: WooCommerce Auto Default Variations
 * Description: Automatically sets default attributes for variable products after CSV import.
 * Version: 0.3.0
 * Requires Plugins: woocommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ──────────────────────────────────────────────────────────────────────────────
// Guard: bail early if WooCommerce is not loaded.
// ──────────────────────────────────────────────────────────────────────────────
add_action( 'plugins_loaded', 'wadp_check_woocommerce_dependency' );
function wadp_check_woocommerce_dependency() {
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', function () {
            echo '<div class="notice notice-error"><p>'
                . esc_html__( 'WooCommerce Auto Default Variations requires WooCommerce to be active.', 'wadp' )
                . '</p></div>';
        } );
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Core logic
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Pick the best default variation for a variable product in ONE pass.
 *
 * Priority:  1) in-stock + purchasable + has price
 *            2) in-stock + has price
 *            3) purchasable + has price
 *            4) first valid variation (absolute fallback)
 *
 * @param WC_Product_Variable $product
 * @return WC_Product_Variation|null
 */
function wadp_pick_default_variation( WC_Product_Variable $product ) {
    $children = $product->get_children();
    if ( empty( $children ) ) {
        return null;
    }

    $tier = [ 1 => null, 2 => null, 3 => null, 4 => null ];

    foreach ( $children as $variation_id ) {
        $variation = wc_get_product( $variation_id );

        // Skip non-published / trashed / wrong type.
        if (
            ! $variation instanceof WC_Product_Variation ||
            'publish' !== get_post_status( $variation_id )
        ) {
            continue;
        }

        $has_price      = $variation->get_price() !== '';
        $in_stock       = $variation->is_in_stock();
        $is_purchasable = $variation->is_purchasable();

        // Absolute fallback — first valid variation encountered.
        if ( null === $tier[4] ) {
            $tier[4] = $variation;
        }

        if ( $in_stock && $is_purchasable && $has_price ) {
            // Best tier found — no need to continue.
            return $variation;
        } elseif ( $in_stock && $has_price && null === $tier[2] ) {
            $tier[2] = $variation;
        } elseif ( $is_purchasable && $has_price && null === $tier[3] ) {
            $tier[3] = $variation;
        }
    }

    return $tier[2] ?? $tier[3] ?? $tier[4];
}

/**
 * Strip the "attribute_" prefix WooCommerce sometimes adds to variation keys.
 *
 * @param array $variation_attributes
 * @return array
 */
function wadp_normalize_default_attributes( array $variation_attributes ): array {
    $normalized = [];
    foreach ( $variation_attributes as $key => $value ) {
        $key               = str_starts_with( $key, 'attribute_' )
            ? substr( $key, 10 )
            : $key;
        $normalized[ $key ] = $value;
    }
    return $normalized;
}

/**
 * Set default attributes on a variable product from the best available variation.
 *
 * @param WC_Product_Variable $product
 * @param bool                $overwrite  Set true to replace existing defaults.
 * @return bool  true if defaults were saved, false otherwise.
 */
function wadp_set_defaults_from_variation(
    WC_Product_Variable $product,
    bool $overwrite = false
): bool {
    if ( ! $overwrite && ! empty( $product->get_default_attributes() ) ) {
        return false;
    }

    $variation = wadp_pick_default_variation( $product );
    if ( ! $variation ) {
        return false;
    }

    $default_attributes = wadp_normalize_default_attributes( $variation->get_attributes() );
    if ( empty( $default_attributes ) ) {
        return false;
    }

    $product->set_default_attributes( $default_attributes );
    $product->save();
    return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook: after CSV import
// Fix: the real hook signature is (WC_Product_Importer $importer, array $data).
// Product IDs live in $data['imported'] and $data['updated'].
// ──────────────────────────────────────────────────────────────────────────────
add_action( 'woocommerce_product_import_done', 'wadp_on_import_done', 10, 2 );

function wadp_on_import_done( $importer, array $data ) {
    if ( ! class_exists( 'WooCommerce' ) ) {
        return;
    }

    // Merge newly imported IDs and updated IDs.
    $product_ids = array_unique( array_merge(
        (array) ( $data['imported'] ?? [] ),
        (array) ( $data['updated']  ?? [] )
    ) );

    if ( empty( $product_ids ) ) {
        return;
    }

    if ( function_exists( 'set_time_limit' ) ) {
        // Log rather than silently suppress.
        if ( ! @set_time_limit( 0 ) ) {  // phpcs:ignore
            error_log( 'WADP: could not extend time limit — large imports may time out.' );
        }
    }

    foreach ( $product_ids as $product_id ) {
        $product = wc_get_product( $product_id );
        if ( ! $product instanceof WC_Product_Variable ) {
            continue;
        }

        wadp_set_defaults_from_variation( $product );

        // Targeted cache invalidation — avoids flushing the whole object cache.
        wc_delete_product_transients( $product_id );
        clean_post_cache( $product_id );
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// WP-CLI backfill command
// Usage: wp wadp backfill [--limit=500] [--overwrite]
// ──────────────────────────────────────────────────────────────────────────────
if ( defined( 'WP_CLI' ) && WP_CLI ) {
    WP_CLI::add_command( 'wadp backfill', 'wadp_cli_backfill' );
}

function wadp_cli_backfill( array $args, array $assoc_args ) {
    $limit     = max( 0, intval( $assoc_args['limit'] ?? 500 ) );
    $overwrite = ! empty( $assoc_args['overwrite'] );
    $per_page  = 100;
    $page      = 1;
    $updated   = 0;
    $skipped   = 0;
    $processed = 0;

    WP_CLI::log( "Starting backfill (limit={$limit}, overwrite=" . ( $overwrite ? 'yes' : 'no' ) . ')' );

    while ( true ) {
        $product_ids = wc_get_products( [
            'type'   => 'variable',
            'limit'  => $per_page,
            'page'   => $page,
            'return' => 'ids',
        ] );

        if ( empty( $product_ids ) ) {
            break;
        }

        foreach ( $product_ids as $product_id ) {
            // Check limit BEFORE processing.
            if ( $limit > 0 && $processed >= $limit ) {
                break 2;
            }

            $processed++;
            $product = wc_get_product( $product_id );

            if ( ! $product instanceof WC_Product_Variable ) {
                $skipped++;
                continue;
            }

            if ( wadp_set_defaults_from_variation( $product, $overwrite ) ) {
                $updated++;
                wc_delete_product_transients( $product_id );
                clean_post_cache( $product_id );
            } else {
                $skipped++;
            }

            // Progress every 50 items.
            if ( $processed % 50 === 0 ) {
                WP_CLI::log( "  … processed {$processed}" );
            }
        }

        $page++;
    }

    WP_CLI::success( "Done. Updated: {$updated}, Skipped/unchanged: {$skipped}, Total processed: {$processed}." );
}