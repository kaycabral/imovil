import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
}

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'

/**
 * False when the public Firebase web config is absent (e.g. running the front
 * without any backend env). `getAuth` throws `auth/invalid-api-key` in that
 * case, so callers check this first and render the signed-out UI instead.
 */
export function isClientFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId)
}

let authEmulatorWired = false
let firestoreEmulatorWired = false
let storageEmulatorWired = false

function getClientApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(config)
}

export function getClientAuth(): Auth {
  const auth = getAuth(getClientApp())
  if (useEmulators && !authEmulatorWired) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    authEmulatorWired = true
  }
  return auth
}

export function getClientDb(): Firestore {
  const db = getFirestore(getClientApp())
  if (useEmulators && !firestoreEmulatorWired) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    firestoreEmulatorWired = true
  }
  return db
}

export function getClientStorage(): FirebaseStorage {
  const storage = getStorage(getClientApp())
  if (useEmulators && !storageEmulatorWired) {
    connectStorageEmulator(storage, '127.0.0.1', 9199)
    storageEmulatorWired = true
  }
  return storage
}
