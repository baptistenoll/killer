import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  initializeAuth,
} from 'firebase/auth'
import type { Auth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// getAuth() throws synchronously on an invalid/empty API key, which would otherwise
// crash the whole app before the developer gets a chance to fill in .env.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey)

const app = initializeApp(firebaseConfig)

// Private browsing / restrictive browser profiles can block IndexedDB, which getAuth()'s
// default persistence needs — falling back down this list keeps sign-in working regardless.
export const auth = isFirebaseConfigured
  ? initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
    })
  : (null as unknown as Auth)
export const db = isFirebaseConfigured ? getFirestore(app) : (null as unknown as Firestore)
