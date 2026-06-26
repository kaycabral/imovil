import { expect, test } from '@e2e/fixtures'

test('unknown slug returns 404', async ({ page }) => {
  const response = await page.goto('/imoveis/slug-que-nao-existe')
  expect(response?.status()).toBe(404)
})
