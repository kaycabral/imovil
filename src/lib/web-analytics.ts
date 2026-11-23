import type { BeforeSendEvent } from '@vercel/analytics/next'

// Path prefixes whose bracketed segments are replaced by the placeholder before
// a page view leaves the browser. First match wins, so static siblings come
// before the dynamic rule they would otherwise match. Public listing slugs
// (`/imoveis/[slug]`) are published content and stay as they are.
const PATH_RULES: readonly (readonly string[])[] = [
  '/painel/imoveis/novo',
  '/painel/imoveis/[id]',
].map((rule) => rule.split('/'))

function isPlaceholder(part: string): boolean {
  return part.startsWith('[') && part.endsWith(']')
}

function matches(segments: readonly string[], rule: readonly string[]): boolean {
  return (
    segments.length >= rule.length &&
    rule.every((part, index) => isPlaceholder(part) || part === segments[index])
  )
}

function redactPath(pathname: string): string {
  const segments = pathname.split('/')
  const rule = PATH_RULES.find((candidate) => matches(segments, candidate))
  if (!rule) return pathname
  return segments.map((segment, index) => rule[index] ?? segment).join('/')
}

/** Origin + redacted path: query string and fragment never leave the browser. */
export function redactAnalyticsUrl(url: string): string | null {
  if (!URL.canParse(url)) return null
  const parsed = new URL(url)
  return `${parsed.origin}${redactPath(parsed.pathname)}`
}

/** `beforeSend` for `<Analytics />`: drops the event when the URL is unparseable. */
export function redactAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = redactAnalyticsUrl(event.url)
  return url === null ? null : { ...event, url }
}
