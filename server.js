const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');
const des = require('des.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Music Helpers & Cryptography (Zylo Music Engine)
// ---------------------------------------------------------------------------
const SAAVN_ENDPOINTS = [
  'https://api.jiosaavn.com/api.php',
  'https://www.jiosaavn.com/api.php'
];
const SAAVN_BASE = SAAVN_ENDPOINTS[0];
const DES_KEY = Buffer.from('38346591', 'utf8');

function decryptSaavnMediaUrl(enc) {
  if (!enc) return null;
  try {
    const cipher = des.DES.create({ type: 'decrypt', key: DES_KEY });
    const inputBytes = Buffer.from(enc, 'base64');
    const outChunks = [];

    for (let i = 0; i < inputBytes.length; i += 8) {
      const block = cipher.update(Array.from(inputBytes.slice(i, i + 8)));
      outChunks.push(Buffer.from(block));
    }
    const out = Buffer.concat(outChunks);

    // PKCS#7 unpadding
    const pad = out[out.length - 1];
    let unpadded = out;
    if (pad > 0 && pad <= 8) {
      let isPad = true;
      for (let i = out.length - pad; i < out.length; i++) {
        if (out[i] !== pad) { isPad = false; break; }
      }
      if (isPad) unpadded = out.slice(0, out.length - pad);
    }

    let dec = unpadded.toString('utf8');
    dec = dec.replace(/\.mp4.*/, '').replace(/\.m4a.*/, '').replace('http:', 'https:');
    return dec;
  } catch (err) {
    return null;
  }
}

function getStreamVariants(decryptedBase) {
  if (!decryptedBase) return {};
  const cleanBase = decryptedBase.replace(/_(12|48|96|160|320)$/, '');
  return {
    '320': `${cleanBase}_320.mp4`,
    '160': `${cleanBase}_160.mp4`,
    '96': `${cleanBase}_96.mp4`,
    '48': `${cleanBase}_48.mp4`,
    '12': `${cleanBase}_12.mp4`
  };
}

function formatArtworkUrl(url) {
  if (!url) return '/assets/BloomeeLogoFG.png';
  return url.replace(/150x150/, '500x500').replace(/50x50/, '500x500').replace('http:', 'https:');
}

function cleanHtml(text) {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function formatTrack(raw) {
  if (!raw) return null;
  const more = raw.more_info || {};
  const encUrl = more.encrypted_media_url || raw.encrypted_media_url;
  const decBase = decryptSaavnMediaUrl(encUrl);
  const streams = getStreamVariants(decBase);

  const durationSec = parseInt(more.duration || raw.duration || '0', 10);
  const artistMap = more.artistMap || {};
  const artistsList = (artistMap.primary_artists || []).map(a => ({
    id: a.id,
    name: cleanHtml(a.name),
    role: a.role
  }));

  const artistStr = cleanHtml(
    more.singers ||
    raw.primary_artists ||
    raw.singers ||
    raw.music ||
    (artistsList.length ? artistsList.map(a => a.name).join(', ') : 'Unknown Artist')
  );

  return {
    id: raw.id || raw.songid || more.songid,
    title: cleanHtml(raw.title || raw.song || ''),
    artist: artistStr,
    album: cleanHtml(more.album || raw.album || ''),
    album_id: more.album_id || raw.albumid,
    duration: durationSec,
    year: raw.year || more.release_date || '',
    image: formatArtworkUrl(raw.image || more.image),
    has_lyrics: more.has_lyrics === 'true' || more.has_lyrics === true,
    streams: streams,
    stream_url: streams['320'] || streams['160'] || streams['96'] || null,
    copyright: more.copyright_text || ''
  };
}

async function fetchSaavn(call, params = {}) {
  const query = new URLSearchParams({
    __call: call,
    _format: 'json',
    _marker: '0',
    ctx: 'web6dot0',
    api_version: '4',
    cc: 'in',
    geo: 'in',
    includeMetaTags: '1',
    languages: 'malayalam,tamil,hindi,english,telugu,punjabi,kannada,bengali,marathi,gujarati,bhojpuri',
    ...params
  });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'X-Forwarded-For': '49.36.0.1',
    'Client-IP': '49.36.0.1',
    'X-Real-IP': '49.36.0.1',
    'CF-IPCountry': 'IN',
    'cookie': 'L=english%2Chindi%2Cmalayalam%2Ctamil%2Ctelugu%2Cpunjabi%2Ckannada%2Cbhojpuri%2Cbengali%2Cmarathi%2Cgujarati; gdpr_acceptance=true; DL=english; cc=in; geo=in'
  };

  let lastErr = null;
  for (const base of SAAVN_ENDPOINTS) {
    try {
      const url = `${base}?${query.toString()}`;
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(6500)
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (err) {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        }
      }
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('All Saavn endpoints failed');
}

// ---------------------------------------------------------------------------
// API Endpoints
// ---------------------------------------------------------------------------

// 1. Homepage: Curated & Trending, Daily Playlists, Top Charts, New Releases
app.get('/api/home', async (req, res) => {
  try {
    const data = await fetchSaavn('content.getHomepageData');

    const charts = (data.charts || []).map(c => ({
      id: c.listid || c.id,
      title: cleanHtml(c.listname || c.title),
      image: formatArtworkUrl(c.image),
      count: c.count || 30,
      type: 'chart'
    }));

    const featuredPlaylists = (data.featured_playlists || []).map(p => ({
      id: p.listid || p.id,
      title: cleanHtml(p.listname || p.title),
      subtitle: cleanHtml(p.subtitle || p.more_info?.firstname || ''),
      image: formatArtworkUrl(p.image),
      count: p.more_info?.song_count || p.count || 20,
      type: 'playlist'
    }));

    const newAlbums = (data.new_albums || []).map(a => ({
      id: a.id || a.albumid,
      title: cleanHtml(a.title || a.name),
      artist: cleanHtml(a.more_info?.artistMap?.primary_artists?.[0]?.name || a.subtitle || a.music || ''),
      image: formatArtworkUrl(a.image),
      year: a.year || a.more_info?.release_date || '',
      type: 'album'
    }));

    // Pre-fetch top trending songs
    let trendingSongs = [];
    if (charts.length > 0) {
      try {
        const chartDetails = await fetchSaavn('playlist.getDetails', { listid: charts[0].id });
        const songsList = chartDetails.songs || chartDetails.list || [];
        trendingSongs = songsList.slice(0, 20).map(formatTrack).filter(Boolean);
      } catch (e) {
        console.error('Failed to pre-fetch top chart songs:', e.message);
      }
    }

    res.json({
      success: true,
      charts,
      featuredPlaylists,
      newAlbums,
      trendingSongs
    });
  } catch (err) {
    console.error('Home API Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Search Autocomplete Suggestions
app.get('/api/suggestions', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ success: true, suggestions: [] });
  try {
    const data = await fetchSaavn('autocomplete.get', { query });
    const suggestions = [];

    if (data.songs?.data) {
      data.songs.data.forEach(s => {
        suggestions.push({
          type: 'song',
          id: s.id,
          title: cleanHtml(s.title),
          subtitle: cleanHtml(s.description || s.music || ''),
          image: formatArtworkUrl(s.image)
        });
      });
    }

    if (data.albums?.data) {
      data.albums.data.forEach(a => {
        suggestions.push({
          type: 'album',
          id: a.id,
          title: cleanHtml(a.title),
          subtitle: cleanHtml(a.description || a.music || 'Album'),
          image: formatArtworkUrl(a.image)
        });
      });
    }

    if (data.playlists?.data) {
      data.playlists.data.forEach(p => {
        suggestions.push({
          type: 'playlist',
          id: p.id,
          title: cleanHtml(p.title),
          subtitle: cleanHtml(p.description || 'Playlist'),
          image: formatArtworkUrl(p.image)
        });
      });
    }

    if (data.artists?.data) {
      data.artists.data.forEach(art => {
        suggestions.push({
          type: 'artist',
          id: art.id,
          title: cleanHtml(art.title),
          subtitle: cleanHtml(art.description || 'Artist'),
          image: formatArtworkUrl(art.image)
        });
      });
    }

    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function cleanSearchQuery(q) {
  if (!q) return '';
  return q
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/\b(feat|ft|official|video|audio|lyrics|remix|slowed|reverb|hd|4k)\b/gi, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 3. Search: songs, albums, playlists, artists (Multi-tier deep search)
app.get('/api/search', async (req, res) => {
  const rawQuery = req.query.q;
  if (!rawQuery) return res.json({ success: true, songs: [], albums: [], playlists: [], artists: [] });

  const page = req.query.p || 1;
  const limit = req.query.n || 30;
  const query = rawQuery.trim();
  const cleaned = cleanSearchQuery(query);

  let songPart = '';
  let artistPart = '';
  if (/\s+by\s+/i.test(query)) {
    const parts = query.split(/\s+by\s+/i);
    songPart = cleanSearchQuery(parts[0] || '');
    artistPart = cleanSearchQuery(parts[1] || '');
  }

  try {
    const fetchPromises = [
      fetchSaavn('search.getResults', { q: query, p: page, n: limit }).catch(() => ({})),
      fetchSaavn('autocomplete.get', { query: query }).catch(() => ({})),
      fetchSaavn('search.getAlbumResults', { q: query, p: 1, n: 8 }).catch(() => ({})),
      fetchSaavn('search.getPlaylistResults', { q: query, p: 1, n: 8 }).catch(() => ({})),
      fetchSaavn('search.getArtistResults', { q: query, p: 1, n: 8 }).catch(() => ({}))
    ];

    if (songPart) {
      fetchPromises.push(fetchSaavn('search.getResults', { q: songPart, p: 1, n: 15 }).catch(() => ({})));
      fetchPromises.push(fetchSaavn('autocomplete.get', { query: songPart }).catch(() => ({})));
    }

    const [songData, acData, albumData, playlistData, artistData, songPartData, songPartAcData] = await Promise.all(fetchPromises);

    // Exact matches from autocomplete (JioSaavn exact title matcher)
    let exactAcSongs = [];
    const rawAcList = [
      ...(acData?.songs?.data || []),
      ...(songPartAcData?.songs?.data || [])
    ];
    const acPids = rawAcList.slice(0, 8).map(s => s.id).filter(Boolean);
    if (acPids.length > 0) {
      try {
        const detailsData = await fetchSaavn('song.getDetails', { pids: acPids.join(',') });
        const songsList = detailsData.songs || Object.values(detailsData).filter(x => x && x.id);
        exactAcSongs = songsList.map(formatTrack).filter(Boolean);
      } catch (e) {}
    }

    // Main search results
    const mainSongs = [
      ...(songData.results || []).map(formatTrack).filter(Boolean),
      ...(songPartData?.results || []).map(formatTrack).filter(Boolean)
    ];

    // If query has extra terms and results are low, fallback with cleaned query
    let fallbackSongs = [];
    if (mainSongs.length < 5 && cleaned && cleaned.toLowerCase() !== query.toLowerCase()) {
      try {
        const fbData = await fetchSaavn('search.getResults', { q: cleaned, p: 1, n: 15 });
        fallbackSongs = (fbData.results || []).map(formatTrack).filter(Boolean);
      } catch (e) {}
    }

    // Merge exact matches first, then main results, deduplicated by ID & title
    const allSongs = [...exactAcSongs, ...mainSongs, ...fallbackSongs];
    const seenIds = new Set();
    const seenTitles = new Set();
    const songs = [];
    for (const s of allSongs) {
      if (!s || !s.id || seenIds.has(s.id)) continue;
      const key = `${s.title.toLowerCase().trim()}|${s.artist.toLowerCase().trim()}`;
      if (seenTitles.has(key)) continue;
      seenIds.add(s.id);
      seenTitles.add(key);
      songs.push(s);
    }

    const albums = (albumData.results || []).map(a => ({
      id: a.id || a.albumid,
      title: cleanHtml(a.title || a.name),
      artist: cleanHtml(a.subtitle || a.music || a.artist || ''),
      image: formatArtworkUrl(a.image),
      year: a.year || '',
      type: 'album'
    }));

    const playlists = (playlistData.results || []).map(p => ({
      id: p.id || p.listid,
      title: cleanHtml(p.title || p.listname),
      subtitle: cleanHtml(p.subtitle || p.more_info?.firstname || 'Playlist'),
      image: formatArtworkUrl(p.image),
      count: p.more_info?.song_count || p.count || '',
      type: 'playlist'
    }));

    const artists = (artistData.results || []).map(art => ({
      id: art.id || art.artistid,
      name: cleanHtml(art.name || art.title),
      role: cleanHtml(art.role || 'Artist'),
      image: formatArtworkUrl(art.image),
      type: 'artist'
    }));

    res.json({
      success: true,
      songs,
      albums,
      playlists,
      artists
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Song Details
app.get('/api/song/:id', async (req, res) => {
  const songId = req.params.id;
  try {
    const data = await fetchSaavn('song.getDetails', { pids: songId });
    const rawSong = data.songs?.[0] || data[songId] || (Array.isArray(data) ? data[0] : null);
    if (!rawSong) {
      return res.status(404).json({ success: false, message: 'Song not found' });
    }
    const track = formatTrack(rawSong);
    res.json({ success: true, track });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Playlist / Chart Details
app.get('/api/playlist/:id', async (req, res) => {
  const listId = req.params.id;
  try {
    const data = await fetchSaavn('playlist.getDetails', { listid: listId });
    const rawSongs = data.songs || data.list || [];
    const songs = rawSongs.map(formatTrack).filter(Boolean);

    res.json({
      success: true,
      playlist: {
        id: data.listid || listId,
        title: cleanHtml(data.listname || data.title),
        subtitle: cleanHtml(data.subtitle || data.more_info?.firstname || ''),
        image: formatArtworkUrl(data.image),
        count: songs.length,
        songs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Album Details
app.get('/api/album/:id', async (req, res) => {
  const albumId = req.params.id;
  try {
    const data = await fetchSaavn('content.getAlbumDetails', { albumid: albumId });
    const rawSongs = data.songs || data.list || [];
    const songs = rawSongs.map(formatTrack).filter(Boolean);

    res.json({
      success: true,
      album: {
        id: data.id || albumId,
        title: cleanHtml(data.title || data.name),
        artist: cleanHtml(data.subtitle || data.primary_artists || data.music || ''),
        image: formatArtworkUrl(data.image),
        year: data.year || data.release_date || '',
        count: songs.length,
        songs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Artist Details
app.get('/api/artist/:id', async (req, res) => {
  const artistId = req.params.id;
  try {
    const data = await fetchSaavn('artist.getArtistPageDetails', { artistId });
    const rawSongs = data.topSongs?.songs || data.top_songs || [];
    const songs = rawSongs.map(formatTrack).filter(Boolean);

    const rawAlbums = data.topAlbums?.albums || data.top_albums || [];
    const albums = rawAlbums.map(a => ({
      id: a.id || a.albumid,
      title: cleanHtml(a.title || a.name),
      image: formatArtworkUrl(a.image),
      year: a.year || '',
      type: 'album'
    }));

    res.json({
      success: true,
      artist: {
        id: data.artistId || artistId,
        name: cleanHtml(data.name),
        subtitle: cleanHtml(data.subtitle || ''),
        image: formatArtworkUrl(data.image),
        bio: cleanHtml(data.bio || ''),
        followers: data.follower_count || data.fan_count || '',
        topSongs: songs,
        albums
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Recommendations & Radio
app.get(['/api/recommendations', '/api/radio'], async (req, res) => {
  const songId = req.query.id;
  if (!songId) {
    // Return general top radio tracks
    try {
      const data = await fetchSaavn('content.getHomepageData');
      const chartId = data.charts?.[0]?.listid || '946682072';
      const chartDetails = await fetchSaavn('playlist.getDetails', { listid: chartId });
      const rawSongs = chartDetails.songs || chartDetails.list || [];
      const recommendations = rawSongs.slice(0, 30).map(formatTrack).filter(Boolean);
      return res.json({ success: true, recommendations });
    } catch (e) {
      return res.json({ success: true, recommendations: [] });
    }
  }

  try {
    const data = await fetchSaavn('reco.getreco', { pid: songId });
    let rawList = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && typeof data === 'object') {
      rawList = data[songId] || Object.values(data)[0] || [];
    }
    const recommendations = (rawList || []).map(formatTrack).filter(Boolean);
    res.json({ success: true, recommendations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Synced & Plain Lyrics (from LRCLIB + Saavn)
app.get('/api/lyrics', async (req, res) => {
  const { title, artist, duration } = req.query;
  if (!title) return res.status(400).json({ success: false, error: 'Title required' });

  try {
    const cleanTitle = title
      .replace(/\s*\(.*?(feat|ft|remastered|version|from|bonus|official).*?\)/gi, '')
      .replace(/\s*\[.*?\]/gi, '')
      .trim();

    const cleanArtist = (artist || '')
      .split(',')[0]
      .split('&')[0]
      .trim();

    const lrclibUrl = new URL('https://lrclib.net/api/get');
    lrclibUrl.searchParams.set('track_name', cleanTitle);
    if (cleanArtist) lrclibUrl.searchParams.set('artist_name', cleanArtist);
    if (duration) lrclibUrl.searchParams.set('duration', Math.round(Number(duration)));

    const lrcRes = await fetch(lrclibUrl.toString(), {
      headers: {
        'User-Agent': 'ZyloMusic/1.0.0 (https://github.com/HemantKArya/BloomeeTunes)'
      }
    });

    if (lrcRes.ok) {
      const lrcData = await lrcRes.json();
      return res.json({
        success: true,
        synced: lrcData.syncedLyrics || null,
        plain: lrcData.plainLyrics || null
      });
    }

    // Try search endpoint
    const searchUrl = new URL('https://lrclib.net/api/search');
    searchUrl.searchParams.set('q', `${cleanTitle} ${cleanArtist}`);
    const searchRes = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': 'ZyloMusic/1.0.0' }
    });

    if (searchRes.ok) {
      const searchItems = await searchRes.json();
      if (Array.isArray(searchItems) && searchItems.length > 0) {
        const item = searchItems[0];
        return res.json({
          success: true,
          synced: item.syncedLyrics || null,
          plain: item.plainLyrics || null
        });
      }
    }

    res.json({ success: true, synced: null, plain: null });
  } catch (err) {
    res.json({ success: true, synced: null, plain: null });
  }
});

// 10. Spotify Import Endpoint
app.post('/api/import/spotify', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'Missing Spotify URL' });

  try {
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);

    const embedUrl = playlistMatch
      ? `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`
      : albumMatch
      ? `https://open.spotify.com/embed/album/${albumMatch[1]}`
      : null;

    if (!embedUrl) {
      return res.status(400).json({ success: false, error: 'Invalid Spotify Playlist or Album URL' });
    }

    const resp = await fetch(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await resp.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

    if (!match) {
      return res.status(400).json({ success: false, error: 'Could not extract playlist data from Spotify.' });
    }

    const data = JSON.parse(match[1]);
    const entity = data.props?.pageProps?.state?.data?.entity;
    const title = entity?.name || 'Imported Spotify Playlist';
    const image = entity?.images?.[0]?.url || '/assets/zylo_logo.png';
    const rawTracks = entity?.trackList || [];

    // Format tracks
    const extractedTracks = rawTracks.map(t => ({
      title: cleanHtml(t.title || ''),
      artist: cleanHtml(t.subtitle || ''),
      duration: Math.round((t.duration || 0) / 1000)
    })).filter(t => t.title);

    // Auto-match top 30 tracks into playable streams immediately WITHOUT changing original titles/artists!
    const resolvedTracks = [];
    const eagerCount = Math.min(extractedTracks.length, 30);
    for (let i = 0; i < eagerCount; i++) {
      const item = extractedTracks[i];
      try {
        const cleanT = cleanSearchQuery(item.title);
        const cleanA = cleanSearchQuery(item.artist);
        let searchRes = await fetchSaavn('search.getResults', {
          q: `${cleanT} ${cleanA}`.trim(),
          p: 1,
          n: 2
        }).catch(() => ({}));
        let matched = (searchRes.results || []).map(formatTrack).filter(Boolean)[0];

        if (!matched && cleanT) {
          const acData = await fetchSaavn('autocomplete.get', { query: cleanT }).catch(() => ({}));
          const pids = (acData.songs?.data || []).slice(0, 2).map(s => s.id).filter(Boolean);
          if (pids.length > 0) {
            const detailsData = await fetchSaavn('song.getDetails', { pids: pids.join(',') }).catch(() => ({}));
            const songsList = detailsData.songs || Object.values(detailsData).filter(x => x && x.id);
            matched = songsList.map(formatTrack).filter(Boolean)[0];
          }
        }

        resolvedTracks.push({
          id: matched ? matched.id : `sp_${Date.now()}_${i}`,
          title: item.title, // PRESERVE EXACT ORIGINAL TITLE
          artist: item.artist, // PRESERVE EXACT ORIGINAL ARTIST
          album: matched?.album || title,
          duration: item.duration || matched?.duration || 210,
          image: matched?.image || image || '/assets/zylo_logo.png',
          streams: matched?.streams || null,
          stream_url: matched?.stream_url || null
        });
      } catch (e) {
        resolvedTracks.push({
          id: `sp_${Date.now()}_${i}`,
          title: item.title,
          artist: item.artist,
          duration: item.duration,
          image: image || '/assets/zylo_logo.png',
          streams: null,
          stream_url: null
        });
      }
    }

    // Add remaining tracks (will be resolved lazily when played)
    for (let i = eagerCount; i < extractedTracks.length; i++) {
      const item = extractedTracks[i];
      resolvedTracks.push({
        id: `sp_${Date.now()}_${i}`,
        title: item.title,
        artist: item.artist,
        duration: item.duration,
        image: image || '/assets/zylo_logo.png',
        streams: null,
        stream_url: null
      });
    }

    const plImage = image || resolvedTracks.find(t => t.image && !t.image.includes('zylo_logo'))?.image || resolvedTracks[0]?.image || '/assets/zylo_logo.png';
    res.json({
      success: true,
      playlist: {
        id: 'sp_pl_' + Date.now(),
        name: title,
        image: plImage,
        tracks: resolvedTracks
      }
    });
  } catch (err) {
    console.error('Spotify import error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. YouTube Playlist Import Endpoint
app.post('/api/import/youtube', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'Missing YouTube URL' });

  try {
    const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const playlistId = listMatch ? listMatch[1] : (url.startsWith('PL') ? url : null);

    if (!playlistId) {
      return res.status(400).json({ success: false, error: 'Invalid YouTube Playlist URL or ID' });
    }

    const browseId = 'VL' + playlistId;
    const body = JSON.stringify({
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20231219.01.00',
          hl: 'en',
          gl: 'US'
        }
      },
      browseId
    });

    const ytRes = await fetch('https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/'
      },
      body
    });

    const data = await ytRes.json();
    const title = data.metadata?.playlistMetadataRenderer?.title ||
                  data.header?.playlistHeaderRenderer?.title?.simpleText ||
                  data.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text ||
                  'Imported YouTube Playlist';

    const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
    const sectionList = tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
    const itemSectionContents = sectionList?.[0]?.itemSectionRenderer?.contents || [];

    const extractedTracks = [];
    itemSectionContents.forEach(item => {
      const lockup = item.lockupViewModel;
      if (lockup) {
        const meta = lockup.metadata?.lockupMetadataViewModel;
        const songTitle = meta?.title?.content;
        const artist = meta?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content || '';
        if (songTitle) {
          extractedTracks.push({ title: cleanHtml(songTitle), artist: cleanHtml(artist) });
        }
      }
    });

    if (!extractedTracks.length) {
      return res.status(400).json({ success: false, error: 'No songs found in this YouTube Playlist' });
    }

    // Auto-match first 15 tracks WITHOUT changing original titles/artists!
    const resolvedTracks = [];
    for (let i = 0; i < Math.min(extractedTracks.length, 15); i++) {
      const item = extractedTracks[i];
      try {
        const cleanT = cleanSearchQuery(item.title);
        const cleanA = cleanSearchQuery(item.artist);
        const searchRes = await fetchSaavn('search.getResults', {
          q: `${cleanT} ${cleanA}`.trim(),
          p: 1,
          n: 1
        });
        const matched = (searchRes.results || []).map(formatTrack).filter(Boolean)[0];
        resolvedTracks.push({
          id: matched ? matched.id : `yt_${Date.now()}_${i}`,
          title: item.title, // PRESERVE EXACT ORIGINAL TITLE
          artist: item.artist, // PRESERVE EXACT ORIGINAL ARTIST
          album: matched?.album || title,
          duration: matched?.duration || 210,
          image: matched?.image || '/assets/zylo_logo.png',
          streams: matched?.streams || null,
          stream_url: matched?.stream_url || null
        });
      } catch (e) {
        resolvedTracks.push({
          id: `yt_${Date.now()}_${i}`,
          title: item.title,
          artist: item.artist,
          duration: 210,
          image: '/assets/zylo_logo.png',
          streams: null,
          stream_url: null
        });
      }
    }

    for (let i = 15; i < extractedTracks.length; i++) {
      const item = extractedTracks[i];
      resolvedTracks.push({
        id: `yt_${Date.now()}_${i}`,
        title: item.title,
        artist: item.artist,
        duration: 210,
        image: '/assets/zylo_logo.png',
        streams: null,
        stream_url: null
      });
    }

    const coverImage = resolvedTracks.find(t => t.image && !t.image.includes('zylo_logo'))?.image || resolvedTracks[0]?.image || '/assets/zylo_logo.png';

    res.json({
      success: true,
      playlist: {
        id: 'yt_pl_' + Date.now(),
        name: title,
        image: coverImage,
        tracks: resolvedTracks
      }
    });
  } catch (err) {
    console.error('YouTube import error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Robust Lazy Resolution endpoint (finds stream without altering original title/artist)
app.get('/api/resolve', async (req, res) => {
  const { title, artist } = req.query;
  if (!title) return res.status(400).json({ success: false });

  try {
    const cleanT = cleanSearchQuery(title);
    const cleanA = cleanSearchQuery(artist || '');

    // Tier 1: Search title + artist
    let searchRes = await fetchSaavn('search.getResults', {
      q: `${cleanT} ${cleanA}`.trim(),
      p: 1,
      n: 5
    }).catch(() => ({}));
    let matched = (searchRes.results || []).map(formatTrack).filter(Boolean)[0];

    // Tier 2: Autocomplete on title
    if (!matched && cleanT) {
      const acData = await fetchSaavn('autocomplete.get', { query: cleanT }).catch(() => ({}));
      const pids = (acData.songs?.data || []).slice(0, 3).map(s => s.id).filter(Boolean);
      if (pids.length > 0) {
        const detailsData = await fetchSaavn('song.getDetails', { pids: pids.join(',') }).catch(() => ({}));
        const songsList = detailsData.songs || Object.values(detailsData).filter(x => x && x.id);
        matched = songsList.map(formatTrack).filter(Boolean)[0];
      }
    }

    // Tier 3: Search title only
    if (!matched && cleanT) {
      searchRes = await fetchSaavn('search.getResults', {
        q: cleanT,
        p: 1,
        n: 5
      }).catch(() => ({}));
      matched = (searchRes.results || []).map(formatTrack).filter(Boolean)[0];
    }

    if (matched) {
      return res.json({
        success: true,
        track: {
          streams: matched.streams,
          stream_url: matched.stream_url,
          duration: matched.duration,
          image: matched.image
        },
        streams: matched.streams,
        stream_url: matched.stream_url,
        duration: matched.duration,
        image: matched.image
      });
    }
    res.json({ success: false });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// 13. iOS-friendly Audio Stream Proxy with Full HTTP Range Support (206 Partial Content)
app.get('/api/stream', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url parameter');

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    return res.status(400).send('Invalid url');
  }

  const client = parsed.protocol === 'https:' ? https : http;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': '*/*'
  };

  if (req.headers.range) {
    headers['Range'] = req.headers.range;
  }

  const proxyReq = client.request(parsed, {
    method: 'GET',
    headers: headers
  }, (proxyRes) => {
    res.status(proxyRes.statusCode);

    const forwardHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified'
    ];

    forwardHeaders.forEach(h => {
      if (proxyRes.headers[h]) {
        res.setHeader(h, proxyRes.headers[h]);
      }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(502).send('Error streaming audio');
    }
  });

  req.on('close', () => {
    proxyReq.destroy();
  });

  proxyReq.end();
});

// Fallback route to serve SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// Server Startup & Serverless Export
// ---------------------------------------------------------------------------
module.exports = app;

if (!process.env.VERCEL) {
  const primaryServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🎵 Zylo Music Server is running!`);
    console.log(`Created by infas.mk`);
    console.log(`Local Access:       http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
    console.log(`iOS / Wi-Fi Access: http://172.20.10.2:${PORT}`);
    console.log(`Secondary Access:   http://localhost:3005`);
    console.log(`======================================================\n`);
  });

  primaryServer.on('error', (err) => {
    console.error(`Port ${PORT} error:`, err.message);
  });

  // Also listen on 3005 so localhost won't collide with any IPv6 apps on port 3000
  const altServer = app.listen(3005, '0.0.0.0', () => {
    console.log(`Zylo also active on http://localhost:3005`);
  });
  altServer.on('error', () => {});
}
