(function () {
  'use strict';

  if (window.__brMusicInitialized) { return; }
  window.__brMusicInitialized = true;

  var LS_KEY = 'br_music_player_v1';
  var MODES = ['list', 'one', 'shuffle'];
  var MODE_LABELS = { list: '列表循环', one: '单曲循环', shuffle: '随机播放' };
  var SAVE_INTERVAL = 3000;

  // ---------- Inline SVG icons (no icon fonts) ----------
  function svgIcon(inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' + inner + '</svg>';
  }
  var STROKE = ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    play: svgIcon('<path fill="currentColor" d="M8 5v14l11-7z"/>'),
    pause: svgIcon('<path fill="currentColor" d="M6 4h4v16H6zM14 4h4v16h-4z"/>'),
    prev: svgIcon('<path fill="currentColor" d="M6 6h2v12H6zM20 6L10 12l10 6V6z"/>'),
    next: svgIcon('<path fill="currentColor" d="M16 6h2v12h-2zM4 6l10 6-10 6V6z"/>'),
    list: svgIcon('<path' + STROKE + ' d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    shuffle: svgIcon('<path' + STROKE + ' d="M16 3h5v5"/><path' + STROKE + ' d="M4 20L21 3"/><path' + STROKE + ' d="M21 16v5h-5"/><path' + STROKE + ' d="M15 15l6 6"/><path' + STROKE + ' d="M4 4l5 5"/>'),
    repeat: svgIcon('<path' + STROKE + ' d="M17 1l4 4-4 4"/><path' + STROKE + ' d="M3 11V9a4 4 0 0 1 4-4h14"/><path' + STROKE + ' d="M7 23l-4-4 4-4"/><path' + STROKE + ' d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
    repeatOne: svgIcon('<path' + STROKE + ' d="M17 1l4 4-4 4"/><path' + STROKE + ' d="M3 11V9a4 4 0 0 1 4-4h14"/><path' + STROKE + ' d="M7 23l-4-4 4-4"/><path' + STROKE + ' d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="13" text-anchor="middle" font-size="8" font-weight="bold" fill="currentColor" stroke="none">1</text>'),
    volume: svgIcon('<path' + STROKE + ' d="M11 5L6 9H2v6h4l5 4V5z"/><path' + STROKE + ' d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'),
    muted: svgIcon('<path' + STROKE + ' d="M11 5L6 9H2v6h4l5 4V5z"/><path' + STROKE + ' d="M23 9l-6 6M17 9l6 6"/>'),
    music: svgIcon('<path' + STROKE + ' d="M9 18V5l12-2v13"/><circle' + STROKE + ' cx="6" cy="18" r="3"/><circle' + STROKE + ' cx="18" cy="16" r="3"/>')
  };

  // ---------- DOM helpers ----------
  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    return n;
  }
  function fmtTime(s) {
    if (!isFinite(s) || s < 0) { s = 0; }
    s = Math.floor(s);
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + (sec < 10 ? '0' + sec : sec);
  }

  // ---------- Playlist data ----------
  function readPlaylist() {
    var node = document.getElementById('br-music-playlist');
    if (!node) { return []; }
    try {
      var data = JSON.parse(node.textContent || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  var playlist = readPlaylist();
  var root = document.getElementById('br-music-player');

  if (!root) { return; }
  if (!playlist.length) {
    root.style.display = 'none';
    return;
  }

  // ---------- State ----------
  var DEFAULT_STATE = { id: null, time: 0, volume: 1, muted: false, mode: 'list', expanded: false };

  function loadState() {
    var s = {};
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) { s = JSON.parse(raw) || {}; }
    } catch (e) { s = {}; }
    var out = {};
    for (var k in DEFAULT_STATE) {
      out[k] = (s[k] !== undefined ? s[k] : DEFAULT_STATE[k]);
    }
    if (MODES.indexOf(out.mode) === -1) { out.mode = 'list'; }
    if (typeof out.volume !== 'number' || !isFinite(out.volume)) { out.volume = 1; }
    out.volume = Math.min(1, Math.max(0, out.volume));
    out.muted = !!out.muted;
    return out;
  }

  var state = loadState();
  state.playing = false;

  function indexOfId(id) {
    for (var i = 0; i < playlist.length; i++) {
      if (playlist[i].id === id) { return i; }
    }
    return -1;
  }

  var currentIndex = indexOfId(state.id);
  if (currentIndex === -1) { currentIndex = 0; }

  // ---------- Audio ----------
  var audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = state.muted ? 0 : state.volume;
  audio.muted = state.muted;
  var playToken = 0;

  // ---------- Build UI ----------
  root.innerHTML = '';
  root.classList.add('br-music');

  var bar = el('div', 'br-music__bar');

  var coverBtn = el('button', 'br-music__cover');
  coverBtn.type = 'button';
  coverBtn.setAttribute('aria-label', '展开播放器');
  var coverImg = el('img', 'br-music__cover-img');
  coverImg.alt = '';
  coverImg.setAttribute('aria-hidden', 'true');
  var coverFallback = el('span', 'br-music__cover-fallback');
  coverFallback.innerHTML = ICONS.music;
  coverFallback.setAttribute('aria-hidden', 'true');
  coverBtn.appendChild(coverImg);
  coverBtn.appendChild(coverFallback);

  var meta = el('div', 'br-music__meta');
  var titleEl = el('div', 'br-music__title');
  var artistEl = el('div', 'br-music__artist');
  meta.appendChild(titleEl);
  meta.appendChild(artistEl);

  var playBtn = el('button', 'br-music__btn br-music__btn--play');
  playBtn.type = 'button';
  playBtn.setAttribute('aria-label', '播放');
  playBtn.innerHTML = ICONS.play;

  var expandBtn = el('button', 'br-music__btn br-music__btn--expand');
  expandBtn.type = 'button';
  expandBtn.setAttribute('aria-label', '展开歌单');
  expandBtn.setAttribute('aria-expanded', 'false');
  expandBtn.innerHTML = ICONS.list;

  bar.appendChild(coverBtn);
  bar.appendChild(meta);
  bar.appendChild(playBtn);
  bar.appendChild(expandBtn);

  var panel = el('div', 'br-music__panel');
  panel.hidden = true;

  var progressWrap = el('div', 'br-music__progress-wrap');
  var progress = el('input', 'br-music__progress');
  progress.type = 'range';
  progress.min = '0';
  progress.max = '100';
  progress.value = '0';
  progress.step = '0.1';
  progress.setAttribute('aria-label', '播放进度');
  var timeWrap = el('div', 'br-music__times');
  var timeCur = el('span', 'br-music__time-cur');
  var timeDur = el('span', 'br-music__time-dur');
  timeCur.textContent = '0:00';
  timeDur.textContent = '--:--';
  timeWrap.appendChild(timeCur);
  timeWrap.appendChild(timeDur);
  progressWrap.appendChild(progress);
  progressWrap.appendChild(timeWrap);

  var controls = el('div', 'br-music__controls');
  var prevBtn = el('button', 'br-music__btn');
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', '上一首');
  prevBtn.innerHTML = ICONS.prev;
  var nextBtn = el('button', 'br-music__btn');
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', '下一首');
  nextBtn.innerHTML = ICONS.next;
  var modeBtn = el('button', 'br-music__btn br-music__btn--mode');
  modeBtn.type = 'button';
  modeBtn.setAttribute('aria-label', '播放模式');
  var muteBtn = el('button', 'br-music__btn');
  muteBtn.type = 'button';
  muteBtn.setAttribute('aria-label', '静音');
  muteBtn.innerHTML = ICONS.volume;
  var volRange = el('input', 'br-music__volume');
  volRange.type = 'range';
  volRange.min = '0';
  volRange.max = '1';
  volRange.step = '0.01';
  volRange.setAttribute('aria-label', '音量');

  controls.appendChild(prevBtn);
  controls.appendChild(nextBtn);
  controls.appendChild(modeBtn);
  controls.appendChild(muteBtn);
  controls.appendChild(volRange);

  var listOl = el('ol', 'br-music__playlist');

  var statusEl = el('div', 'br-music__status');
  statusEl.setAttribute('role', 'status');
  statusEl.setAttribute('aria-live', 'polite');

  panel.appendChild(progressWrap);
  panel.appendChild(controls);
  panel.appendChild(listOl);
  panel.appendChild(statusEl);

  root.appendChild(bar);
  root.appendChild(panel);

  // ---------- Playlist list ----------
  playlist.forEach(function (t, i) {
    var li = el('li', 'br-music__playlist-item');
    var b = el('button', 'br-music__playlist-btn');
    b.type = 'button';
    b.setAttribute('aria-label', t.title + ' - ' + (t.artist || 'Unknown Artist'));
    var idx = el('span', 'br-music__playlist-idx');
    idx.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
    var name = el('span', 'br-music__playlist-name');
    name.textContent = t.title;
    var art = el('span', 'br-music__playlist-artist');
    art.textContent = t.artist || 'Unknown Artist';
    b.appendChild(idx);
    b.appendChild(name);
    b.appendChild(art);
    b.addEventListener('click', function () { playTrack(i, true); });
    li.appendChild(b);
    listOl.appendChild(li);
  });

  // ---------- Update functions ----------
  function currentTrack() { return playlist[currentIndex]; }

  function updateCover() {
    var t = currentTrack();
    var url = t && t.cover ? t.cover : '';
    if (url) {
      coverImg.style.display = '';
      coverFallback.style.display = 'none';
      coverImg.onerror = function () {
        coverImg.style.display = 'none';
        coverFallback.style.display = '';
        coverImg.onerror = null;
      };
      coverImg.src = url;
    } else {
      coverImg.style.display = 'none';
      coverFallback.style.display = '';
      coverImg.removeAttribute('src');
    }
  }

  function updateMeta() {
    var t = currentTrack();
    titleEl.textContent = t.title;
    artistEl.textContent = t.artist || 'Unknown Artist';
  }

  function updateMode() {
    var icon = state.mode === 'shuffle' ? ICONS.shuffle : (state.mode === 'one' ? ICONS.repeatOne : ICONS.repeat);
    modeBtn.innerHTML = icon;
    modeBtn.setAttribute('aria-label', '播放模式：' + MODE_LABELS[state.mode] + '（点击切换）');
  }

  function updateVolumeUI() {
    volRange.value = String(state.muted ? 0 : state.volume);
    muteBtn.innerHTML = (state.muted || state.volume === 0) ? ICONS.muted : ICONS.volume;
  }

  function updatePlayBtn() {
    playBtn.innerHTML = state.playing ? ICONS.pause : ICONS.play;
    playBtn.setAttribute('aria-label', state.playing ? '暂停' : '播放');
    root.classList.toggle('br-music--playing', state.playing);
  }

  function highlightCurrent() {
    var items = listOl.querySelectorAll('.br-music__playlist-item');
    for (var i = 0; i < items.length; i++) {
      var isCur = i === currentIndex;
      items[i].classList.toggle('br-music--current', isCur);
      var btn = items[i].firstChild;
      if (isCur) { btn.setAttribute('aria-current', 'true'); }
      else { btn.removeAttribute('aria-current'); }
    }
  }

  function updateProgressUI() {
    var dur = audio.duration;
    if (isFinite(dur) && dur > 0) {
      var pct = (audio.currentTime / dur) * 100;
      progress.value = String(pct);
      timeDur.textContent = fmtTime(dur);
      timeCur.textContent = fmtTime(audio.currentTime);
    } else {
      progress.value = '0';
      timeDur.textContent = '--:--';
      timeCur.textContent = '0:00';
    }
  }

  // ---------- Persistence ----------
  var saveTimer = null;
  function saveNow() {
    var t = currentTrack();
    var data = {
      id: t ? t.id : null,
      time: isFinite(audio.currentTime) ? audio.currentTime : 0,
      volume: state.volume,
      muted: state.muted,
      mode: state.mode,
      expanded: state.expanded
    };
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function scheduleSave() {
    if (saveTimer) { return; }
    saveTimer = setTimeout(function () { saveTimer = null; saveNow(); }, SAVE_INTERVAL);
  }

  // ---------- Playback ----------
  function playTrack(index) {
    if (index < 0 || index >= playlist.length) { return; }
    currentIndex = index;
    var t = currentTrack();
    var token = ++playToken;

    updateCover();
    updateMeta();
    highlightCurrent();

    var resumeTime = 0;
    if (t.id === state.id && state.time > 0) { resumeTime = state.time; }
    else { state.time = 0; }

    audio.src = t.audio;
    audio.load();

    var p = audio.play();
    if (p && p.then) {
      p.then(function () {
        if (token !== playToken) { return; }
        state.playing = true;
        updatePlayBtn();
        if (resumeTime > 0) {
          try { audio.currentTime = resumeTime; } catch (e) {}
        }
      }).catch(function () {
        if (token !== playToken) { return; }
        state.playing = false;
        updatePlayBtn();
        setStatus('无法播放：' + t.title);
      });
    }
  }

  function togglePlay() {
    if (!currentTrack()) { return; }
    if (state.playing) {
      audio.pause();
    } else {
      var p = audio.play();
      if (p && p.then) {
        p.catch(function () { state.playing = false; updatePlayBtn(); });
      }
    }
  }

  function nextTrack() {
    if (state.mode === 'shuffle') {
      if (playlist.length <= 1) { playTrack(0); return; }
      var ni;
      do { ni = Math.floor(Math.random() * playlist.length); } while (ni === currentIndex);
      playTrack(ni);
    } else {
      playTrack((currentIndex + 1) % playlist.length);
    }
  }

  function prevTrack() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    playTrack((currentIndex - 1 + playlist.length) % playlist.length);
  }

  // ---------- Status message ----------
  var statusTimer = null;
  function setStatus(msg) {
    statusEl.textContent = msg;
    statusEl.classList.add('br-music__status--show');
    if (statusTimer) { clearTimeout(statusTimer); }
    statusTimer = setTimeout(function () {
      statusEl.classList.remove('br-music__status--show');
    }, 2500);
  }

  // ---------- Events ----------
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);

  modeBtn.addEventListener('click', function () {
    var i = MODES.indexOf(state.mode);
    state.mode = MODES[(i + 1) % MODES.length];
    updateMode();
    setStatus(MODE_LABELS[state.mode]);
    saveNow();
  });

  muteBtn.addEventListener('click', function () {
    state.muted = !state.muted;
    audio.muted = state.muted;
    if (!state.muted && state.volume === 0) { state.volume = 1; }
    audio.volume = state.volume;
    updateVolumeUI();
    saveNow();
  });

  volRange.addEventListener('input', function () {
    state.volume = parseFloat(volRange.value);
    state.muted = false;
    audio.volume = state.volume;
    audio.muted = false;
    updateVolumeUI();
    scheduleSave();
  });

  progress.addEventListener('input', function () {
    var dur = audio.duration;
    if (!isFinite(dur) || dur <= 0) { return; }
    var pct = parseFloat(progress.value);
    audio.currentTime = (pct / 100) * dur;
    timeCur.textContent = fmtTime(audio.currentTime);
  });

  function toggleExpanded() {
    state.expanded = !state.expanded;
    panel.hidden = !state.expanded;
    expandBtn.setAttribute('aria-expanded', String(state.expanded));
    coverBtn.setAttribute('aria-label', state.expanded ? '收起播放器' : '展开播放器');
    saveNow();
  }
  coverBtn.addEventListener('click', toggleExpanded);
  expandBtn.addEventListener('click', toggleExpanded);

  audio.addEventListener('timeupdate', function () {
    updateProgressUI();
    if (state.playing) { scheduleSave(); }
  });
  audio.addEventListener('loadedmetadata', updateProgressUI);
  audio.addEventListener('play', function () { state.playing = true; updatePlayBtn(); });
  audio.addEventListener('pause', function () { state.playing = false; updatePlayBtn(); saveNow(); });
  audio.addEventListener('ended', function () {
    if (state.mode === 'one') {
      audio.currentTime = 0;
      var p = audio.play();
      if (p && p.then) { p.catch(function () {}); }
    } else {
      nextTrack();
    }
  });
  audio.addEventListener('error', function () {
    var t = currentTrack();
    if (!t) { return; }
    setStatus('加载失败：' + t.title);
    if (playlist.length > 1) {
      var bad = currentIndex;
      setTimeout(function () {
        if (currentIndex === bad) { nextTrack(); }
      }, 300);
    }
  });

  window.addEventListener('beforeunload', saveNow);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { saveNow(); }
  });

  // ---------- Restore on load (no autoplay) ----------
  var idx = indexOfId(state.id);
  if (idx !== -1) { currentIndex = idx; }

  var t = currentTrack();
  if (t) {
    updateCover();
    updateMeta();
    highlightCurrent();
    audio.src = t.audio;
    audio.load();
    if (state.time > 0) {
      audio.addEventListener('loadedmetadata', function onmd() {
        audio.removeEventListener('loadedmetadata', onmd);
        try {
          if (state.time < audio.duration) { audio.currentTime = state.time; }
        } catch (e) {}
      });
    }
  }
  updateMode();
  updateVolumeUI();
  updatePlayBtn();
  updateProgressUI();
  if (state.expanded) {
    panel.hidden = false;
    expandBtn.setAttribute('aria-expanded', 'true');
  }
})();
