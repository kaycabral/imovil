import { expect, test } from '@playwright/test'

test.describe('painel auth gate', () => {
  test('redireciona não-autenticado para /imoveis com login=1', async ({ page }) => {
    await page.goto('/painel')
    await expect(page).toHaveURL(/\/imoveis\?login=1/)
  })

  test('redireciona /painel/imoveis não-autenticado', async ({ page }) => {
    await page.goto('/painel/imoveis')
    await expect(page).toHaveURL(/\/imoveis\?login=1/)
  })

  test('redireciona /painel/imoveis/novo não-autenticado', async ({ page }) => {
    await page.goto('/painel/imoveis/novo')
    await expect(page).toHaveURL(/\/imoveis\?login=1/)
  })
})
