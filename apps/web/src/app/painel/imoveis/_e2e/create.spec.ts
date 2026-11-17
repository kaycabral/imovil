import { TEST_IMAGE } from '@e2e/constants'
import { expect, test } from '@e2e/fixtures'
import { mockBrasilApi } from '@e2e/mocks'
import { getAdminDb } from '@imovil/db'

test.use({ authAsBroker: true })

// CREATE é a única operação que não pode ser seedada via API — o próprio
// ponto do teste é que o formulário escreve um doc novo. Não asseguramos
// publicação aqui: esse é um teste separado (publish.spec.ts).
test('broker creates a new property as draft via the form', async ({ page, broker }) => {
  await mockBrasilApi(page, {
    street: 'Av. Djalma Batista',
    neighborhood: 'Adrianópolis',
    city: 'Manaus',
    state: 'AM',
  })

  await page.goto('/painel/imoveis/novo')
  await expect(page.getByRole('heading', { name: 'Novo imóvel' })).toBeVisible()

  const title = `Apto E2E ${Date.now()}`

  await page.getByLabel('Modalidade').click()
  await page.getByRole('option', { name: 'Aluguel' }).click()

  await page.getByLabel('Tipo').click()
  await page.getByRole('option', { name: 'Apartamento' }).click()

  await page.getByLabel('Título', { exact: true }).fill(title)
  await page.getByLabel('Descrição').fill('Descrição de teste gerada pelo spec E2E de criação.')

  // BrasilAPI é mockada; ao digitar o CEP o form autofilla street/city/state/neighborhood.
  await page.getByLabel('CEP').fill('69057070')
  await expect(page.getByText('Adrianópolis · Manaus — AM')).toBeVisible()

  // MoneyField é "cents-first": dígito digitado = centavo. "200000" → R$ 2.000,00 (200000 cents).
  await page.getByLabel('Valor do aluguel').fill('200000')
  await page.getByLabel('Área (m²)').fill('60')
  await page.getByLabel('Quartos').fill('2')
  await page.getByLabel('Ano de construção').fill('2020')

  await page.getByLabel('Adicionar imagens').setInputFiles(TEST_IMAGE)
  // Upload rolou quando o botão de remover a imagem aparecer.
  await expect(page.getByRole('button', { name: 'Remover imagem' })).toBeVisible()

  await page.getByRole('button', { name: 'Salvar como rascunho' }).click()

  await expect(page).toHaveURL(/\/painel\/imoveis$/)
  // List page renders a mobile card and a desktop table for each row; only
  // the viewport-appropriate one is displayed. filter({ visible: true })
  // picks the one that's actually shown and avoids strict-mode duplicates.
  await expect(page.getByText(title).filter({ visible: true })).toBeVisible()

  // Sanity check no Firestore — garante que o doc foi criado pelo owner certo como draft.
  const snap = await getAdminDb()
    .collection('properties')
    .where('ownerUid', '==', broker.uid)
    .where('title', '==', title)
    .get()
  expect(snap.size).toBe(1)
  const data = snap.docs[0]!.data()
  expect(data.status).toBe('draft')
  expect(data.price).toBe(200000)
})
