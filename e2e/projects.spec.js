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

test.describe('案件管理', () => {
  test('案件一覧ページに遷移できる', async ({ page }) => {
    await login(page)
    await page.getByRole('link', { name: '案件' }).click()
    await expect(page).toHaveURL(/\/projects/)
    await expect(page.getByRole('heading', { name: '案件' })).toBeVisible()
  })

  test('新規案件を作成・編集・削除できる', async ({ page }) => {
    await login(page)
    await page.goto('/projects')

    // 新規作成
    await page.getByRole('button', { name: '新規案件' }).click()
    await page.getByLabel('タイトル *').fill('E2Eテスト案件')
    await page.getByLabel('金額（円）*').fill('100000')
    await page.getByRole('button', { name: '保存' }).click()

    await expect(page.getByText('E2Eテスト案件')).toBeVisible()

    // 編集
    await page.getByRole('row', { name: /E2Eテスト案件/ }).getByTitle('').first().click()
    // pencilボタンをクリック
    const editBtn = page.locator('[data-project-title="E2Eテスト案件"]').getByRole('button').first()
    // ペンシルアイコンのボタンを見つけてクリック
    await page.locator('tr').filter({ hasText: 'E2Eテスト案件' }).getByRole('button').first().click()
    await page.getByLabel('タイトル *').fill('E2Eテスト案件 (編集済)')
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText('E2Eテスト案件 (編集済)')).toBeVisible()

    // 削除
    await page.locator('tr').filter({ hasText: 'E2Eテスト案件 (編集済)' }).getByRole('button').last().click()
    await page.getByRole('button', { name: '削除' }).click()
    await expect(page.getByText('E2Eテスト案件 (編集済)')).not.toBeVisible()
  })

  test('カンバンビューに切り替えできる', async ({ page }) => {
    await login(page)
    await page.goto('/projects')
    await page.getByRole('button', { name: 'カンバン' }).click()
    await expect(page.getByText('見積')).toBeVisible()
    await expect(page.getByText('進行中')).toBeVisible()
  })

  test('タイムラインビューに切り替えできる', async ({ page }) => {
    await login(page)
    await page.goto('/projects')
    await page.getByRole('button', { name: 'タイムライン' }).click()
    await expect(page.getByText('プロジェクトタイムライン')).toBeVisible()
  })

  test('CSVエクスポートボタンが存在する', async ({ page }) => {
    await login(page)
    await page.goto('/projects')
    await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible()
  })
})
