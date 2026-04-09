import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword123'

test('ログインしてダッシュボードに遷移する', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'FreelanceOS' })).toBeVisible()

  await page.getByLabel('メールアドレス').fill(TEST_EMAIL)
  await page.getByLabel('パスワード').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'ログイン' }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText('ダッシュボード')).toBeVisible()
})
