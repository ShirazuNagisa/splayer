<?php
/**
 * Uninstall file for splayer
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit();
}

// delete options
delete_option( 'splayer_options' );

// clear scheduled events
$timestamp = wp_next_scheduled( 'splayer_check_updates_cron' );
if ( $timestamp ) {
    wp_unschedule_event( $timestamp, 'splayer_check_updates_cron' );
}