# Zylo Music 🎵

> **Created by infas.mk**

A premium, modern music streaming web application and PWA inspired by Apple Music and the Melvora design system, tailored for iOS (iPhone & iPad) and desktop browsers.

---

## ✨ Highlights & Features

- **Melvora Liquid Glass & 3D Design**:
  - Deep dark surfaces (`#09090F`, `#14141E`, `#1C1C28`) with soft lime-green accents (`#C7F464`).
  - Subtle background Aurora glow with glassmorphic cards and 3D specular depth.
  - Floating pill glass navigation bar with safe-area support for iOS notch and home bar.
- **Dynamic Artwork & Visuals**:
  - Playlists automatically use song cover art, with the Zylo 3D emblem as a minimal fallback.
  - Smooth right-to-left marquee animation for long song titles.
  - Real-time animated sound equalizer on active tracks.
- **Audio Streaming & Control**:
  - Multi-bitrate streaming (up to **320 kbps AAC**, 160 kbps, 96 kbps).
  - Native iOS Lock Screen & Control Center (`navigator.mediaSession`) support with live artwork, scrub bar, and remote controls.
  - Built-in **Sleep Timer** (15m, 30m, 45m, 60m, custom).
- **Time-Synced Lyrics**:
  - Interactive karaoke lyrics (via LRCLIB) that highlight and scroll automatically with playback.
  - Tap any lyric line to jump directly to that moment in the track.
- **Import & Search**:
  - **Spotify Import**: Paste any Spotify track, album, or playlist link to import directly.
  - **YouTube Import**: Import playlists from YouTube with original titles preserved.
  - Robust multi-tier search engine finding regional, indie, and global music.
- **Library & Playlist Management**:
  - Create, rename, and manage custom playlists.
  - **Reorder tracks** (▲ / ▼) and remove tracks (✕) with instant save.
  - One-tap favorites (**Liked Songs**) and listening **History**.
  - **Offline Downloads**: Download tracks and playlists locally for offline listening.
- **PWA (Progressive Web App)**:
  - Add to Home Screen on iOS Safari for full-screen, native app experience without App Store installation.

---

## 🚀 Running Locally

```bash
git clone https://github.com/infasmk/zylo.git
cd zylo
npm install
npm start
```

- **Local PC**: `http://localhost:3000` (or `http://localhost:3005`)
- **iOS Device on Wi-Fi**: `http://<YOUR_LOCAL_IP>:3000` (e.g. `http://172.20.10.2:3000`)

---

## 📲 Install on iPhone / iPad (iOS Safari)

1. Connect your iPhone to the same Wi-Fi / hotspot as the server.
2. Open **Safari** and navigate to your server's address (e.g. `http://172.20.10.2:3000`).
3. Tap the **Share** button (square icon with an arrow pointing up) at the bottom.
4. Select **"Add to Home Screen"**.
5. Tap **Add** in the top-right corner.
6. Launch **Zylo** from your home screen for full standalone audio streaming!

---

## 👤 Credits

Created and curated by **infas.mk**.
