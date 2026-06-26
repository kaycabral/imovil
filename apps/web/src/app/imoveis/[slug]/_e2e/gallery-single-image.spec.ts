import { expect, test } from '@e2e/fixtures'

// Regressão: com 1 imagem só, a galeria da página de detalhe usava `md:aspect-auto`
// e contava com as miniaturas pra dar altura ao grid. Sem miniaturas, a figure
// principal colapsava pra uma linha (~0px de altura) no desktop. O fix mantém um
// aspect-ratio quando não há miniaturas. Aqui asseguramos que a imagem principal
// renderiza com altura real.
test('single-image gallery does not collapse on the detail page', async ({
  page,
  seedProperty,
}) => {
  const { slug, title } = await seedProperty({
    status: 'published',
    overrides: {
      title: 'Imóvel com uma foto',
      images: [{ path: 'e2e/test.jpg', src: 'http://127.0.0.1:9199/test.jpg', alt: 'Foto única' }],
    },
  })

  await page.goto(`/imoveis/${slug}`)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  const mainImage = page.getByRole('img', { name: 'Foto única' })
  await expect(mainImage).toBeVisible()

  const box = await mainImage.boundingBox()
  expect(box).not.toBeNull()
  // Colapso = altura ~0; render real é centenas de px. 100 separa os dois com folga.
  expect(box!.height).toBeGreaterThan(100)
})
