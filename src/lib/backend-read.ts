import { logger } from '@cbrl/log'

export const BACKEND_READ_TIMEOUT_MS = 4_000

export type BackendRead<T> = { ok: true; data: T } | { ok: false }

/**
 * Runs a server-side backend read (Postgres, Supabase Auth) so that an
 * unavailable backend degrades the page instead of crashing it.
 *
 * Covers the three ways a read fails when the backend is not there:
 *   - throws synchronously (missing env → `requireEnv*`)
 *   - rejects (bad credentials, permission, network)
 *   - hangs (the database or the local stack does not answer)
 *
 * The caller decides what the degraded UI looks like from `ok: false`.
 */
export async function readBackend<T>(
  label: string,
  read: () => Promise<T>,
  timeoutMs: number = BACKEND_READ_TIMEOUT_MS,
): Promise<BackendRead<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs)
    })
    const data = await Promise.race([read(), timeout])
    return { ok: true, data }
  } catch (error) {
    logger.error('backend read unavailable', { read: label, err: error })
    return { ok: false }
  } finally {
    clearTimeout(timer)
  }
}
