import { expect, test } from '@e2e/fixtures'

// Guards the map stack (maplibre-gl + react-map-gl) across upgrades: maplibre-gl
// 6 went ESM-only and loads its worker from a real URL, which only fails at
// runtime in the browser — never in typecheck/build. The MapTiler style is
// replaced by a minimal valid style so the test needs no network or quota.
const MINIMAL_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e5e7eb' } }],
}

test('detail page renders the approximate-location map without runtime errors', async ({
  page,
  seedProperty,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.route('**/api.maptiler.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MINIMAL_STYLE),
    }),
  )

  const { slug, title } = await seedProperty({
    status: 'published',
    coords: { lat: -3.1, lng: -60.02 },
  })

  // Next emits the worker as a hashed same-origin asset (maplibre-gl-worker[-dev].<hash>.mjs).
  const workerLoaded = page.waitForResponse(
    (response) => /\/maplibre-gl-worker[^/]*\.mjs/.test(response.url()) && response.ok(),
  )

  await page.goto(`/imoveis/${slug}`)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  const canvas = page.locator('canvas.maplibregl-canvas')
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThan(100)

  // A broken worker setup never serves the asset, so this wait is the regression
  // guard; any runtime error logged until then (ESM import, style, layers) fails too.
  await workerLoaded
  expect(errors).toEqual([])
})
