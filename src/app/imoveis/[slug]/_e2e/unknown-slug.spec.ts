import { test } from '@e2e/fixtures'
import { expectNotFound } from '@e2e/not-found'

test('unknown slug answers 404', async ({ page }) => {
  await expectNotFound(page, '/imoveis/slug-que-nao-existe')
})
