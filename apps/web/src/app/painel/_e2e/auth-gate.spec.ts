import { waitForGoogleSignIn } from '@e2e/auth'
import { expect, test } from '@playwright/test'

// Logged out: the painel layout redirects to `/imoveis?login=1&next=…` and
// AutoSignIn starts the Google sign-in, carrying the page as `next`.
test.describe('painel auth gate', () => {
  for (const path of ['/painel', '/painel/imoveis', '/painel/imoveis/novo']) {
    test(`redireciona ${path} não-autenticado para o login Google`, async ({ page }) => {
      const signIn = waitForGoogleSignIn(page)
      await page.goto(path)
      await expect(signIn).resolves.toEqual({ callbackPath: '/auth/callback', next: path })
    })
  }
})
