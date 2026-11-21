import type { Page } from '@playwright/test'

type PostalCodeOverrides = {
  postalCode?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
}

export async function mockBrasilApi(
  page: Page,
  overrides: PostalCodeOverrides = {},
): Promise<void> {
  await page.route('**/api/postal-code/**', (route) => {
    const url = new URL(route.request().url())
    const fromUrl = url.pathname.split('/').pop() ?? ''
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        postalCode: overrides.postalCode ?? fromUrl.replace(/\D/g, '') ?? '69000000',
        street: overrides.street ?? 'Rua de Teste',
        neighborhood: overrides.neighborhood ?? 'Centro',
        city: overrides.city ?? 'Manaus',
        state: overrides.state ?? 'AM',
      }),
    })
  })
}

// 1x1 transparent PNG — replaces MapTiler tiles so tests don't hit the network / quota.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4//8/AwAI/AL+XJ/PIAAAAABJRU5ErkJggg==',
  'base64',
)

export async function mockMapTiler(page: Page): Promise<void> {
  await page.route('**/api.maptiler.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }),
  )
}
