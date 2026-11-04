/**
 * BloomeeTunes Web - Main Application Logic
 * Audio Engine, MediaSession API, UI Router, Synced Lyrics & Library
 */

// ---------------------------------------------------------------------------
// App State
// ---------------------------------------------------------------------------
const state = {
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  originalQueue: [],
  isPlaying: false,
  isShuffle: false,
  repeatMode: 'off', // 'off' | 'all' | 'one'
  audioQuality: localStorage.getItem('bloomee_quality') || '320',
  autoplay: localStorage.getItem('bloomee_autoplay') !== 'false',
  
  // Library data
  likedSongs: JSON.parse(localStorage.getItem('bloomee_liked') || '[]'),
  history: JSON.parse(localStorage.getItem('bloomee_history') || '[]'),
  playlists: JSON.parse(localStorage.getItem('bloomee_playlists') || '[]'),

  // UI state
  activeView: 'explore',
  previousView: 'explore',
  playerTab: 'art', // 'art' | 'lyrics' | 'queue'
  searchFilter: 'all',
  
  // Synced lyrics data
  lyrics: [], // [{ time: float, text: string }]
  currentLyricIndex: -1,

  // Sleep timer
  sleepTimerTimeout: null
};

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------
const elements = {
  audio: document.getElementById('audio-engine'),
  ambientGlow: document.getElementById('ambient-glow'),
  mainContent: document.getElementById('main-content'),

  // Views
  views: {
    explore: document.getElementById('view-explore'),
    search: document.getElementById('view-search'),
    library: document.getElementById('view-library'),
    settings: document.getElementById('view-settings'),
    details: document.getElementById('view-details')
  },

  // Navigation
  navItems: document.querySelectorAll('.nav-item'),
  brandHomeBtn: document.getElementById('brand-home-btn'),
  headerSearchTrigger: document.getElementById('header-search-trigger'),
  headerSettingsBtn: document.getElementById('header-settings-btn'),

  // Explore
  exploreCarousel: document.getElementById('explore-carousel'),
  chartsList: document.getElementById('charts-list'),
  trendingTracksList: document.getElementById('trending-tracks-list'),
  featuredPlaylistsList: document.getElementById('featured-playlists-list'),
  newAlbumsList: document.getElementById('new-albums-list'),
  playAllTrending: document.getElementById('play-all-trending'),
  iosInstallBanner: document.getElementById('ios-install-banner'),
  iosBannerClose: document.getElementById('ios-banner-close'),

  // Search
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  suggestionsDropdown: document.getElementById('search-suggestions-dropdown'),
  searchFilters: document.getElementById('search-filters'),
  searchEmptyState: document.getElementById('search-empty-state'),
  searchResultsLists: document.getElementById('search-results-lists'),

  // Library
  likedCard: document.getElementById('library-liked-card'),
  likedSongsCount: document.getElementById('liked-songs-count'),
  playLikedSongsBtn: document.getElementById('play-liked-songs-btn'),
  historyCard: document.getElementById('library-history-card'),
  historySongsCount: document.getElementById('history-songs-count'),
  userPlaylistsGrid: document.getElementById('user-playlists-grid'),
  createPlaylistBtn: document.getElementById('create-playlist-btn'),

  // Details
  detailsBackBtn: document.getElementById('details-back-btn'),
  detailsCover: document.getElementById('details-cover'),
  detailsType: document.getElementById('details-type'),
  detailsTitle: document.getElementById('details-title'),
  detailsSubtitle: document.getElementById('details-subtitle'),
  detailsExtra: document.getElementById('details-extra'),
  detailsPlayAll: document.getElementById('details-play-all'),
  detailsShuffleAll: document.getElementById('details-shuffle-all'),
  detailsTracklist: document.getElementById('details-tracklist'),

  // Mini Player
  miniPlayer: document.getElementById('mini-player'),
  miniProgressFill: document.getElementById('mini-progress-fill'),
  miniPlayerExpand: document.getElementById('mini-player-expand'),
  miniCover: document.getElementById('mini-cover'),
  miniTitle: document.getElementById('mini-title'),
  miniArtist: document.getElementById('mini-artist'),
  miniLikeBtn: document.getElementById('mini-like-btn'),
  miniPlayBtn: document.getElementById('mini-play-btn'),
  miniNextBtn: document.getElementById('mini-next-btn'),

  // Full Player
  fullPlayer: document.getElementById('full-player'),
  playerDismissBtn: document.getElementById('player-dismiss-btn'),
  playerSourceName: document.getElementById('player-source-name'),
  playerTabBtns: document.querySelectorAll('.player-mode-tabs .tab-btn'),
  tabContentArt: document.getElementById('tab-content-art'),
  tabContentLyrics: document.getElementById('tab-content-lyrics'),
  tabContentQueue: document.getElementById('tab-content-queue'),
  playerCover: document.getElementById('player-cover'),
  vinylRecord: document.getElementById('vinyl-record'),
  lyricsScrollContainer: document.getElementById('lyrics-scroll-container'),
  lyricsLines: document.getElementById('lyrics-lines'),
  queueItemsList: document.getElementById('queue-items-list'),
  queueCount: document.getElementById('queue-count'),
  queueClearBtn: document.getElementById('queue-clear-btn'),
  playerTitle: document.getElementById('player-title'),
  playerArtist: document.getElementById('player-artist'),
  playerLikeBtn: document.getElementById('player-like-btn'),
  playerAddPlaylistBtn: document.getElementById('player-add-playlist-btn'),
  playerScrubber: document.getElementById('player-scrubber'),
  playerTimeCurrent: document.getElementById('player-time-current'),
  playerTimeTotal: document.getElementById('player-time-total'),
  playerShuffleBtn: document.getElementById('player-shuffle-btn'),
  playerPrevBtn: document.getElementById('player-prev-btn'),
  playerPlayBtn: document.getElementById('player-play-btn'),
  playerNextBtn: document.getElementById('player-next-btn'),
  playerRepeatBtn: document.getElementById('player-repeat-btn'),
  repeatOneIndicator: document.querySelector('.repeat-one-indicator'),
  playerQualityBadge: document.getElementById('player-quality-badge'),

  // Settings
  settingQuality: document.getElementById('setting-quality'),
  settingAutoplay: document.getElementById('setting-autoplay'),
  settingSleepTimer: document.getElementById('setting-sleep-timer'),
  sleepTimerDesc: document.getElementById('sleep-timer-desc'),

  // Modals & Toast
  playlistModal: document.getElementById('playlist-modal'),
  playlistModalTitle: document.getElementById('playlist-modal-title'),
  playlistModalBody: document.getElementById('playlist-modal-body'),
  newPlaylistInput: document.getElementById('new-playlist-input'),
  saveNewPlaylistBtn: document.getElementById('save-new-playlist-btn'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  toast: document.getElementById('toast')
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatSeconds(secs) {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  clearTimeout(elements.toast._timer);
  elements.toast._timer = setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2400);
}

function saveLibrary() {
  localStorage.setItem('bloomee_liked', JSON.stringify(state.likedSongs));
  localStorage.setItem('bloomee_history', JSON.stringify(state.history));
  localStorage.setItem('bloomee_playlists', JSON.stringify(state.playlists));
  updateLibraryUI();
}

function isTrackLiked(trackId) {
  return state.likedSongs.some(t => t.id === trackId);
}

function toggleLikeTrack(track) {
  if (!track) return;
  const index = state.likedSongs.findIndex(t => t.id === track.id);
  if (index >= 0) {
    state.likedSongs.splice(index, 1);
    showToast('Removed from Liked Songs');
  } else {
    state.likedSongs.unshift(track);
    showToast('Added to Liked Songs');
  }
  saveLibrary();
  updateLikeButtons();
}

function updateLikeButtons() {
  if (!state.currentTrack) return;
  const liked = isTrackLiked(state.currentTrack.id);
  elements.miniLikeBtn.classList.toggle('liked', liked);
  elements.playerLikeBtn.classList.toggle('liked', liked);
}

function addToHistory(track) {
  if (!track) return;
  state.history = state.history.filter(t => t.id !== track.id);
  state.history.unshift(track);
  if (state.history.length > 50) state.history.pop();
  saveLibrary();
}

// ---------------------------------------------------------------------------
// Audio Engine & Playback
// ---------------------------------------------------------------------------
function getStreamUrlForTrack(track) {
  if (!track) return null;
  // If we have stream variants (320, 160, 96), pick based on user quality setting
  const quality = state.audioQuality || '320';
  const rawUrl = track.streams?.[quality] ||
                 track.streams?.['320'] ||
                 track.streams?.['160'] ||
                 track.stream_url;

  if (!rawUrl) return null;
  // Proxy through /api/stream with proper Range headers for iOS Safari
  return `/api/stream?url=${encodeURIComponent(rawUrl)}`;
}

async function playTrack(track, fromQueue = false) {
  if (!track) return;

  state.currentTrack = track;
  addToHistory(track);

  // If track was not played from existing queue, update queue
  if (!fromQueue) {
    state.queue = [track];
    state.queueIndex = 0;
    state.originalQueue = [track];
  }

  const streamUrl = getStreamUrlForTrack(track);
  if (!streamUrl) {
    showToast('Stream URL unavailable for this track');
    return;
  }

  elements.audio.src = streamUrl;
  elements.audio.load();

  try {
    await elements.audio.play();
    state.isPlaying = true;
  } catch (err) {
    console.error('Audio play error:', err);
    state.isPlaying = false;
  }

  updatePlayerUI();
  updateQueueUI();
  fetchAndRenderLyrics(track);
  setupMediaSession(track);
}

function playQueue(tracks, startIndex = 0, sourceName = 'Queue') {
  if (!tracks || !tracks.length) return;
  state.queue = [...tracks];
  state.originalQueue = [...tracks];
  state.queueIndex = startIndex;
  elements.playerSourceName.textContent = sourceName;

  if (state.isShuffle) {
    shuffleQueue(startIndex);
  } else {
    playTrack(state.queue[state.queueIndex], true);
  }
}

function togglePlayPause() {
  if (!state.currentTrack && state.queue.length > 0) {
    playTrack(state.queue[0], true);
    return;
  }
  if (!state.currentTrack) return;

  if (elements.audio.paused) {
    elements.audio.play().then(() => {
      state.isPlaying = true;
      updatePlayPauseIcons();
    }).catch(console.error);
  } else {
    elements.audio.pause();
    state.isPlaying = false;
    updatePlayPauseIcons();
  }
}

function playNextTrack() {
  if (!state.queue.length) return;

  if (state.repeatMode === 'one') {
    elements.audio.currentTime = 0;
    elements.audio.play();
    return;
  }

  if (state.queueIndex + 1 < state.queue.length) {
    state.queueIndex++;
    playTrack(state.queue[state.queueIndex], true);
  } else if (state.repeatMode === 'all') {
    state.queueIndex = 0;
    playTrack(state.queue[0], true);
  } else if (state.autoplay && state.currentTrack) {
    fetchAutoplayRecommendations(state.currentTrack.id);
  } else {
    showToast('End of queue');
    state.isPlaying = false;
    updatePlayPauseIcons();
  }
}

function playPrevTrack() {
  if (!state.queue.length) return;

  // If track has been playing for more than 3 seconds, restart it
  if (elements.audio.currentTime > 3) {
    elements.audio.currentTime = 0;
    return;
  }

  if (state.queueIndex > 0) {
    state.queueIndex--;
    playTrack(state.queue[state.queueIndex], true);
  } else {
    elements.audio.currentTime = 0;
  }
}

function toggleShuffle() {
  state.isShuffle = !state.isShuffle;
  elements.playerShuffleBtn.classList.toggle('active', state.isShuffle);

  if (state.isShuffle && state.queue.length > 1) {
    shuffleQueue(state.queueIndex);
    showToast('Shuffle ON');
  } else {
    unshuffleQueue();
    showToast('Shuffle OFF');
  }
  updateQueueUI();
}

function shuffleQueue(keepIndex) {
  const current = state.queue[keepIndex];
  const others = state.queue.filter((_, idx) => idx !== keepIndex);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  state.queue = [current, ...others];
  state.queueIndex = 0;
}

function unshuffleQueue() {
  if (!state.currentTrack) return;
  state.queue = [...state.originalQueue];
  state.queueIndex = state.queue.findIndex(t => t.id === state.currentTrack.id);
  if (state.queueIndex === -1) state.queueIndex = 0;
}

function toggleRepeat() {
  if (state.repeatMode === 'off') {
    state.repeatMode = 'all';
    elements.playerRepeatBtn.classList.add('active');
    elements.repeatOneIndicator.classList.add('hidden');
    showToast('Repeat ALL');
  } else if (state.repeatMode === 'all') {
    state.repeatMode = 'one';
    elements.playerRepeatBtn.classList.add('active');
    elements.repeatOneIndicator.classList.remove('hidden');
    showToast('Repeat ONE');
  } else {
    state.repeatMode = 'off';
    elements.playerRepeatBtn.classList.remove('active');
    elements.repeatOneIndicator.classList.add('hidden');
    showToast('Repeat OFF');
  }
}

async function fetchAutoplayRecommendations(trackId) {
  showToast('Playing next from Bloomee Flow...');
  try {
    const res = await fetch(`/api/recommendations?id=${trackId}`);
    const data = await res.json();
    if (data.success && data.recommendations?.length > 0) {
      // Add fresh recommendations to queue
      const existingIds = new Set(state.queue.map(t => t.id));
      const fresh = data.recommendations.filter(t => !existingIds.has(t.id));
      if (fresh.length > 0) {
        state.queue.push(...fresh);
        state.originalQueue.push(...fresh);
        state.queueIndex++;
        playTrack(state.queue[state.queueIndex], true);
      }
    }
  } catch (err) {
    console.error('Autoplay recommendations error:', err);
  }
}

// ---------------------------------------------------------------------------
// MediaSession API (iOS Lock Screen & Control Center)
// ---------------------------------------------------------------------------
function setupMediaSession(track) {
  if (!('mediaSession' in navigator) || !track) return;

  const artworkUrl = track.image || '/assets/BloomeeLogoFG.png';

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album || 'Bloomee',
    artwork: [
      { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '384x384', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }
    ]
  });

  navigator.mediaSession.setActionHandler('play', () => {
    elements.audio.play();
    state.isPlaying = true;
    updatePlayPauseIcons();
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    elements.audio.pause();
    state.isPlaying = false;
    updatePlayPauseIcons();
  });

  navigator.mediaSession.setActionHandler('previoustrack', () => playPrevTrack());
  navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());

  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime != null && !isNaN(details.seekTime)) {
      elements.audio.currentTime = details.seekTime;
      updateScrubberPosition();
    }
  });

  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    const skip = details.seekOffset || 10;
    elements.audio.currentTime = Math.max(elements.audio.currentTime - skip, 0);
  });

  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    const skip = details.seekOffset || 10;
    elements.audio.currentTime = Math.min(elements.audio.currentTime + skip, elements.audio.duration || 0);
  });
}

