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
// JioSaavn Helpers & Cryptography
// ---------------------------------------------------------------------------
const SAAVN_BASE = 'https://www.jiosaavn.com/api.php';
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
    console.error('DES decrypt error:', err.message);
    return null;
  }
}

function getStreamVariants(decryptedBase) {
  if (!decryptedBase) return {};
  // Check if it already has bitrate suffix like _96 or _160
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
    ...params
  });
  const url = `${SAAVN_BASE}?${query.toString()}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    }
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    // Sometimes Saavn returns trailing HTML or garbage
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// API Endpoints
// ---------------------------------------------------------------------------

// 1. Homepage: Featured playlists, Top charts, New albums, Trending
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

    // Fetch popular trending songs to show directly in Trending
    let trendingSongs = [];
    if (charts.length > 0) {
      try {
        const chartDetails = await fetchSaavn('playlist.getDetails', { listid: charts[0].id });
        const songsList = chartDetails.songs || chartDetails.list || [];
        trendingSongs = songsList.slice(0, 15).map(formatTrack).filter(Boolean);
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

// 3. Search: songs, albums, playlists, artists
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  const page = req.query.p || 1;
  const limit = req.query.n || 20;
  if (!query) return res.json({ success: true, results: [] });

  try {
    const songData = await fetchSaavn('search.getResults', { q: query, p: page, n: limit });
    const songs = (songData.results || []).map(formatTrack).filter(Boolean);

    let albums = [];
    let playlists = [];
    let artists = [];

    try {
      const albumData = await fetchSaavn('search.getAlbumResults', { q: query, p: 1, n: 8 });
      albums = (albumData.results || []).map(a => ({
        id: a.id || a.albumid,
        title: cleanHtml(a.title || a.name),
        artist: cleanHtml(a.subtitle || a.music || a.artist || ''),
        image: formatArtworkUrl(a.image),
        year: a.year || '',
        type: 'album'
      }));
    } catch (e) {}

    try {
      const playlistData = await fetchSaavn('search.getPlaylistResults', { q: query, p: 1, n: 8 });
      playlists = (playlistData.results || []).map(p => ({
        id: p.id || p.listid,
        title: cleanHtml(p.title || p.listname),
        subtitle: cleanHtml(p.subtitle || p.more_info?.firstname || 'Playlist'),
        image: formatArtworkUrl(p.image),
        count: p.more_info?.song_count || p.count || '',
        type: 'playlist'
      }));
    } catch (e) {}

    try {
      const artistData = await fetchSaavn('search.getArtistResults', { q: query, p: 1, n: 8 });
      artists = (artistData.results || []).map(art => ({
        id: art.id || art.artistid,
        name: cleanHtml(art.name || art.title),
        role: cleanHtml(art.role || 'Artist'),
        image: formatArtworkUrl(art.image),
        type: 'artist'
      }));
    } catch (e) {}

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
    const rawSong = data[songId] || (Array.isArray(data) ? data[0] : null);
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

// 8. Related songs / Auto-radio recommendations
app.get('/api/recommendations', async (req, res) => {
  const songId = req.query.id;
  if (!songId) return res.json({ success: true, recommendations: [] });
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

// 9. Synced & Plain Lyrics (from LRCLIB + JioSaavn fallback)
app.get('/api/lyrics', async (req, res) => {
  const { title, artist, duration } = req.query;
  if (!title) return res.status(400).json({ success: false, error: 'Title required' });

  try {
    // Clean track title (strip feat, remastered, etc.)
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
        'User-Agent': 'BloomeeTunes-Web/1.0.0 (https://github.com/HemantKArya/BloomeeTunes)'
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

    // Try search endpoint on LRCLIB
    const searchUrl = new URL('https://lrclib.net/api/search');
    searchUrl.searchParams.set('q', `${cleanTitle} ${cleanArtist}`);
    const searchRes = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'BloomeeTunes-Web/1.0.0'
      }
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

// 10. iOS-friendly Audio Stream Proxy with Full HTTP Range Support (206 Partial Content)
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
    // Forward status code (e.g. 206 Partial Content or 200 OK)
    res.status(proxyRes.statusCode);

    // Forward crucial range & content headers
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
    console.error('Audio stream proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).send('Error streaming audio');
    }
  });

  req.on('close', () => {
    proxyReq.destroy();
  });

  proxyReq.end();
});

// Fallback route to serve SPA for any unhandled routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// Server Startup
// ---------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🎵 BloomeeTunes Web Server is running!`);
  console.log(`Local Access:       http://localhost:${PORT}`);
  console.log(`iOS / Wi-Fi Access: http://172.20.10.2:${PORT}`);
  console.log(`======================================================\n`);
});
