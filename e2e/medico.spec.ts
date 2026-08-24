import { test, expect } from '@playwright/test'

test.describe('Médico Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'medico@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/medico/casos')
  })

  test('Médico ve sus casos', async ({ page }) => {
    await expect(page).toHaveURL('**/medico/casos')
    const casosCount = await page.locator('table tbody tr').count()
    expect(casosCount).toBeGreaterThan(0)
  })

  test('Médico puede generar informe', async ({ page }) => {
    await page.locator('table tbody tr').first().locator('a:has-text("Ver detalle")').click()
    await page.waitForURL('**/medico/casos/*')
    const informeBtn = page.locator('a:has-text("Informe")')
    await expect(informeBtn).toBeVisible()
  })
})
