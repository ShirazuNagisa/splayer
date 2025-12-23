<?php
/**
 * Plugin Name: SPlayer — Simple Floating Music Player
 * Plugin URI:  https://github.com/YOUR_GITHUB_USERNAME/splayer
 * Description: 轻量圆角浮动音乐播放器，支持后台图形化歌单管理、播放模式、GitHub 仓库检查并下载安装更新。
 * Version:     1.0.0
 * Author:      Your Name
 * Author URI:  https://your-site.example
 * Text Domain: splayer
 * Domain Path: /languages
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}

define( 'SPLAYER_VERSION', '1.0.0' );
define( 'SPLAYER_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SPLAYER_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'SPLAYER_PLUGIN_FILE', __FILE__ );

require_once SPLAYER_PLUGIN_DIR . 'includes/class-splayer-loader.php';

function run_splayer() {
    $loader = new SPlayer_Loader();
    $loader->init();
}
run_splayer();

/* Activation / Deactivation hooks */
function splayer_activate() {
    if ( ! get_option( 'splayer_options' ) ) {
        $default = array(
            'playlist'     => array(),
            'github_repo'  => '', // e.g. owner/repo
            'auto_update'  => false,
            'update_cron'  => 'daily'
        );
        add_option( 'splayer_options', $default );
    }
    // schedule cron if needed
    $opts = get_option( 'splayer_options', array() );
    if ( ! empty( $opts['auto_update'] ) && ! wp_next_scheduled( 'splayer_check_updates_cron' ) ) {
        wp_schedule_event( time(), $opts['update_cron'] ?: 'daily', 'splayer_check_updates_cron' );
    }
}
register_activation_hook( __FILE__, 'splayer_activate' );

function splayer_deactivate() {
    // clear scheduled event
    $timestamp = wp_next_scheduled( 'splayer_check_updates_cron' );
    if ( $timestamp ) {
        wp_unschedule_event( $timestamp, 'splayer_check_updates_cron' );
    }
}
register_deactivation_hook( __FILE__, 'splayer_deactivate' );

/* Cron hook handler */
add_action( 'splayer_check_updates_cron', function() {
    $opts = get_option( 'splayer_options', array() );
    if ( empty( $opts['github_repo'] ) ) {
        return;
    }
    if ( empty( $opts['auto_update'] ) ) {
        return;
    }
    // invoke update check via loader class static method
    if ( class_exists( 'SPlayer_Loader' ) ) {
        SPlayer_Loader::maybe_update_from_github( $opts['github_repo'] );
    }
} );