import { smokeSuite } from '@cbrl/testing/playwright'

// GET /api/health -> 200 { status: 'ok' }, and `/` renders with a title.
smokeSuite()
