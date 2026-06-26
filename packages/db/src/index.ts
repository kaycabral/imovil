import { requireEnvOneOf } from '@cbrl/env'
import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { FieldValue, Timestamp, getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getRemoteConfig, type RemoteConfig } from 'firebase-admin/remote-config'

export { FieldValue, Timestamp, type Firestore, type RemoteConfig }

let cachedApp: App | undefined

function getAdminApp(): App {
  if (cachedApp) return cachedApp
  const existing = getApps()[0]
  if (existing) {
    cachedApp = existing
    return existing
  }

  // GCLOUD_PROJECT / GOOGLE_CLOUD_PROJECT are the standard project vars that
  // Cloud Run/Functions and `firebase emulators:exec` inject — include them so
  // the admin SDK resolves the project under the emulator e2e suite (and in
  // deployed runtimes) without an explicit override.
  const projectId = requireEnvOneOf(
    'FIREBASE_ADMIN_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'GCLOUD_PROJECT',
    'GOOGLE_CLOUD_PROJECT',
  )

  // Emulator short-circuit: skip credential resolution when running against the emulator suite.
  const isEmulator =
    !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_AUTH_EMULATOR_HOST
  if (isEmulator) {
    cachedApp = initializeApp({ projectId })
    return cachedApp
  }

  // Two auth modes:
  // - Service account JSON via FIREBASE_ADMIN_{CLIENT_EMAIL,PRIVATE_KEY}: useful for local
  //   dev without the emulator, and in environments where the org allows minting SA keys.
  // - Application Default Credentials (default): used in App Hosting / Cloud Run, where the
  //   runtime service account is auto-discovered. No JSON key needed — and required when
  //   the org policy `iam.disableServiceAccountKeyCreation` blocks key creation.
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const credential =
    clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault()

  cachedApp = initializeApp({ credential, projectId })
  return cachedApp
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}

// Server-side Firebase Remote Config. Use `template.evaluate()` to resolve a
// snapshot of the parameters. Caching is the caller's responsibility — wrap
// in React.cache when used from server components.
export function getAdminRemoteConfig(): RemoteConfig {
  return getRemoteConfig(getAdminApp())
}
