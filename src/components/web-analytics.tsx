'use client'

import { redactAnalyticsEvent } from '@/lib/web-analytics'
import { Analytics } from '@vercel/analytics/next'

// Cookieless page views; every URL goes through the redaction before it is sent.
export function WebAnalytics() {
  return <Analytics beforeSend={redactAnalyticsEvent} />
}
