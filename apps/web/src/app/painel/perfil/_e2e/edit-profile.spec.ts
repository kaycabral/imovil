import { expect, test } from '@e2e/fixtures'
import { getProfile } from '@e2e/seed'

test.use({ authAsBroker: true })

test('broker edits phone and creci in profile page', async ({ page, broker }) => {
  await page.goto('/painel/perfil')
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible()

  await page.getByLabel('Celular').fill('(92) 98888-7777')
  await page.getByLabel('CRECI').fill('CRECI-AM 9876-F')
  await page.getByRole('button', { name: 'Salvar' }).click()

  await expect(page.getByText('Perfil atualizado.')).toBeVisible()

  const data = await getProfile(broker.id)
  expect(data?.phone).toBe('(92) 98888-7777')
  expect(data?.creci).toBe('CRECI-AM 9876-F')
})
