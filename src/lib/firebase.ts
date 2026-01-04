import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: 'studio-5726715282-ae599',
  appId: '1:273761981942:web:bd7ede059c1e4a953be3d7',
  apiKey: 'AIzaSyD1j9gNDdFUa-a4tg4EMGu66TOXDDynrBo',
  authDomain: 'studio-5726715282-ae599.firebaseapp.com',
  storageBucket: 'studio-5726715282-ae599.appspot.com',
  messagingSenderId: '273761981942',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
