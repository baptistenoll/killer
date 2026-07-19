import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
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

export const auth = isFirebaseConfigured ? getAuth(app) : (null as unknown as Auth)
export const db = isFirebaseConfigured ? getFirestore(app) : (null as unknown as Firestore)
