import { expect, test } from '@e2e/fixtures'

// Anônimo: sem storageState. O contato vem do campo `broker` embutido no doc do
// imóvel (phone default 92999990000 no seed), não do profile do usuário.
test('visitor sees broker phone on WhatsApp CTA of published property', async ({
  page,
  seedProperty,
}) => {
  const { slug, title } = await seedProperty({
    status: 'published',
    overrides: { title: 'Anúncio com contato' },
  })

  await page.goto(`/imoveis/${slug}`)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  const waLink = page.getByRole('link', { name: /Falar no WhatsApp/ })
  await expect(waLink).toBeVisible()
  await expect(waLink).toHaveAttribute('href', /wa\.me\/92999990000/)
})
