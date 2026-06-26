import { NextResponse } from 'next/server'

// Dev/test-only stub for Nominatim. Keeps E2E hermetic (no OSM rate limit,
// no network flake). 404 in production so this route never leaks out.
export function GET() {
  if (process.env.NODE_ENV === 'production') {
    return Promise.resolve(new NextResponse('Not Found', { status: 404 }))
  }
  return Promise.resolve(NextResponse.json([{ lat: '-3.10', lon: '-60.02' }]))
}
