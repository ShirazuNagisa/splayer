<?php
if ( ! defined( 'WPINC' ) ) {
    die;
}

class SPlayer_Admin {

    public function init() {
        add_action( 'admin_menu', array( $this, 'add_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
        add_action( 'admin_init', array( $this, 'save_settings' ) );
    }

    public function add_menu() {
        add_menu_page(
            'SPlayer',
            'SPlayer',
            'manage_options',
            'splayer',
            array( $this, 'render_admin_page' ),
            'dashicons-format-audio',
            80
        );
    }

    public function enqueue_admin_assets( $hook ) {
        if ( $hook !== 'toplevel_page_splayer' ) return;

        wp_enqueue_style( 'splayer-admin-css', SPLAYER_PLUGIN_URL . 'assets/css/splayer.css', array(), SPLAYER_VERSION );
        wp_enqueue_script( 'splayer-admin-js', SPLAYER_PLUGIN_URL . 'assets/js/splayer.js', array(), SPLAYER_VERSION, true );

        $opts = get_option( 'splayer_options', array() );
        wp_localize_script( 'splayer-admin-js', 'SPLAYER_DATA', array(
            'is_admin'     => true,
            'ajax_url'     => admin_url( 'admin-ajax.php' ),
            'nonce'        => wp_create_nonce( 'splayer_admin_nonce' ),
            'playlist'     => isset( $opts['playlist'] ) ? $opts['playlist'] : array(),
            'github_repo'  => isset( $opts['github_repo'] ) ? $opts['github_repo'] : '',
            'auto_update'  => ! empty( $opts['auto_update'] ),
            'default_cover'=> SPLAYER_PLUGIN_URL . 'assets/media/default-cover.jpg'
        ) );
    }

    public function render_admin_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'no permission' );
        }
        ?>
        <div class="wrap">
            <div id="splayer-admin-root"></div>
        </div>
        <?php
    }

    public function save_settings() {
        // if form-based settings are later added, process here
    }
}