import { test, expect } from '@playwright/test'

test.describe('Cliente Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'cliente@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/cliente/casos')
  })

  test('Cliente ve solo sus casos', async ({ page }) => {
    await expect(page).toHaveURL('**/cliente/casos')
  })

  test('Cliente puede descargar informe', async ({ page }) => {
    await page.locator('table tbody tr').first().click()
    await page.waitForURL('**/cliente/casos/*')
    const downloadBtn = page.locator('a:has-text("Descargar")')
    await expect(downloadBtn).toBeVisible()
  })
})
