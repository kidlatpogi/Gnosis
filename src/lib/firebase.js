// Firebase v9 Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration using environment variables
// In production (Vercel), set these as environment variables
// In development, use .env file with VITE_ prefix
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCowBbtT_6nujsccz4rjj1TvI7eOLsGFFM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gnosis-c104d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gnosis-c104d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gnosis-c104d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "669346897474",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:669346897474:web:3aba36f430999cc61097db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
