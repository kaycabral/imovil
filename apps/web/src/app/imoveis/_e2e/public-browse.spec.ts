import { expect, test, type SeedPropertyFn } from '@e2e/fixtures'

// Seeds the standard trio (apartment / house / studio) with per-test-unique
// titles and returns them, so specs assert on titles that can't collide with
// other parallel workers' data on the shared /imoveis listing.
async function seedTrio(seedProperty: SeedPropertyFn) {
  const apt = await seedProperty({
    status: 'published',
    overrides: {
      title: 'Apê Adrianópolis pet',
      kind: 'apartment',
      neighborhood: 'Adrianópolis',
      price: 200000,
      petFriendly: true,
    },
  })
  const house = await seedProperty({
    status: 'published',
    overrides: {
      title: 'Casa Centro sem pet',
      kind: 'house',
      neighborhood: 'Centro',
      price: 500000,
      petFriendly: false,
    },
  })
  const studio = await seedProperty({
    status: 'published',
    overrides: {
      title: 'Studio Adrianópolis pet',
      kind: 'studio',
      neighborhood: 'Adrianópolis',
      price: 100000,
      petFriendly: true,
    },
  })
  return { apt, house, studio }
}

test.describe('without properties', () => {
  test('redirects / to /imoveis', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/imoveis(\?|$)/)
  })

  test('renders hero and filter bar', async ({ page }) => {
    await page.goto('/imoveis')
    await expect(page.getByRole('heading', { name: 'Alugue em Manaus' })).toBeVisible()
    await expect(page.getByLabel('Tipo')).toBeVisible()
  })

  test('shows empty state when no property matches filters', async ({ page }) => {
    await page.goto('/imoveis?max=1&rooms=10')
    await expect(page.getByText('Nenhum imóvel com esses filtros')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Limpar filtros' })).toBeVisible()
  })
})

test.describe('with seeded properties', () => {
  test('visitor sees all published properties on /imoveis', async ({ page, seedProperty }) => {
    const { apt, house, studio } = await seedTrio(seedProperty)
    await page.goto('/imoveis')
    await expect(page.getByText(apt.title)).toBeVisible()
    await expect(page.getByText(house.title)).toBeVisible()
    await expect(page.getByText(studio.title)).toBeVisible()
  })

  test('filtering by type "Apartamento" shows only apartments', async ({ page, seedProperty }) => {
    const { apt, house, studio } = await seedTrio(seedProperty)
    await page.goto('/imoveis')
    await page.getByLabel('Tipo').click()
    await page.getByRole('option', { name: 'Apartamento' }).click()

    await expect(page.getByText(apt.title)).toBeVisible()
    await expect(page.getByText(house.title)).toHaveCount(0)
    await expect(page.getByText(studio.title)).toHaveCount(0)
  })

  test('toggling "Aceita pet" hides non-pet-friendly properties', async ({
    page,
    seedProperty,
  }) => {
    const { apt, house, studio } = await seedTrio(seedProperty)
    await page.goto('/imoveis')
    await page.getByRole('button', { name: 'Aceita pet' }).click()

    await expect(page.getByText(apt.title)).toBeVisible()
    await expect(page.getByText(studio.title)).toBeVisible()
    await expect(page.getByText(house.title)).toHaveCount(0)
  })

  test('selecting "Até R$ 1.500" shows only properties below the cap', async ({
    page,
    seedProperty,
  }) => {
    const { apt, house, studio } = await seedTrio(seedProperty)
    await page.goto('/imoveis')
    await page.getByLabel('Até').click()
    await page.getByRole('option', { name: 'R$ 1.500' }).click()

    await expect(page.getByText(studio.title)).toBeVisible()
    await expect(page.getByText(apt.title)).toHaveCount(0)
    await expect(page.getByText(house.title)).toHaveCount(0)
  })
})
