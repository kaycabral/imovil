/**
 * Absolute base for metadata URLs (Open Graph image, manifest). Link previews on
 * LinkedIn/WhatsApp need absolute URLs; Vercel injects the production host.
 */
export function siteUrl(host = process.env.VERCEL_PROJECT_PRODUCTION_URL): URL {
  return new URL(host ? `https://${host}` : 'http://localhost:3000')
}
