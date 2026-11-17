import { waitForGoogleSignIn } from '@e2e/auth'
import { expect, test } from '@playwright/test'

// No storageState — anonymous visitor.
test.describe('mobile sheet (logged out)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('hamburger sheet shows Entrar that starts the Google sign-in', async ({ page }) => {
    await page.goto('/imoveis')
    await page.getByRole('button', { name: 'Abrir menu' }).click()

    const sheet = page.getByRole('dialog', { name: 'Menu' })
    await expect(sheet).toBeVisible()
    // Sem nav items quando deslogado — só o CTA Entrar no rodapé do sheet.
    await expect(sheet.getByRole('link', { name: 'Visão geral' })).toHaveCount(0)

    // Click Entrar should redirect straight to the Google sign-in (no
    // intermediate dialog), coming back to the page the visitor was on.
    const signIn = waitForGoogleSignIn(page)
    await sheet.getByRole('button', { name: 'Entrar' }).click()
    await expect(signIn).resolves.toEqual({ callbackPath: '/auth/callback', next: '/imoveis' })
  })
})
