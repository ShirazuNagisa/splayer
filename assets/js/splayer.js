/**
 * splayer.js
 * 前端播放器与后台管理的 JS（包括 admin AJAX 与前端播放器交互）
 */

(function(window, document){
  'use strict';

  // global localized object from PHP: window.SPLAYER_DATA
  var DATA = window.SPLAYER_DATA || {};

  /* ---------- FRONTEND PLAYER ---------- */
  function mountPlayer(){
    if(!DATA.playlist) DATA.playlist = [];

    // root container
    var root = document.createElement('div');
    root.id = 'splayer-root';
    document.body.appendChild(root);

    // collapsed disc
    var disc = document.createElement('div');
    disc.className = 'splayer-disc';
    var discCover = document.createElement('div');
    discCover.className = 'cover';
    var img = document.createElement('img');
    img.src = DATA.playlist[0] && DATA.playlist[0].cover ? DATA.playlist[0].cover : DATA.default_cover;
    img.alt = '';
    discCover.appendChild(img);
    disc.appendChild(discCover);
    root.appendChild(disc);

    // panel
    var panel = document.createElement('div');
    panel.className = 'splayer-panel';
    panel.style.display = 'none';
    panel.innerHTML = '\
      <div class="header">\
        <div class="cover"><img src="'+ (DATA.playlist[0] && DATA.playlist[0].cover ? DATA.playlist[0].cover : DATA.default_cover) +'" /></div>\
        <div class="meta"><div class="title">SPlayer</div><div class="artist">—</div></div>\
      </div>\
      <div class="splayer-controls">\
        <button class="prev" title="上一首">⟸</button>\
        <button class="play" title="播放/暂停">▶</button>\
        <button class="next" title="下一首">⟹</button>\
        <div class="progress"><div class="fill"></div></div>\
        <select class="mode" title="播放模式">\
          <option value="order">顺序</option>\
          <option value="single">单曲循环</option>\
          <option value="shuffle">随机</option>\
        </select>\
      </div>\
      <div class="splayer-playlist"></div>\
      <div class="splayer-footer">SPlayer · 轻量播放</div>';
    root.appendChild(panel);

    // audio element
    var audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    root.appendChild(audio);

    // state
    var state = {
      playingIndex: 0,
      mode: 'order',
      playing: false
    };

    // helpers
    function renderPlaylist(){
      var listWrap = panel.querySelector('.splayer-playlist');
      listWrap.innerHTML = '';
      DATA.playlist.forEach(function(item, i){
        var it = document.createElement('div');
        it.className = 'item' + (i===state.playingIndex? ' active':'');
        it.dataset.index = i;
        it.innerHTML = '<div class="thumb"><img src="'+ (item.cover ? item.cover : DATA.default_cover) +'" /></div>\
                        <div class="info"><div class="name">'+ (item.title || ('Track '+(i+1))) +'</div>\
                        <div class="sub">'+ (item.artist||item.url) +'</div></div>';
        listWrap.appendChild(it);
        it.addEventListener('click', function(){
          loadAndPlay(parseInt(this.dataset.index,10));
        }, false);
      });
    }

    function loadAndPlay(idx){
      if (!DATA.playlist[idx]) return;
      state.playingIndex = idx;
      var track = DATA.playlist[idx];
      audio.src = track.url;
      audio.play().catch(function(){});
      state.playing = true;
      updateUI();
    }

    function updateUI(){
      // disc image
      var p = DATA.playlist[state.playingIndex] || {};
      disc.querySelector('img').src = p.cover || DATA.default_cover;
      panel.querySelector('.header .cover img').src = p.cover || DATA.default_cover;
      panel.querySelector('.meta .title').textContent = p.title || 'Track ' + (state.playingIndex+1);
      panel.querySelector('.meta .artist').textContent = p.artist || '';
      // playing class
      if(state.playing){
        disc.classList.add('playing');
        panel.querySelector('.play').textContent = '⏸';
      } else {
        disc.classList.remove('playing');
        panel.querySelector('.play').textContent = '▶';
      }
      // playlist active highlight
      var items = panel.querySelectorAll('.splayer-playlist .item');
      items.forEach(function(it){
        it.classList.remove('active');
        if (parseInt(it.dataset.index,10) === state.playingIndex) it.classList.add('active');
      });
    }

    function nextTrack(){
      if (state.mode === 'single') {
        loadAndPlay(state.playingIndex);
        return;
      }
      if (state.mode === 'shuffle') {
        var idx = Math.floor(Math.random()*DATA.playlist.length);
        loadAndPlay(idx);
        return;
      }
      // order
      var nextIdx = state.playingIndex + 1;
      if (nextIdx >= DATA.playlist.length) nextIdx = 0;
      loadAndPlay(nextIdx);
    }

    // events
    disc.addEventListener('click', function(e){
      var showing = panel.style.display !== 'none';
      panel.style.display = showing ? 'none' : 'block';
    });

    panel.querySelector('.play').addEventListener('click', function(){
      if (!audio.src) loadAndPlay(state.playingIndex);
      if (audio.paused) {
        audio.play().catch(function(){});
        state.playing = true;
      } else {
        audio.pause();
        state.playing = false;
      }
      updateUI();
    });

    panel.querySelector('.prev').addEventListener('click', function(){
      var prev = state.playingIndex - 1;
      if (prev < 0) prev = DATA.playlist.length - 1;
      loadAndPlay(prev);
    });

    panel.querySelector('.next').addEventListener('click', function(){
      nextTrack();
    });

    panel.querySelector('.mode').addEventListener('change', function(){
      state.mode = this.value;
    });

    audio.addEventListener('timeupdate', function(){
      var fill = panel.querySelector('.progress .fill');
      if (audio.duration) {
        var pct = (audio.currentTime / audio.duration) * 100;
        fill.style.width = pct + '%';
      }
    });

    audio.addEventListener('ended', function(){
      nextTrack();
    });

    // initial render
    renderPlaylist();
    updateUI();
  }

  /* ---------- ADMIN AJAX (only executed when admin context provided) ---------- */
  function adminBind(){
    if (!DATA.is_admin) return;
    var ajaxurl = DATA.ajax_url;
    var nonce = DATA.nonce;

    // helper fetch wrapper
    function send(action, payload, cb){
      payload = payload || {};
      payload.action = action;
      payload._wpnonce = nonce;
      fetch(ajaxurl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams(payload)
      }).then(function(r){ return r.json(); }).then(function(json){
        if (cb) cb(json);
      }).catch(function(err){
        console.error('SPlayer Ajax Error', err);
        if (cb) cb({ success:false, error: err });
      });
    }

    // basic bindings on admin page if present
    var container = document.getElementById('splayer-admin-root');
    if (!container) return;

    function renderForm(options){
      container.innerHTML = '\
        <div style="max-width:820px;padding:12px;">\
          <h2>SPlayer 后台管理</h2>\
          <div style="margin-top:8px;">\
            <label>GitHub 仓库（owner/repo）：</label><br/>\
            <input id="splayer-github" type="text" value="'+ (options.github_repo || '') +'" style="width:320px;padding:6px;border-radius:6px;border:1px solid #ddd" />\
            <label style="margin-left:8px"><input id="splayer-auto-update" type="checkbox" '+ (options.auto_update ? 'checked' : '') +' /> 自动更新</label>\
            <button id="splayer-check-update" style="margin-left:8px;padding:6px 10px;border-radius:6px">检查更新</button>\
            <button id="splayer-install-update" style="margin-left:6px;padding:6px 10px;border-radius:6px">下载安装最新</button>\
          </div>\
          <hr/>\
          <h3>播放列表</h3>\
          <div id="splayer-playlist-admin"></div>\
          <div style="margin-top:8px">\
            <input id="splayer-title" placeholder="歌曲标题" style="width:200px;padding:6px;border-radius:6px;border:1px solid #ddd" />\
            <input id="splayer-artist" placeholder="艺术家（可选）" style="width:180px;padding:6px;border-radius:6px;border:1px solid #ddd;margin-left:6px" />\
            <input id="splayer-url" placeholder="音频 URL" style="width:300px;padding:6px;border-radius:6px;border:1px solid #ddd;margin-left:6px" />\
            <input id="splayer-cover" placeholder="封面 URL（可选）" style="width:200px;padding:6px;border-radius:6px;border:1px solid #ddd;margin-left:6px" />\
            <button id="splayer-add" style="margin-left:6px;padding:6px 10px;border-radius:6px">添加</button>\
          </div>\
        </div>';
      renderPlaylistAdmin(options.playlist || []);
      bindAdminActions();
    }

    function renderPlaylistAdmin(list){
      var wrap = document.getElementById('splayer-playlist-admin');
      if (!wrap) return;
      wrap.innerHTML = '';
      if (!list.length) {
        wrap.innerHTML = '<div style="padding:8px;color:#666">当前歌单为空</div>';
        return;
      }
      list.forEach(function(item, i){
        var row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        row.style.padding = '6px';
        row.style.borderBottom = '1px dashed #eee';
        row.innerHTML = '<div style="width:44px;height:44px;overflow:hidden;border-radius:6px"><img src="'+ (item.cover||DATA.default_cover) +'" style="width:100%;height:100%;object-fit:cover" /></div>\
          <div style="flex:1"><strong>'+(item.title||'Untitled')+'</strong><br/><span style="opacity:.7">'+(item.artist||item.url)+'</span></div>\
          <div><button data-idx="'+i+'" class="splayer-del">删除</button></div>';
        wrap.appendChild(row);
      });
    }

    function bindAdminActions(){
      document.getElementById('splayer-add').addEventListener('click', function(){
        var title = document.getElementById('splayer-title').value.trim();
        var artist = document.getElementById('splayer-artist').value.trim();
        var url = document.getElementById('splayer-url').value.trim();
        var cover = document.getElementById('splayer-cover').value.trim();
        if (!url) { alert('音频 URL 不能为空'); return; }
        send('splayer_add_track', { title: title, artist: artist, url: url, cover: cover }, function(res){
          if (res && res.success) {
            renderPlaylistAdmin(res.data.playlist);
            // clear fields
            document.getElementById('splayer-title').value = '';
            document.getElementById('splayer-artist').value = '';
            document.getElementById('splayer-url').value = '';
            document.getElementById('splayer-cover').value = '';
          } else {
            alert('添加失败');
          }
        });
      });

      document.querySelectorAll('.splayer-del').forEach(function(btn){
        btn.addEventListener('click', function(){
          var idx = this.dataset.idx;
          if (!confirm('确认删除该曲目？')) return;
          send('splayer_remove_track', { index: idx }, function(res){
            if (res && res.success) {
              renderPlaylistAdmin(res.data.playlist);
            } else {
              alert('删除失败');
            }
          });
        });
      });

      // check update
      var checkBtn = document.getElementById('splayer-check-update');
      if (checkBtn) {
        checkBtn.addEventListener('click', function(){
          var repo = document.getElementById('splayer-github').value.trim();
          send('splayer_check_update', { repo: repo }, function(res){
            if (res && res.success) {
              alert('检查完成: ' + (res.data.message || '无新版本'));
            } else {
              alert('检查失败: ' + (res.error || '未知错误'));
            }
          });
        });
      }
      // install update
      var installBtn = document.getElementById('splayer-install-update');
      if (installBtn) {
        installBtn.addEventListener('click', function(){
          var repo = document.getElementById('splayer-github').value.trim();
          if (!confirm('将从 GitHub 下载并替换插件文件，是否继续？请确保已备份站点。')) return;
          send('splayer_install_update', { repo: repo }, function(res){
            if (res && res.success) {
              alert('更新完成：' + (res.data.message || '已安装最新'));
            } else {
              alert('更新失败：' + (res.error || '未知错误'));
            }
          });
        });
      }

      // delete bindings (rebind) — ensure future buttons attached
      var wrap = document.getElementById('splayer-playlist-admin');
      wrap.addEventListener('click', function(e){
        if (e.target && e.target.classList.contains('splayer-del')) {
          var idx = e.target.dataset.idx;
          if (!confirm('确认删除该曲目？')) return;
          send('splayer_remove_track', { index: idx }, function(res){
            if (res && res.success) {
              renderPlaylistAdmin(res.data.playlist);
            } else {
              alert('删除失败');
            }
          });
        }
      }, false);
    }

    // initial load of options
    send('splayer_get_options', {}, function(res){
      if (res && res.success) {
        renderForm(res.data);
      } else {
        document.getElementById('splayer-admin-root').innerHTML = '<div>加载失败</div>';
      }
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', function(){
    if (DATA.frontend_enabled !== false) {
      try { mountPlayer(); } catch(e){ console.error(e); }
    }
    try { adminBind(); } catch(e){ console.error(e); }
  });

})(window, document);