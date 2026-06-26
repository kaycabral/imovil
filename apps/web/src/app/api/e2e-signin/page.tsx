import { notFound } from 'next/navigation'
import { TestSignIn } from './_components/test-sign-in'

// Test-only page. Signs in via Firebase Client SDK so Playwright storageState
// captures the auth state (cookie + IndexedDB). 404 unless ENABLE_TEST_AUTH
// is set — keeps it off in production by default but allows opt-in for smoke
// tests against a staging deployment.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const enabled = process.env.ENABLE_TEST_AUTH === 'true' || process.env.NODE_ENV !== 'production'
  if (!enabled) notFound()

  const { token } = await searchParams
  return <TestSignIn token={token ?? ''} />
}
