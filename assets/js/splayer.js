(function () {

  /* ===============================
     后台直接退出
     =============================== */
  if (typeof SPLAYER_DATA !== 'undefined' && SPLAYER_DATA.is_admin) {
    return;
  }

  const STORAGE_KEY = 'splayer_disc_position';

  document.addEventListener('DOMContentLoaded', function () {
    mountSPlayer();
  });

  /* ===============================
     挂载播放器
     =============================== */
  function mountSPlayer() {
    if (document.querySelector('.splayer-root')) return;

    /* 根容器 */
    const root = document.createElement('div');
    root.className = 'splayer-root';
    document.body.appendChild(root);

    /* 圆形唱片 */
    const disc = document.createElement('div');
    disc.className = 'splayer-disc';
    root.appendChild(disc);

    /* 恢复位置 */
    restoreDiscPosition(disc);

    /* 展开面板 */
    const panel = document.createElement('div');
    panel.className = 'splayer-panel';
    panel.innerHTML = `
      <div class="splayer-panel-inner">
        <div class="splayer-title">SPlayer</div>
        <div class="splayer-playlist"></div>
        <div class="splayer-controls">
          <button data-mode="single">单曲</button>
          <button data-mode="loop">循环</button>
          <button data-mode="random">随机</button>
        </div>
      </div>
    `;
    root.appendChild(panel);

    /* 展开 / 收起 */
    disc.addEventListener('click', function () {
      if (disc._dragging) return;
      panel.classList.toggle('show');
    });

    /* 启用拖动（鼠标 + 触摸） */
    enableDiscDrag(disc);
  }

  /* ===============================
     拖动（Mouse + Touch）
     =============================== */
  function enableDiscDrag(disc) {
    let dragging = false;
    let sx = 0, sy = 0;
    let sl = 0, st = 0;

    const start = (x, y) => {
      dragging = true;
      disc._dragging = false;

      sx = x;
      sy = y;

      const rect = disc.getBoundingClientRect();
      sl = rect.left;
      st = rect.top;

      disc.style.transition = 'none';
    };

    const move = (x, y) => {
      if (!dragging) return;

      const dx = x - sx;
      const dy = y - sy;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        disc._dragging = true;
      }

      disc.style.left = sl + dx + 'px';
      disc.style.top = st + dy + 'px';
      disc.style.right = 'auto';
      disc.style.bottom = 'auto';
    };

    const end = () => {
      if (!dragging) return;
      dragging = false;
      snapDiscToEdge(disc);
      saveDiscPosition(disc);
    };

    /* Mouse */
    disc.addEventListener('mousedown', e => {
      start(e.clientX, e.clientY);
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      move(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', end);

    /* Touch */
    disc.addEventListener('touchstart', e => {
      const t = e.touches[0];
      start(t.clientX, t.clientY);
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    }, { passive: true });

    document.addEventListener('touchend', end);
  }

  /* ===============================
     吸附边缘
     =============================== */
  function snapDiscToEdge(disc) {
    const rect = disc.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 12;

    let left;
    if (rect.left + rect.width / 2 < vw / 2) {
      left = padding;
    } else {
      left = vw - rect.width - padding;
    }

    let top = rect.top;
    top = Math.max(padding, top);
    top = Math.min(vh - rect.height - padding, top);

    disc.style.transition = 'all .35s cubic-bezier(.22,.61,.36,1)';
    disc.style.left = left + 'px';
    disc.style.top = top + 'px';
  }

  /* ===============================
     位置存储
     =============================== */
  function saveDiscPosition(disc) {
    const rect = disc.getBoundingClientRect();
    const data = {
      left: rect.left,
      top: rect.top
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function restoreDiscPosition(disc) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const pos = JSON.parse(raw);
      disc.style.left = pos.left + 'px';
      disc.style.top = pos.top + 'px';
      disc.style.right = 'auto';
      disc.style.bottom = 'auto';
    } catch (e) {}
  }

})();