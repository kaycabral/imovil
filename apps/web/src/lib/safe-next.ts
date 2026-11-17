/**
 * Same-origin path from a `next` query param, or null. Rejects absolute and
 * protocol-relative URLs so a crafted link cannot bounce the user off-site
 * after sign-in.
 */
export function safeNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null
  return raw
}
