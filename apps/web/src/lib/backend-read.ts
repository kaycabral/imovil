export const BACKEND_READ_TIMEOUT_MS = 4_000

export type BackendRead<T> = { ok: true; data: T } | { ok: false }

/**
 * Runs a server-side backend read (Firestore, Auth, Remote Config) so that an
 * unavailable backend degrades the page instead of crashing it.
 *
 * Covers the three ways the Admin SDK fails when the backend is not there:
 *   - throws synchronously (missing project env → `requireEnvOneOf`)
 *   - rejects (bad credentials, permission, network)
 *   - hangs (emulator host configured but not running; gRPC keeps retrying)
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
    console.error(`[backend] ${label} unavailable:`, error)
    return { ok: false }
  } finally {
    clearTimeout(timer)
  }
}
