import { expect, test } from '@e2e/fixtures'

test.describe('as owner', () => {
  test.use({ authAsBroker: true })

  test('sees draft with yellow banner', async ({ page, seedProperty }) => {
    const { slug, title } = await seedProperty({
      status: 'draft',
      overrides: { title: 'Draft do dono' },
    })
    await page.goto(`/imoveis/${slug}`)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByText('Este imóvel está em rascunho.')).toBeVisible()
  })

  test('sees paused with yellow banner', async ({ page, seedProperty }) => {
    const { slug, title } = await seedProperty({
      status: 'paused',
      overrides: { title: 'Pausado do dono' },
    })
    await page.goto(`/imoveis/${slug}`)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByText('Este imóvel está pausado.')).toBeVisible()
  })
})

test.describe('as anonymous visitor', () => {
  test('hits 404 on a draft', async ({ page, seedProperty }) => {
    const { slug } = await seedProperty({ status: 'draft' })
    const response = await page.goto(`/imoveis/${slug}`)
    expect(response?.status()).toBe(404)
  })

  test('hits 404 on a paused property', async ({ page, seedProperty }) => {
    const { slug } = await seedProperty({ status: 'paused' })
    const response = await page.goto(`/imoveis/${slug}`)
    expect(response?.status()).toBe(404)
  })

  test('sees published property without owner banner', async ({ page, seedProperty }) => {
    const { slug, title } = await seedProperty({
      status: 'published',
      overrides: { title: 'Publicado visível' },
    })
    await page.goto(`/imoveis/${slug}`)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByText('Este imóvel está em rascunho.')).toHaveCount(0)
    await expect(page.getByText('Este imóvel está pausado.')).toHaveCount(0)
  })
})
