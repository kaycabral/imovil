import { expect, type Page } from '@playwright/test'

/**
 * Assert the page rendered Next's not-found UI. With Cache Components the
 * prerendered shell streams first, so a request-time `notFound()` cannot turn
 * the status into 404: Next keeps 200 and marks the page `noindex` instead.
 */
export async function expectNotFound(page: Page): Promise<void> {
  await expect(page.getByText('This page could not be found.')).toBeVisible()
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1)
}
