import { execSync } from 'node:child_process'

import type { NextConfig } from 'next'

// Supabase project URL: production is https://<ref>.supabase.co; the local stack
// is http://127.0.0.1:54321. Storage public URLs live under it.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null
const isLocalSupabase = supabaseUrl?.protocol === 'http:'

// Build-time git SHA — read by /api/health so a smoke can check which commit is
// serving. Fallbacks: Vercel's commit SHA, then git, then a literal 'unknown'
// so dev builds don't crash when /.git isn't available.
const commitSha = (() => {
  if (process.env.NEXT_PUBLIC_COMMIT_SHA) return process.env.NEXT_PUBLIC_COMMIT_SHA
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
})()

// Defesa em profundidade. Ver SECURITY.md.
// Browser fala com Supabase (Auth + Storage) e MapTiler (mapa). Login Google é
// redirect (sem popup/iframe), então não precisa de script/frame do Google.
const supabaseOrigin = supabaseUrl ? supabaseUrl.origin : 'https://*.supabase.co'
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} https://api.maptiler.com`,
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
]

const nextConfig: NextConfig = {
  typedRoutes: true,
  env: {
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  // 127.0.0.1: Playwright browser (CI). ideapad.local: dev access from LAN hostname.
  allowedDevOrigins: ['127.0.0.1', 'ideapad.local'],
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

export default nextConfig
