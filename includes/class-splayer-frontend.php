<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SPlayer_Frontend {

    public static function enqueue_assets() {
        wp_register_style( 'splayer-css', SPLAYER_PLUGIN_URL . 'assets/css/splayer.css', array(), SPLAYER_VERSION );
        wp_register_script( 'splayer-js', SPLAYER_PLUGIN_URL . 'assets/js/splayer.js', array(), SPLAYER_VERSION, true );
        wp_enqueue_style( 'splayer-css' );
        wp_enqueue_script( 'splayer-js' );

        $opts = get_option( 'splayer_options', array() );
        $playlist = isset( $opts['playlist'] ) ? $opts['playlist'] : array();

        wp_localize_script( 'splayer-js', 'SPLAYER', array(
            'playlist' => $playlist,
            'options'  => isset( $opts['options'] ) ? $opts['options'] : array(),
            'defaultCover' => SPLAYER_PLUGIN_URL . 'assets/media/default-cover.jpg',
        ) );
    }

    public static function shortcode_render( $atts = array() ) {
        // enqueue via hooks if not already
        self::enqueue_assets();
        ob_start();
        // markup is handled by JS injection when scripts run — keep placeholder for no-JS fallback
        echo '<div class="splayer-fallback">';
        echo '<noscript>请启用 JavaScript 以使用 splayer。</noscript>';
        echo '</div>';
        return ob_get_clean();
    }
}
