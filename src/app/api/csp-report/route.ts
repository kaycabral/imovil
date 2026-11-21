import { logger } from '@cbrl/log'
import { cspReportRoute } from '@cbrl/next/server'

// Browsers post CSP violation reports here (report-uri / report-to), without
// credentials; URIs arrive stripped of query strings and fragments.
export const POST = cspReportRoute({
  onReport: (violation) => logger.warn('csp violation', { ...violation }),
})
