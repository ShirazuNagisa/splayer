<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SPlayer_Loader {

    public static function init() {
        // admin hooks
        add_action( 'admin_menu', array( 'SPlayer_Admin', 'register_menu' ) );
        add_action( 'admin_enqueue_scripts', array( 'SPlayer_Admin', 'enqueue_assets' ) );
        // front hooks
        add_action( 'wp_enqueue_scripts', array( 'SPlayer_Frontend', 'enqueue_assets' ) );
        add_action( 'wp_ajax_splayer_save_playlist', array( 'SPlayer_Admin', 'ajax_save_playlist' ) );
        add_action( 'wp_ajax_splayer_get_playlist', array( 'SPlayer_Admin', 'ajax_get_playlist' ) );
        add_action( 'wp_ajax_splayer_check_update', array( 'SPlayer_Admin', 'ajax_check_update' ) );
        add_action( 'wp_ajax_splayer_install_update', array( 'SPlayer_Admin', 'ajax_install_update' ) );
    }
}