function updateMediaSessionPosition() {
  if (!('mediaSession' in navigator) || !elements.audio.duration) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: elements.audio.duration,
      playbackRate: elements.audio.playbackRate || 1,
      position: elements.audio.currentTime || 0
    });
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// Audio Element Event Listeners
// ---------------------------------------------------------------------------
elements.audio.addEventListener('play', () => {
  state.isPlaying = true;
  updatePlayPauseIcons();
  elements.vinylRecord.style.animationPlayState = 'running';
});

elements.audio.addEventListener('pause', () => {
  state.isPlaying = false;
  updatePlayPauseIcons();
  elements.vinylRecord.style.animationPlayState = 'paused';
});

elements.audio.addEventListener('timeupdate', () => {
  updateScrubberPosition();
  syncLyricsToPlayback(elements.audio.currentTime);
  updateMediaSessionPosition();
});

elements.audio.addEventListener('loadedmetadata', () => {
  const dur = elements.audio.duration;
  elements.playerScrubber.max = dur;
  elements.playerTimeTotal.textContent = formatSeconds(dur);
});

elements.audio.addEventListener('ended', () => {
  playNextTrack();
});

elements.audio.addEventListener('error', (e) => {
  console.error('Audio playback error:', e);
  showToast('Playback error. Trying next stream...');
  setTimeout(() => playNextTrack(), 1000);
});

