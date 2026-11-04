/**
 * Zylo Music — Premium Dark Music Streaming Experience
 * Created by infas.mk
 * 
 * Audio Engine, MediaSession API, Category Filtering, Synced Lyrics,
 * Direct Sleep Timer in Player, Spotify/YouTube Playlist Importer & PWA Prompt
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
  audioQuality: localStorage.getItem('zylo_quality') || '320',
  autoplay: localStorage.getItem('zylo_autoplay') !== 'false',

  // Library data
  likedSongs: JSON.parse(localStorage.getItem('zylo_liked') || '[]'),
  history: JSON.parse(localStorage.getItem('zylo_history') || '[]'),
  playlists: JSON.parse(localStorage.getItem('zylo_playlists') || '[]'),

  // UI state
  activeView: 'home',
  previousView: 'home',
  homeCategory: 'all',
  libraryFilter: 'all',
  playerTab: 'art', // 'art' | 'lyrics' | 'queue'
  searchFilter: 'all',

  // Raw fetched explore data
  homeData: null,

  // Lyrics
  lyrics: [],
  currentLyricIndex: -1,

  // Sleep Timer
  sleepTimerTimeout: null,
  sleepTimerType: 'off', // 'off' | 'minutes' | 'end_of_track'
  sleepTimerMinutes: 0,
  sleepTimerEndTimestamp: 0,
  sleepTimerInterval: null
};

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------
const elements = {
  audio: document.getElementById('audio-engine'),
  ambientGlow: document.getElementById('ambient-glow'),
  mainContent: document.getElementById('main-content'),
  topHeader: document.getElementById('top-header'),

  // Top Header
  headerProfileBtn: document.getElementById('header-profile-btn'),
  headerImportBtn: document.getElementById('header-import-btn'),
  headerSearchBtn: document.getElementById('header-search-btn'),
  headerFavoritesBtn: document.getElementById('header-favorites-btn'),

  // Views
  views: {
    home: document.getElementById('view-home'),
    explore: document.getElementById('view-explore'),
    library: document.getElementById('view-library'),
    settings: document.getElementById('view-settings'),
    details: document.getElementById('view-details')
  },
  navItems: document.querySelectorAll('.bottom-nav .nav-item'),

  // Home Screen Elements
  homeCategoryTabs: document.getElementById('home-category-tabs'),
  curatedCarousel: document.getElementById('curated-carousel'),
  dailyPlaylistsList: document.getElementById('daily-playlists-list'),
  seeAllPlaylistsBtn: document.getElementById('see-all-playlists-btn'),
  homeTrendingTracks: document.getElementById('home-trending-tracks'),
  playAllTrending: document.getElementById('play-all-trending'),
  homeNewAlbums: document.getElementById('home-new-albums'),
  sectionCurated: document.getElementById('section-curated'),
  sectionDailyPlaylists: document.getElementById('section-daily-playlists'),
  sectionTrendingHits: document.getElementById('section-trending-hits'),
  sectionNewReleases: document.getElementById('section-new-releases'),

  // Search / Explore Screen
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  quickTagsContainer: document.getElementById('quick-tags-container'),
  searchFilterPills: document.getElementById('search-filter-pills'),
  searchEmptyState: document.getElementById('search-empty-state'),
  searchResultsLists: document.getElementById('search-results-lists'),

  // Library Screen
  libraryImportBtn: document.getElementById('library-import-btn'),
  createPlaylistBtn: document.getElementById('create-playlist-btn'),
  libraryFilterTabs: document.getElementById('library-filter-tabs'),
  libraryLikedItem: document.getElementById('library-liked-item'),
  likedCountText: document.getElementById('liked-count-text'),
  playLikedBtn: document.getElementById('play-liked-btn'),
  libraryHistoryItem: document.getElementById('library-history-item'),
  historyCountText: document.getElementById('history-count-text'),
  playHistoryBtn: document.getElementById('play-history-btn'),
  libraryDownloadsItem: document.getElementById('library-downloads-item'),
  downloadsCountText: document.getElementById('downloads-count-text'),
  downloadsPillCount: document.getElementById('downloads-pill-count'),
  playDownloadsBtn: document.getElementById('play-downloads-btn'),
  userPlaylistsContainer: document.getElementById('user-playlists-container'),

  // Details Screen
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
  playerAmbientBlur: document.getElementById('player-ambient-blur'),
  playerDismissBtn: document.getElementById('player-dismiss-btn'),
  playerSourceName: document.getElementById('player-source-name'),
  playerSleepTimerBtn: document.getElementById('player-sleep-timer-btn'),
  sleepBadgeMini: document.getElementById('sleep-badge-mini'),
  playerLikeBtn: document.getElementById('player-like-btn'),
  playerTabPills: document.querySelectorAll('.player-tab-pill'),
  tabContentArt: document.getElementById('tab-content-art'),
  tabContentLyrics: document.getElementById('tab-content-lyrics'),
  tabContentQueue: document.getElementById('tab-content-queue'),
  playerCover: document.getElementById('player-cover'),
  lyricsScrollContainer: document.getElementById('lyrics-scroll-container'),
  lyricsLines: document.getElementById('lyrics-lines'),
  queueItemsList: document.getElementById('queue-items-list'),
  queueCount: document.getElementById('queue-count'),
  queueClearBtn: document.getElementById('queue-clear-btn'),
  playerTitle: document.getElementById('player-title'),
  playerArtist: document.getElementById('player-artist'),
  playerScrubber: document.getElementById('player-scrubber'),
  playerTimeCurrent: document.getElementById('player-time-current'),
  playerTimeRemaining: document.getElementById('player-time-remaining'),
  playerShuffleBtn: document.getElementById('player-shuffle-btn'),
  playerPrevBtn: document.getElementById('player-prev-btn'),
  playerPlayBtn: document.getElementById('player-play-btn'),
  playerNextBtn: document.getElementById('player-next-btn'),
  playerRepeatBtn: document.getElementById('player-repeat-btn'),
  repeatOneIndicator: document.querySelector('.repeat-one-indicator'),
  playerQualityBadge: document.getElementById('player-quality-badge'),
  playerDownloadBtn: document.getElementById('player-download-btn'),
  playerAddPlaylistBtn: document.getElementById('player-add-playlist-btn'),

  // Sleep Timer Modal
  sleepTimerModal: document.getElementById('sleep-timer-modal'),
  sleepModalClose: document.getElementById('sleep-modal-close'),
  timerOptionBtns: document.querySelectorAll('.timer-option-btn'),

  // Import Modal
  importModal: document.getElementById('import-modal'),
  importModalClose: document.getElementById('import-modal-close'),
  importTabSpotify: document.getElementById('import-tab-spotify'),
  importTabYoutube: document.getElementById('import-tab-youtube'),
  importHint: document.getElementById('import-hint'),
  importUrlInput: document.getElementById('import-url-input'),
  importSubmitBtn: document.getElementById('import-submit-btn'),
  importStatusBox: document.getElementById('import-status-box'),
  importStatusText: document.getElementById('import-status-text'),
  settingsOpenImportBtn: document.getElementById('settings-open-import-btn'),

  // Playlist Modal
  playlistModal: document.getElementById('playlist-modal'),
  playlistModalTitle: document.getElementById('playlist-modal-title'),
  playlistModalBody: document.getElementById('playlist-modal-body'),
  modalCloseBtn: document.getElementById('modal-close-btn'),

  // PWA Install Prompt Modal
  pwaInstallModal: document.getElementById('pwa-install-modal'),
  pwaConfirmBtn: document.getElementById('pwa-confirm-btn'),
  pwaDismissBtn: document.getElementById('pwa-dismiss-btn'),
  triggerPwaGuideBtn: document.getElementById('trigger-pwa-guide-btn'),

  // Settings
  settingQuality: document.getElementById('setting-quality'),
  settingAutoplay: document.getElementById('setting-autoplay'),
  settingSleepTimer: document.getElementById('setting-sleep-timer'),
  sleepTimerDesc: document.getElementById('sleep-timer-desc'),
  settingsStorageUsed: document.getElementById('settings-storage-used'),
  settingsViewDownloadsBtn: document.getElementById('settings-view-downloads-btn'),
  settingsClearDownloadsBtn: document.getElementById('settings-clear-downloads-btn'),

  // Toast
  toast: document.getElementById('toast')
};

let deferredPrompt = null;
let currentImportSource = 'spotify';

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
  }, 2600);
}

function saveLibrary() {
  localStorage.setItem('zylo_liked', JSON.stringify(state.likedSongs));
  localStorage.setItem('zylo_history', JSON.stringify(state.history));
  localStorage.setItem('zylo_playlists', JSON.stringify(state.playlists));
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
// Offline Storage Engine (IndexedDB)
// ---------------------------------------------------------------------------
const DB_NAME = 'zylo_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'downloads';
let dbInstance = null;

function getDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

async function isTrackDownloaded(trackId) {
  if (!trackId) return false;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

async function getDownloadedTrack(trackId) {
  if (!trackId) return null;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function getAllDownloads() {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

async function downloadTrack(track) {
  if (!track) return;
  showToast(`Downloading "${track.title}" for offline...`);

  try {
    let streamUrl = getStreamUrlForTrack(track);
    if (!streamUrl) {
      const res = await fetch(`/api/resolve?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist || '')}`);
      const data = await res.json();
      if (data.success && data.track) {
        track.stream_url = data.track.stream_url;
        track.streams = data.track.streams;
        track.duration = data.track.duration || track.duration;
        if (!track.image) track.image = data.track.image;
        streamUrl = getStreamUrlForTrack(track);
      }
    }

    if (!streamUrl) {
      showToast('Download failed: Stream not found');
      return;
    }

    const response = await fetch(streamUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const audioBlob = await response.blob();

    let offlineImage = track.image || '/assets/zylo_logo.png';
    try {
      const imgRes = await fetch(offlineImage);
      if (imgRes.ok) {
        const imgBlob = await imgRes.blob();
        offlineImage = await new Promise((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result);
          reader.readAsDataURL(imgBlob);
        });
      }
    } catch (_) {}

    const record = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album || 'Zylo Offline',
      duration: track.duration || 0,
      image: offlineImage,
      audioBlob: audioBlob,
      size: audioBlob.size,
      downloadedAt: Date.now()
    };

    const db = await getDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });

    showToast(`✓ Downloaded "${track.title}" for offline!`);
    updateDownloadBadges();
  } catch (err) {
    console.error('Download error:', err);
    showToast(`Download failed: ${err.message || 'Network error'}`);
  }
}

async function removeDownload(trackId) {
  try {
    const db = await getDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
    showToast('Download removed from offline storage');
    updateDownloadBadges();
  } catch (err) {
    console.error('Remove download error:', err);
  }
}

async function clearAllDownloads() {
  try {
    const db = await getDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
    showToast('Cleared all offline downloads');
    updateDownloadBadges();
  } catch (err) {
    console.error('Clear downloads error:', err);
  }
}

async function updateDownloadBadges() {
  const all = await getAllDownloads();
  const count = all.length;
  let totalBytes = 0;
  all.forEach(item => totalBytes += (item.size || 0));
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  if (elements.downloadsPillCount) elements.downloadsPillCount.textContent = count;
  if (elements.downloadsCountText) elements.downloadsCountText.textContent = `${count} songs • ${totalMB} MB stored`;
  if (elements.settingsStorageUsed) elements.settingsStorageUsed.textContent = `${count} songs (${totalMB} MB)`;

  if (state.currentTrack && elements.playerDownloadBtn) {
    const isDl = await isTrackDownloaded(state.currentTrack.id);
    elements.playerDownloadBtn.classList.toggle('downloaded', isDl);
    elements.playerDownloadBtn.title = isDl ? 'Downloaded (Tap to remove)' : 'Download for offline';
  }

  document.querySelectorAll('.track-download-btn').forEach(async (btn) => {
    const trId = btn.dataset.trackId;
    if (trId) {
      const isDl = await isTrackDownloaded(trId);
      btn.classList.toggle('downloaded', isDl);
      btn.title = isDl ? 'Downloaded (Offline ready)' : 'Download for offline';
    }
  });
}

// ---------------------------------------------------------------------------
// Audio Engine & Playback
// ---------------------------------------------------------------------------
function getStreamUrlForTrack(track) {
  if (!track) return null;
  const quality = state.audioQuality || '320';
  const rawUrl = track.streams?.[quality] ||
                 track.streams?.['320'] ||
                 track.streams?.['160'] ||
                 track.stream_url;

  if (!rawUrl) return null;
  return `/api/stream?url=${encodeURIComponent(rawUrl)}`;
}

async function playTrack(track, fromQueue = false) {
  if (!track) return;

  // 1. Check if track is downloaded for offline playback
  let streamSrc = null;
  try {
    const downloaded = await getDownloadedTrack(track.id);
    if (downloaded && downloaded.audioBlob) {
      streamSrc = URL.createObjectURL(downloaded.audioBlob);
    }
  } catch (e) {
    console.error('IDB check error:', e);
  }

  // 2. If not downloaded, resolve via network if online
  if (!streamSrc) {
    if (!navigator.onLine) {
      showToast('Offline: Download this song first to listen offline');
      return;
    }

    if (!track.stream_url && !track.streams) {
      showToast(`Resolving ${track.title}...`);
      try {
        const res = await fetch(`/api/resolve?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist || '')}`);
        const data = await res.json();
        if (data.success && data.track) {
          track.stream_url = data.track.stream_url;
          track.streams = data.track.streams;
          track.duration = data.track.duration || track.duration;
          if (!track.image) track.image = data.track.image;
        }
      } catch (e) {
        console.error('Resolve error:', e);
      }
    }

    streamSrc = getStreamUrlForTrack(track);
  }

  state.currentTrack = track;
  addToHistory(track);

  if (!fromQueue) {
    state.queue = [track];
    state.queueIndex = 0;
    state.originalQueue = [track];
  }

  if (!streamSrc) {
    showToast('Stream unavailable for this track');
    return;
  }

  elements.audio.src = streamSrc;
  elements.audio.load();

  try {
    await elements.audio.play();
    state.isPlaying = true;
  } catch (err) {
    console.error('Playback error:', err);
    state.isPlaying = false;
  }

  updatePlayerUI();
  updateQueueUI();
  fetchAndRenderLyrics(track);
  setupMediaSession(track);
}

function playQueue(tracks, startIndex = 0, sourceName = 'Zylo') {
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
  if (state.sleepTimerType === 'end_of_track') {
    elements.audio.pause();
    state.isPlaying = false;
    clearSleepTimer();
    showToast('Sleep timer: song ended. Music stopped.');
    updatePlayPauseIcons();
    return;
  }

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
  showToast('Queue ended. Loading Zylo Flow...');
  try {
    const res = await fetch(`/api/recommendations?id=${trackId}`);
    const data = await res.json();
    if (data.success && data.recommendations?.length > 0) {
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
// Direct Sleep Timer (Inside Player & Settings)
// ---------------------------------------------------------------------------
function setSleepTimer(minutes) {
  clearSleepTimer();

  if (minutes === 0) {
    showToast('Sleep timer turned off');
    return;
  }

  if (minutes === -1) {
    // End of current track
    state.sleepTimerType = 'end_of_track';
    elements.sleepBadgeMini.textContent = '1s';
    elements.sleepBadgeMini.classList.remove('hidden');
    elements.sleepTimerDesc.textContent = 'Stopping at end of current song';
    showToast('Sleep timer: Stopping at end of song');
    return;
  }

  state.sleepTimerType = 'minutes';
  state.sleepTimerMinutes = minutes;
  state.sleepTimerEndTimestamp = Date.now() + minutes * 60 * 1000;

  elements.sleepBadgeMini.textContent = `${minutes}m`;
  elements.sleepBadgeMini.classList.remove('hidden');
  elements.sleepTimerDesc.textContent = `Stopping in ${minutes} minutes`;

  state.sleepTimerInterval = setInterval(() => {
    const leftMs = state.sleepTimerEndTimestamp - Date.now();
    if (leftMs <= 0) {
      elements.audio.pause();
      state.isPlaying = false;
      updatePlayPauseIcons();
      clearSleepTimer();
      showToast('Sleep timer expired. Music paused.');
    } else {
      const leftMins = Math.ceil(leftMs / (60 * 1000));
      elements.sleepBadgeMini.textContent = `${leftMins}m`;
    }
  }, 10000);

  showToast(`Sleep timer set for ${minutes} minutes`);
}

function clearSleepTimer() {
  clearInterval(state.sleepTimerInterval);
  clearTimeout(state.sleepTimerTimeout);
  state.sleepTimerType = 'off';
  state.sleepTimerMinutes = 0;
  elements.sleepBadgeMini.classList.add('hidden');
  elements.sleepTimerDesc.textContent = 'Off';
  elements.settingSleepTimer.value = '0';
}

// Sleep timer modal triggers
elements.playerSleepTimerBtn.addEventListener('click', () => {
  elements.sleepTimerModal.classList.remove('hidden');
});

elements.sleepModalClose.addEventListener('click', () => {
  elements.sleepTimerModal.classList.add('hidden');
});

elements.timerOptionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const minutes = parseInt(btn.dataset.minutes, 10);
    setSleepTimer(minutes);
    elements.sleepTimerModal.classList.add('hidden');
  });
});

elements.settingSleepTimer.addEventListener('change', () => {
  const minutes = parseInt(elements.settingSleepTimer.value, 10);
  setSleepTimer(minutes);
});

// ---------------------------------------------------------------------------
// MediaSession API (iOS Lock Screen & Control Center)
// ---------------------------------------------------------------------------
function setupMediaSession(track) {
  if (!('mediaSession' in navigator) || !track) return;
  const artworkUrl = track.image || '/assets/zylo_logo.png';

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album || 'Zylo',
    artwork: [
      { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
      { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
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
});

elements.audio.addEventListener('pause', () => {
  state.isPlaying = false;
  updatePlayPauseIcons();
});

elements.audio.addEventListener('timeupdate', () => {
  updateScrubberPosition();
  syncLyricsToPlayback(elements.audio.currentTime);
  updateMediaSessionPosition();
});

elements.audio.addEventListener('loadedmetadata', () => {
  const dur = elements.audio.duration;
  elements.playerScrubber.max = dur;
  elements.playerTimeRemaining.textContent = `-${formatSeconds(dur)}`;
});

elements.audio.addEventListener('ended', () => {
  playNextTrack();
});

elements.audio.addEventListener('error', (e) => {
  console.error('Audio playback error:', e);
  showToast('Stream error. Trying next stream...');
  setTimeout(() => playNextTrack(), 1000);
});

// ---------------------------------------------------------------------------
// Scrubber & Sliders
// ---------------------------------------------------------------------------
function updateScrubberPosition() {
  const cur = elements.audio.currentTime || 0;
  const dur = elements.audio.duration || 1;
  const remaining = Math.max(dur - cur, 0);
  const pct = (cur / dur) * 100;

  elements.playerScrubber.value = cur;
  elements.playerTimeCurrent.textContent = formatSeconds(cur);
  elements.playerTimeRemaining.textContent = `-${formatSeconds(remaining)}`;
  elements.miniProgressFill.style.width = `${pct}%`;

  // Lime-green fill slider styling
  elements.playerScrubber.style.background = `linear-gradient(to right, #C7F464 0%, #C7F464 ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`;
}

elements.playerScrubber.addEventListener('input', () => {
  const seekTo = parseFloat(elements.playerScrubber.value);
  const dur = elements.audio.duration || 1;
  elements.playerTimeCurrent.textContent = formatSeconds(seekTo);
  elements.playerTimeRemaining.textContent = `-${formatSeconds(Math.max(dur - seekTo, 0))}`;
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

  // Reveal mini player
  elements.miniPlayer.classList.remove('hidden');

  // Mini Player
  elements.miniCover.src = track.image || '/assets/zylo_logo.png';
  elements.miniTitle.textContent = track.title;
  elements.miniArtist.textContent = track.artist;

  // Full Player
  elements.playerCover.src = track.image || '/assets/zylo_logo.png';
  elements.playerTitle.textContent = track.title;
  elements.playerArtist.textContent = track.artist;
  elements.playerQualityBadge.textContent = `${state.audioQuality} KBPS`;

  // Dynamic Ambient Artwork Blur in Full Player
  elements.playerAmbientBlur.style.backgroundImage = `url('${track.image || '/assets/zylo_logo.png'}')`;

  updatePlayPauseIcons();
  updateLikeButtons();

  if (elements.playerDownloadBtn) {
    isTrackDownloaded(track.id).then(isDl => {
      elements.playerDownloadBtn.classList.toggle('downloaded', isDl);
      elements.playerDownloadBtn.title = isDl ? 'Downloaded (Tap to remove)' : 'Download for offline';
    });
  }

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
      <button class="track-btn remove-queue-btn" title="Remove">✕</button>
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

  if (elements.topHeader) {
    elements.topHeader.classList.toggle('header-hidden', viewName !== 'home');
  }

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

elements.headerProfileBtn.addEventListener('click', () => navigateTo('library'));
elements.headerSearchBtn.addEventListener('click', () => {
  navigateTo('explore');
  elements.searchInput.focus();
});
elements.headerFavoritesBtn.addEventListener('click', () => loadDetailsView('liked'));
elements.detailsBackBtn.addEventListener('click', () => navigateTo(state.previousView || 'home'));

// ---------------------------------------------------------------------------
// Mini Player & Full Player Controls
// ---------------------------------------------------------------------------
elements.miniPlayerExpand.addEventListener('click', () => {
  elements.fullPlayer.classList.remove('hidden');
});

elements.playerDismissBtn.addEventListener('click', () => {
  elements.fullPlayer.classList.add('hidden');
});

elements.playerTabPills.forEach(pill => {
  pill.addEventListener('click', () => {
    const tab = pill.dataset.tab;
    state.playerTab = tab;

    elements.playerTabPills.forEach(p => p.classList.toggle('active', p.dataset.tab === tab));
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
// UI Component Builders (Track Tiles, Rows, Cards)
// ---------------------------------------------------------------------------
function createTrackTile(track, onPlay) {
  const tile = document.createElement('div');
  tile.className = `track-tile ${state.currentTrack?.id === track.id ? 'active' : ''}`;
  tile.dataset.id = track.id;

  const isLiked = isTrackLiked(track.id);

  tile.innerHTML = `
    <div class="track-thumb-wrap">
      <img class="track-thumb" src="${track.image || '/assets/zylo_logo.png'}" alt="" loading="lazy">
      ${state.currentTrack?.id === track.id && state.isPlaying ? '<div class="track-playing-eq"><span></span><span></span><span></span></div>' : ''}
    </div>
    <div class="track-info">
      <div class="track-title">${track.title}</div>
      <div class="track-meta">${track.artist}</div>
    </div>
    <div class="track-duration">${formatSeconds(track.duration)}</div>
    <div class="track-actions">
      <button class="track-btn track-download-btn" data-track-id="${track.id}" title="Download for offline" aria-label="Download for offline">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      </button>
      <button class="track-btn track-like-btn ${isLiked ? 'liked' : ''}" title="Favorite" aria-label="Favorite">
        <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
      </button>
      <button class="track-btn track-add-btn" title="Add to Playlist" aria-label="Add to Playlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
  `;

  isTrackDownloaded(track.id).then(isDl => {
    if (isDl) tile.querySelector('.track-download-btn')?.classList.add('downloaded');
  });

  tile.addEventListener('click', async (e) => {
    if (e.target.closest('.track-download-btn')) {
      e.stopPropagation();
      const isDl = await isTrackDownloaded(track.id);
      if (isDl) {
        await removeDownload(track.id);
      } else {
        await downloadTrack(track);
      }
      return;
    }
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

function createDailyPlaylistRow(item, onPlay, onClick) {
  const row = document.createElement('div');
  row.className = 'daily-playlist-row';
  row.innerHTML = `
    <div class="daily-playlist-thumb-wrap">
      <img class="daily-playlist-thumb" src="${item.image}" alt="" loading="lazy">
    </div>
    <div class="daily-playlist-info">
      <div class="daily-playlist-name">${item.title}</div>
      <div class="daily-playlist-meta">${item.subtitle || 'Zylo Daily'} • ${item.count || 25} tracks</div>
    </div>
    <button class="circular-play-btn" title="Play">
      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
    </button>
  `;

  row.addEventListener('click', (e) => {
    if (e.target.closest('.circular-play-btn')) {
      e.stopPropagation();
      if (onPlay) onPlay();
      return;
    }
    if (onClick) onClick();
  });

  return row;
}

function createMediaCard(item, onClick) {
  const card = document.createElement('div');
  card.className = 'media-card';
  card.innerHTML = `
    <div class="media-card-thumb-wrap">
      <img class="media-card-img" src="${item.image}" alt="" loading="lazy">
    </div>
    <div class="media-card-title">${item.title}</div>
    <div class="media-card-subtitle">${item.subtitle || item.artist || ''}</div>
  `;
  card.addEventListener('click', () => onClick(item));
  return card;
}

// ---------------------------------------------------------------------------
// Home Screen Data & Category Filter
// ---------------------------------------------------------------------------
async function loadHomeData() {
  try {
    const res = await fetch('/api/home');
    const data = await res.json();
    if (!data.success) return;
    state.homeData = data;

    // 1. Curated Carousel
    renderCuratedCarousel(data.featuredPlaylists.slice(0, 3).concat(data.charts.slice(0, 2)));

    // 2. Top Daily Playlists
    elements.dailyPlaylistsList.innerHTML = '';
    data.featuredPlaylists.slice(0, 5).forEach(pl => {
      elements.dailyPlaylistsList.appendChild(
        createDailyPlaylistRow(
          pl,
          () => loadAndPlayPlaylist(pl.id, pl.title),
          () => loadDetailsView('playlist', pl.id)
        )
      );
    });

    // 3. Trending Tracks
    elements.homeTrendingTracks.innerHTML = '';
    data.trendingSongs.slice(0, 15).forEach((track, idx) => {
      elements.homeTrendingTracks.appendChild(
        createTrackTile(track, () => playQueue(data.trendingSongs, idx, 'Trending'))
      );
    });

    elements.playAllTrending.onclick = () => {
      if (data.trendingSongs.length > 0) {
        playQueue(data.trendingSongs, 0, 'Trending Hits');
      }
    };

    // 4. New Releases / Albums
    elements.homeNewAlbums.innerHTML = '';
    data.newAlbums.forEach(album => {
      elements.homeNewAlbums.appendChild(
        createMediaCard(album, () => loadDetailsView('album', album.id))
      );
    });

  } catch (err) {
    console.error('Failed to load home data:', err);
  }
}

function renderCuratedCarousel(items) {
  elements.curatedCarousel.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'curated-card';
    card.innerHTML = `
      <img class="curated-card-bg" src="${item.image}" alt="">
      <div class="curated-card-overlay">
        <span class="curated-tag">${item.type || 'Curated & Trending'}</span>
        <h2 class="curated-card-title">${item.title}</h2>
        <p class="curated-card-desc">${item.subtitle || 'Tap to play in Zylo Music'}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      loadDetailsView(item.type || 'playlist', item.id);
    });
    elements.curatedCarousel.appendChild(card);
  });
}

function filterHomeSections(category) {
  state.homeCategory = category;

  if (category === 'all') {
    elements.sectionCurated.classList.remove('hidden');
    elements.sectionDailyPlaylists.classList.remove('hidden');
    elements.sectionTrendingHits.classList.remove('hidden');
    elements.sectionNewReleases.classList.remove('hidden');
  } else if (category === 'new') {
    elements.sectionCurated.classList.add('hidden');
    elements.sectionDailyPlaylists.classList.add('hidden');
    elements.sectionTrendingHits.classList.add('hidden');
    elements.sectionNewReleases.classList.remove('hidden');
  } else if (category === 'trending') {
    elements.sectionCurated.classList.remove('hidden');
    elements.sectionDailyPlaylists.classList.add('hidden');
    elements.sectionTrendingHits.classList.remove('hidden');
    elements.sectionNewReleases.classList.add('hidden');
  } else if (category === 'charts') {
    elements.sectionCurated.classList.add('hidden');
    elements.sectionDailyPlaylists.classList.remove('hidden');
    elements.sectionTrendingHits.classList.remove('hidden');
    elements.sectionNewReleases.classList.add('hidden');
  } else if (category === 'recommended') {
    elements.sectionCurated.classList.remove('hidden');
    elements.sectionDailyPlaylists.classList.remove('hidden');
    elements.sectionTrendingHits.classList.add('hidden');
    elements.sectionNewReleases.classList.remove('hidden');
  }
}

elements.homeCategoryTabs.querySelectorAll('.category-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    elements.homeCategoryTabs.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    filterHomeSections(pill.dataset.category);
  });
});

elements.seeAllPlaylistsBtn.addEventListener('click', () => {
  navigateTo('library');
});

// ---------------------------------------------------------------------------
// Details View (Album / Playlist / Chart / Liked Songs / History / Downloads)
// ---------------------------------------------------------------------------
let currentDetailsTracks = [];

async function loadDetailsView(type, id) {
  navigateTo('details');
  elements.detailsTracklist.innerHTML = '<div class="lyrics-loading">Loading songs...</div>';
  currentDetailsTracks = [];

  if (type === 'downloads') {
    elements.detailsCover.src = '/assets/zylo_logo.png';
    elements.detailsType.textContent = 'Offline';
    elements.detailsTitle.textContent = 'Downloaded Music';
    const downloads = await getAllDownloads();
    elements.detailsSubtitle.textContent = `${downloads.length} songs • Offline Listening`;
    elements.detailsExtra.textContent = 'Available without internet';
    currentDetailsTracks = downloads;
    renderDetailsTracklist('Offline Downloads');
    return;
  }

  if (type === 'liked') {
    elements.detailsCover.src = '/assets/zylo_logo.png';
    elements.detailsType.textContent = 'Favorites';
    elements.detailsTitle.textContent = 'Liked Songs';
    elements.detailsSubtitle.textContent = `${state.likedSongs.length} songs • Personal Collection`;
    elements.detailsExtra.textContent = 'Saved in your Zylo library';
    currentDetailsTracks = [...state.likedSongs];
    renderDetailsTracklist('Liked Songs');
    return;
  }

  if (type === 'history') {
    elements.detailsCover.src = '/assets/zylo_logo.png';
    elements.detailsType.textContent = 'History';
    elements.detailsTitle.textContent = 'Recently Played';
    elements.detailsSubtitle.textContent = `${state.history.length} songs`;
    elements.detailsExtra.textContent = 'Listening History';
    currentDetailsTracks = [...state.history];
    renderDetailsTracklist('Recently Played');
    return;
  }

  if (type === 'user_playlist' || type === 'imported') {
    const pl = state.playlists.find(p => p.id === id);
    if (!pl) return;
    elements.detailsCover.src = pl.image || '/assets/zylo_logo.png';
    elements.detailsType.textContent = pl.type === 'imported' ? 'Imported Playlist' : 'Playlist';
    elements.detailsTitle.textContent = pl.name;
    elements.detailsSubtitle.textContent = `${pl.tracks.length} tracks`;
    elements.detailsExtra.textContent = pl.type === 'imported' ? 'Imported to Zylo' : 'Created by you';
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

async function loadAndPlayPlaylist(id, title) {
  try {
    const res = await fetch(`/api/playlist/${id}`);
    const data = await res.json();
    if (data.playlist?.songs?.length) {
      playQueue(data.playlist.songs, 0, title);
    }
  } catch (e) {
    console.error(e);
  }
}

// ---------------------------------------------------------------------------
// Search (Unified Clean Search)
// ---------------------------------------------------------------------------
let searchDebounceTimer = null;

elements.searchInput.addEventListener('input', () => {
  const q = elements.searchInput.value.trim();
  elements.searchClearBtn.classList.toggle('hidden', !q);

  clearTimeout(searchDebounceTimer);
  if (!q) {
    elements.searchEmptyState.classList.remove('hidden');
    elements.searchResultsLists.classList.add('hidden');
    return;
  }

  elements.searchEmptyState.classList.add('hidden');
  elements.searchResultsLists.classList.remove('hidden');

  searchDebounceTimer = setTimeout(() => {
    executeSearch(q);
  }, 280);
});

elements.searchClearBtn.addEventListener('click', () => {
  elements.searchInput.value = '';
  elements.searchClearBtn.classList.add('hidden');
  elements.searchEmptyState.classList.remove('hidden');
  elements.searchResultsLists.classList.add('hidden');
  elements.searchInput.focus();
});

async function executeSearch(query) {
  if (!query) return;
  try {
    elements.searchResultsLists.innerHTML = '<div class="lyrics-loading" style="padding:24px 0;text-align:center;">Searching Zylo...</div>';
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.success) return;

    elements.searchEmptyState.classList.add('hidden');
    elements.searchResultsLists.classList.remove('hidden');
    renderSearchResults(data, query);
  } catch (err) {
    console.error('Search error:', err);
  }
}

function renderSearchResults(data, query = '') {
  elements.searchResultsLists.innerHTML = '';
  const filter = state.searchFilter;

  const hasAny = (data.songs?.length || data.albums?.length || data.playlists?.length || data.artists?.length);
  if (!hasAny) {
    elements.searchResultsLists.innerHTML = `
      <div class="search-empty-state">
        <h3>No results found</h3>
        <p>Could not find matches for "${query}". Try searching another track or artist.</p>
      </div>
    `;
    return;
  }

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

elements.searchFilterPills.querySelectorAll('.category-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    elements.searchFilterPills.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.searchFilter = pill.dataset.filter;
    const q = elements.searchInput.value.trim();
    if (q) executeSearch(q);
  });
});

// ---------------------------------------------------------------------------
// Library & My Music (Reference Screen 3)
// ---------------------------------------------------------------------------
function updateLibraryUI() {
  elements.likedCountText.textContent = `${state.likedSongs.length} songs • Favorites`;
  elements.historyCountText.textContent = `${state.history.length} songs • History`;
  updateDownloadBadges();

  const filter = state.libraryFilter;
  elements.userPlaylistsContainer.innerHTML = '';

  // Show/Hide Liked, History and Downloads according to filter
  if (filter === 'all') {
    if (elements.libraryDownloadsItem) elements.libraryDownloadsItem.classList.remove('hidden');
    elements.libraryLikedItem.classList.remove('hidden');
    elements.libraryHistoryItem.classList.remove('hidden');
  } else if (filter === 'downloads') {
    if (elements.libraryDownloadsItem) elements.libraryDownloadsItem.classList.remove('hidden');
    elements.libraryLikedItem.classList.add('hidden');
    elements.libraryHistoryItem.classList.add('hidden');
  } else if (filter === 'liked') {
    if (elements.libraryDownloadsItem) elements.libraryDownloadsItem.classList.add('hidden');
    elements.libraryLikedItem.classList.remove('hidden');
    elements.libraryHistoryItem.classList.add('hidden');
  } else if (filter === 'playlists' || filter === 'imported') {
    if (elements.libraryDownloadsItem) elements.libraryDownloadsItem.classList.add('hidden');
    elements.libraryLikedItem.classList.add('hidden');
    elements.libraryHistoryItem.classList.add('hidden');
  }

  // Filter playlists
  const playlistsToShow = (filter === 'downloads') ? [] : state.playlists.filter(pl => {
    if (filter === 'all' || filter === 'playlists') return true;
    if (filter === 'imported') return pl.type === 'imported';
    return false;
  });

  playlistsToShow.forEach(pl => {
    const card = document.createElement('div');
    card.className = 'library-item-card';
    card.innerHTML = `
      <div class="library-thumb-wrap">
        <img src="${pl.image || '/assets/zylo_logo.png'}" alt="" class="playlist-vector-img">
      </div>
      <div class="library-item-info">
        <div class="library-item-title">${pl.name}</div>
        <div class="library-item-sub">${pl.tracks.length} tracks • ${pl.type === 'imported' ? 'Imported' : 'Custom Playlist'}</div>
      </div>
      <button class="circular-play-btn" title="Play">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
      </button>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.circular-play-btn')) {
        e.stopPropagation();
        if (pl.tracks.length > 0) playQueue(pl.tracks, 0, pl.name);
        return;
      }
      loadDetailsView(pl.type === 'imported' ? 'imported' : 'user_playlist', pl.id);
    });

    elements.userPlaylistsContainer.appendChild(card);
  });
}

elements.libraryLikedItem.addEventListener('click', () => loadDetailsView('liked'));
elements.playLikedBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (state.likedSongs.length > 0) {
    playQueue(state.likedSongs, 0, 'Liked Songs');
  } else {
    showToast('No liked songs yet');
  }
});

elements.libraryHistoryItem.addEventListener('click', () => loadDetailsView('history'));
elements.playHistoryBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (state.history.length > 0) {
    playQueue(state.history, 0, 'Recently Played');
  } else {
    showToast('No history yet');
  }
});

if (elements.libraryDownloadsItem) {
  elements.libraryDownloadsItem.addEventListener('click', () => loadDetailsView('downloads'));
}
if (elements.playDownloadsBtn) {
  elements.playDownloadsBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const dls = await getAllDownloads();
    if (dls.length > 0) {
      playQueue(dls, 0, 'Offline Downloads');
    } else {
      showToast('No downloaded songs yet. Tap the download icon to save songs offline.');
    }
  });
}
if (elements.settingsViewDownloadsBtn) {
  elements.settingsViewDownloadsBtn.addEventListener('click', () => loadDetailsView('downloads'));
}
if (elements.settingsClearDownloadsBtn) {
  elements.settingsClearDownloadsBtn.addEventListener('click', async () => {
    if (confirm('Clear all downloaded offline songs from storage?')) {
      await clearAllDownloads();
    }
  });
}

if (elements.playerDownloadBtn) {
  elements.playerDownloadBtn.addEventListener('click', async () => {
    if (!state.currentTrack) return;
    const isDl = await isTrackDownloaded(state.currentTrack.id);
    if (isDl) {
      await removeDownload(state.currentTrack.id);
    } else {
      await downloadTrack(state.currentTrack);
    }
  });
}

elements.libraryFilterTabs.querySelectorAll('.category-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    elements.libraryFilterTabs.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.libraryFilter = pill.dataset.tab;
    updateLibraryUI();
  });
});

// Create Playlist Modal
elements.createPlaylistBtn.addEventListener('click', () => {
  elements.playlistModalTitle.textContent = 'New Playlist';
  elements.playlistModalBody.innerHTML = `
    <input type="text" id="new-playlist-input" placeholder="Playlist Name" class="modal-input" maxlength="40">
    <button class="primary-lime-btn full" id="save-new-playlist-btn">Create Playlist</button>
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
      name,
      type: 'user',
      image: '/assets/zylo_logo.png',
      tracks: []
    };
    state.playlists.unshift(newPl);
    saveLibrary();
    elements.playlistModal.classList.add('hidden');
    showToast(`Created playlist "${name}"`);
  };
});

function openAddToPlaylistModal(track) {
  elements.playlistModalTitle.textContent = `Add to Playlist`;
  
  if (!state.playlists.length) {
    elements.playlistModalBody.innerHTML = `
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:12px;">No playlists created yet.</p>
      <input type="text" id="quick-playlist-input" placeholder="Playlist Name" class="modal-input">
      <button class="primary-lime-btn full" id="quick-create-btn">Create & Add</button>
    `;
    elements.playlistModal.classList.remove('hidden');
    document.getElementById('quick-create-btn').onclick = () => {
      const name = document.getElementById('quick-playlist-input').value.trim();
      if (!name) return;
      const newPl = {
        id: 'pl_' + Date.now(),
        name,
        type: 'user',
        image: track.image || '/assets/zylo_logo.png',
        tracks: [track]
      };
      state.playlists.unshift(newPl);
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
// Spotify & YouTube Playlist Importer
// ---------------------------------------------------------------------------
function openImportModal(source = 'spotify') {
  currentImportSource = source;
  elements.importTabSpotify.classList.toggle('active', source === 'spotify');
  elements.importTabYoutube.classList.toggle('active', source === 'youtube');

  if (source === 'spotify') {
    elements.importHint.textContent = 'Paste any Spotify Playlist, Album, or Track URL:';
    elements.importUrlInput.placeholder = 'https://open.spotify.com/playlist/...';
  } else {
    elements.importHint.textContent = 'Paste any YouTube or YouTube Music Playlist URL:';
    elements.importUrlInput.placeholder = 'https://www.youtube.com/playlist?list=...';
  }

  elements.importUrlInput.value = '';
  elements.importStatusBox.classList.add('hidden');
  elements.importModal.classList.remove('hidden');
  elements.importUrlInput.focus();
}

if (elements.headerImportBtn) {
  elements.headerImportBtn.addEventListener('click', () => openImportModal('spotify'));
}
elements.libraryImportBtn.addEventListener('click', () => openImportModal('spotify'));
if (elements.settingsOpenImportBtn) {
  elements.settingsOpenImportBtn.addEventListener('click', () => openImportModal('spotify'));
}

elements.importModalClose.addEventListener('click', () => {
  elements.importModal.classList.add('hidden');
});

elements.importTabSpotify.addEventListener('click', () => openImportModal('spotify'));
elements.importTabYoutube.addEventListener('click', () => openImportModal('youtube'));

elements.importSubmitBtn.addEventListener('click', async () => {
  const url = elements.importUrlInput.value.trim();
  if (!url) return;

  elements.importStatusBox.classList.remove('hidden');
  elements.importStatusText.textContent = 'Connecting and fetching tracks...';

  const endpoint = currentImportSource === 'spotify' ? '/api/import/spotify' : '/api/import/youtube';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();

    if (data.success && data.playlist) {
      const pl = {
        ...data.playlist,
        type: 'imported'
      };
      state.playlists.unshift(pl);
      saveLibrary();

      elements.importModal.classList.add('hidden');
      showToast(`Imported "${pl.name}" (${pl.tracks.length} tracks)!`);
      loadDetailsView('imported', pl.id);
    } else {
      elements.importStatusText.textContent = data.error || 'Failed to import. Check URL and try again.';
    }
  } catch (err) {
    elements.importStatusText.textContent = 'Error connecting to importer service.';
  }
});

// ---------------------------------------------------------------------------
// Settings Handlers
// ---------------------------------------------------------------------------
elements.settingQuality.value = state.audioQuality;
elements.settingQuality.addEventListener('change', () => {
  state.audioQuality = elements.settingQuality.value;
  localStorage.setItem('zylo_quality', state.audioQuality);
  if (state.currentTrack) {
    elements.playerQualityBadge.textContent = `${state.audioQuality} KBPS`;
  }
  showToast(`Streaming quality set to ${state.audioQuality} kbps`);
});

elements.settingAutoplay.checked = state.autoplay;
elements.settingAutoplay.addEventListener('change', () => {
  state.autoplay = elements.settingAutoplay.checked;
  localStorage.setItem('zylo_autoplay', state.autoplay);
  showToast(`Autoplay ${state.autoplay ? 'enabled' : 'disabled'}`);
});

// ---------------------------------------------------------------------------
// First-Time PWA Install Prompt
// ---------------------------------------------------------------------------
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function checkFirstTimePWA() {
  const prompted = localStorage.getItem('zylo_pwa_prompted');
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  if (!prompted && !isStandalone) {
    setTimeout(() => {
      elements.pwaInstallModal.classList.remove('hidden');
    }, 1200);
  }
}

elements.pwaConfirmBtn.addEventListener('click', async () => {
  localStorage.setItem('zylo_pwa_prompted', 'true');
  elements.pwaInstallModal.classList.add('hidden');

  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') showToast('Thank you for installing Zylo!');
  } else {
    showToast('Follow the steps to add Zylo to your Home Screen!');
  }
});

elements.pwaDismissBtn.addEventListener('click', () => {
  localStorage.setItem('zylo_pwa_prompted', 'true');
  elements.pwaInstallModal.classList.add('hidden');
});

if (elements.triggerPwaGuideBtn) {
  elements.triggerPwaGuideBtn.addEventListener('click', () => {
    elements.pwaInstallModal.classList.remove('hidden');
  });
}

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
    navigateTo('explore');
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
    elements.importModal.classList.add('hidden');
    elements.sleepTimerModal.classList.add('hidden');
    elements.pwaInstallModal.classList.add('hidden');
  }
});

// ---------------------------------------------------------------------------
// Initial Boot
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  updateLibraryUI();
  loadHomeData();
  checkFirstTimePWA();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration:', err);
    });
  }
});
