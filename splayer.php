<?php
/**
 * Plugin Name: splayer
 * Plugin URI: https://github.com/ShirazuNagisa/splayer
 * Description: Lightweight rounded music player for WordPress with draggable disc, frosted glass expanded window, playlist management and GitHub update check.
 * Version: 1.1.4
 * Author: Shirazu
 * Author URI: https://github.com/ShirazuNagisa
 * Text Domain: splayer
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'SPLAYER_VERSION', '1.1.4' );
define( 'SPLAYER_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SPLAYER_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'SPLAYER_GITHUB_REPO', 'https://api.github.com/repos/ShirazuNagisa/splayer' );

autoload_includes();

function autoload_includes() {
    require_once SPLAYER_PLUGIN_DIR . 'includes/class-splayer-loader.php';
    require_once SPLAYER_PLUGIN_DIR . 'includes/class-splayer-admin.php';
    require_once SPLAYER_PLUGIN_DIR . 'includes/class-splayer-frontend.php';

    SPlayer_Loader::init();
}

register_activation_hook( __FILE__, 'splayer_activate' );
register_uninstall_hook( __FILE__, 'splayer_uninstall' );

function splayer_activate() {
    $defaults = array(
        'version'      => SPLAYER_VERSION,
        'playlist'     => array(),
        'options'      => array(
            'autoplay' => false,
            'mode'     => 'normal' // normal, shuffle, loop
        ),
        'last_update_check' => 0
    );

    $existing = get_option( 'splayer_options' );
    if ( ! $existing ) {
        add_option( 'splayer_options', $defaults );
    } else {
        $existing['version'] = SPLAYER_VERSION;
        update_option( 'splayer_options', $existing );
    }
}

function splayer_uninstall() {
    // handled in uninstall.php
}

// expose shortcode
add_action( 'init', function() {
    add_shortcode( 'splayer', array( 'SPlayer_Frontend', 'shortcode_render' ) );
} );
