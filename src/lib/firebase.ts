import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "studio-5726715282-ae599.firebaseapp.com",
  projectId: "studio-5726715282-ae599",
  storageBucket: "studio-5726715282-ae599.appspot.com",
  messagingSenderId: "5726715282",
  appId: "1:5726715282:web:35c8e3123845c43232938f"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
