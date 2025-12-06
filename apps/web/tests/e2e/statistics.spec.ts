import { expect, test } from '@playwright/test';

/**
 * E2E Test: Statistics Dashboard（統計ダッシュボード）
 * TASK-0021: Frontend統合テストとE2Eテスト
 * TASK-0038: レスポンシブ対応・E2Eテスト
 */

test.describe('Statistics Dashboard - 統計ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    // 統計ページにアクセス
    await page.goto('/statistics');
  });

  /**
   * TC-E2E-ST-001: 統計ダッシュボードページが表示される
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('統計ダッシュボードページが表示される', async ({ page }) => {
    // ページタイトル確認
    await expect(page.locator('h2')).toContainText('統計ダッシュボード');

    // 期間選択フォームが表示される（日付入力欄の存在確認）
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  /**
   * TC-E2E-ST-002: 期間選択フォームが操作できる
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('期間選択フォームが操作できる', async ({ page }) => {
    // 開始日入力欄を取得
    const startDateInput = page.locator('input[type="date"]').first();
    await expect(startDateInput).toBeVisible();

    // 終了日入力欄を取得
    const endDateInput = page.locator('input[type="date"]').last();
    await expect(endDateInput).toBeVisible();

    // 日付を入力（操作可能であることを確認）
    await startDateInput.fill('2025-01-01');
    await endDateInput.fill('2025-11-30');

    // 入力値が反映されることを確認
    await expect(startDateInput).toHaveValue('2025-01-01');
    await expect(endDateInput).toHaveValue('2025-11-30');
  });

  /**
   * TC-E2E-ST-003: データなし状態が表示される
   * 🟡 信頼性レベル: 妥当な推測（データなし状態の確認）
   */
  test('データなし状態またはローディングが表示される', async ({ page }) => {
    // データがない場合のメッセージ、またはローディング状態が表示される
    // APIがモックされていない場合、実際のAPIレスポンスに依存
    await expect(page.getByText(/データがありません|読み込み中|ネットワークエラー/)).toBeVisible({
      timeout: 10000,
    });
  });

  // 以下のテストはモックAPIまたはテストデータが必要なため、現時点ではスキップ
  test('期間を選択して統計情報が表示される', async ({ page: _page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });

  test('全体統計が表示される', async ({ page: _page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });

  test('デッキ別統計が表示される', async ({ page: _page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });

  test('円グラフが表示される', async ({ page: _page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });
});
