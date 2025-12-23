<?php
/**
 * Uninstall file for splayer
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit();
}

// Check capability — only allow when uninstall triggered by WP
if ( ! is_multisite() ) {
    delete_option( 'splayer_options' );
} else {
    // If multisite, remove from site options for each site
    global $wpdb;
    $blog_ids = $wpdb->get_col( "SELECT blog_id FROM $wpdb->blogs" );
    foreach ( $blog_ids as $blog_id ) {
        switch_to_blog( $blog_id );
        delete_option( 'splayer_options' );
        restore_current_blog();
    }
}

// Clear any scheduled hooks if added in future versions
wp_clear_scheduled_hook( 'splayer_check_updates' );
