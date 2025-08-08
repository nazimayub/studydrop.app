
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "study-buddy-2b5en",
  appId: "1:57530004631:web:6cf7e941282d059db565d2",
  storageBucket: "study-buddy-2b5en.appspot.com",
  apiKey: "AIzaSyCkW61faEjkZM2IvmZ2cPXO-v9bUuZOSCo",
  authDomain: "study-buddy-2b5en.firebaseapp.com",
  messagingSenderId: "57530004631",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Explicitly set the auth domain to prevent intermittent issues.
auth.tenantId = null;
auth.languageCode = 'en';


export { app, db, auth, storage };

