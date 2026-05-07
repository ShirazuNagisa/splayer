(function () {
  'use strict';

  /* ============================================================
     SVG ICONS
     ============================================================ */
  var ICONS = {
    prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
    modeSeq: '<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h12v2H4z"/><path d="M18 16l4 3-4 3z"/></svg>',
    modeShuffle: '<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>',
    modeRepeat: '<svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>',
    playlist: '<svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    playing: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
  };

  /* ============================================================
     DATA
     ============================================================ */
  var S = window.SPLAYER || {};
  var playlist = Array.isArray(S.playlist) ? S.playlist : [];
  var defaultCover = S.defaultCover || '';

  /* ============================================================
     STATE
     ============================================================ */
  var audio = new Audio();
  audio.preload = 'auto';

  var currentIndex = 0;
  var panelState = 'closed'; // 'closed' | 'normal' | 'playlist'
  var playMode = 'seq';      // 'seq' | 'shuffle' | 'repeat'
  var isClosing = false;
  var isPlaylistVisible = false;
  var playlistOrigTop = 0;

  /* progress drag */
  var isProgressDragging = false;

  /* disc drag */
  var isDragging = false;
  var offsetX = 0;
  var offsetY = 0;
  var dragStartX = 0;
  var dragStartY = 0;
  var dragStartTime = 0;
  var hasMoved = false;

  /* ============================================================
     DOM BUILD
     ============================================================ */
  /* -- disc -- */
  var disc = document.createElement('div');
  disc.className = 'splayer-disc';
  disc.style.left = '16px';
  disc.style.top = '50%';
  disc.style.transform = 'translateY(-50%)';

  var discCover = document.createElement('div');
  discCover.className = 'cover';
  disc.appendChild(discCover);
  document.body.appendChild(disc);

  /* -- panel -- */
  var panel = document.createElement('div');
  panel.className = 'splayer-panel';

  panel.innerHTML =
    '<div class="panel-cover"></div>' +
    '<div class="panel-content">' +
      /* button row: mode | prev | play | next | spacer | playlist */
      '<div class="button-row">' +
        '<button id="sp-mode" class="splayer-btn mode-btn active-seq">' + ICONS.modeSeq + '</button>' +
        '<button id="sp-prev" class="splayer-btn">' + ICONS.prev + '</button>' +
        '<button id="sp-play" class="splayer-btn">' + ICONS.play + '</button>' +
        '<button id="sp-next" class="splayer-btn">' + ICONS.next + '</button>' +
        '<span class="spacer"></span>' +
        '<button id="sp-playlist-btn" class="splayer-btn playlist-btn">' + ICONS.playlist + '</button>' +
      '</div>' +
      /* progress bar */
      '<div class="progress-area">' +
        '<span class="time" id="sp-time-cur">0:00</span>' +
        '<div class="splayer-progress" id="sp-progress">' +
          '<div class="progress-filled" id="sp-progress-filled"></div>' +
          '<div class="progress-thumb" id="sp-progress-thumb"></div>' +
        '</div>' +
        '<span class="time time-right" id="sp-time-dur">0:00</span>' +
      '</div>' +
      /* title */
      '<div class="song-title" id="sp-title"></div>' +
    '</div>' +
    /* playlist overlay */
    '<div class="splayer-playlist-overlay" id="sp-playlist-overlay">' +
      '<div class="playlist-header">' +
        '<span>播放列表</span>' +
        '<button class="playlist-close" id="sp-playlist-close">' + ICONS.close + '</button>' +
      '</div>' +
      '<div class="playlist-items" id="sp-playlist-items"></div>' +
    '</div>';

  document.body.appendChild(panel);

  /* -- refs -- */
  var panelCover = panel.querySelector('.panel-cover');
  var titleEl = panel.querySelector('#sp-title');
  var playBtn = panel.querySelector('#sp-play');
  var prevBtn = panel.querySelector('#sp-prev');
  var nextBtn = panel.querySelector('#sp-next');
  var modeBtn = panel.querySelector('#sp-mode');
  var playlistBtn = panel.querySelector('#sp-playlist-btn');
  var playlistOverlay = panel.querySelector('#sp-playlist-overlay');
  var playlistItems = panel.querySelector('#sp-playlist-items');
  var playlistClose = panel.querySelector('#sp-playlist-close');
  var progressEl = panel.querySelector('#sp-progress');
  var progressFilled = panel.querySelector('#sp-progress-filled');
  var progressThumb = panel.querySelector('#sp-progress-thumb');
  var timeCur = panel.querySelector('#sp-time-cur');
  var timeDur = panel.querySelector('#sp-time-dur');

  /* ============================================================
     HELPERS
     ============================================================ */
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function setCover(url) {
    var u = url || defaultCover;
    discCover.style.backgroundImage = 'url(' + u + ')';
    panelCover.style.backgroundImage = 'url(' + u + ')';
  }

  function setTitle(text) {
    titleEl.textContent = text || '';
  }

  function updatePlayBtn(isPlaying) {
    playBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
  }

  function updateRotation(isPlaying) {
    disc.classList.toggle('splayer-rotating', isPlaying);
    disc.classList.toggle('splayer-paused', !isPlaying);
  }

  function updateModeBtn() {
    var cls = 'active-seq';
    var icon = ICONS.modeSeq;
    if (playMode === 'shuffle') { cls = 'active-shuffle'; icon = ICONS.modeShuffle; }
    if (playMode === 'repeat')  { cls = 'active-repeat';  icon = ICONS.modeRepeat; }
    modeBtn.className = 'splayer-btn mode-btn ' + cls;
    modeBtn.innerHTML = icon;
  }

  function updateProgress() {
    var dur = audio.duration || 0;
    var cur = audio.currentTime || 0;
    var pct = dur > 0 ? (cur / dur * 100) : 0;
    if (!isProgressDragging) {
      progressFilled.style.width = pct + '%';
      progressThumb.style.left = pct + '%';
    }
    timeCur.textContent = formatTime(cur);
    timeDur.textContent = formatTime(dur);
  }

  /* ============================================================
     TRACK LOADING
     ============================================================ */
  function loadTrack(i) {
    var t = playlist[i];
    if (!t) return;
    currentIndex = i;
    audio.src = t.url;
    audio.loop = false;
    audio.load();
    setCover(t.cover);
    setTitle(t.title || ('Track ' + (i + 1)));
    updatePlaylistUI();
  }

  if (playlist.length) {
    loadTrack(0);
  } else {
    setCover();
    setTitle('暂无歌曲');
    playBtn.disabled = true;
    nextBtn.disabled = true;
    prevBtn.disabled = true;
    modeBtn.disabled = true;
  }

  /* ============================================================
     PLAYBACK CONTROL
     ============================================================ */
  function playCurrent() {
    if (!playlist.length) return;
    audio.play();
  }

  function togglePlay() {
    if (!playlist.length) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  function getNextIndex() {
    if (playMode === 'shuffle') {
      var r;
      do {
        r = Math.floor(Math.random() * playlist.length);
      } while (r === currentIndex && playlist.length > 1);
      return r;
    }
    /* seq or repeat - seq still advances to next */
    return (currentIndex + 1) % playlist.length;
  }

  function getPrevIndex() {
    if (playMode === 'shuffle') {
      var r;
      do {
        r = Math.floor(Math.random() * playlist.length);
      } while (r === currentIndex && playlist.length > 1);
      return r;
    }
    return (currentIndex - 1 + playlist.length) % playlist.length;
  }

  function nextTrack() {
    if (!playlist.length) return;
    if (playMode === 'repeat') {
      audio.currentTime = 0;
      playCurrent();
      return;
    }
    var ni = getNextIndex();
    loadTrack(ni);
    playCurrent();
  }

  function prevTrack() {
    if (!playlist.length) return;
    if (playMode === 'repeat') {
      audio.currentTime = 0;
      playCurrent();
      return;
    }
    var pi = getPrevIndex();
    loadTrack(pi);
    playCurrent();
  }

  /* ============================================================
     PLAY MODE CYCLING
     ============================================================ */
  function cycleMode() {
    if (playMode === 'seq')     { playMode = 'shuffle'; }
    else if (playMode === 'shuffle') { playMode = 'repeat'; }
    else                         { playMode = 'seq'; }
    updateModeBtn();
  }

  modeBtn.addEventListener('click', cycleMode);

  /* ============================================================
     AUDIO EVENTS
     ============================================================ */
  audio.addEventListener('play', function () {
    updatePlayBtn(true);
    updateRotation(true);
  });

  audio.addEventListener('pause', function () {
    updatePlayBtn(false);
    updateRotation(false);
  });

  audio.addEventListener('ended', function () {
    if (playlist.length) {
      if (playMode === 'repeat') {
        audio.currentTime = 0;
        playCurrent();
      } else {
        nextTrack();
      }
    }
  });

  audio.addEventListener('timeupdate', function () {
    updateProgress();
  });

  audio.addEventListener('loadedmetadata', function () {
    updateProgress();
  });

  /* ============================================================
     BUTTON EVENTS
     ============================================================ */
  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', nextTrack);
  prevBtn.addEventListener('click', prevTrack);

  /* ============================================================
     PANEL SHOW / HIDE  (disc → normal panel)
     ============================================================ */
  function disablePanelTransition() {
    panel.classList.add('no-transition');
  }

  function enablePanelTransition() {
    /* force reflow then remove class */
    void panel.offsetHeight;
    panel.classList.remove('no-transition');
  }

  function showPanel() {
    if (panelState !== 'closed' || isClosing) return;

    var rect = disc.getBoundingClientRect();
    var isMobile = window.innerWidth <= 480;
    var expandW = isMobile ? 280 : 320;
    var expandH = isMobile ? 88 : 110;

    /* 1. disable transition, snap panel exactly onto disc */
    disablePanelTransition();
    panel.style.top = rect.top + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.right = 'auto';
    panel.style.width = rect.width + 'px';
    panel.style.height = rect.height + 'px';
    panel.style.borderRadius = '50%';
    panel.style.opacity = '1';

    /* 2. force reflow & enable transition */
    enablePanelTransition();

    /* 3. next frame: expand */
    requestAnimationFrame(function () {
      panel.classList.add('layout-normal');
      var centerX = rect.left + rect.width / 2;
      if (centerX < window.innerWidth / 2) {
        panel.style.left = rect.left + 'px';
      } else {
        panel.style.left = (rect.left + rect.width - expandW) + 'px';
      }
      panel.style.right = 'auto';
      panel.style.width = expandW + 'px';
      panel.style.height = expandH + 'px';
      panel.style.borderRadius = '16px';
      panel.classList.add('splayer-panel-show');

      disc.style.opacity = '0';
    });

    panelState = 'normal';
    updatePlaylistBtnState();
    updateProgress();

    setTimeout(function () {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
  }

  function hidePanel() {
    if (panelState === 'closed' || isClosing) return;

    /* if playlist is open, close it first */
    if (isPlaylistVisible) {
      hidePlaylistImmediate();
    }

    isClosing = true;
    var rect = disc.getBoundingClientRect();

    panel.classList.remove('splayer-panel-show');
    panel.classList.remove('layout-normal');
    panel.classList.remove('layout-playlist');

    disablePanelTransition();
    panel.style.width = rect.width + 'px';
    panel.style.height = rect.height + 'px';
    panel.style.top = rect.top + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.borderRadius = '50%';
    enablePanelTransition();

    setTimeout(function () {
      disc.style.opacity = '1';
      panel.style.opacity = '0';
      panelState = 'closed';
      isClosing = false;
    }, 480);

    document.removeEventListener('click', handleOutsideClick);
  }

  function togglePanel() {
    if (panelState === 'closed') {
      showPanel();
    } else {
      hidePanel();
    }
  }

  function handleOutsideClick(e) {
    if (!panel.contains(e.target) && !disc.contains(e.target)) {
      hidePanel();
    }
  }

  panel.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  /* ============================================================
     PLAYLIST OVERLAY
     ============================================================ */
  function updatePlaylistUI() {
    var html = '';
    for (var i = 0; i < playlist.length; i++) {
      var t = playlist[i];
      var isActive = (i === currentIndex);
      html += '<div class="playlist-item' + (isActive ? ' active' : '') + '" data-index="' + i + '">' +
        '<span class="item-index">' + (isActive ? '<span class="item-playing">' + ICONS.playing + '</span>' : (i + 1)) + '</span>' +
        '<span class="item-title">' + (t.title || ('Track ' + (i + 1))) + '</span>' +
      '</div>';
    }
    playlistItems.innerHTML = html;

    /* click to play */
    Array.prototype.forEach.call(playlistItems.children, function (el) {
      el.addEventListener('click', function () {
        var idx = parseInt(el.getAttribute('data-index'), 10);
        if (idx === currentIndex) {
          /* same track, just play */
          playCurrent();
        } else {
          loadTrack(idx);
          playCurrent();
        }
        /* close playlist after selecting */
        hidePlaylist();
      });
    });
  }

  function showPlaylist() {
    if (isPlaylistVisible || panelState !== 'normal') return;
    isPlaylistVisible = true;

    var rect = panel.getBoundingClientRect();
    var isMobile = window.innerWidth <= 480;
    var playlistH = isMobile ? 220 : 260;

    /* decide direction: if disc is in bottom half, expand upward */
    var discRect = disc.getBoundingClientRect();
    var discCenterY = discRect.top + discRect.height / 2;

    updatePlaylistUI();
    playlistOverlay.classList.add('show');
    panel.classList.add('layout-playlist');
    playlistBtn.classList.add('active');

    if (discCenterY > window.innerHeight / 2) {
      /* expand upward */
      playlistOrigTop = rect.top;
      var newTop = rect.top - playlistH;
      if (newTop < 0) newTop = 0;
      panel.style.top = newTop + 'px';
    } else {
      /* expand downward */
      playlistOrigTop = rect.top;
    }

    panel.style.height = (rect.height + playlistH) + 'px';
  }

  function hidePlaylist() {
    if (!isPlaylistVisible) return;
    isPlaylistVisible = false;

    playlistOverlay.classList.remove('show');
    panel.classList.remove('layout-playlist');
    playlistBtn.classList.remove('active');

    /* restore top if was expanded upward */
    var discRect = disc.getBoundingClientRect();
    var discCenterY = discRect.top + discRect.height / 2;
    if (discCenterY > window.innerHeight / 2 && playlistOrigTop) {
      panel.style.top = playlistOrigTop + 'px';
    }

    /* restore normal panel height */
    var isMobile = window.innerWidth <= 480;
    panel.style.height = (isMobile ? 88 : 110) + 'px';
  }

  function hidePlaylistImmediate() {
    isPlaylistVisible = false;
    playlistOverlay.classList.remove('show');
    panel.classList.remove('layout-playlist');
    playlistBtn.classList.remove('active');
    var isMobile = window.innerWidth <= 480;
    panel.style.height = (isMobile ? 88 : 110) + 'px';
  }

  function togglePlaylist() {
    if (!isPlaylistVisible) {
      showPlaylist();
    } else {
      hidePlaylist();
    }
  }

  function updatePlaylistBtnState() {
    if (panelState === 'normal') {
      playlistBtn.disabled = false;
    } else {
      playlistBtn.disabled = true;
    }
  }

  playlistBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    togglePlaylist();
  });

  playlistClose.addEventListener('click', function (e) {
    e.stopPropagation();
    hidePlaylist();
  });

  /* ============================================================
     PROGRESS BAR DRAG (SEEK)
     ============================================================ */
  function getProgressFromEvent(e) {
    var rect = progressEl.getBoundingClientRect();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return x / rect.width;
  }

  function startProgressDrag(e) {
    if (!playlist.length || !audio.duration) return;
    isProgressDragging = true;
    progressEl.classList.add('dragging');

    var ratio = getProgressFromEvent(e);
    progressFilled.style.width = (ratio * 100) + '%';
    progressThumb.style.left = (ratio * 100) + '%';

    e.stopPropagation();
    e.preventDefault();
  }

  function doProgressDrag(e) {
    if (!isProgressDragging) return;
    var ratio = getProgressFromEvent(e);
    progressFilled.style.width = (ratio * 100) + '%';
    progressThumb.style.left = (ratio * 100) + '%';

    /* update current time display while dragging */
    var dur = audio.duration || 0;
    timeCur.textContent = formatTime(ratio * dur);

    e.preventDefault();
  }

  function endProgressDrag(e) {
    if (!isProgressDragging) return;
    isProgressDragging = false;
    progressEl.classList.remove('dragging');

    var ratio = parseFloat(progressFilled.style.width) / 100;
    if (isFinite(ratio) && audio.duration) {
      audio.currentTime = ratio * audio.duration;
    }
  }

  /* mouse events on progress */
  progressEl.addEventListener('mousedown', startProgressDrag);
  window.addEventListener('mousemove', doProgressDrag);
  window.addEventListener('mouseup', endProgressDrag);

  /* touch events on progress */
  progressEl.addEventListener('touchstart', startProgressDrag, { passive: false });
  window.addEventListener('touchmove', doProgressDrag, { passive: false });
  window.addEventListener('touchend', endProgressDrag);

  /* ============================================================
     DISC DRAG (mouse + touch)
     ============================================================ */
  function getEventCoords(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function startDrag(e) {
    e.stopPropagation();
    e.preventDefault();

    var coords = getEventCoords(e);
    dragStartX = coords.x;
    dragStartY = coords.y;
    offsetX = coords.x - disc.offsetLeft;
    offsetY = coords.y - disc.offsetTop;
    dragStartTime = Date.now();
    hasMoved = false;

    isDragging = true;
    disc.style.transition = 'none';
    disc.style.transform = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
  }

  function doDrag(e) {
    if (!isDragging) return;
    e.preventDefault();

    var coords = getEventCoords(e);
    var dx = coords.x - dragStartX;
    var dy = coords.y - dragStartY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved = true;
    }

    var x = coords.x - offsetX;
    var y = coords.y - offsetY;
    x = Math.max(0, Math.min(window.innerWidth - disc.offsetWidth, x));
    y = Math.max(0, Math.min(window.innerHeight - disc.offsetHeight, y));
    disc.style.left = x + 'px';
    disc.style.top = y + 'px';
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;

    document.body.style.userSelect = 'auto';
    document.body.style.touchAction = 'auto';

    /* tap → toggle panel */
    if (!hasMoved && Date.now() - dragStartTime < 300) {
      disc.style.transition = 'left 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s ease';
      togglePanel();
      return;
    }

    /* drag → snap to edge */
    disc.style.transition = 'left 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s ease';
    var x = disc.offsetLeft;
    if (x + disc.offsetWidth / 2 < window.innerWidth / 2) {
      disc.style.left = '16px';
    } else {
      disc.style.left = (window.innerWidth - disc.offsetWidth - 16) + 'px';
    }
  }

  /* mouse */
  disc.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('mouseleave', endDrag);

  /* touch */
  disc.addEventListener('touchstart', startDrag);
  window.addEventListener('touchmove', doDrag, { passive: false });
  window.addEventListener('touchend', endDrag);
  window.addEventListener('touchcancel', endDrag);

  /* ============================================================
     INIT
     ============================================================ */
  updateModeBtn();
  updatePlaylistBtnState();
  updatePlaylistUI();

})();
