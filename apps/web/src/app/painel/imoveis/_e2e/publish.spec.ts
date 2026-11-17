import { expect, test } from '@e2e/fixtures'
import { getPropertyById } from '@e2e/seed'

test.use({ authAsBroker: true })

test('broker publishes a draft property from the list menu', async ({ page, seedProperty }) => {
  const { id, title } = await seedProperty({
    status: 'draft',
    overrides: { title: 'Draft a publicar' },
  })

  await page.goto('/painel/imoveis')
  // Scope to this property's row by its unique title — the list holds other
  // parallel tests' rows too, so the Ações button must be row-scoped.
  const row = page.getByRole('row').filter({ hasText: title })
  await expect(row.getByText('Rascunho')).toBeVisible()

  await row.getByRole('button', { name: 'Ações do imóvel' }).click()
  await page.getByRole('menuitem', { name: 'Publicar' }).click()

  await expect(page.getByText('Imóvel publicado.')).toBeVisible()
  await expect(row.getByText('Publicado')).toBeVisible()

  const stored = await getPropertyById(id)
  expect(stored?.status).toBe('published')
})
