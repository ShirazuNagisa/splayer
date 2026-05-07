<?php
/**
 * SPlayer Admin
 */

if (!defined('ABSPATH')) {
  exit;
}

class SPlayer_Admin {

  /**
   * 注册后台菜单
   */
  public static function register_menu() {
    add_menu_page(
      'SPlayer',
      'SPlayer',
      'manage_options',
      'splayer',
      [__CLASS__, 'render'],
      'dashicons-controls-volumeon',
      58
    );
  }

  /**
   * 后台资源加载
   */
  public static function enqueue_assets($hook) {
    if ($hook !== 'toplevel_page_splayer') {
      return;
    }
  }

  /**
   * 后台页面渲染
   */
  public static function render() {
    if (!current_user_can('manage_options')) {
      return;
    }

    $options  = get_option('splayer_options', []);
    $playlist = isset($options['playlist']) && is_array($options['playlist'])
      ? $options['playlist']
      : [];

    ?>
    <div class="wrap">
      <h1>SPlayer 播放列表管理</h1>

      <table class="widefat striped">
        <thead>
          <tr>
            <th style="width:20%;">标题</th>
            <th style="width:35%;">音频 URL</th>
            <th style="width:35%;">封面 URL</th>
            <th style="width:10%;">操作</th>
          </tr>
        </thead>
        <tbody id="splayer-playlist-body">
          <?php foreach ($playlist as $track): ?>
            <tr>
              <td>
                <input type="text" class="sp-title" value="<?php echo esc_attr($track['title'] ?? ''); ?>" />
              </td>
              <td>
                <input type="text" class="sp-url" value="<?php echo esc_attr($track['url'] ?? ''); ?>" />
              </td>
              <td>
                <input type="text" class="sp-cover" value="<?php echo esc_attr($track['cover'] ?? ''); ?>" />
              </td>
              <td>
                <button type="button" class="button sp-remove">删除</button>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>

      <p style="margin-top:16px;">
        <button type="button" class="button" id="sp-add-track">添加歌曲</button>
        <button type="button" class="button button-primary" id="sp-save-playlist">保存设置</button>
      </p>
    </div>

    <script>
    (function () {
      const tbody = document.getElementById('splayer-playlist-body');

      document.getElementById('sp-add-track').addEventListener('click', () => {
        tbody.insertAdjacentHTML('beforeend', `
          <tr>
            <td><input type="text" class="sp-title" /></td>
            <td><input type="text" class="sp-url" /></td>
            <td><input type="text" class="sp-cover" /></td>
            <td><button type="button" class="button sp-remove">删除</button></td>
          </tr>
        `);
      });

      tbody.addEventListener('click', (e) => {
        if (e.target.classList.contains('sp-remove')) {
          e.target.closest('tr').remove();
        }
      });

      document.getElementById('sp-save-playlist').addEventListener('click', () => {
        const data = [];

        tbody.querySelectorAll('tr').forEach(tr => {
          const title = tr.querySelector('.sp-title').value.trim();
          const url   = tr.querySelector('.sp-url').value.trim();
          const cover = tr.querySelector('.sp-cover').value.trim();

          if (url) {
            data.push({ title, url, cover });
          }
        });

        const form = new FormData();
        form.append('action', 'splayer_save_playlist');
        form.append('playlist', JSON.stringify(data));

        fetch(ajaxurl, {
          method: 'POST',
          body: form
        }).then(() => {
          alert('播放列表已保存');
        });
      });
    })();
    </script>
    <?php
  }

  /**
   * AJAX：保存播放列表
   */
  public static function ajax_save_playlist() {
    if (!current_user_can('manage_options')) {
      wp_die();
    }

    $raw = isset($_POST['playlist']) ? wp_unslash($_POST['playlist']) : '[]';
    $list = json_decode($raw, true);

    if (!is_array($list)) {
      $list = [];
    }

    update_option('splayer_options', [
      'playlist' => $list
    ]);

    wp_die();
  }

  /* ============================================================
     GitHub 更新检测
     ============================================================ */

