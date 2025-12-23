<?php
if ( ! defined( 'WPINC' ) ) {
    die;
}

require_once SPLAYER_PLUGIN_DIR . 'includes/class-splayer-admin.php';
require_once SPLAYER_PLUGIN_DIR . 'includes/class-splayer-frontend.php';

class SPlayer_Loader {

    public function init() {
        // load textdomain
        add_action( 'init', array( $this, 'load_textdomain' ) );

        // admin & frontend init
        if ( is_admin() ) {
            $admin = new SPlayer_Admin();
            $admin->init();
        }
        $frontend = new SPlayer_Frontend();
        $frontend->init();

        // ajax handlers (prefixed)
        add_action( 'wp_ajax_splayer_add_track', array( $this, 'ajax_add_track' ) );
        add_action( 'wp_ajax_splayer_remove_track', array( $this, 'ajax_remove_track' ) );
        add_action( 'wp_ajax_splayer_get_options', array( $this, 'ajax_get_options' ) );
        add_action( 'wp_ajax_splayer_check_update', array( $this, 'ajax_check_update' ) );
        add_action( 'wp_ajax_splayer_install_update', array( $this, 'ajax_install_update' ) );
    }

    public function load_textdomain() {
        load_plugin_textdomain( 'splayer', false, basename( dirname( __FILE__ ) ) . '/../languages' );
    }

    /*********** AJAX handlers ***********/

