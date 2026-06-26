import { execSync } from 'node:child_process'

import type { NextConfig } from 'next'

const isEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'

// Build-time git SHA — read by /api/health so smoke can poll until the new
// deploy is actually serving (App Hosting rolls out gradually). Fallbacks:
// Cloud Build's $COMMIT_SHA, then a literal 'unknown' so dev builds don't
// crash when /.git isn't available.
const commitSha = (() => {
  if (process.env.NEXT_PUBLIC_COMMIT_SHA) return process.env.NEXT_PUBLIC_COMMIT_SHA
  if (process.env.COMMIT_SHA) return process.env.COMMIT_SHA
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
})()

// Defesa em profundidade. Ver SECURITY.md.
// Aceita Firebase Auth (Google popup) + Firestore + Storage + ViaCEP.
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://accounts.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://viacep.com.br",
  'frame-src https://*.firebaseapp.com https://accounts.google.com',
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
  // App Hosting copies `.next/standalone` into the Cloud Run image. Set
  // explicitly so the standalone artifacts always land, regardless of which
  // builder produced them.
  output: 'standalone',
  // No `outputFileTracingRoot` pin: with Turborepo (turbo.json at the repo root),
  // the App Hosting buildpack switches into its Turborepo runner, which expects
  // the standalone bundle laid out as `apps/web/.next/standalone/apps/web/.next/...`
  // (workspace prefix preserved). Letting Next auto-detect the monorepo root from
  // the lockfile produces exactly that layout, so the adapter can locate the
  // routes manifest.
  // 127.0.0.1: Playwright browser (CI). ideapad.local: dev access from LAN hostname.
  allowedDevOrigins: ['127.0.0.1', 'ideapad.local'],
  images: {
    // In emulator mode the Storage emulator returns http://127.0.0.1:9199/…
    // URLs. Next.js 15 refuses to optimize images from private IPs as an
    // anti-SSRF measure, even when the hostname is allow-listed. unoptimized
    // serves them verbatim in emulator runs while production stays optimized.
    unoptimized: isEmulator,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      ...(isEmulator ? ([{ protocol: 'http', hostname: '127.0.0.1' }] as const) : []),
    ],
  },
}

export default nextConfig
