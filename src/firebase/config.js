import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration from Firebase Console
// (CVstomize Web App - Session 2)
const firebaseConfig = {
  apiKey: "AIzaSyDJd-QHJAbpj_vWcRCX4QD0vBj03z9B6qI",
  authDomain: "cvstomize.firebaseapp.com",
  projectId: "cvstomize",
  storageBucket: "cvstomize.firebasestorage.app",
  messagingSenderId: "351889420459",
  appId: "1:351889420459:web:3f1d2eac80f44b3d2cc7ee",
  measurementId: "G-8L47NZPTCE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
