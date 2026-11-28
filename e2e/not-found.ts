import { expect, type Page } from '@playwright/test'

/**
 * Open `path` and assert a real 404 with Next's not-found UI. `proxy.ts`
 * answers it before the prerendered shell streams, so the status is not stuck
 * at 200.
 */
export async function expectNotFound(page: Page, path: string): Promise<void> {
  const response = await page.goto(path)
  expect(response?.status()).toBe(404)
  await expect(page.getByText('This page could not be found.')).toBeVisible()
}
