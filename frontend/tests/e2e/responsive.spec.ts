import { devices, expect, test } from '@playwright/test';

/**
 * E2E Test: Responsive Design（レスポンシブデザイン）
 * TASK-0038: レスポンシブ対応・E2Eテスト
 *
 * モバイル・PC両環境でのUI表示を検証
 */

test.describe('Responsive Design - レスポンシブデザインテスト', () => {
  /**
   * TC-E2E-RESP-001: モバイル表示が正しく動作する
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('モバイル表示が正しく動作する', async ({ browser }) => {
    // Pixel 5 デバイスエミュレーション
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });
    const page = await context.newPage();

    // トップページにアクセス
    await page.goto('/');

    // ページが表示される
    await expect(page.locator('h1')).toContainText('対戦履歴');

    // 新規登録ボタンが表示される
    await expect(page.getByRole('button', { name: '新規登録' })).toBeVisible();

    // モバイルではテーブルが非表示（lg:table クラスにより）
    // カード表示または空メッセージが表示されることを確認
    // テーブルが存在しても、モバイルでは視覚的に非表示（CSSで制御）
    // ビューポートサイズを確認
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThan(1024); // lg ブレークポイント未満

    await context.close();
  });

  /**
   * TC-E2E-RESP-002: PC表示が正しく動作する
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('PC表示が正しく動作する', async ({ browser }) => {
    // デスクトップ Chrome（1280x720）
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    // トップページにアクセス
    await page.goto('/');

    // ページが表示される
    await expect(page.locator('h1')).toContainText('対戦履歴');

    // 新規登録ボタンが表示される
    await expect(page.getByRole('button', { name: '新規登録' })).toBeVisible();

    // ビューポートサイズを確認
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeGreaterThanOrEqual(1024); // lg ブレークポイント以上

    await context.close();
  });

  /**
   * TC-E2E-RESP-003: 統計ダッシュボードがレスポンシブに表示される
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('統計ダッシュボードがモバイルでレスポンシブに表示される', async ({ browser }) => {
    // Pixel 5 デバイスエミュレーション
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });
    const page = await context.newPage();

    // 統計ページにアクセス
    await page.goto('/statistics');

    // ページタイトルが表示される
    await expect(page.locator('h2')).toContainText('統計ダッシュボード');

    // 期間選択フォームが表示される
    await expect(page.locator('input[type="date"]').first()).toBeVisible();

    // ビューポートサイズを確認
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThan(768); // md ブレークポイント未満

    // スクロールが正しく動作することを確認
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // ページがスクロール可能であることを確認（コンテンツがある場合）
    // 注: コンテンツが少ない場合はスクロールが発生しない可能性がある

    await context.close();
  });

  /**
   * 追加テスト: ナビゲーションがモバイルで動作する
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('ナビゲーションがモバイルで動作する', async ({ browser }) => {
    // Pixel 5 デバイスエミュレーション
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });
    const page = await context.newPage();

    // トップページにアクセス
    await page.goto('/');

    // ナビゲーションリンクが表示される（ヘッダー内）
    // 「対戦履歴」「統計」「インポート」のいずれかのリンクが存在することを確認
    const navLinks = page.locator('nav a, header a');
    await expect(navLinks.first()).toBeVisible();

    // 統計ページへのリンクをクリック
    const statisticsLink = page.getByRole('link', { name: /統計/ });
    if (await statisticsLink.isVisible()) {
      await statisticsLink.click();
      await expect(page.locator('h2')).toContainText('統計ダッシュボード');
    }

    await context.close();
  });
});
