(function () {
  'use strict';

  const S = window.SPLAYER || {};
  const playlist = Array.isArray(S.playlist) ? S.playlist : [];
  if (!playlist.length) return;

  /* ====== DOM ====== */
  const disc = document.createElement('div');
  disc.className = 'splayer-disc';

  const discCover = document.createElement('div');
  discCover.className = 'cover';
  disc.appendChild(discCover);
  document.body.appendChild(disc);

  const panel = document.createElement('div');
  panel.className = 'splayer-panel';
  panel.innerHTML = `
    <div class="panel-cover"></div>
    <div class="controls">
      <div class="button-center">
        <button id="sp-prev" class="splayer-btn">⏮</button>
        <button id="sp-play" class="splayer-btn">▶</button>
        <button id="sp-next" class="splayer-btn">⏭</button>
      </div>
      <div class="title" id="sp-title"></div>
    </div>
  `;
  document.body.appendChild(panel);

  const panelCover = panel.querySelector('.panel-cover');
  const titleEl = panel.querySelector('#sp-title');

  /* ====== AUDIO ====== */
  const audio = new Audio();
  audio.preload = 'auto';
  let index = 0;

  function loadTrack(i) {
    const t = playlist[i];
    if (!t) return;
    index = i;
    audio.src = t.url;
    const cover = t.cover || S.defaultCover;
    discCover.style.backgroundImage = `url(${cover})`;
    panelCover.style.backgroundImage = `url(${cover})`;
    titleEl.textContent = t.title || `Track ${i + 1}`;
  }

  loadTrack(0);

  /* ====== CONTROLS ====== */
  panel.querySelector('#sp-play').onclick = () => {
    audio.paused ? audio.play() : audio.pause();
  };
  panel.querySelector('#sp-next').onclick = () => {
    loadTrack((index + 1) % playlist.length);
    audio.play();
  };
  panel.querySelector('#sp-prev').onclick = () => {
    loadTrack((index - 1 + playlist.length) % playlist.length);
    audio.play();
  };

  audio.onplay = () => disc.classList.add('splayer-rotating');
  audio.onpause = () => disc.classList.remove('splayer-rotating');

  /* ====== PANEL EXPAND/COLLAPSE ====== */
  let isPanelOpen = false;

  function showPanel() {
    const rect = disc.getBoundingClientRect();

    panel.style.top = rect.top + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.width = rect.width + 'px';
    panel.style.height = rect.height + 'px';
    panel.style.borderRadius = '50%';
    panel.style.opacity = 1;

    disc.style.opacity = 0;

    requestAnimationFrame(() => {
      const centerX = rect.left + rect.width / 2;
      if (centerX < window.innerWidth / 2) {
        panel.style.left = rect.right + 12 + 'px';
        panel.style.right = 'auto';
      } else {
        panel.style.right = window.innerWidth - rect.left + 12 + 'px';
        panel.style.left = 'auto';
      }

      panel.style.width = '320px';
      panel.style.height = '96px';
      panel.style.borderRadius = '16px';
      panel.classList.add('splayer-panel-show');
    });

    isPanelOpen = true;
  }

  function hidePanel() {
    const rect = disc.getBoundingClientRect();
    panel.classList.remove('splayer-panel-show');
    panel.style.width = rect.width + 'px';
    panel.style.height = rect.height + 'px';
    panel.style.top = rect.top + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.borderRadius = '50%';

    setTimeout(() => {
      disc.style.opacity = 1;
      panel.style.opacity = 0;
    }, 350);

    isPanelOpen = false;
  }

  disc.addEventListener('click', () => {
    isPanelOpen ? hidePanel() : showPanel();
  });

  /* ====== DRAGGING DISC ====== */
  let isDragging = false, offsetX = 0, offsetY = 0;

  disc.addEventListener('mousedown', e => {
    isDragging = true;
    offsetX = e.clientX - disc.offsetLeft;
    offsetY = e.clientY - disc.offsetTop;
    disc.style.transition = 'none';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;
    x = Math.max(0, Math.min(window.innerWidth - disc.offsetWidth, x));
    y = Math.max(0, Math.min(window.innerHeight - disc.offsetHeight, y));
    disc.style.left = x + 'px';
    disc.style.top = y + 'px';
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    disc.style.transition = 'left 0.2s, top 0.2s, opacity 0.3s';
    document.body.style.userSelect = 'auto';
    const x = disc.offsetLeft;
    if (x + disc.offsetWidth / 2 < window.innerWidth / 2) {
      disc.style.left = '16px';
    } else {
      disc.style.left = (window.innerWidth - disc.offsetWidth - 16) + 'px';
    }
  });

})();
