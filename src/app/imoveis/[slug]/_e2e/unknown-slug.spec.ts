import { test } from '@e2e/fixtures'
import { expectNotFound } from '@e2e/not-found'

test('unknown slug renders not found', async ({ page }) => {
  await page.goto('/imoveis/slug-que-nao-existe')
  await expectNotFound(page)
})
