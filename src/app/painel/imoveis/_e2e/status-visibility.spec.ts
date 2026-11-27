import { expect, test } from '@e2e/fixtures'
import { expectNotFound } from '@e2e/not-found'

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
  test('gets not found on a draft', async ({ page, seedProperty }) => {
    const { slug } = await seedProperty({ status: 'draft' })
    await page.goto(`/imoveis/${slug}`)
    await expectNotFound(page)
  })

  test('gets not found on a paused property', async ({ page, seedProperty }) => {
    const { slug } = await seedProperty({ status: 'paused' })
    await page.goto(`/imoveis/${slug}`)
    await expectNotFound(page)
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
