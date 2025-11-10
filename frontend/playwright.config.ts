import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Shadowverse Battle Log - Frontend統合テストとE2Eテスト
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* 並列実行設定 */
  fullyParallel: true,

  /* テスト失敗時の動作 */
  forbidOnly: !!process.env.CI, // CIでは.only()を禁止
  retries: process.env.CI ? 2 : 0, // CIでは2回リトライ
  workers: process.env.CI ? 1 : undefined, // CIでは1ワーカー

  /* レポート設定 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'], // コンソール出力
  ],

  /* 共通設定 */
  use: {
    /* ベースURL */
    baseURL: 'http://localhost:5173',

    /* スクリーンショット設定 */
    screenshot: 'only-on-failure',

    /* ビデオ録画 */
    video: 'retain-on-failure',

    /* トレース設定 */
    trace: 'on-first-retry',

    /* タイムアウト設定 */
    actionTimeout: 10000, // 10秒
  },

  /* プロジェクト設定（ブラウザ） */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Firefox と WebKit は必要に応じてコメント解除
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* モバイルテスト（オプション） */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* 開発サーバー自動起動 */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2分
  },
});
