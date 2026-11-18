import { readEnvFlag } from '@imovil/env'

// Feature flags read from env (per Vercel environment). New flags go here as
// `IMOVIL_FEATURE_<NAME>`; unset means off.

export type Features = {
  /** Lead capture / leads dashboard. False until the feature ships. */
  leads: boolean
}

export function getFeatures(): Features {
  return {
    leads: readEnvFlag('IMOVIL_FEATURE_LEADS'),
  }
}
