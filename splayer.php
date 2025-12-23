<?php
/**
 * Plugin Name: SPlayer — Simple Floating Music Player
 * Plugin URI:  https://github.com/ShirazuNagisa/splayer
 * Description: 轻量圆角浮动音乐播放器，支持后台歌单管理与 GitHub 自动更新。
 * Version:     1.1.0
 * Author:      ShirazuNagisa
 * License:     GPLv2 or later
 */

if ( ! defined( 'WPINC' ) ) {
    die;
}

define( 'SPLAYER_VERSION', '1.1.0' );
define( 'SPLAYER_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SPLAYER_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'SPLAYER_PLUGIN_FILE', __FILE__ );

/** 固定 GitHub 仓库地址 */
define( 'SPLAYER_GITHUB_REPO', 'ShirazuNagisa/splayer' );

require_once SPLAYER_PLUGIN_DIR . 'includes/class-splayer-loader.php';

function run_splayer() {
    $loader = new SPlayer_Loader();
    $loader->init();
}
run_splayer();