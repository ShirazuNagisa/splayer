<?php
if ( ! defined( 'WPINC' ) ) die;

class SPlayer_Admin {

    public function init() {
        add_action( 'admin_menu', [$this,'menu'] );
        add_action( 'admin_enqueue_scripts', [$this,'assets'] );
    }

    public function menu() {
        add_menu_page(
            'SPlayer',
            'SPlayer',
            'manage_options',
            'splayer',
            [$this,'page'],
            'dashicons-format-audio'
        );
    }

    public function assets( $hook ) {
        if ( $hook !== 'toplevel_page_splayer' ) return;

        wp_enqueue_script(
            'splayer-admin',
            SPLAYER_PLUGIN_URL . 'assets/js/splayer.js',
            [],
            SPLAYER_VERSION,
            true
        );

        wp_localize_script( 'splayer-admin', 'SPLAYER_DATA', [
            'is_admin' => true,
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('splayer_admin_nonce')
        ]);
    }

    public function page() {
        echo '<div id="splayer-admin-root"></div>';
    }
}