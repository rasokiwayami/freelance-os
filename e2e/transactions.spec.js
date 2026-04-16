import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword123'

async function login(page) {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(TEST_EMAIL)
  await page.getByLabel('パスワード').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test.describe('入出金管理', () => {
  test('入出金一覧ページに遷移できる', async ({ page }) => {
    await login(page)
    await page.getByRole('link', { name: '入出金' }).click()
    await expect(page).toHaveURL(/\/transactions/)
    await expect(page.getByRole('heading', { name: '入出金' })).toBeVisible()
  })

  test('新規取引を記録して一覧に表示される', async ({ page }) => {
    await login(page)
    await page.goto('/transactions')

    await page.getByRole('button', { name: '新規登録' }).click()
    await page.getByLabel('金額（円）*').fill('50000')
    await page.getByLabel('説明').fill('E2Eテスト取引')
    await page.getByRole('button', { name: '保存' }).click()

    await expect(page.getByText('E2Eテスト取引')).toBeVisible()
  })

  test('エクスポート・インポートボタンが存在する', async ({ page }) => {
    await login(page)
    await page.goto('/transactions')
    await expect(page.getByRole('button', { name: 'エクスポート' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'インポート' })).toBeVisible()
  })

  test('収入/支出フィルタが機能する', async ({ page }) => {
    await login(page)
    await page.goto('/transactions')
    await page.getByRole('button', { name: '収入' }).click()
    // ページが更新されてフィルタが適用される
    await expect(page.getByRole('button', { name: '収入' })).toHaveClass(/default|primary/)
  })

  test('ダッシュボードでKPIカードが表示される', async ({ page }) => {
    await login(page)
    await page.goto('/dashboard')
    await expect(page.getByText('月間収入')).toBeVisible()
    await expect(page.getByText('進行中の案件')).toBeVisible()
  })
})
