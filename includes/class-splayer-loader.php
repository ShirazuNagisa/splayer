<?php
if ( ! defined( 'WPINC' ) ) {
    die;
}

require_once SPLAYER_PLUGIN_DIR . 'includes/class-splayer-admin.php';
require_once SPLAYER_PLUGIN_DIR . 'includes/class-splayer-frontend.php';

class SPlayer_Loader {

    public function init() {
        if ( is_admin() ) {
            ( new SPlayer_Admin() )->init();
        }
        ( new SPlayer_Frontend() )->init();

        add_action( 'wp_ajax_splayer_check_update', array( $this, 'ajax_check_update' ) );
        add_action( 'wp_ajax_splayer_install_update', array( $this, 'ajax_install_update' ) );
    }

    private function auth() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'permission denied' );
        }
        if ( ! wp_verify_nonce( $_POST['_wpnonce'], 'splayer_admin_nonce' ) ) {
            wp_send_json_error( 'invalid nonce' );
        }
    }

    public function ajax_check_update() {
        $this->auth();
        $data = self::get_latest_release();
        is_wp_error( $data )
            ? wp_send_json_error( $data->get_error_message() )
            : wp_send_json_success( $data['tag_name'] );
    }

    public function ajax_install_update() {
        $this->auth();
        $res = self::install_update();
        is_wp_error( $res )
            ? wp_send_json_error( $res->get_error_message() )
            : wp_send_json_success( 'updated' );
    }

    public static function get_latest_release() {
        $api = 'https://api.github.com/repos/' . SPLAYER_GITHUB_REPO . '/releases/latest';
        $res = wp_remote_get( $api, [
            'headers' => ['User-Agent' => 'SPlayer']
        ]);
        if ( is_wp_error( $res ) ) return $res;
        return json_decode( wp_remote_retrieve_body( $res ), true );
    }

    public static function install_update() {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        $release = self::get_latest_release();
        if ( empty( $release['zipball_url'] ) ) {
            return new WP_Error( 'invalid_release' );
        }
        $tmp = download_url( $release['zipball_url'] );
        unzip_file( $tmp, WP_PLUGIN_DIR );
        return true;
    }
}