// ---------------------------------------------------------------------------
// Scrubber & Sliders
// ---------------------------------------------------------------------------
function updateScrubberPosition() {
  const cur = elements.audio.currentTime || 0;
  const dur = elements.audio.duration || 1;
  const pct = (cur / dur) * 100;

  elements.playerScrubber.value = cur;
  elements.playerTimeCurrent.textContent = formatSeconds(cur);
  elements.miniProgressFill.style.width = `${pct}%`;

  // Gradient fill on slider track
  elements.playerScrubber.style.background = `linear-gradient(to right, #ec4899 0%, #8b5cf6 ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`;
}

elements.playerScrubber.addEventListener('input', () => {
  const seekTo = parseFloat(elements.playerScrubber.value);
  elements.playerTimeCurrent.textContent = formatSeconds(seekTo);
});

elements.playerScrubber.addEventListener('change', () => {
  const seekTo = parseFloat(elements.playerScrubber.value);
  elements.audio.currentTime = seekTo;
});

// ---------------------------------------------------------------------------
// Player UI Synchronization
// ---------------------------------------------------------------------------
function updatePlayPauseIcons() {
  const isPlaying = state.isPlaying;

  // Mini player
  elements.miniPlayBtn.querySelector('.play-icon').classList.toggle('hidden', isPlaying);
  elements.miniPlayBtn.querySelector('.pause-icon').classList.toggle('hidden', !isPlaying);

  // Full player
  elements.playerPlayBtn.querySelector('.play-icon').classList.toggle('hidden', isPlaying);
  elements.playerPlayBtn.querySelector('.pause-icon').classList.toggle('hidden', !isPlaying);
}

