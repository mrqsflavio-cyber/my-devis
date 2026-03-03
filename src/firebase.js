import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDYfKwxWwOJmjkd8X6y2EVB1kJY_6qIUsQ",
  authDomain: "my-devis-b233d.firebaseapp.com",
  projectId: "my-devis-b233d",
  storageBucket: "my-devis-b233d.firebasestorage.app",
  messagingSenderId: "1041538352421",
  appId: "1:1041538352421:web:5420461638228c4ded06cc",
  measurementId: "G-R05WYQEYHB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
