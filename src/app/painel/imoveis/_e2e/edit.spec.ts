import { expect, test } from '@e2e/fixtures'
import { getPropertyById } from '@e2e/seed'

test.use({ authAsBroker: true })

test('broker edits a property title from the list menu', async ({ page, seedProperty }) => {
  const { id, title } = await seedProperty({
    status: 'published',
    overrides: { title: 'Título original E2E' },
  })
  const updatedTitle = `${title} editado`

  await page.goto('/painel/imoveis')
  // Row-scoped by the unique seeded title — other parallel tests' rows share
  // the list, so the Ações button can't be selected globally.
  const row = page.getByRole('row').filter({ hasText: title })
  await row.getByRole('button', { name: 'Ações do imóvel' }).click()
  await page.getByRole('menuitem', { name: 'Editar' }).click()

  await expect(page).toHaveURL(new RegExp(`/painel/imoveis/${id}/editar$`))
  await expect(page.getByRole('heading', { name: 'Editar imóvel' })).toBeVisible()

  const titleInput = page.getByLabel('Título', { exact: true })
  await titleInput.fill(updatedTitle)

  await page.getByRole('button', { name: 'Salvar alterações' }).click()

  await expect(page.getByText('Alterações salvas.')).toBeVisible()
  await expect(page).toHaveURL(/\/painel\/imoveis$/)
  // List page renders a mobile card and a desktop table for each row; only
  // the viewport-appropriate one is displayed. filter({ visible: true })
  // picks the one that's actually shown and avoids strict-mode duplicates.
  await expect(page.getByText(updatedTitle).filter({ visible: true })).toBeVisible()

  const stored = await getPropertyById(id)
  expect(stored?.title).toBe(updatedTitle)
})
