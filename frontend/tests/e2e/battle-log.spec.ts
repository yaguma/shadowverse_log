import { expect, test } from '@playwright/test';

/**
 * E2E Test: Battle Log機能（対戦履歴登録・一覧・削除）
 * TASK-0021: Frontend統合テストとE2Eテスト
 */

test.describe('Battle Log - 対戦履歴機能', () => {
  test.beforeEach(async ({ page }) => {
    // トップページにアクセス
    await page.goto('/');
  });

  test('対戦履歴ページが表示される', async ({ page }) => {
    // ページタイトル確認
    await expect(page.locator('h2')).toContainText('対戦履歴');

    // 新規登録ボタンが表示される
    await expect(page.getByRole('button', { name: '新規登録' })).toBeVisible();
  });

  test('対戦履歴登録フォームが開く', async ({ page }) => {
    // 新規登録ボタンをクリック
    await page.getByRole('button', { name: '新規登録' }).click();

    // フォームモーダルが表示される
    await expect(page.getByText('対戦履歴登録')).toBeVisible();

    // 必須項目が表示される
    await expect(page.getByLabel('日付 *')).toBeVisible();
    await expect(page.getByLabel('対戦タイプ *')).toBeVisible();
    await expect(page.getByLabel('ランク *')).toBeVisible();
  });

  test('対戦履歴を登録できる', async ({ page }) => {
    // TODO: モックAPIサーバーの準備が必要
    test.skip();
  });

  test('対戦履歴一覧が表示される', async ({ page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });

  test('対戦履歴を削除できる', async ({ page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });
});
