import { expect, test } from '@playwright/test';

/**
 * E2E Test: Import機能（データインポート）
 * TASK-0021: Frontend統合テストとE2Eテスト
 */

test.describe('Import - データインポート機能', () => {
  test.beforeEach(async ({ page }) => {
    // インポートページにアクセス
    await page.goto('/import');
  });

  test('インポートページが表示される', async ({ page }) => {
    // ページタイトル確認
    await expect(page.locator('h2')).toContainText('データインポート');

    // ファイル選択ボタンが表示される
    await expect(page.getByLabel('ファイル選択')).toBeVisible();
  });

  test('JSON形式のファイルをインポートできる', async ({ page }) => {
    // TODO: テストファイル準備が必要
    test.skip();
  });

  test('CSV形式のファイルをインポートできる', async ({ page }) => {
    // TODO: テストファイル準備が必要
    test.skip();
  });

  test('不正なファイル形式でエラーが表示される', async ({ page }) => {
    // TODO: テストファイル準備が必要
    test.skip();
  });

  test('インポート進捗が表示される', async ({ page }) => {
    // TODO: テストファイル準備が必要
    test.skip();
  });
});
