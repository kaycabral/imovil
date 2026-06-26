import { expect, test } from '@playwright/test'

// No storageState — anonymous visitor.
test.describe('mobile sheet (logged out)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('hamburger sheet shows Entrar that triggers the Google popup', async ({ page, context }) => {
    await page.goto('/imoveis')
    await page.getByRole('button', { name: 'Abrir menu' }).click()

    const sheet = page.getByRole('dialog', { name: 'Menu' })
    await expect(sheet).toBeVisible()
    // Sem nav items quando deslogado — só o CTA Entrar no rodapé do sheet.
    await expect(sheet.getByRole('link', { name: 'Visão geral' })).toHaveCount(0)

    // Click Entrar should open the Firebase Auth popup directly (no
    // intermediate dialog). The Auth emulator serves the popup on
    // 127.0.0.1:9099/emulator/auth/handler — we just confirm a popup opened.
    const popupPromise = context.waitForEvent('page')
    await sheet.getByRole('button', { name: 'Entrar' }).click()
    const popup = await popupPromise
    expect(popup.url()).toContain('emulator/auth/handler')
    await popup.close()
  })
})
