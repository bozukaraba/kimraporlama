import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA0kJj_OXa9Qrzi9VHjZ99mk5jloKvnqIE",
  authDomain: "kimraporlama.firebaseapp.com",
  projectId: "kimraporlama",
  storageBucket: "kimraporlama.firebasestorage.app",
  messagingSenderId: "311661651825",
  appId: "1:311661651825:web:cd73e51a812a09cebdf8d0"
};

const app = initializeApp(firebaseConfig);

// Debug için
console.log('Firebase config:', firebaseConfig);
console.log('Firebase app:', app);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Debug için
console.log('Auth instance:', auth);
console.log('Firestore instance:', db);

export default app; 