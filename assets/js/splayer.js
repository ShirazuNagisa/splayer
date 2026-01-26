(function () {
  'use strict';

  const S = window.SPLAYER || {};
  const playlist = Array.isArray(S.playlist) ? S.playlist : [];

  const disc = document.createElement('div');
  disc.className = 'splayer-disc';
  
  disc.style.left = '16px';
  disc.style.top = '50%';
  disc.style.transform = 'translateY(-50%)';

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

  if (playlist.length) {
    loadTrack(0);
  } else {
    discCover.style.backgroundImage = `url(${S.defaultCover})`;
    panelCover.style.backgroundImage = `url(${S.defaultCover})`;
    titleEl.textContent = 'No tracks in playlist';
    
    panel.querySelector('#sp-play').disabled = true;
    panel.querySelector('#sp-next').disabled = true;
    panel.querySelector('#sp-prev').disabled = true;
  }

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

  let isPanelOpen = false;

  function handleOutsideClick(e) {
    if (!panel.contains(e.target) && !disc.contains(e.target)) {
      hidePanel();
    }
  }

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
    
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
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
    
    document.removeEventListener('click', handleOutsideClick);
  }

  disc.addEventListener('click', (e) => {
    e.stopPropagation();
    isPanelOpen ? hidePanel() : showPanel();
  });
  
  panel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  let isDragging = false, offsetX = 0, offsetY = 0;

  // 获取事件坐标（兼容鼠标和触摸事件）
  function getEventCoordinates(e) {
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
    return {
      x: e.clientX,
      y: e.clientY
    };
  }

  // 开始拖动（兼容鼠标和触摸事件）
  function startDrag(e) {
    e.stopPropagation();
    e.preventDefault(); // 防止触摸设备上的滚动和其他默认行为
    
    isDragging = true;
    const coords = getEventCoordinates(e);
    offsetX = coords.x - disc.offsetLeft;
    offsetY = coords.y - disc.offsetTop;
    disc.style.transition = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none'; // 防止触摸设备上的默认行为
  }

  // 拖动过程（兼容鼠标和触摸事件）
  function drag(e) {
    if (!isDragging) return;
    e.preventDefault(); // 防止触摸设备上的滚动
    
    const coords = getEventCoordinates(e);
    let x = coords.x - offsetX;
    let y = coords.y - offsetY;
    x = Math.max(0, Math.min(window.innerWidth - disc.offsetWidth, x));
    y = Math.max(0, Math.min(window.innerHeight - disc.offsetHeight, y));
    disc.style.left = x + 'px';
    disc.style.top = y + 'px';
    disc.style.transform = 'none';
  }

  // 结束拖动（兼容鼠标和触摸事件）
  function endDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    disc.style.transition = 'left 0.2s, top 0.2s, opacity 0.3s';
    document.body.style.userSelect = 'auto';
    document.body.style.touchAction = 'auto';
    const x = disc.offsetLeft;
    if (x + disc.offsetWidth / 2 < window.innerWidth / 2) {
      disc.style.left = '16px';
      disc.style.transform = 'translateY(-50%)';
    } else {
      disc.style.left = (window.innerWidth - disc.offsetWidth - 16) + 'px';
      disc.style.transform = 'none';
    }
  }

  // 添加鼠标事件监听
  disc.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('mouseleave', endDrag); // 鼠标离开窗口时结束拖动

  // 添加触摸事件监听
  disc.addEventListener('touchstart', startDrag);
  window.addEventListener('touchmove', drag, { passive: false });
  window.addEventListener('touchend', endDrag);
  window.addEventListener('touchcancel', endDrag); // 触摸被取消时结束拖动

})();