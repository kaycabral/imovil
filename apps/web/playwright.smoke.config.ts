import { defineSmokeConfig } from '@cbrl/testing/playwright'

// Post-deploy smoke against SMOKE_BASE_URL (the deployed URL); fails fast without it.
export default defineSmokeConfig()
