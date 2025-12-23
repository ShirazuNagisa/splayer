<?php
if ( ! defined( 'WPINC' ) ) {
    die;
}

class SPlayer_Frontend {

    public function init() {
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
        add_action( 'wp_footer', array( $this, 'render_player_markup' ), 100 );
    }

    public function enqueue_frontend_assets() {
        wp_enqueue_style( 'splayer-frontend-css', SPLAYER_PLUGIN_URL . 'assets/css/splayer.css', array(), SPLAYER_VERSION );
        wp_enqueue_script( 'splayer-frontend-js', SPLAYER_PLUGIN_URL . 'assets/js/splayer.js', array(), SPLAYER_VERSION, true );

        $opts = get_option( 'splayer_options', array() );
        $playlist = isset( $opts['playlist'] ) ? $opts['playlist'] : array();
        // sanitize playlist for output
        $clean = array();
        foreach ( $playlist as $t ) {
            $clean[] = array(
                'title'  => isset( $t['title'] ) ? sanitize_text_field( $t['title'] ) : '',
                'artist' => isset( $t['artist'] ) ? sanitize_text_field( $t['artist'] ) : '',
                'url'    => isset( $t['url'] ) ? esc_url_raw( $t['url'] ) : '',
                'cover'  => isset( $t['cover'] ) ? esc_url_raw( $t['cover'] ) : '',
            );
        }

        wp_localize_script( 'splayer-frontend-js', 'SPLAYER_DATA', array(
            'playlist' => $clean,
            'default_cover' => SPLAYER_PLUGIN_URL . 'assets/media/default-cover.jpg',
            'frontend_enabled' => true
        ) );
    }

    public function render_player_markup() {
        // minimal markup is injected by JS; we only ensure fallback for non-js
        echo '<noscript><!-- SPlayer: 请启用 JavaScript 以使用播放器 --></noscript>';
    }
}