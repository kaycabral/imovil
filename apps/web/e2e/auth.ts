import type { Page, Request } from '@playwright/test'

function isGoogleAuthorize(request: Request): boolean {
  const url = new URL(request.url())
  return url.pathname === '/auth/v1/authorize' && url.searchParams.get('provider') === 'google'
}

export type SignInRedirect = { callbackPath: string; next: string | null }

/**
 * Starts waiting for the Google sign-in redirect (Supabase `/auth/v1/authorize`)
 * and resolves with where it will land back. Call it BEFORE triggering the
 * sign-in. The local stack has Google disabled, so the redirect stops at
 * Supabase — no external call leaves the machine.
 */
export async function waitForGoogleSignIn(page: Page): Promise<SignInRedirect> {
  const request = await page.waitForRequest(isGoogleAuthorize)
  const redirectTo = new URL(new URL(request.url()).searchParams.get('redirect_to') ?? '')
  return { callbackPath: redirectTo.pathname, next: redirectTo.searchParams.get('next') }
}
