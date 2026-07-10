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
     SPlayer CLASS
     ============================================================ */
  var SPlayer = function (opts) {
    opts = opts || {};

    /* --- options --- */
    this.container = opts.container || document.body;
    this.playlist = Array.isArray(opts.playlist) ? opts.playlist : [];
    this.defaultCover = opts.defaultCover || '';
    this.themeMode = opts.theme || (opts.options && opts.options.theme_mode) || 'auto';
    this.initLeft = opts.left !== undefined ? opts.left : '16px';
    this.initTop = opts.top !== undefined ? opts.top : '50%';

    /* --- state --- */
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.currentIndex = 0;
    this.panelState = 'closed';
    this.playMode = 'seq';
    this.isClosing = false;
    this.isPlaylistVisible = false;
    this.discOrigTop = null;
    this.panelLeftSide = true;
    this.panelDiscR = 0;

    /* progress drag */
    this.isProgressDragging = false;

    /* disc drag */
    this.isDragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartTime = 0;
    this.hasMoved = false;

    /* DOM references */
    this.disc = null;
    this.discCover = null;
    this.panel = null;
    this.panelContent = null;
    this.titleEl = null;
    this.playBtn = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.modeBtn = null;
    this.playlistBtn = null;
    this.playlistPanel = null;
    this.playlistItems = null;
    this.playlistClose = null;
    this.progressEl = null;
    this.progressFilled = null;
    this.progressThumb = null;
    this.timeCur = null;
    this.timeDur = null;

    /* bound event handlers (for removal) */
    this._boundPlayClick = null;
    this._boundNextClick = null;
    this._boundPrevClick = null;
    this._boundModeClick = null;
    this._boundPlaylistBtnClick = null;
    this._boundPlaylistCloseClick = null;
    this._boundPanelClick = null;
    this._boundDiscMouseDown = null;
    this._boundWindowMouseMove = null;
    this._boundWindowMouseUp = null;
    this._boundWindowMouseLeave = null;
    this._boundDiscTouchStart = null;
    this._boundWindowTouchMove = null;
    this._boundWindowTouchEnd = null;
    this._boundWindowTouchCancel = null;
    this._boundWindowResize = null;
    this._boundProgressMouseDown = null;
    this._boundWindowProgressMouseMove = null;
    this._boundWindowProgressMouseUp = null;
    this._boundProgressTouchStart = null;
    this._boundWindowProgressTouchMove = null;
    this._boundWindowProgressTouchEnd = null;

    /* audio events */
    this._boundAudioPlay = null;
    this._boundAudioPause = null;
    this._boundAudioEnded = null;
    this._boundAudioTimeUpdate = null;
    this._boundAudioLoadedMeta = null;

    this._build();
    this._init();
  };

  /* ============================================================
     PROTOTYPE METHODS
     ============================================================ */

  /* ---- private helpers ---- */
  function _formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---- build DOM ---- */
  SPlayer.prototype._build = function () {
    var self = this;

    /* disc */
    var disc = document.createElement('div');
    disc.className = 'splayer-disc';
    disc.style.left = self.initLeft;
    disc.style.top = self.initTop;
    disc.style.transform = 'translateY(-50%)';
    self.disc = disc;

    var discCover = document.createElement('div');
    discCover.className = 'cover';
    disc.appendChild(discCover);
    self.discCover = discCover;
    self.container.appendChild(disc);

    /* panel */
    var panel = document.createElement('div');
    panel.className = 'splayer-panel';
    panel.innerHTML =
      '<div class="panel-content">' +
        '<div class="button-row">' +
          '<button class="splayer-btn mode-btn active-seq">' + ICONS.modeSeq + '</button>' +
          '<button class="splayer-btn">' + ICONS.prev + '</button>' +
          '<button class="splayer-btn">' + ICONS.play + '</button>' +
          '<button class="splayer-btn">' + ICONS.next + '</button>' +
          '<span class="spacer"></span>' +
          '<button class="splayer-btn playlist-btn">' + ICONS.playlist + '</button>' +
        '</div>' +
        '<div class="progress-area">' +
          '<span class="time">0:00</span>' +
          '<div class="splayer-progress">' +
            '<div class="progress-filled"></div>' +
            '<div class="progress-thumb"></div>' +
          '</div>' +
          '<span class="time time-right">0:00</span>' +
        '</div>' +
        '<div class="song-title"></div>' +
        '<a class="splayer-github-link" href="https://github.com/ShirazuNagisa/splayer" target="_blank" title="GitHub">' + ICONS.github + '</a>' +
      '</div>';
    self.panel = panel;
    self.container.appendChild(panel);

    /* playlist panel */
    var playlistPanel = document.createElement('div');
    playlistPanel.className = 'splayer-playlist-panel';
    playlistPanel.innerHTML =
      '<div class="playlist-header">' +
        '<span>播放列表</span>' +
        '<button class="playlist-close">' + ICONS.close + '</button>' +
      '</div>' +
      '<div class="playlist-items"></div>';
    self.playlistPanel = playlistPanel;
    self.container.appendChild(playlistPanel);

    /* refs */
    var pc = panel.querySelector('.panel-content');
    self.panelContent = pc;
    var btns = pc.querySelectorAll('.splayer-btn');
    self.modeBtn = btns[0];
    self.prevBtn = btns[1];
    self.playBtn = btns[2];
    self.nextBtn = btns[3];
    self.playlistBtn = btns[5];

    self.titleEl = pc.querySelector('.song-title');
    var times = pc.querySelectorAll('.time');
    self.timeCur = times[0];
    self.timeDur = times[1];

    var prog = pc.querySelector('.splayer-progress');
    self.progressEl = prog;
    self.progressFilled = prog.querySelector('.progress-filled');
    self.progressThumb = prog.querySelector('.progress-thumb');

    self.playlistItems = playlistPanel.querySelector('.playlist-items');
    self.playlistClose = playlistPanel.querySelector('.playlist-close');
  };

  SPlayer.prototype._setCover = function (url) {
    var u = url || this.defaultCover;
    this.discCover.style.backgroundImage = 'url(' + u + ')';
  };

  SPlayer.prototype._setTitle = function (text) {
    this.titleEl.textContent = text || '';
  };

  SPlayer.prototype._updatePlayBtn = function (isPlaying) {
    this.playBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
  };

  SPlayer.prototype._updateRotation = function (isPlaying) {
    this.disc.classList.toggle('splayer-rotating', isPlaying);
    this.disc.classList.toggle('splayer-paused', !isPlaying);
  };

  SPlayer.prototype._updateModeBtn = function () {
    var cls = 'active-seq';
    var icon = ICONS.modeSeq;
    if (this.playMode === 'shuffle') { cls = 'active-shuffle'; icon = ICONS.modeShuffle; }
    if (this.playMode === 'repeat')  { cls = 'active-repeat'; icon = ICONS.modeRepeat; }
    this.modeBtn.className = 'splayer-btn mode-btn ' + cls;
    this.modeBtn.innerHTML = icon;
  };

  SPlayer.prototype._updateProgress = function () {
    var dur = this.audio.duration || 0;
    var cur = this.audio.currentTime || 0;
    var pct = dur > 0 ? (cur / dur * 100) : 0;
    if (!this.isProgressDragging) {
      this.progressFilled.style.width = pct + '%';
      this.progressThumb.style.left = pct + '%';
    }
    this.timeCur.textContent = _formatTime(cur);
    this.timeDur.textContent = _formatTime(dur);
  };

  SPlayer.prototype._loadTrack = function (i) {
    var t = this.playlist[i];
    if (!t) return;
    this.currentIndex = i;
    this.audio.src = t.url;
    this.audio.loop = false;
    this.audio.load();
    this._setCover(t.cover);
    this._setTitle(t.title || ('Track ' + (i + 1)));
    this._updatePlaylistUI();
  };

  /* ---- playback ---- */
  SPlayer.prototype._playCurrent = function () {
    if (!this.playlist.length) return;
    this.audio.play();
  };

  SPlayer.prototype.togglePlay = function () {
    if (!this.playlist.length) return;
    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  };

  SPlayer.prototype.play = function () {
    if (!this.playlist.length) return;
    this.audio.play();
  };

  SPlayer.prototype.pause = function () {
    this.audio.pause();
  };

  SPlayer.prototype._getNextIndex = function () {
    if (this.playMode === 'shuffle') {
      var r;
      do {
        r = Math.floor(Math.random() * this.playlist.length);
      } while (r === this.currentIndex && this.playlist.length > 1);
      return r;
    }
    return (this.currentIndex + 1) % this.playlist.length;
  };

  SPlayer.prototype._getPrevIndex = function () {
    if (this.playMode === 'shuffle') {
      var r;
      do {
        r = Math.floor(Math.random() * this.playlist.length);
      } while (r === this.currentIndex && this.playlist.length > 1);
      return r;
    }
    return (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
  };

  SPlayer.prototype.nextTrack = function () {
    if (!this.playlist.length) return;
    if (this.playMode === 'repeat') {
      this.audio.currentTime = 0;
      this._playCurrent();
      return;
    }
    var ni = this._getNextIndex();
    this._loadTrack(ni);
    this._playCurrent();
  };

  SPlayer.prototype.prevTrack = function () {
    if (!this.playlist.length) return;
    if (this.playMode === 'repeat') {
      this.audio.currentTime = 0;
      this._playCurrent();
      return;
    }
    var pi = this._getPrevIndex();
    this._loadTrack(pi);
    this._playCurrent();
  };

  SPlayer.prototype._cycleMode = function () {
    if (this.playMode === 'seq')        { this.playMode = 'shuffle'; }
    else if (this.playMode === 'shuffle') { this.playMode = 'repeat'; }
    else                                  { this.playMode = 'seq'; }
    this._updateModeBtn();
  };

  /* ---- panel show/hide ---- */
  SPlayer.prototype._disablePanelTransition = function () {
    this.panel.classList.add('no-transition');
  };

  SPlayer.prototype._enablePanelTransition = function () {
    void this.panel.offsetHeight;
    this.panel.classList.remove('no-transition');
  };

  SPlayer.prototype._showPanel = function () {
    var self = this;
    if (self.panelState !== 'closed' || self.isClosing) return;

    var rect = self.disc.getBoundingClientRect();
    var isMobile = window.innerWidth <= 480;
    var expandW = isMobile ? 280 : 320;
    var expandH = isMobile ? 88 : 110;
    var bottomMargin = 16;

    var panelBottom = rect.top + expandH;
    var maxBottom = window.innerHeight - bottomMargin;
    if (panelBottom > maxBottom) {
      var overflow = panelBottom - maxBottom;
      self.discOrigTop = rect.top;
      self.disc.style.transition = 'none';
      self.disc.style.transform = 'none';
      self.disc.style.top = (rect.top - overflow) + 'px';
      void self.disc.offsetHeight;
      rect = self.disc.getBoundingClientRect();
    }

    var centerX = rect.left + rect.width / 2;
    var leftSide = centerX < window.innerWidth / 2;
    var discR = Math.round(rect.width / 2);
    var discPad = Math.round(rect.width * 1.2);
    self.panelLeftSide = leftSide;
    self.panelDiscR = discR;

    self._disablePanelTransition();
    self.panel.classList.add('layout-normal', 'no-border');
    self.panel.style.top = rect.top + 'px';
    self.panel.style.width = '0px';
    self.panel.style.height = '0px';
    self.panel.style.opacity = '1';
    if (leftSide) {
      self.panel.style.left = rect.left + 'px';
      self.panel.style.right = 'auto';
      self.panel.style.paddingLeft = discPad + 'px';
      self.panel.style.paddingRight = '14px';
      self.panelContent.style.left = discPad + 'px';
      self.panelContent.style.right = '0';
      self.panelContent.style.padding = '0 10px 0 0';
      self.panelContent.style.alignItems = 'center';
      self.panel.style.borderTopLeftRadius = discR + 'px';
      self.panel.style.borderTopRightRadius = '16px';
    } else {
      self.panel.style.left = 'auto';
      self.panel.style.right = (window.innerWidth - rect.right) + 'px';
      self.panel.style.paddingLeft = '14px';
      self.panel.style.paddingRight = discPad + 'px';
      self.panelContent.style.left = '0';
      self.panelContent.style.right = discPad + 'px';
      self.panelContent.style.padding = '0 0 0 10px';
      self.panelContent.style.alignItems = 'center';
      self.panel.style.borderTopLeftRadius = '16px';
      self.panel.style.borderTopRightRadius = discR + 'px';
    }
    self.panel.style.borderBottomRightRadius = '16px';
    self.panel.style.borderBottomLeftRadius = '16px';
    self._enablePanelTransition();

    requestAnimationFrame(function () {
      self.panel.style.width = expandW + 'px';
      self.panel.style.height = expandH + 'px';
      self.panel.classList.add('splayer-panel-show');
      self.panel.classList.remove('no-border');
    });

    self.panelState = 'normal';
    self._updatePlaylistBtnState();
    self._updateProgress();

    setTimeout(function () {
      document.addEventListener('click', self._boundOutsideClick);
    }, 100);
  };

  SPlayer.prototype._hidePanel = function () {
    var self = this;
    if (self.panelState === 'closed' || self.isClosing) return;

    if (self.isPlaylistVisible) {
      self._hidePlaylistImmediate();
    }

    self.isClosing = true;

    self.panel.classList.remove('splayer-panel-show');
    self.panel.classList.remove('layout-normal');
    self.panel.classList.remove('layout-playlist');
    self.panel.classList.add('no-border');

    self.panel.style.width = '0px';
    self.panel.style.height = '0px';

    setTimeout(function () {
      if (self.discOrigTop !== null) {
        self.disc.style.transition = 'left 0.25s ease-in-out, top 0.4s ease-in-out';
        var restoreTop = Math.min(self.discOrigTop, window.innerHeight - self.disc.offsetHeight - 8);
        if (restoreTop < 8) restoreTop = 8;
        self.disc.style.top = restoreTop + 'px';
        self.discOrigTop = null;
      }
      self.panel.style.opacity = '0';
      self.panel.classList.remove('no-border');
      self.panelContent.style.alignItems = '';
      self.panelContent.style.left = '';
      self.panelContent.style.right = '';
      self.panelContent.style.padding = '';
      self.panel.style.borderRadius = '';
      self.panel.style.borderTopLeftRadius = '';
      self.panel.style.borderTopRightRadius = '';
      self.panel.style.borderBottomLeftRadius = '';
      self.panel.style.borderBottomRightRadius = '';
      self.panel.style.paddingLeft = '';
      self.panel.style.paddingRight = '';
      self.panelState = 'closed';
      self.isClosing = false;
    }, 440);

    document.removeEventListener('click', self._boundOutsideClick);
  };

  SPlayer.prototype._syncPanelPosition = function () {
    if (this.panelState === 'closed') return;
    var rect = this.disc.getBoundingClientRect();
    this.panel.style.top = rect.top + 'px';
    if (this.panelLeftSide) {
      this.panel.style.left = rect.left + 'px';
      this.panel.style.right = 'auto';
    } else {
      this.panel.style.left = 'auto';
      this.panel.style.right = (window.innerWidth - rect.right) + 'px';
    }
  };

  SPlayer.prototype._togglePanel = function () {
    if (this.panelState === 'closed') {
      this._showPanel();
    } else {
      this._hidePanel();
    }
  };

  SPlayer.prototype._handleOutsideClick = function (e) {
    var self = this;
    var panel = self.panel;
    var disc = self.disc;
    var playlistPanel = self.playlistPanel;

    if (self.isPlaylistVisible) {
      if (!panel.contains(e.target) && !disc.contains(e.target) && !playlistPanel.contains(e.target)) {
        self._hidePlaylist();
        return;
      }
    }
    if (!panel.contains(e.target) && !disc.contains(e.target)) {
      self._hidePanel();
    }
  };

  /* ---- playlist ---- */
  SPlayer.prototype._updatePlaylistUI = function () {
    var self = this;
    var html = '';
    for (var i = 0; i < self.playlist.length; i++) {
      var t = self.playlist[i];
      var isActive = (i === self.currentIndex);
      html += '<div class="playlist-item' + (isActive ? ' active' : '') + '" data-index="' + i + '">' +
        '<span class="item-index">' + (isActive ? '<span class="item-playing">' + ICONS.playing + '</span>' : (i + 1)) + '</span>' +
        '<span class="item-title">' + (t.title || ('Track ' + (i + 1))) + '</span>' +
      '</div>';
    }
    self.playlistItems.innerHTML = html;

    Array.prototype.forEach.call(self.playlistItems.children, function (el) {
      el.addEventListener('click', function () {
        var idx = parseInt(el.getAttribute('data-index'), 10);
        if (idx === self.currentIndex) {
          self._playCurrent();
        } else {
          self._loadTrack(idx);
          self._playCurrent();
        }
        self._hidePlaylist();
      });
    });
  };

  SPlayer.prototype._showPlaylist = function () {
    var self = this;
    if (self.isPlaylistVisible || self.panelState !== 'normal') return;
    self.isPlaylistVisible = true;

    var panelRect = self.panel.getBoundingClientRect();
    var isMobile = window.innerWidth <= 480;
    var playlistH = isMobile ? 220 : 260;
    var gap = 8;

    var discRect = self.disc.getBoundingClientRect();
    var discCenterY = discRect.top + discRect.height / 2;
    var expandUpward = discCenterY > window.innerHeight / 2;

    self._updatePlaylistUI();
    self.playlistBtn.classList.add('active');
    self.panel.classList.add('layout-playlist');

    self.playlistPanel.style.width = panelRect.width + 'px';
    self.playlistPanel.style.left = panelRect.left + 'px';
    self.playlistPanel.style.height = '0px';

    if (expandUpward) {
      var btm = window.innerHeight - panelRect.top + gap;
      var maxBtm = window.innerHeight - gap - playlistH;
      if (btm > maxBtm) btm = maxBtm;
      self.playlistPanel.style.top = 'auto';
      self.playlistPanel.style.bottom = btm + 'px';
    } else {
      self.playlistPanel.style.top = (panelRect.bottom + gap) + 'px';
      self.playlistPanel.style.bottom = 'auto';
    }

    requestAnimationFrame(function () {
      self.playlistPanel.style.height = playlistH + 'px';
      self.playlistPanel.classList.add('show');
    });
  };

  SPlayer.prototype._hidePlaylist = function () {
    if (!this.isPlaylistVisible) return;
    this.isPlaylistVisible = false;
    this.playlistPanel.classList.remove('show');
    this.playlistPanel.style.height = '0px';
    this.panel.classList.remove('layout-playlist');
    this.playlistBtn.classList.remove('active');
  };

  SPlayer.prototype._hidePlaylistImmediate = function () {
    this.isPlaylistVisible = false;
    this.playlistPanel.classList.remove('show');
    this.playlistPanel.style.height = '0px';
    this.panel.classList.remove('layout-playlist');
    this.playlistBtn.classList.remove('active');
  };

  SPlayer.prototype._togglePlaylist = function () {
    if (!this.isPlaylistVisible) {
      this._showPlaylist();
    } else {
      this._hidePlaylist();
    }
  };

  SPlayer.prototype._updatePlaylistBtnState = function () {
    this.playlistBtn.disabled = (this.panelState !== 'normal');
  };

  /* ---- progress drag ---- */
  SPlayer.prototype._getProgressFromEvent = function (e) {
    var rect = this.progressEl.getBoundingClientRect();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return x / rect.width;
  };

  SPlayer.prototype._startProgressDrag = function (e) {
    if (!this.playlist.length || !this.audio.duration) return;
    this.isProgressDragging = true;
    this.progressEl.classList.add('dragging');

    var ratio = this._getProgressFromEvent(e);
    this.progressFilled.style.width = (ratio * 100) + '%';
    this.progressThumb.style.left = (ratio * 100) + '%';

    e.stopPropagation();
    e.preventDefault();
  };

  SPlayer.prototype._doProgressDrag = function (e) {
    if (!this.isProgressDragging) return;
    var ratio = this._getProgressFromEvent(e);
    this.progressFilled.style.width = (ratio * 100) + '%';
    this.progressThumb.style.left = (ratio * 100) + '%';

    var dur = this.audio.duration || 0;
    this.timeCur.textContent = _formatTime(ratio * dur);

    e.preventDefault();
  };

  SPlayer.prototype._endProgressDrag = function () {
    if (!this.isProgressDragging) return;
    this.isProgressDragging = false;
    this.progressEl.classList.remove('dragging');

    var ratio = parseFloat(this.progressFilled.style.width) / 100;
    if (isFinite(ratio) && this.audio.duration) {
      this.audio.currentTime = ratio * this.audio.duration;
    }
  };

  /* ---- disc drag ---- */
  SPlayer.prototype._getEventCoords = function (e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  SPlayer.prototype._startDrag = function (e) {
    e.stopPropagation();
    e.preventDefault();

    var coords = this._getEventCoords(e);
    this.dragStartX = coords.x;
    this.dragStartY = coords.y;
    this.offsetX = coords.x - this.disc.offsetLeft;
    this.offsetY = coords.y - this.disc.offsetTop;
    this.dragStartTime = Date.now();
    this.hasMoved = false;

    this.isDragging = true;
    this.disc.style.transition = 'none';
    this.disc.style.transform = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
  };

  SPlayer.prototype._doDrag = function (e) {
    if (!this.isDragging) return;
    e.preventDefault();

    var coords = this._getEventCoords(e);
    var dx = coords.x - this.dragStartX;
    var dy = coords.y - this.dragStartY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      this.hasMoved = true;
    }

    var x = coords.x - this.offsetX;
    var y = coords.y - this.offsetY;
    x = Math.max(0, Math.min(window.innerWidth - this.disc.offsetWidth, x));
    y = Math.max(0, Math.min(window.innerHeight - this.disc.offsetHeight, y));
    this.disc.style.left = x + 'px';
    this.disc.style.top = y + 'px';

    if (this.panelState !== 'closed') {
      this._syncPanelPosition();
    }
  };

  SPlayer.prototype._endDrag = function () {
    var self = this;
    if (!self.isDragging) return;
    self.isDragging = false;

    document.body.style.userSelect = 'auto';
    document.body.style.touchAction = 'auto';

    /* tap → toggle panel */
    if (!self.hasMoved && Date.now() - self.dragStartTime < 300) {
      self.disc.style.transition = 'left 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s ease';
      self._togglePanel();
      return;
    }

    /* drag → snap to edge */
    self.disc.style.transition = 'left 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s ease';
    var x = self.disc.offsetLeft;
    if (x + self.disc.offsetWidth / 2 < window.innerWidth / 2) {
      self.disc.style.left = '16px';
    } else {
      self.disc.style.left = (window.innerWidth - self.disc.offsetWidth - 16) + 'px';
    }

    if (self.panelState !== 'closed') {
      self.panel.style.transition = 'left 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), right 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)';
      self._syncPanelPosition();
      setTimeout(function () {
        self.panel.style.transition = '';
      }, 260);
    }
  };

  SPlayer.prototype._clampDiscPosition = function () {
    if (this.panelState !== 'closed') return;
    var dTop = this.disc.offsetTop;
    var dLeft = this.disc.offsetLeft;
    var dW = this.disc.offsetWidth;
    var dH = this.disc.offsetHeight;
    var margin = 8;

    var clampedTop = Math.max(margin, Math.min(dTop, window.innerHeight - dH - margin));
    var clampedLeft = Math.max(margin, Math.min(dLeft, window.innerWidth - dW - margin));

    if (clampedTop !== dTop) { this.disc.style.top = clampedTop + 'px'; }
    if (clampedLeft !== dLeft) { this.disc.style.left = clampedLeft + 'px'; }
  };

  SPlayer.prototype._applyTheme = function (mode) {
    document.body.classList.remove('splayer-light', 'splayer-dark');
    if (mode === 'light') {
      document.body.classList.add('splayer-light');
    } else if (mode === 'dark') {
      document.body.classList.add('splayer-dark');
    }
  };

  /* ============================================================
     INIT
     ============================================================ */
  SPlayer.prototype._init = function () {
    var self = this;

    /* audio events */
    self._boundAudioPlay = function () {
      self._updatePlayBtn(true);
      self._updateRotation(true);
    };
    self._boundAudioPause = function () {
      self._updatePlayBtn(false);
      self._updateRotation(false);
    };
    self._boundAudioEnded = function () {
      if (self.playlist.length) {
        if (self.playMode === 'repeat') {
          self.audio.currentTime = 0;
          self._playCurrent();
        } else {
          self.nextTrack();
        }
      }
    };
    self._boundAudioTimeUpdate = function () { self._updateProgress(); };
    self._boundAudioLoadedMeta = function () { self._updateProgress(); };

    self.audio.addEventListener('play', self._boundAudioPlay);
    self.audio.addEventListener('pause', self._boundAudioPause);
    self.audio.addEventListener('ended', self._boundAudioEnded);
    self.audio.addEventListener('timeupdate', self._boundAudioTimeUpdate);
    self.audio.addEventListener('loadedmetadata', self._boundAudioLoadedMeta);

    /* button events */
    self._boundPlayClick = function () { self.togglePlay(); };
    self._boundNextClick = function () { self.nextTrack(); };
    self._boundPrevClick = function () { self.prevTrack(); };
    self._boundModeClick = function () { self._cycleMode(); };
    self._boundPlaylistBtnClick = function (e) { e.stopPropagation(); self._togglePlaylist(); };
    self._boundPlaylistCloseClick = function (e) { e.stopPropagation(); self._hidePlaylist(); };
    self._boundPanelClick = function (e) { e.stopPropagation(); };
    self._boundOutsideClick = function (e) { self._handleOutsideClick(e); };

    self.playBtn.addEventListener('click', self._boundPlayClick);
    self.nextBtn.addEventListener('click', self._boundNextClick);
    self.prevBtn.addEventListener('click', self._boundPrevClick);
    self.modeBtn.addEventListener('click', self._boundModeClick);
    self.playlistBtn.addEventListener('click', self._boundPlaylistBtnClick);
    self.playlistClose.addEventListener('click', self._boundPlaylistCloseClick);
    self.panel.addEventListener('click', self._boundPanelClick);

    /* disc drag */
    self._boundDiscMouseDown = function (e) { self._startDrag(e); };
    self._boundWindowMouseMove = function (e) { self._doDrag(e); };
    self._boundWindowMouseUp = function () { self._endDrag(); };
    self._boundWindowMouseLeave = function () { self._endDrag(); };
    self._boundDiscTouchStart = function (e) { self._startDrag(e); };
    self._boundWindowTouchMove = function (e) { self._doDrag(e); };
    self._boundWindowTouchEnd = function () { self._endDrag(); };
    self._boundWindowTouchCancel = function () { self._endDrag(); };

    self.disc.addEventListener('mousedown', self._boundDiscMouseDown);
    window.addEventListener('mousemove', self._boundWindowMouseMove);
    window.addEventListener('mouseup', self._boundWindowMouseUp);
    window.addEventListener('mouseleave', self._boundWindowMouseLeave);
    self.disc.addEventListener('touchstart', self._boundDiscTouchStart);
    window.addEventListener('touchmove', self._boundWindowTouchMove, { passive: false });
    window.addEventListener('touchend', self._boundWindowTouchEnd);
    window.addEventListener('touchcancel', self._boundWindowTouchCancel);

    /* progress drag */
    self._boundProgressMouseDown = function (e) { self._startProgressDrag(e); };
    self._boundWindowProgressMouseMove = function (e) { self._doProgressDrag(e); };
    self._boundWindowProgressMouseUp = function () { self._endProgressDrag(); };
    self._boundProgressTouchStart = function (e) { self._startProgressDrag(e); };
    self._boundWindowProgressTouchMove = function (e) { self._doProgressDrag(e); };
    self._boundWindowProgressTouchEnd = function () { self._endProgressDrag(); };

    self.progressEl.addEventListener('mousedown', self._boundProgressMouseDown);
    window.addEventListener('mousemove', self._boundWindowProgressMouseMove);
    window.addEventListener('mouseup', self._boundWindowProgressMouseUp);
    self.progressEl.addEventListener('touchstart', self._boundProgressTouchStart, { passive: false });
    window.addEventListener('touchmove', self._boundWindowProgressTouchMove, { passive: false });
    window.addEventListener('touchend', self._boundWindowProgressTouchEnd);

    /* window resize */
    self._boundWindowResize = function () { self._clampDiscPosition(); };
    window.addEventListener('resize', self._boundWindowResize);

    /* initial load */
    if (self.playlist.length) {
      self._loadTrack(0);
    } else {
      self._setCover();
      self._setTitle('暂无歌曲');
      self.playBtn.disabled = true;
      self.nextBtn.disabled = true;
      self.prevBtn.disabled = true;
      self.modeBtn.disabled = true;
    }

    /* theme */
    self._applyTheme(self.themeMode);

    /* init UI */
    self._updateModeBtn();
    self._updatePlaylistBtnState();
    self._updatePlaylistUI();
  };

  /* ============================================================
     DESTROY (cleanup)
     ============================================================ */
  SPlayer.prototype.destroy = function () {
    var self = this;

    /* remove audio events */
    self.audio.removeEventListener('play', self._boundAudioPlay);
    self.audio.removeEventListener('pause', self._boundAudioPause);
    self.audio.removeEventListener('ended', self._boundAudioEnded);
    self.audio.removeEventListener('timeupdate', self._boundAudioTimeUpdate);
    self.audio.removeEventListener('loadedmetadata', self._boundAudioLoadedMeta);

    /* remove button events */
    self.playBtn.removeEventListener('click', self._boundPlayClick);
    self.nextBtn.removeEventListener('click', self._boundNextClick);
    self.prevBtn.removeEventListener('click', self._boundPrevClick);
    self.modeBtn.removeEventListener('click', self._boundModeClick);
    self.playlistBtn.removeEventListener('click', self._boundPlaylistBtnClick);
    self.playlistClose.removeEventListener('click', self._boundPlaylistCloseClick);
    self.panel.removeEventListener('click', self._boundPanelClick);
    document.removeEventListener('click', self._boundOutsideClick);

    /* remove disc drag events */
    self.disc.removeEventListener('mousedown', self._boundDiscMouseDown);
    window.removeEventListener('mousemove', self._boundWindowMouseMove);
    window.removeEventListener('mouseup', self._boundWindowMouseUp);
    window.removeEventListener('mouseleave', self._boundWindowMouseLeave);
    self.disc.removeEventListener('touchstart', self._boundDiscTouchStart);
    window.removeEventListener('touchmove', self._boundWindowTouchMove);
    window.removeEventListener('touchend', self._boundWindowTouchEnd);
    window.removeEventListener('touchcancel', self._boundWindowTouchCancel);

    /* remove progress drag events */
    self.progressEl.removeEventListener('mousedown', self._boundProgressMouseDown);
    window.removeEventListener('mousemove', self._boundWindowProgressMouseMove);
    window.removeEventListener('mouseup', self._boundWindowProgressMouseUp);
    self.progressEl.removeEventListener('touchstart', self._boundProgressTouchStart);
    window.removeEventListener('touchmove', self._boundWindowProgressTouchMove);
    window.removeEventListener('touchend', self._boundWindowProgressTouchEnd);

    /* remove window resize */
    window.removeEventListener('resize', self._boundWindowResize);

    /* pause audio */
    self.audio.pause();
    self.audio.src = '';

    /* remove DOM */
    if (self.disc && self.disc.parentNode) self.disc.parentNode.removeChild(self.disc);
    if (self.panel && self.panel.parentNode) self.panel.parentNode.removeChild(self.panel);
    if (self.playlistPanel && self.playlistPanel.parentNode) self.playlistPanel.parentNode.removeChild(self.playlistPanel);
  };

  /* ============================================================
     EXPORT
     ============================================================ */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPlayer;
  } else {
    window.SPlayer = SPlayer;
  }

})();