
"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only on the client side
const app = typeof window !== 'undefined' 
  ? !getApps().length ? initializeApp(firebaseConfig) : getApp()
  : null;

const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;
const storage = app ? getStorage(app) : null;
const messaging = app && typeof window !== 'undefined' ? getMessaging(app) : null;


// Explicitly set the auth domain to prevent intermittent issues.
if (auth && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  auth.tenantId = null;
  auth.languageCode = 'en';
}


export { app, db, auth, storage, messaging };
