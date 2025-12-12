import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebase configuration from Firebase Console
// (CVstomize Web App - Session 2)
const firebaseConfig = {
  apiKey: "AIzaSyDJd-QHJAbpj_vWcRCX4QD0vBj03z9B6qI",
  authDomain: "cvstomize.firebaseapp.com",
  projectId: "cvstomize",
  storageBucket: "cvstomize.firebasestorage.app",
  messagingSenderId: "351889420459",
  appId: "1:351889420459:web:3f1d2eac80f44b3d2cc7ee",
  measurementId: "G-8L47NZPTCE",
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