function updatePlayerUI() {
  const track = state.currentTrack;
  if (!track) return;

  // Reveal mini player if hidden
  elements.miniPlayer.classList.remove('hidden');

  // Mini Player
  elements.miniCover.src = track.image;
  elements.miniTitle.textContent = track.title;
  elements.miniArtist.textContent = track.artist;

  // Full Player
  elements.playerCover.src = track.image;
  elements.playerTitle.textContent = track.title;
  elements.playerArtist.textContent = track.artist;
  elements.playerQualityBadge.textContent = `${state.audioQuality} KBPS AAC`;

  updatePlayPauseIcons();
  updateLikeButtons();

  // Highlight active track in lists
  document.querySelectorAll('.track-tile').forEach(tile => {
    tile.classList.toggle('active', tile.dataset.id === track.id);
  });
}

function updateQueueUI() {
  elements.queueCount.textContent = state.queue.length;
  elements.queueItemsList.innerHTML = '';

  state.queue.forEach((track, idx) => {
    const isCurrent = idx === state.queueIndex;
    const item = document.createElement('div');
    item.className = `track-tile ${isCurrent ? 'active' : ''}`;
    item.innerHTML = `
      <div class="track-thumb-wrap">
        <img class="track-thumb" src="${track.image}" alt="">
        ${isCurrent ? '<div class="track-playing-eq"><span></span><span></span><span></span></div>' : ''}
      </div>
      <div class="track-info">
        <div class="track-title">${track.title}</div>
        <div class="track-meta">${track.artist}</div>
      </div>
      <div class="track-duration">${formatSeconds(track.duration)}</div>
      <button class="track-btn remove-queue-btn" title="Remove from queue">✕</button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-queue-btn')) {
        e.stopPropagation();
        removeFromQueue(idx);
        return;
      }
      state.queueIndex = idx;
      playTrack(state.queue[idx], true);
    });

    elements.queueItemsList.appendChild(item);
  });
}

function removeFromQueue(index) {
  if (index === state.queueIndex) {
    playNextTrack();
  }
  state.queue.splice(index, 1);
  if (index < state.queueIndex) state.queueIndex--;
  updateQueueUI();
}

elements.queueClearBtn.addEventListener('click', () => {
  if (state.currentTrack) {
    state.queue = [state.currentTrack];
    state.queueIndex = 0;
  } else {
    state.queue = [];
    state.queueIndex = -1;
  }
  updateQueueUI();
  showToast('Queue cleared');
});

// ---------------------------------------------------------------------------
// Synced Lyrics
// ---------------------------------------------------------------------------
function parseLRC(lrcText) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const time = minutes * 60 + seconds + millis / 1000;
      const text = line.replace(timeRegex, '').trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

async function fetchAndRenderLyrics(track) {
  state.lyrics = [];
  state.currentLyricIndex = -1;
  elements.lyricsLines.innerHTML = '<div class="lyrics-loading">Searching lyrics...</div>';

  try {
    const query = new URLSearchParams({
      title: track.title,
      artist: track.artist,
      duration: track.duration || ''
    });
    const res = await fetch(`/api/lyrics?${query.toString()}`);
    const data = await res.json();

    if (data.synced) {
      state.lyrics = parseLRC(data.synced);
      renderSyncedLyrics();
    } else if (data.plain) {
      renderPlainLyrics(data.plain);
    } else {
      elements.lyricsLines.innerHTML = '<div class="lyrics-loading">No lyrics available for this song.</div>';
    }
  } catch (err) {
    elements.lyricsLines.innerHTML = '<div class="lyrics-loading">Could not load lyrics.</div>';
  }
}

function renderSyncedLyrics() {
  elements.lyricsLines.innerHTML = '';
  state.lyrics.forEach((item, index) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'lyric-line';
    lineEl.textContent = item.text;
    lineEl.dataset.index = index;

    lineEl.addEventListener('click', () => {
      elements.audio.currentTime = item.time;
      elements.audio.play();
    });

    elements.lyricsLines.appendChild(lineEl);
  });
}

function renderPlainLyrics(text) {
  elements.lyricsLines.innerHTML = '';
  const lines = text.split('\n');
  lines.forEach(l => {
    if (!l.trim()) return;
    const lineEl = document.createElement('div');
    lineEl.className = 'lyric-line static';
    lineEl.textContent = l;
    elements.lyricsLines.appendChild(lineEl);
  });
}

function syncLyricsToPlayback(currentTime) {
  if (!state.lyrics.length) return;

  // Find line with time <= currentTime
  let activeIndex = -1;
  for (let i = 0; i < state.lyrics.length; i++) {
    if (currentTime >= state.lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  if (activeIndex !== state.currentLyricIndex && activeIndex >= 0) {
    state.currentLyricIndex = activeIndex;

    const lineElements = elements.lyricsLines.querySelectorAll('.lyric-line');
    lineElements.forEach((el, idx) => {
      el.classList.toggle('active', idx === activeIndex);
    });

    // Auto-scroll active line to center
    const activeEl = lineElements[activeIndex];
    if (activeEl && elements.lyricsScrollContainer) {
      const containerHeight = elements.lyricsScrollContainer.clientHeight;
      const elOffset = activeEl.offsetTop;
      const elHeight = activeEl.clientHeight;
      elements.lyricsScrollContainer.scrollTo({
        top: elOffset - containerHeight / 2 + elHeight / 2,
        behavior: 'smooth'
      });
    }
  }
}

// ---------------------------------------------------------------------------
// View Router & Navigation
// ---------------------------------------------------------------------------
function navigateTo(viewName) {
  if (state.activeView === viewName) return;

  state.previousView = state.activeView;
  state.activeView = viewName;

  Object.keys(elements.views).forEach(key => {
    elements.views[key].classList.toggle('active', key === viewName);
  });

  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  elements.mainContent.scrollTo({ top: 0, behavior: 'smooth' });
}

elements.navItems.forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.view));
});

elements.brandHomeBtn.addEventListener('click', () => navigateTo('explore'));
elements.headerSearchTrigger.addEventListener('click', () => {
  navigateTo('search');
  elements.searchInput.focus();
});
elements.headerSettingsBtn.addEventListener('click', () => navigateTo('settings'));
elements.detailsBackBtn.addEventListener('click', () => navigateTo(state.previousView || 'explore'));

// ---------------------------------------------------------------------------
// Mini Player & Full Player Controls
// ---------------------------------------------------------------------------
elements.miniPlayerExpand.addEventListener('click', () => {
  elements.fullPlayer.classList.remove('hidden');
});

elements.playerDismissBtn.addEventListener('click', () => {
  elements.fullPlayer.classList.add('hidden');
});

// Tab Switcher in Full Player
elements.playerTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    state.playerTab = tab;

    elements.playerTabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    elements.tabContentArt.classList.toggle('active', tab === 'art');
    elements.tabContentLyrics.classList.toggle('active', tab === 'lyrics');
    elements.tabContentQueue.classList.toggle('active', tab === 'queue');
  });
});

elements.miniPlayBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  togglePlayPause();
});

elements.playerPlayBtn.addEventListener('click', togglePlayPause);
elements.miniNextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  playNextTrack();
});

elements.playerNextBtn.addEventListener('click', playNextTrack);
elements.playerPrevBtn.addEventListener('click', playPrevTrack);
elements.playerShuffleBtn.addEventListener('click', toggleShuffle);
elements.playerRepeatBtn.addEventListener('click', toggleRepeat);

elements.miniLikeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleLikeTrack(state.currentTrack);
});

elements.playerLikeBtn.addEventListener('click', () => {
  toggleLikeTrack(state.currentTrack);
});

// ---------------------------------------------------------------------------
// UI Component Builders (Track Tiles, Cards)
// ---------------------------------------------------------------------------
function createTrackTile(track, onPlay) {
  const tile = document.createElement('div');
  tile.className = `track-tile ${state.currentTrack?.id === track.id ? 'active' : ''}`;
  tile.dataset.id = track.id;

  const isLiked = isTrackLiked(track.id);

  tile.innerHTML = `
    <div class="track-thumb-wrap">
      <img class="track-thumb" src="${track.image}" alt="" loading="lazy">
      ${state.currentTrack?.id === track.id && state.isPlaying ? '<div class="track-playing-eq"><span></span><span></span><span></span></div>' : ''}
    </div>
    <div class="track-info">
      <div class="track-title">${track.title}</div>
      <div class="track-meta">${track.artist}</div>
    </div>
    <div class="track-duration">${formatSeconds(track.duration)}</div>
    <div class="track-actions">
      <button class="track-btn track-like-btn ${isLiked ? 'liked' : ''}" title="Favorite" aria-label="Favorite">
        <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
      </button>
      <button class="track-btn track-add-btn" title="Add to Playlist" aria-label="Add to Playlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
  `;

  tile.addEventListener('click', (e) => {
    if (e.target.closest('.track-like-btn')) {
      toggleLikeTrack(track);
      tile.querySelector('.track-like-btn').classList.toggle('liked', isTrackLiked(track.id));
      return;
    }
    if (e.target.closest('.track-add-btn')) {
      openAddToPlaylistModal(track);
      return;
    }
    if (onPlay) onPlay(track);
  });

  return tile;
}

function createMediaCard(item, onClick) {
  const card = document.createElement('div');
  card.className = 'media-card';
  card.innerHTML = `
    <div class="media-card-thumb-wrap">
      <img class="media-card-img" src="${item.image}" alt="" loading="lazy">
      <div class="card-play-overlay">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
      </div>
    </div>
    <div class="media-card-title">${item.title}</div>
    <div class="media-card-subtitle">${item.subtitle || item.artist || ''}</div>
  `;
  card.addEventListener('click', () => onClick(item));
  return card;
}

// ---------------------------------------------------------------------------
// Explore Screen Initialization & Data Fetching
// ---------------------------------------------------------------------------
async function loadExploreData() {
  try {
    const res = await fetch('/api/home');
    const data = await res.json();
    if (!data.success) return;

    // 1. Featured Carousel
    renderCarousel(data.charts.slice(0, 3).concat(data.featuredPlaylists.slice(0, 2)));

    // 2. Top Charts
    elements.chartsList.innerHTML = '';
    data.charts.forEach(chart => {
      elements.chartsList.appendChild(createMediaCard(chart, () => loadDetailsView('chart', chart.id)));
    });

    // 3. Trending Tracks
    elements.trendingTracksList.innerHTML = '';
    data.trendingSongs.forEach((track, idx) => {
      elements.trendingTracksList.appendChild(
        createTrackTile(track, () => playQueue(data.trendingSongs, idx, 'Trending'))
      );
    });

    // Play All Trending
    elements.playAllTrending.onclick = () => {
      if (data.trendingSongs.length > 0) {
        playQueue(data.trendingSongs, 0, 'Trending');
      }
    };

    // 4. Featured Playlists
    elements.featuredPlaylistsList.innerHTML = '';
    data.featuredPlaylists.forEach(playlist => {
      elements.featuredPlaylistsList.appendChild(
        createMediaCard(playlist, () => loadDetailsView('playlist', playlist.id))
      );
    });

    // 5. New Albums
    elements.newAlbumsList.innerHTML = '';
    data.newAlbums.forEach(album => {
      elements.newAlbumsList.appendChild(
        createMediaCard(album, () => loadDetailsView('album', album.id))
      );
    });

  } catch (err) {
    console.error('Failed to load explore data:', err);
  }
}

function renderCarousel(items) {
  elements.exploreCarousel.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.innerHTML = `
      <img class="carousel-bg" src="${item.image}" alt="">
      <div class="carousel-overlay">
        <span class="carousel-tag">${item.type || 'Featured'}</span>
        <h2 class="carousel-title">${item.title}</h2>
        <p class="carousel-desc">${item.subtitle || 'Tap to listen now on Bloomee'}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      loadDetailsView(item.type || 'playlist', item.id);
    });
    elements.exploreCarousel.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Details View (Album / Playlist / Chart / Liked Songs / History)
// ---------------------------------------------------------------------------
let currentDetailsTracks = [];

async function loadDetailsView(type, id) {
  navigateTo('details');
  elements.detailsTracklist.innerHTML = '<div class="lyrics-loading">Loading songs...</div>';
  currentDetailsTracks = [];

  if (type === 'liked') {
    elements.detailsCover.src = '/assets/BloomeeLogoFG.png';
    elements.detailsType.textContent = 'Collection';
    elements.detailsTitle.textContent = 'Liked Songs';
    elements.detailsSubtitle.textContent = `${state.likedSongs.length} favorite songs`;
    elements.detailsExtra.textContent = 'Saved in local library';
    currentDetailsTracks = [...state.likedSongs];
    renderDetailsTracklist('Liked Songs');
    return;
  }

  if (type === 'history') {
    elements.detailsCover.src = '/assets/BloomeeLogoFG.png';
    elements.detailsType.textContent = 'History';
    elements.detailsTitle.textContent = 'Recently Played';
    elements.detailsSubtitle.textContent = `${state.history.length} songs`;
    elements.detailsExtra.textContent = 'Playback history';
    currentDetailsTracks = [...state.history];
    renderDetailsTracklist('Recently Played');
    return;
  }

  if (type === 'user_playlist') {
    const pl = state.playlists.find(p => p.id === id);
    if (!pl) return;
    elements.detailsCover.src = pl.image || '/assets/BloomeeLogoFG.png';
    elements.detailsType.textContent = 'Custom Playlist';
    elements.detailsTitle.textContent = pl.name;
    elements.detailsSubtitle.textContent = `${pl.tracks.length} tracks`;
    elements.detailsExtra.textContent = 'User Created';
    currentDetailsTracks = [...pl.tracks];
    renderDetailsTracklist(pl.name);
    return;
  }

  try {
    const endpoint = type === 'album' ? `/api/album/${id}` : `/api/playlist/${id}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    const item = data.album || data.playlist;

    if (!item) {
      elements.detailsTracklist.innerHTML = '<div class="lyrics-loading">No songs found.</div>';
      return;
    }

    elements.detailsCover.src = item.image;
    elements.detailsType.textContent = type.toUpperCase();
    elements.detailsTitle.textContent = item.title;
    elements.detailsSubtitle.textContent = item.artist || item.subtitle || '';
    elements.detailsExtra.textContent = `${item.count} tracks`;

    currentDetailsTracks = item.songs || [];
    renderDetailsTracklist(item.title);
  } catch (err) {
    elements.detailsTracklist.innerHTML = '<div class="lyrics-loading">Failed to load content.</div>';
  }
}

function renderDetailsTracklist(sourceName) {
  elements.detailsTracklist.innerHTML = '';
  if (!currentDetailsTracks.length) {
    elements.detailsTracklist.innerHTML = '<div class="lyrics-loading">No songs in this list yet.</div>';
    return;
  }

  currentDetailsTracks.forEach((track, idx) => {
    elements.detailsTracklist.appendChild(
      createTrackTile(track, () => playQueue(currentDetailsTracks, idx, sourceName))
    );
  });

  elements.detailsPlayAll.onclick = () => {
    playQueue(currentDetailsTracks, 0, sourceName);
  };

  elements.detailsShuffleAll.onclick = () => {
    state.isShuffle = true;
    elements.playerShuffleBtn.classList.add('active');
    playQueue(currentDetailsTracks, Math.floor(Math.random() * currentDetailsTracks.length), sourceName);
  };
}

// ---------------------------------------------------------------------------
// Search & Suggestions
// ---------------------------------------------------------------------------
let searchDebounceTimer = null;

elements.searchInput.addEventListener('input', () => {
  const q = elements.searchInput.value.trim();
  elements.searchClearBtn.classList.toggle('hidden', !q);

  clearTimeout(searchDebounceTimer);
  if (!q) {
    elements.suggestionsDropdown.classList.add('hidden');
    elements.searchEmptyState.classList.remove('hidden');
    elements.searchResultsLists.classList.add('hidden');
    return;
  }

  searchDebounceTimer = setTimeout(() => {
    fetchSuggestions(q);
    executeSearch(q);
  }, 250);
});

elements.searchClearBtn.addEventListener('click', () => {
  elements.searchInput.value = '';
  elements.searchClearBtn.classList.add('hidden');
  elements.suggestionsDropdown.classList.add('hidden');
  elements.searchEmptyState.classList.remove('hidden');
  elements.searchResultsLists.classList.add('hidden');
  elements.searchInput.focus();
});

async function fetchSuggestions(query) {
  try {
    const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.success || !data.suggestions?.length) {
      elements.suggestionsDropdown.classList.add('hidden');
      return;
    }

    elements.suggestionsDropdown.innerHTML = '';
    data.suggestions.slice(0, 6).forEach(item => {
      const el = document.createElement('div');
      el.className = 'suggestion-item';
      el.innerHTML = `
        <img class="suggestion-thumb" src="${item.image}" alt="">
        <div class="suggestion-text">
          <span class="suggestion-title">${item.title}</span>
          <span class="suggestion-sub">${item.subtitle}</span>
        </div>
      `;
      el.addEventListener('click', () => {
        elements.suggestionsDropdown.classList.add('hidden');
        elements.searchInput.value = item.title;
        executeSearch(item.title);
      });
      elements.suggestionsDropdown.appendChild(el);
    });

    elements.suggestionsDropdown.classList.remove('hidden');
  } catch (err) {
    elements.suggestionsDropdown.classList.add('hidden');
  }
}

async function executeSearch(query) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.success) return;

    elements.searchEmptyState.classList.add('hidden');
    elements.searchResultsLists.classList.remove('hidden');
    renderSearchResults(data);
  } catch (err) {
    console.error('Search error:', err);
  }
}

function renderSearchResults(data) {
  elements.searchResultsLists.innerHTML = '';

  const filter = state.searchFilter;

  // Songs
  if ((filter === 'all' || filter === 'songs') && data.songs?.length) {
    const block = document.createElement('div');
    block.className = 'section-block';
    block.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Songs</h2>
      </div>
      <div class="track-list" id="search-songs-list"></div>
    `;
    const list = block.querySelector('#search-songs-list');
    data.songs.forEach((track, idx) => {
      list.appendChild(createTrackTile(track, () => playQueue(data.songs, idx, 'Search')));
    });
    elements.searchResultsLists.appendChild(block);
  }

  // Albums
  if ((filter === 'all' || filter === 'albums') && data.albums?.length) {
    const block = document.createElement('div');
    block.className = 'section-block';
    block.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Albums</h2>
      </div>
      <div class="horizontal-scroll" id="search-albums-list"></div>
    `;
    const list = block.querySelector('#search-albums-list');
    data.albums.forEach(album => {
      list.appendChild(createMediaCard(album, () => loadDetailsView('album', album.id)));
    });
    elements.searchResultsLists.appendChild(block);
  }

  // Playlists
  if ((filter === 'all' || filter === 'playlists') && data.playlists?.length) {
    const block = document.createElement('div');
    block.className = 'section-block';
    block.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Playlists</h2>
      </div>
      <div class="horizontal-scroll" id="search-playlists-list"></div>
    `;
    const list = block.querySelector('#search-playlists-list');
    data.playlists.forEach(pl => {
      list.appendChild(createMediaCard(pl, () => loadDetailsView('playlist', pl.id)));
    });
    elements.searchResultsLists.appendChild(block);
  }

  // Artists
  if ((filter === 'all' || filter === 'artists') && data.artists?.length) {
    const block = document.createElement('div');
    block.className = 'section-block';
    block.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Artists</h2>
      </div>
      <div class="horizontal-scroll" id="search-artists-list"></div>
    `;
    const list = block.querySelector('#search-artists-list');
    data.artists.forEach(art => {
      list.appendChild(createMediaCard(art, () => loadDetailsView('artist', art.id)));
    });
    elements.searchResultsLists.appendChild(block);
  }
}

// Search Filter Pills
elements.searchFilters.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    elements.searchFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.searchFilter = pill.dataset.filter;
    const q = elements.searchInput.value.trim();
    if (q) executeSearch(q);
  });
});

// ---------------------------------------------------------------------------
// Library & Custom Playlists
// ---------------------------------------------------------------------------
function updateLibraryUI() {
  elements.likedSongsCount.textContent = `${state.likedSongs.length} songs`;
  elements.historySongsCount.textContent = `${state.history.length} songs`;

  elements.userPlaylistsGrid.innerHTML = '';
  state.playlists.forEach(pl => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.innerHTML = `
      <div class="media-card-thumb-wrap">
        <img class="media-card-img" src="${pl.image || '/assets/BloomeeLogoFG.png'}" alt="">
        <div class="card-play-overlay">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
        </div>
      </div>
      <div class="media-card-title">${pl.name}</div>
      <div class="media-card-subtitle">${pl.tracks.length} tracks</div>
    `;
    card.addEventListener('click', () => loadDetailsView('user_playlist', pl.id));
    elements.userPlaylistsGrid.appendChild(card);
  });
}

elements.likedCard.addEventListener('click', () => loadDetailsView('liked'));
elements.historyCard.addEventListener('click', () => loadDetailsView('history'));
elements.playLikedSongsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (state.likedSongs.length > 0) {
    playQueue(state.likedSongs, 0, 'Liked Songs');
  } else {
    showToast('No liked songs yet');
  }
});

// Create Playlist Modal
elements.createPlaylistBtn.addEventListener('click', () => {
  elements.playlistModalTitle.textContent = 'Create New Playlist';
  elements.playlistModalBody.innerHTML = `
    <input type="text" id="new-playlist-input" placeholder="Playlist Name" class="modal-input" maxlength="40">
    <button class="modal-action-btn" id="save-new-playlist-btn">Create Playlist</button>
  `;
  elements.playlistModal.classList.remove('hidden');

  const input = document.getElementById('new-playlist-input');
  const btn = document.getElementById('save-new-playlist-btn');
  input.focus();

  btn.onclick = () => {
    const name = input.value.trim();
    if (!name) return;
    const newPl = {
      id: 'pl_' + Date.now(),
      name: name,
      image: '/assets/BloomeeLogoFG.png',
      tracks: []
    };
    state.playlists.push(newPl);
    saveLibrary();
    elements.playlistModal.classList.add('hidden');
    showToast(`Created playlist "${name}"`);
  };
});

function openAddToPlaylistModal(track) {
  elements.playlistModalTitle.textContent = `Add to Playlist`;
  
  if (!state.playlists.length) {
    elements.playlistModalBody.innerHTML = `
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:12px;">You haven't created any playlists yet.</p>
      <input type="text" id="quick-playlist-input" placeholder="New Playlist Name" class="modal-input">
      <button class="modal-action-btn" id="quick-create-btn">Create & Add</button>
    `;
    elements.playlistModal.classList.remove('hidden');
    document.getElementById('quick-create-btn').onclick = () => {
      const name = document.getElementById('quick-playlist-input').value.trim();
      if (!name) return;
      const newPl = {
        id: 'pl_' + Date.now(),
        name,
        image: track.image || '/assets/BloomeeLogoFG.png',
        tracks: [track]
      };
      state.playlists.push(newPl);
      saveLibrary();
      elements.playlistModal.classList.add('hidden');
      showToast(`Added to "${name}"`);
    };
    return;
  }

  let html = `<div style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">`;
  state.playlists.forEach(pl => {
    html += `
      <button class="settings-item select-playlist-btn" data-id="${pl.id}" style="width:100%;cursor:pointer;text-align:left;">
        <span class="setting-name">${pl.name} (${pl.tracks.length} tracks)</span>
      </button>
    `;
  });
  html += `</div>`;

  elements.playlistModalBody.innerHTML = html;
  elements.playlistModal.classList.remove('hidden');

  elements.playlistModalBody.querySelectorAll('.select-playlist-btn').forEach(btn => {
    btn.onclick = () => {
      const pl = state.playlists.find(p => p.id === btn.dataset.id);
      if (pl) {
        if (!pl.tracks.some(t => t.id === track.id)) {
          pl.tracks.push(track);
          if (pl.tracks.length === 1) pl.image = track.image;
          saveLibrary();
          showToast(`Added to "${pl.name}"`);
        } else {
          showToast(`Already in "${pl.name}"`);
        }
      }
      elements.playlistModal.classList.add('hidden');
    };
  });
}

elements.playerAddPlaylistBtn.addEventListener('click', () => {
  if (state.currentTrack) openAddToPlaylistModal(state.currentTrack);
});

elements.modalCloseBtn.addEventListener('click', () => {
  elements.playlistModal.classList.add('hidden');
});

// ---------------------------------------------------------------------------
// Settings Handlers
// ---------------------------------------------------------------------------
elements.settingQuality.value = state.audioQuality;
elements.settingQuality.addEventListener('change', () => {
  state.audioQuality = elements.settingQuality.value;
  localStorage.setItem('bloomee_quality', state.audioQuality);
  if (state.currentTrack) {
    elements.playerQualityBadge.textContent = `${state.audioQuality} KBPS AAC`;
  }
  showToast(`Streaming quality set to ${state.audioQuality} kbps`);
});

elements.settingAutoplay.checked = state.autoplay;
elements.settingAutoplay.addEventListener('change', () => {
  state.autoplay = elements.settingAutoplay.checked;
  localStorage.setItem('bloomee_autoplay', state.autoplay);
  showToast(`Autoplay ${state.autoplay ? 'enabled' : 'disabled'}`);
});

elements.settingSleepTimer.addEventListener('change', () => {
  clearTimeout(state.sleepTimerTimeout);
  const minutes = parseInt(elements.settingSleepTimer.value, 10);
  if (minutes > 0) {
    elements.sleepTimerDesc.textContent = `Stopping in ${minutes} minutes`;
    state.sleepTimerTimeout = setTimeout(() => {
      elements.audio.pause();
      state.isPlaying = false;
      updatePlayPauseIcons();
      elements.settingSleepTimer.value = '0';
      elements.sleepTimerDesc.textContent = 'Off';
      showToast('Sleep timer expired. Music paused.');
    }, minutes * 60 * 1000);
    showToast(`Sleep timer set for ${minutes} minutes`);
  } else {
    elements.sleepTimerDesc.textContent = 'Off';
    showToast('Sleep timer cancelled');
  }
});

// ---------------------------------------------------------------------------
// iOS Safari PWA Banner & Standalone Detection
// ---------------------------------------------------------------------------
function checkIOSPWA() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  if (isIOS && !isStandalone) {
    elements.iosInstallBanner.classList.remove('hidden');
  }
}

elements.iosBannerClose.addEventListener('click', () => {
  elements.iosInstallBanner.classList.add('hidden');
});

// ---------------------------------------------------------------------------
// Keyboard Shortcuts
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
  } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    navigateTo('search');
    elements.searchInput.focus();
  } else if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    playNextTrack();
  } else if (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    playPrevTrack();
  } else if (e.key === 'Escape') {
    elements.fullPlayer.classList.add('hidden');
    elements.playlistModal.classList.add('hidden');
  }
});

// ---------------------------------------------------------------------------
// Initial Boot
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  updateLibraryUI();
  loadExploreData();
  checkIOSPWA();

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('ServiceWorker registration skipped:', err);
    });
  }
});
