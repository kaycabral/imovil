import { waitForGoogleSignIn } from '@e2e/auth'
import { expect, test } from '@e2e/fixtures'

test.use({ authAsBroker: true })

test.describe('mobile sheet', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('hamburger opens sheet and navigates via nav item', async ({ page }) => {
    await page.goto('/painel')
    await page.getByRole('button', { name: 'Abrir menu' }).click()

    const sheet = page.getByRole('dialog', { name: 'Menu' })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('link', { name: 'Visão geral' })).toBeVisible()

    await sheet.getByRole('link', { name: 'Meus imóveis' }).click()
    await expect(page).toHaveURL(/\/painel\/imoveis$/)
    await expect(page.getByRole('heading', { name: 'Meus imóveis' })).toBeVisible()
  })

  test('sign out from sheet clears session', async ({ page }) => {
    await page.goto('/painel')
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('button', { name: 'Sair' }).click()

    await expect(page).toHaveURL(/\/imoveis(\?|$)/)

    // Session cookie cleared — hitting /painel should start the sign-in again.
    const signIn = waitForGoogleSignIn(page)
    await page.goto('/painel')
    await expect(signIn).resolves.toEqual({ callbackPath: '/auth/callback', next: '/painel' })
  })
})

test.describe('desktop cluster', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('inline pill navigates to listing', async ({ page }) => {
    await page.goto('/painel')
    await page.getByRole('link', { name: 'Meus imóveis', exact: true }).click()
    await expect(page).toHaveURL(/\/painel\/imoveis$/)
    await expect(page.getByRole('heading', { name: 'Meus imóveis' })).toBeVisible()
  })

  test('avatar dropdown sign out clears session', async ({ page }) => {
    await page.goto('/painel')
    await page.getByRole('button', { name: 'Abrir menu da conta' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()

    await expect(page).toHaveURL(/\/imoveis(\?|$)/)

    // Session cookie cleared — hitting /painel should start the sign-in again.
    const signIn = waitForGoogleSignIn(page)
    await page.goto('/painel')
    await expect(signIn).resolves.toEqual({ callbackPath: '/auth/callback', next: '/painel' })
  })
})
