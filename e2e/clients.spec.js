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

test.describe('クライアント管理', () => {
  test('クライアント一覧ページに遷移できる', async ({ page }) => {
    await login(page)
    await page.getByRole('link', { name: 'クライアント' }).click()
    await expect(page).toHaveURL(/\/clients/)
    await expect(page.getByRole('heading', { name: 'クライアント' })).toBeVisible()
  })

  test('新規クライアントを作成・削除できる', async ({ page }) => {
    await login(page)
    await page.goto('/clients')

    // 新規作成
    await page.getByRole('button', { name: '新規クライアント' }).click()
    await page.getByLabel('名前 *').fill('E2Eテストクライアント')
    await page.getByLabel('会社名').fill('テスト株式会社')
    await page.getByRole('button', { name: '保存' }).click()

    await expect(page.getByText('E2Eテストクライアント')).toBeVisible()
    await expect(page.getByText('テスト株式会社')).toBeVisible()

    // 削除（削除ボタンをクリック）
    await page.locator('[class*="Card"]').filter({ hasText: 'E2Eテストクライアント' })
      .getByRole('button').last().click()
    await page.getByRole('button', { name: '削除' }).click()
    await expect(page.getByText('E2Eテストクライアント')).not.toBeVisible()
  })
})
