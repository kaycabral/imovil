import { expect, test } from '@playwright/test'

test('health endpoint returns ok', async ({ request }) => {
  const res = await request.get('/api/health')
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('ok')
})

test('home page renders', async ({ page }) => {
  const res = await page.goto('/')
  expect(res?.status()).toBeLessThan(400)
  await expect(page).toHaveTitle(/.+/)
})
