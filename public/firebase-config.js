// ============================================================================
// Zylo Music — Firebase Cloud Sync Configuration
// Created by infas.mk
//
// 1. Visit https://console.firebase.google.com/
// 2. Create or select a project (e.g. "zylo-music")
// 3. Enable Authentication -> Email/Password sign-in provider
// 4. Create a Firestore Database (Start in test mode or with user auth rules)
// 5. In Project Settings -> General -> Your apps -> Web app (</>), register app
// 6. Replace the placeholder values below with your credentials!
//
// TIP: If deploying on Vercel or Render, you can also set environment variables:
// FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
// FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID
// ============================================================================

window.zyloFirebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
