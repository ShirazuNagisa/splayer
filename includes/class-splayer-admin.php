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
   * 后台资源加载（必须存在，避免 Fatal Error）
   */
  public static function enqueue_assets($hook) {
    if ($hook !== 'toplevel_page_splayer') {
      return;
    }
    // 当前后台 JS / CSS 使用内联方式，这里预留接口即可
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
}
