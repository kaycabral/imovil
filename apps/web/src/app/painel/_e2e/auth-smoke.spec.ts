import { expect, test } from '@e2e/fixtures'

test.use({ authAsBroker: true })

// Infra smoke: proves storageState from auth.setup loads an authenticated
// session into the browser and the broker can reach /painel without being
// bounced to /imoveis?login=1.
test('broker session loads /painel authenticated', async ({ page }) => {
  await page.goto('/painel/imoveis')
  await expect(page).toHaveURL(/\/painel\/imoveis$/)
  await expect(page.getByRole('heading', { name: /Meus imóveis/i })).toBeVisible()
})