  /**
   * 显示后台更新通知
   */
  public static function admin_update_notice() {
    if (!current_user_can('manage_options')) {
      return;
    }

    $options = get_option('splayer_options', []);
    $update_info = isset($options['update_info']) ? $options['update_info'] : [];

    if (empty($update_info) || empty($update_info['version'])) {
      return;
    }

    $current_version = SPLAYER_VERSION;
    $new_version = $update_info['version'];

    if (version_compare($new_version, $current_version, '<=')) {
      return;
    }

    // 检查是否已忽略
    if (!empty($update_info['dismissed'])) {
      return;
    }

    // 检查是否设置了"以后提醒"
    if (!empty($update_info['remind_at']) && $update_info['remind_at'] > time()) {
      return;
    }

    $download_url = !empty($update_info['download_url']) ? esc_url($update_info['download_url']) : '';
    $changelog = !empty($update_info['changelog']) ? esc_textarea($update_info['changelog']) : '';

    ?>
    <div class="notice notice-warning is-dismissible splayer-update-notice">
      <p>
        <strong>SPlayer 有可用更新：<?php echo esc_html($current_version); ?> → <?php echo esc_html($new_version); ?></strong>
      </p>
      <?php if ($changelog): ?>
        <pre style="margin:6px 0;font-size:12px;color:#555;max-height:100px;overflow:auto;white-space:pre-wrap;"><?php echo $changelog; ?></pre>
      <?php endif; ?>
      <p style="margin:8px 0 4px;">
        <?php if ($download_url): ?>
          <a href="<?php echo $download_url; ?>" target="_blank" class="button button-primary" style="margin-right:8px;">下载最新版本</a>
        <?php endif; ?>
        <button type="button" class="button splayer-remind-later" data-action="splayer_remind_update" style="margin-right:8px;">以后提醒我（7天）</button>
        <button type="button" class="button splayer-dismiss-update" data-action="splayer_dismiss_update">不再提醒</button>
      </p>
    </div>
    <script>
    (function() {
      document.querySelectorAll('.splayer-remind-later, .splayer-dismiss-update').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var action = this.getAttribute('data-action');
          var formData = new FormData();
          formData.append('action', action);
          fetch(ajaxurl, { method: 'POST', body: formData }).then(function() {
            var notice = document.querySelector('.splayer-update-notice');
            if (notice) notice.remove();
          });
        });
      });
    })();
    </script>
    <?php
  }

  /**
   * AJAX：从 GitHub API 检查最新版本
   */
  public static function ajax_check_update() {
    if (!current_user_can('manage_options')) {
      wp_die();
    }

    $result = self::fetch_latest_release();

    if (is_wp_error($result)) {
      wp_send_json_error($result->get_error_message());
    }

    wp_send_json_success($result);
  }

  /**
   * 从 GitHub API 获取最新发行版信息
   */
  public static function fetch_latest_release() {
    $url = SPLAYER_GITHUB_REPO . '/releases/latest';

    $response = wp_remote_get($url, [
      'timeout' => 15,
      'headers' => [
        'Accept' => 'application/vnd.github.v3+json',
        'User-Agent' => 'WordPress-SPlayer'
      ]
    ]);

    if (is_wp_error($response)) {
      return $response;
    }

    $code = wp_remote_retrieve_response_code($response);
    if ($code !== 200) {
      return new WP_Error('github_error', 'GitHub API 返回状态码: ' . $code);
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (empty($data['tag_name'])) {
      return new WP_Error('invalid_data', '无法解析版本号');
    }

    $version = ltrim($data['tag_name'], 'v');
    $download_url = '';
    if (!empty($data['zipball_url'])) {
      $download_url = $data['zipball_url'];
    }
    if (!empty($data['html_url'])) {
      $download_url = $data['html_url'];
    }

    $changelog = '';
    if (!empty($data['body'])) {
      $changelog = wp_strip_all_tags($data['body']);
      // 截取前 500 字符
      if (mb_strlen($changelog) > 500) {
        $changelog = mb_substr($changelog, 0, 500) . '...';
      }
    }

    return [
      'version'       => $version,
      'download_url'  => $download_url,
      'changelog'     => $changelog,
      'checked_at'    => time(),
    ];
  }

  /**
   * 执行更新检查并存储结果
   */
  public static function run_update_check() {
    $result = self::fetch_latest_release();

    if (is_wp_error($result)) {
      return;
    }

    $options = get_option('splayer_options', []);

    // 保留旧的 dismiss / remind 状态
    $old_update = isset($options['update_info']) ? $options['update_info'] : [];
    $dismissed = !empty($old_update['dismissed']) ? $old_update['dismissed'] : false;
    $remind_at = !empty($old_update['remind_at']) ? $old_update['remind_at'] : 0;

    // 如果版本不同，重置 dismiss/remind
    $old_version = !empty($old_update['version']) ? $old_update['version'] : '';
    if ($old_version !== $result['version']) {
      $dismissed = false;
      $remind_at = 0;
    }

    $result['dismissed'] = $dismissed;
    $result['remind_at'] = $remind_at;

    $options['update_info'] = $result;
    $options['last_update_check'] = time();

    update_option('splayer_options', $options);
  }

  /**
   * AJAX：以后提醒（延迟7天）
   */
  public static function ajax_remind_update() {
    if (!current_user_can('manage_options')) {
      wp_die();
    }

    $options = get_option('splayer_options', []);
    if (isset($options['update_info'])) {
      $options['update_info']['remind_at'] = time() + 7 * DAY_IN_SECONDS;
      $options['update_info']['dismissed'] = false;
    }
    update_option('splayer_options', $options);
    wp_die();
  }

  /**
   * AJAX：不再提醒
   */
  public static function ajax_dismiss_update() {
    if (!current_user_can('manage_options')) {
      wp_die();
    }

    $options = get_option('splayer_options', []);
    if (isset($options['update_info'])) {
      $options['update_info']['dismissed'] = true;
      $options['update_info']['remind_at'] = 0;
    }
    update_option('splayer_options', $options);
    wp_die();
  }

  /**
   * 自动安装更新（保留备用）
   */
  public static function ajax_install_update() {
    if (!current_user_can('manage_options')) {
      wp_die();
    }
    wp_die('请前往 GitHub 页面手动下载更新。');
  }

  /**
   * 自动获取播放列表
   */
  public static function ajax_get_playlist() {
    if (!current_user_can('manage_options')) {
      wp_die();
    }
    $options = get_option('splayer_options', []);
    $playlist = isset($options['playlist']) ? $options['playlist'] : [];
    wp_send_json($playlist);
  }
}
