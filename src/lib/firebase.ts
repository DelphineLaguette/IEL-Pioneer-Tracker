import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ── Paste your Firebase project config here ───────────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Create a project → Add a Web App → copy the config object below
// 3. In Firestore → Create database → Start in production mode
// 4. In Firestore → Rules → set allow read, write: if true → Publish
const firebaseConfig = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID",
};

// Only initialise Firebase when real values have been pasted in
export const FIREBASE_CONFIGURED =
  !firebaseConfig.projectId.startsWith('REPLACE');

export const db = FIREBASE_CONFIGURED
  ? getFirestore(initializeApp(firebaseConfig))
  : null as never;
