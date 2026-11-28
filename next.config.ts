import { commitSha, cspDirectives, devOrigins, withSecurityHeaders } from '@cbrl/next/config'
import type { NextConfig } from 'next'

// Supabase project URL: production is https://<ref>.supabase.co; the local stack
// is http://127.0.0.1:54321. Storage public URLs live under it.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null
const isLocalSupabase = supabaseUrl?.protocol === 'http:'
const supabaseOrigin = supabaseUrl ? supabaseUrl.origin : 'https://*.supabase.co'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  // Served by /api/health so a smoke test can check which commit is live.
  env: { NEXT_PUBLIC_COMMIT_SHA: commitSha() },
  // 127.0.0.1 (Playwright), <hostname>.local and the machine's LAN IPv4s.
  allowedDevOrigins: devOrigins(),
  images: {
    // The local Supabase stack serves Storage from http://127.0.0.1:54321.
    // Next refuses to optimize images from private IPs (anti-SSRF), even when
    // allow-listed, so local runs serve them verbatim; production stays optimized.
    unoptimized: isLocalSupabase,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      // Google avatar (Supabase Auth keeps the Google `picture`).
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      ...(supabaseUrl && isLocalSupabase
        ? ([{ protocol: 'http', hostname: supabaseUrl.hostname, port: supabaseUrl.port }] as const)
        : []),
    ],
  },
}

// The browser talks to Supabase (Auth + Storage) and MapTiler (map). Google
// sign-in is a redirect (no popup/iframe), so no Google script or frame. The CSP
// is report-only for now; violations go to /api/csp-report.
export default withSecurityHeaders(nextConfig, {
  csp: cspDirectives({ 'connect-src': [supabaseOrigin, 'https://api.maptiler.com'] }),
  cspMode: 'report-only',
  reportPath: '/api/csp-report',
})
