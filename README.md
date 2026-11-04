# BloomeeTunes Web Edition 🎵

A fully featured, responsive Web & PWA adaptation of the [BloomeeTunes](https://github.com/HemantKArya/BloomeeTunes) music player, designed specifically for iOS devices (iPhone & iPad) and desktop browsers.

---

## ✨ Features

- **High-Quality Audio Streaming**: Stream music at up to **320 kbps AAC**, 160 kbps, or 96 kbps.
- **Native iOS Lock Screen & Control Center Controls**: Full `navigator.mediaSession` integration with live artwork, scrub bar, track details, play/pause, previous, and next controls.
- **Time-Synced Lyrics**: Real-time karaoke lyrics (powered by LRCLIB) that automatically highlight and scroll with playback. Tap any line to seek directly to that moment.
- **Complete Music Catalog**:
  - **Explore**: Global & regional Top Charts, Trending Tracks, Featured Playlists, and New Releases.
  - **Search**: Instant debounced search with live autocomplete for songs, albums, playlists, and artists.
  - **Details**: Full album, playlist, and artist pages with "Play All" and "Shuffle All".
- **Local Library**:
  - **Liked Songs**: One-tap favoriting with persistent local storage.
  - **Custom Playlists**: Create, name, and manage custom playlists.
  - **Listening History**: Tracks recently played songs.
- **Autoplay & Bloomee Flow**: Automatically queue similar recommended songs when your playlist or queue ends.
- **Sleep Timer**: Auto-pause playback after 15, 30, 45, or 60 minutes.
- **iOS PWA Standalone Mode**:
  - Add to Home Screen on iOS Safari for a native app feel with safe-area notch and home indicator padding.
  - No App Store or sideloading required.

---

## 🚀 Running Locally

```bash
cd bloomee_web
npm install
npm start
```

- **Local PC**: `http://localhost:3000`
- **iOS Device on same network**: `http://<YOUR_LOCAL_IP>:3000` (e.g. `http://172.20.10.2:3000`)

---

## 📲 How to Install as an App on your iPhone

1. Connect your iPhone to the same Wi-Fi (or hotspot) as your computer.
2. Open **Safari** on your iPhone and go to:
   ```
   http://172.20.10.2:3000
   ```
3. Tap the **Share** button (box with an arrow pointing up) at the bottom of Safari.
4. Scroll down and tap **"Add to Home Screen"**.
5. Tap **"Add"** in the top-right corner.
6. The **Bloomee** icon will now appear on your home screen. Open it to enjoy full-screen, background music playback!
# zylo
