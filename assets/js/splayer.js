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
    playing: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    github: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z"/></svg>'
  };

  /* ============================================================
     DATA
     ============================================================ */
  var S = window.SPLAYER || {};
  var playlist = Array.isArray(S.playlist) ? S.playlist : [];
  var defaultCover = S.defaultCover || '';
  var playerOptions = S.options || {};
  var themeMode = playerOptions.theme_mode || 'auto';

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
  var discOrigTop = null;
  var panelLeftSide = true;
  var panelDiscR = 0;

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
      /* github link */
      '<a class="splayer-github-link" href="https://github.com/ShirazuNagisa/splayer" target="_blank" title="GitHub">' + ICONS.github + '</a>' +
    '</div>';

  document.body.appendChild(panel);

  /* -- standalone playlist panel (extends from above/below main panel) -- */
  var playlistPanel = document.createElement('div');
  playlistPanel.className = 'splayer-playlist-panel';
  playlistPanel.innerHTML =
    '<div class="playlist-header">' +
      '<span>播放列表</span>' +
      '<button class="playlist-close" id="sp-playlist-close">' + ICONS.close + '</button>' +
    '</div>' +
    '<div class="playlist-items" id="sp-playlist-items"></div>';
  document.body.appendChild(playlistPanel);

  /* -- refs -- */
  var panelContent = panel.querySelector('.panel-content');
  var titleEl = panel.querySelector('#sp-title');
  var playBtn = panel.querySelector('#sp-play');
  var prevBtn = panel.querySelector('#sp-prev');
  var nextBtn = panel.querySelector('#sp-next');
  var modeBtn = panel.querySelector('#sp-mode');
  var playlistBtn = panel.querySelector('#sp-playlist-btn');
  var playlistItems = playlistPanel.querySelector('#sp-playlist-items');
  var playlistClose = playlistPanel.querySelector('#sp-playlist-close');
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
    var bottomMargin = 16;

    /* check if panel bottom overflows screen */
    var panelBottom = rect.top + expandH;
    var maxBottom = window.innerHeight - bottomMargin;
    if (panelBottom > maxBottom) {
      var overflow = panelBottom - maxBottom;
      discOrigTop = rect.top;
      disc.style.transition = 'none';
      disc.style.transform = 'none';
      disc.style.top = (rect.top - overflow) + 'px';
      void disc.offsetHeight;
      rect = disc.getBoundingClientRect();
    }

    var centerX = rect.left + rect.width / 2;
    var leftSide = centerX < window.innerWidth / 2;
    var discR = Math.round(rect.width / 2);
    var discPad = Math.round(rect.width * 1.2);
    panelLeftSide = leftSide;
    panelDiscR = discR;

    /* snap panel behind disc at zero size — disc z-index > panel z-index */
    disablePanelTransition();
    panel.classList.add('layout-normal', 'no-border');
    panel.style.top = rect.top + 'px';
    panel.style.width = '0px';
    panel.style.height = '0px';
    panel.style.opacity = '1';
    if (leftSide) {
      panel.style.left = rect.left + 'px';
      panel.style.right = 'auto';
      panel.style.paddingLeft = discPad + 'px';
      panel.style.paddingRight = '14px';
      panelContent.style.left = discPad + 'px';
      panelContent.style.right = '0';
      panelContent.style.padding = '0 10px 0 0';
      panelContent.style.alignItems = 'center';
      panel.style.borderTopLeftRadius = discR + 'px';
      panel.style.borderTopRightRadius = '16px';
    } else {
      panel.style.left = 'auto';
      panel.style.right = (window.innerWidth - rect.right) + 'px';
      panel.style.paddingLeft = '14px';
      panel.style.paddingRight = discPad + 'px';
      panelContent.style.left = '0';
      panelContent.style.right = discPad + 'px';
      panelContent.style.padding = '0 0 0 10px';
      panelContent.style.alignItems = 'center';
      panel.style.borderTopLeftRadius = '16px';
      panel.style.borderTopRightRadius = discR + 'px';
    }
    panel.style.borderBottomRightRadius = '16px';
    panel.style.borderBottomLeftRadius = '16px';
    enablePanelTransition();

    /* expand — panel grows outward from behind disc */
    requestAnimationFrame(function () {
      panel.style.width = expandW + 'px';
      panel.style.height = expandH + 'px';
      panel.classList.add('splayer-panel-show');
      panel.classList.remove('no-border');
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

    panel.classList.remove('splayer-panel-show');
    panel.classList.remove('layout-normal');
    panel.classList.remove('layout-playlist');
    panel.classList.add('no-border');

    /* shrink back to zero — corner radius stays discR, no直角穿帮 */
    panel.style.width = '0px';
    panel.style.height = '0px';

    setTimeout(function () {
      if (discOrigTop !== null) {
        disc.style.transition = 'left 0.25s ease-in-out, top 0.4s ease-in-out';
        var restoreTop = Math.min(discOrigTop, window.innerHeight - disc.offsetHeight - 8);
        if (restoreTop < 8) restoreTop = 8;
        disc.style.top = restoreTop + 'px';
        discOrigTop = null;
      }
      panel.style.opacity = '0';
      panel.classList.remove('no-border');
      panelContent.style.alignItems = '';
      panelContent.style.left = '';
      panelContent.style.right = '';
      panelContent.style.padding = '';
      panel.style.borderRadius = '';
      panel.style.borderTopLeftRadius = '';
      panel.style.borderTopRightRadius = '';
      panel.style.borderBottomLeftRadius = '';
      panel.style.borderBottomRightRadius = '';
      panel.style.paddingLeft = '';
      panel.style.paddingRight = '';
      panelState = 'closed';
      isClosing = false;
    }, 440);

    document.removeEventListener('click', handleOutsideClick);
  }

  /** sync panel position with disc when dragging */
  function syncPanelPosition() {
    if (panelState === 'closed') return;
    var rect = disc.getBoundingClientRect();
    panel.style.top = rect.top + 'px';
    if (panelLeftSide) {
      panel.style.left = rect.left + 'px';
      panel.style.right = 'auto';
    } else {
      panel.style.left = 'auto';
      panel.style.right = (window.innerWidth - rect.right) + 'px';
    }
  }

  function togglePanel() {
    if (panelState === 'closed') {
      showPanel();
    } else {
      hidePanel();
    }
  }

  function handleOutsideClick(e) {
    if (isPlaylistVisible) {
      if (!panel.contains(e.target) && !disc.contains(e.target) && !playlistPanel.contains(e.target)) {
        hidePlaylist();
        return;
      }
    }
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

    var panelRect = panel.getBoundingClientRect();
    var isMobile = window.innerWidth <= 480;
    var playlistH = isMobile ? 220 : 260;
    var gap = 8;

    /* decide direction: if disc is in bottom half, expand upward */
    var discRect = disc.getBoundingClientRect();
    var discCenterY = discRect.top + discRect.height / 2;
    var expandUpward = discCenterY > window.innerHeight / 2;

    updatePlaylistUI();
    playlistBtn.classList.add('active');
    panel.classList.add('layout-playlist');

    /* position playlist panel below or above the main panel */
    playlistPanel.style.width = panelRect.width + 'px';
    playlistPanel.style.left = panelRect.left + 'px';
    playlistPanel.style.height = '0px';

    if (expandUpward) {
      var btm = window.innerHeight - panelRect.top + gap;
      var maxBtm = window.innerHeight - gap - playlistH;
      if (btm > maxBtm) btm = maxBtm;
      playlistPanel.style.top = 'auto';
      playlistPanel.style.bottom = btm + 'px';
    } else {
      playlistPanel.style.top = (panelRect.bottom + gap) + 'px';
      playlistPanel.style.bottom = 'auto';
    }

    requestAnimationFrame(function () {
      playlistPanel.style.height = playlistH + 'px';
      playlistPanel.classList.add('show');
    });
  }

  function hidePlaylist() {
    if (!isPlaylistVisible) return;
    isPlaylistVisible = false;

    playlistPanel.classList.remove('show');
    playlistPanel.style.height = '0px';
    panel.classList.remove('layout-playlist');
    playlistBtn.classList.remove('active');
  }

  function hidePlaylistImmediate() {
    isPlaylistVisible = false;
    playlistPanel.classList.remove('show');
    playlistPanel.style.height = '0px';
    panel.classList.remove('layout-playlist');
    playlistBtn.classList.remove('active');
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

    if (panelState !== 'closed') {
      syncPanelPosition();
    }
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

    if (panelState !== 'closed') {
      syncPanelPosition();
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
     WINDOW RESIZE — 窗口缩放时唱片不跑出视口
     ============================================================ */
  function clampDiscPosition() {
    if (panelState !== 'closed') return;
    var dTop = disc.offsetTop;
    var dLeft = disc.offsetLeft;
    var dW = disc.offsetWidth;
    var dH = disc.offsetHeight;
    var margin = 8;

    var clampedTop = Math.max(margin, Math.min(dTop, window.innerHeight - dH - margin));
    var clampedLeft = Math.max(margin, Math.min(dLeft, window.innerWidth - dW - margin));

    if (clampedTop !== dTop) { disc.style.top = clampedTop + 'px'; }
    if (clampedLeft !== dLeft) { disc.style.left = clampedLeft + 'px'; }
  }

  window.addEventListener('resize', clampDiscPosition);

  /* ============================================================
     THEME
     ============================================================ */
  function applyTheme(mode) {
    document.body.classList.remove('splayer-light', 'splayer-dark');
    if (mode === 'light') {
      document.body.classList.add('splayer-light');
    } else if (mode === 'dark') {
      document.body.classList.add('splayer-dark');
    }
  }

  applyTheme(themeMode);

  /* ============================================================
     INIT
     ============================================================ */
  updateModeBtn();
  updatePlaylistBtnState();
  updatePlaylistUI();

})();
