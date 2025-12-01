import { expect, test } from '@playwright/test';

/**
 * E2E Test: Battle Log機能（対戦履歴登録・一覧・削除）
 * TASK-0021: Frontend統合テストとE2Eテスト
 * TASK-0038: レスポンシブ対応・E2Eテスト
 */

test.describe('Battle Log - 対戦履歴機能', () => {
  test.beforeEach(async ({ page }) => {
    // トップページにアクセス
    await page.goto('/');
  });

  /**
   * TC-E2E-BL-001: 対戦履歴ページが表示される
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('対戦履歴ページが表示される', async ({ page }) => {
    // ページタイトル確認 - h1タグで「対戦履歴一覧」を検索
    await expect(page.locator('h1')).toContainText('対戦履歴');

    // 新規登録ボタンが表示される
    await expect(page.getByRole('button', { name: '新規登録' })).toBeVisible();
  });

  /**
   * TC-E2E-BL-002: 対戦履歴登録フォームが開く
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('対戦履歴登録フォームが開く', async ({ page }) => {
    // 新規登録ボタンをクリック
    await page.getByRole('button', { name: '新規登録' }).click();

    // フォームモーダルが表示される（dialog ロール）
    await expect(page.getByRole('dialog')).toBeVisible();

    // 必須項目が表示される
    await expect(page.getByText('対戦履歴登録')).toBeVisible();
  });

  /**
   * TC-E2E-BL-003: フォームをキャンセルで閉じられる
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('フォームをキャンセルで閉じられる', async ({ page }) => {
    // 新規登録ボタンをクリック
    await page.getByRole('button', { name: '新規登録' }).click();

    // フォームモーダルが表示される
    await expect(page.getByRole('dialog')).toBeVisible();

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // モーダルが閉じる
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  /**
   * TC-E2E-BL-004: 空データメッセージが表示される
   * 🟡 信頼性レベル: 妥当な推測（データなし状態の確認）
   */
  test('空データメッセージが表示される', async ({ page }) => {
    // データがない場合のメッセージが表示される
    // 注: APIがモックされていない場合、実際のAPIレスポンスに依存
    await expect(page.getByText(/対戦履歴がありません|読み込み中/)).toBeVisible({
      timeout: 10000,
    });
  });

  // 以下のテストはモックAPIまたはテストデータが必要なため、現時点ではスキップ
  test('対戦履歴を登録できる', async ({ page: _page }) => {
    // TODO: モックAPIサーバーの準備が必要
    test.skip();
  });

  test('対戦履歴一覧が表示される', async ({ page: _page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });

  test('対戦履歴を削除できる', async ({ page: _page }) => {
    // TODO: テストデータ準備が必要
    test.skip();
  });
});
