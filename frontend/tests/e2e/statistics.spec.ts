import { expect, test } from '@playwright/test';

/**
 * E2E Test: Statistics Dashboard（統計ダッシュボード）
 * TASK-0021: Frontend統合テストとE2Eテスト
 */

test.describe('Statistics Dashboard - 統計ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    // 統計ページにアクセス
    await page.goto('/statistics');
  });

  test('統計ダッシュボードページが表示される', async ({ page }) => {
    // ページタイトル確認
    await expect(page.locator('h2')).toContainText('統計ダッシュボード');

    // 期間選択が表示される
    await expect(page.getByLabel('期間選択')).toBeVisible();
  });

  test('期間を選択して統計情報が表示される', async ({ page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });

  test('全体統計が表示される', async ({ page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });

  test('デッキ別統計が表示される', async ({ page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });

  test('円グラフが表示される', async ({ page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });

  test('レスポンシブデザインが動作する', async ({ page, viewport }) => {
    // TODO: モバイル表示テスト
    test.skip();
  });
});
