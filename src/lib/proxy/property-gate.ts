import type { PropertyStatus } from '@/shared'

const PROPERTY_PATH = /^\/imoveis\/([^/]+)\/?$/

/** The slug of a `/imoveis/:slug` page, or null for any other path. */
export function propertySlugFromPath(pathname: string): string | null {
  const match = PROPERTY_PATH.exec(pathname)
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

type Visibility = { status: PropertyStatus; ownerId: string } | null

export type PropertyGateDeps = {
  /** Status + owner by slug; null when the slug does not exist. May throw. */
  lookup: (slug: string) => Promise<Visibility>
  /** Signed-in user id, read only when the property is not published. */
  viewerId: () => Promise<string | null>
  timeoutMs?: number
}

/** Budget for the lookup: past it the page renders as before. */
export const PROPERTY_GATE_TIMEOUT_MS = 1500

/**
 * Whether `/imoveis/:slug` must answer 404 before the page starts streaming.
 * With Cache Components the shell goes out with a 200, so a `notFound()` in the
 * page cannot change the status: the check has to happen in the proxy.
 *
 * Only a missing slug, or an unpublished one seen by anyone but its owner, is a
 * 404. A failing or slow lookup returns false: the page keeps its own checks
 * and its "backend unavailable" state.
 */
export async function isPropertyNotFound(slug: string, deps: PropertyGateDeps): Promise<boolean> {
  const { lookup, viewerId, timeoutMs = PROPERTY_GATE_TIMEOUT_MS } = deps
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), timeoutMs)
  })
  try {
    const found = await Promise.race([lookup(slug), timeout])
    if (found === 'timeout') return false
    if (!found) return true
    if (found.status === 'published') return false
    return (await viewerId()) !== found.ownerId
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