    protected function require_manage_options() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'error' => 'permission_denied' ), 403 );
        }
        if ( empty( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( $_REQUEST['_wpnonce'], 'splayer_admin_nonce' ) ) {
            wp_send_json_error( array( 'error' => 'invalid_nonce' ), 403 );
        }
    }

    public function ajax_get_options() {
        $this->require_manage_options();
        $opts = get_option( 'splayer_options', array() );
        if ( ! isset( $opts['playlist'] ) ) $opts['playlist'] = array();
        wp_send_json_success( $opts );
    }

    public function ajax_add_track() {
        $this->require_manage_options();
        $title = isset( $_POST['title'] ) ? sanitize_text_field( wp_unslash( $_POST['title'] ) ) : '';
        $artist = isset( $_POST['artist'] ) ? sanitize_text_field( wp_unslash( $_POST['artist'] ) ) : '';
        $url = isset( $_POST['url'] ) ? esc_url_raw( wp_unslash( $_POST['url'] ) ) : '';
        $cover = isset( $_POST['cover'] ) ? esc_url_raw( wp_unslash( $_POST['cover'] ) ) : '';

        if ( empty( $url ) ) {
            wp_send_json_error( array( 'error' => 'empty_url' ) );
        }

        $opts = get_option( 'splayer_options', array() );
        if ( ! isset( $opts['playlist'] ) || ! is_array( $opts['playlist'] ) ) $opts['playlist'] = array();

        $track = array(
            'title'  => $title,
            'artist' => $artist,
            'url'    => $url,
            'cover'  => $cover
        );
        $opts['playlist'][] = $track;
        update_option( 'splayer_options', $opts );

        wp_send_json_success( array( 'playlist' => $opts['playlist'] ) );
    }

    public function ajax_remove_track() {
        $this->require_manage_options();
        $index = isset( $_POST['index'] ) ? intval( $_POST['index'] ) : -1;
        $opts = get_option( 'splayer_options', array() );
        if ( ! isset( $opts['playlist'] ) || ! is_array( $opts['playlist'] ) ) $opts['playlist'] = array();

        if ( $index < 0 || $index >= count( $opts['playlist'] ) ) {
            wp_send_json_error( array( 'error' => 'invalid_index' ) );
        }
        array_splice( $opts['playlist'], $index, 1 );
        update_option( 'splayer_options', $opts );
        wp_send_json_success( array( 'playlist' => $opts['playlist'] ) );
    }

    public function ajax_check_update() {
        $this->require_manage_options();
        $repo = isset( $_POST['repo'] ) ? sanitize_text_field( wp_unslash( $_POST['repo'] ) ) : '';
        if ( empty( $repo ) ) {
            wp_send_json_error( array( 'error' => 'empty_repo' ) );
        }

        $release = self::get_latest_release_from_github( $repo );
        if ( is_wp_error( $release ) ) {
            wp_send_json_error( array( 'error' => $release->get_error_message() ) );
        }

        $current = SPLAYER_VERSION;
        $remote_ver = isset( $release['tag_name'] ) ? $release['tag_name'] : '';
        $msg = 'remote tag: ' . $remote_ver;
        wp_send_json_success( array( 'message' => $msg, 'release' => $release ) );
    }

    public function ajax_install_update() {
        $this->require_manage_options();
        $repo = isset( $_POST['repo'] ) ? sanitize_text_field( wp_unslash( $_POST['repo'] ) ) : '';
        if ( empty( $repo ) ) {
            wp_send_json_error( array( 'error' => 'empty_repo' ) );
        }
        $result = self::maybe_update_from_github( $repo, true );
        if ( is_wp_error( $result ) ) {
            wp_send_json_error( array( 'error' => $result->get_error_message() ) );
        }
        wp_send_json_success( array( 'message' => 'updated', 'detail' => $result ) );
    }

    /* ---------- GitHub helper methods ---------- */

    /**
     * Get latest release metadata from GitHub
     * @param string $repo owner/repo
     * @return array|WP_Error
     */
    public static function get_latest_release_from_github( $repo ) {
        if ( empty( $repo ) || strpos( $repo, '/' ) === false ) {
            return new WP_Error( 'invalid_repo', '仓库格式应为 owner/repo' );
        }
        $api = "https://api.github.com/repos/{$repo}/releases/latest";
        $args = array(
            'headers' => array(
                'Accept'        => 'application/vnd.github.v3+json',
                'User-Agent'    => 'SPlayer-Update-Agent'
            ),
            'timeout' => 20,
        );
        $resp = wp_remote_get( $api, $args );
        if ( is_wp_error( $resp ) ) return $resp;
        $code = wp_remote_retrieve_response_code( $resp );
        if ( $code != 200 ) {
            return new WP_Error( 'http_error', 'GitHub API 返回 HTTP ' . $code );
        }
        $body = wp_remote_retrieve_body( $resp );
        $data = json_decode( $body, true );
        if ( empty( $data ) ) {
            return new WP_Error( 'invalid_response', '无法解析 GitHub 返回的数据' );
        }
        return $data;
    }

    /**
     * Download and install update from GitHub latest release (zipball)
     * @param string $repo
     * @param bool $force_install - if true, perform install now
     * @return array|WP_Error
     */
    public static function maybe_update_from_github( $repo, $force_install = false ) {
        $release = self::get_latest_release_from_github( $repo );
        if ( is_wp_error( $release ) ) return $release;

        // prefer zipball_url
        $zip_url = isset( $release['zipball_url'] ) ? $release['zipball_url'] : ( isset( $release['tarball_url'] ) ? $release['tarball_url'] : '' );
        if ( empty( $zip_url ) ) {
            return new WP_Error( 'no_asset', '找不到 zipball_url' );
        }

        // download to temp
        $tmp_file = wp_tempnam();
        if ( ! $tmp_file ) {
            return new WP_Error( 'tmp_failed', '无法创建临时文件' );
        }

        $resp = wp_remote_get( $zip_url, array( 'timeout' => 60, 'headers' => array( 'User-Agent' => 'SPlayer-Update-Agent' ) ) );
        if ( is_wp_error( $resp ) ) return $resp;
        $code = wp_remote_retrieve_response_code( $resp );
        if ( $code != 200 ) {
            return new WP_Error( 'http_error', '下载 release 返回 HTTP ' . $code );
        }

        $body = wp_remote_retrieve_body( $resp );
        file_put_contents( $tmp_file, $body );

        // use WP Filesystem / unzip_file
        if ( ! function_exists( 'unzip_file' ) ) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        // unzip to temp dir
        $tmp_dir = get_temp_dir() . 'splayer_update_' . time() . '/';
        wp_mkdir_p( $tmp_dir );
        $unzip = unzip_file( $tmp_file, $tmp_dir );
        if ( is_wp_error( $unzip ) ) {
            @unlink( $tmp_file );
            return $unzip;
        }

        // find plugin root inside tmp_dir (zip often contains one root folder)
        $files = scandir( $tmp_dir );
        $root_subdir = '';
        foreach ( $files as $f ) {
            if ( $f === '.' || $f === '..' ) continue;
            if ( is_dir( $tmp_dir . $f ) ) { $root_subdir = $tmp_dir . $f . '/'; break; }
        }
        if ( empty( $root_subdir ) ) {
            $root_subdir = $tmp_dir;
        }

        // copy files from root_subdir to plugin dir
        $dest = SPLAYER_PLUGIN_DIR;
        // Recursively copy — implement simple recursive copy
        $copy_result = self::recurse_copy( $root_subdir, $dest );
        // cleanup
        @unlink( $tmp_file );
        self::recurse_remove_dir( $tmp_dir );

        if ( is_wp_error( $copy_result ) ) {
            return $copy_result;
        }

        return array( 'installed' => true, 'tag' => $release['tag_name'] );
    }

    public static function recurse_copy( $src, $dst ) {
        if ( ! is_dir( $src ) ) return new WP_Error( 'src_missing', '源文件夹不存在' );
        $dir = opendir( $src );
        if ( ! is_dir( $dst ) ) {
            wp_mkdir_p( $dst );
        }
        while ( false !== ( $file = readdir( $dir ) ) ) {
            if ( ( $file != '.' ) && ( $file != '..' ) ) {
                if ( is_dir( $src . '/' . $file ) ) {
                    $res = self::recurse_copy( $src . '/' . $file, $dst . '/' . $file );
                    if ( is_wp_error( $res ) ) return $res;
                } else {
                    // copy file
                    if ( ! @copy( $src . '/' . $file, $dst . '/' . $file ) ) {
                        return new WP_Error( 'copy_failed', '复制文件失败: ' . $src . '/' . $file );
                    }
                }
            }
        }
        closedir( $dir );
        return true;
    }

    public static function recurse_remove_dir( $dir ) {
        if ( ! is_dir( $dir ) ) return;
        $objects = scandir( $dir );
        foreach ( $objects as $object ) {
            if ( $object != "." && $object != ".." ) {
                if ( is_dir( $dir . "/" . $object ) ) {
                    self::recurse_remove_dir( $dir . "/" . $object );
                } else {
                    @unlink( $dir . "/" . $object );
                }
            }
        }
        @rmdir( $dir );
    }
}