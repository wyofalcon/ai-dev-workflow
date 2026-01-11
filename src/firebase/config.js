import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebase configuration from Firebase Console
// (CVstomize Web App - Session 2)
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyBFLvRSQIE7EHfNTz_tVcoEfuiiB_UmSpo",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "cvstomize.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "cvstomize",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "cvstomize.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "351889420459",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:351889420459:web:3f1d2eac80f44b3d2cc7ee",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-8L47NZPTCE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Connect to Firebase Auth Emulator in development (FREE - no GCP costs)
// Start emulator with: docker compose --profile emulators up
if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  console.log("🔧 Using Firebase Auth Emulator at localhost:9099");
}

export default app;
