import { expect, test } from '@playwright/test';
import { checkA11y, injectAxe } from 'axe-playwright';

/**
 * E2E Test: Accessibility（アクセシビリティ）
 * TASK-0021: Frontend統合テストとE2Eテスト
 *
 * WCAG 2.1 AA準拠を目指す
 */

test.describe('Accessibility - アクセシビリティテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('トップページ（対戦履歴）のアクセシビリティ', async ({ page }) => {
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('統計ダッシュボードページのアクセシビリティ', async ({ page }) => {
    await page.goto('/statistics');
    await checkA11y(page, undefined, {
      detailedReport: true,
    });
  });

  test('インポートページのアクセシビリティ', async ({ page }) => {
    await page.goto('/import');
    await checkA11y(page, undefined, {
      detailedReport: true,
    });
  });

  test('キーボードナビゲーションが動作する', async ({ page }) => {
    // Tabキーでナビゲーション
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // TODO: より詳細なキーボードナビゲーションテスト
    test.skip();
  });

  test('スクリーンリーダー用のaria-labelが設定されている', async ({ page }) => {
    // TODO: aria-label検証
    test.skip();
  });
});
