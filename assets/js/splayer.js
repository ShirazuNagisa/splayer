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
  panel.className = 'splayer-panel splayer-hidden';
  panel.innerHTML = `
    <div class="panel-cover"></div>
    <div class="controls">
      <div class="row">
        <button id="sp-prev">⏮</button>
        <button id="sp-play">▶</button>
        <button id="sp-next">⏭</button>
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

  audio.onplay = () => {
    disc.classList.add('splayer-rotating');
    panel.querySelector('#sp-play').textContent = '⏸';
  };

  audio.onpause = () => {
    disc.classList.remove('splayer-rotating');
    panel.querySelector('#sp-play').textContent = '▶';
  };

  /* ====== PANEL TOGGLE ====== */
  function showPanel() {
    const rect = disc.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    panel.style.top = rect.top + 'px';

    if (centerX < window.innerWidth / 2) {
      // 唱片在左侧 → 展开窗右侧
      panel.style.left = rect.right + 12 + 'px';
      panel.style.right = 'auto';
    } else {
      // 唱片在右侧 → 展开窗左侧
      panel.style.right = window.innerWidth - rect.left + 12 + 'px';
      panel.style.left = 'auto';
    }

    panel.classList.remove('splayer-hidden');
    requestAnimationFrame(() => {
      panel.classList.add('splayer-panel-show');
    });
  }

  function hidePanel() {
    panel.classList.remove('splayer-panel-show');
    setTimeout(() => {
      panel.classList.add('splayer-hidden');
    }, 300);
  }

  disc.addEventListener('click', () => {
    panel.classList.contains('splayer-hidden') ? showPanel() : hidePanel();
  });

})();
