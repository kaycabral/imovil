import { getAdminRemoteConfig } from '@tekoa/db'
import { cache } from 'react'

// Feature flags backed by Firebase Remote Config. New flags go here; the
// schema lives in this file (TypeScript) and is mirrored manually in the
// Firebase Console parameter list per environment.

export type Features = {
  /** Lead capture / leads dashboard. False until the feature ships. */
  leads: boolean
}

const DEFAULTS: Features = {
  leads: false,
}

const FETCH_TIMEOUT_MS = 4_000

/**
 * Fetches the Remote Config server template, evaluates it, and returns a
 * typed Features snapshot. Cached per request via `React.cache` so server
 * components composing this don't re-fetch.
 *
 * Falls back to DEFAULTS if Remote Config is unreachable. Specifically:
 *   - Emulator mode (CI / local Firebase emulator) — RC has no emulator,
 *     skip the network call entirely so tests don't hang.
 *   - Any thrown error or timeout — return defaults, never crash the page.
 */
export const getFeatures = cache(async (): Promise<Features> => {
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return DEFAULTS
  }

  try {
    const template = await Promise.race([
      getAdminRemoteConfig().getServerTemplate(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('remote-config timeout')), FETCH_TIMEOUT_MS),
      ),
    ])
    const config = template.evaluate()
    return {
      leads: config.getBoolean('feature_leads'),
    }
  } catch {
    return DEFAULTS
  }
})
