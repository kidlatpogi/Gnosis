// Firebase v9 Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyCowBbtT_6nujsccz4rjj1TvI7eOLsGFFM",
  authDomain: "gnosis-c104d.firebaseapp.com",
  projectId: "gnosis-c104d",
  storageBucket: "gnosis-c104d.firebasestorage.app",
  messagingSenderId: "669346897474",
  appId: "1:669346897474:web:3aba36f430999cc61097db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
