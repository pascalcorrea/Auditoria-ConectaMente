import { test, expect } from '@playwright/test'

test.describe('Backoffice Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'backoffice@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/**')
  })

  test('Backoffice ve dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('Backoffice puede ver cumplimiento', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/cumplimiento')
    const tabla = page.locator('table')
    await expect(tabla).toBeVisible()
  })
})
