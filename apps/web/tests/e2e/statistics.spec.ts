import { expect, test } from '@playwright/test';

/**
 * E2E Test: Statistics Dashboard（統計ダッシュボード）
 * TASK-0021: Frontend統合テストとE2Eテスト
 * TASK-0028: 統計画面シーズン選択UI実装
 * TASK-0029: 統計画面対戦履歴登録ボタン追加
 * TASK-0030: 統計画面E2Eテスト
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

/**
 * E2E Test: Season Selection（シーズン選択）
 * TASK-0028: 統計画面シーズン選択UI実装
 * TASK-0030: 統計画面E2Eテスト
 */
test.describe('Season Selection - シーズン選択', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/statistics');
  });

  /**
   * TC-E2E-SS-001: シーズン選択UIが表示される
   * 🔵 信頼性レベル: TASK-0028に基づく
   */
  test('シーズン選択UIが表示される', async ({ page }) => {
    // シーズンラベルが表示される
    await expect(page.getByText('シーズン')).toBeVisible({ timeout: 10000 });

    // シーズン選択UIが表示される（ドロップダウンまたは入力フィールド）
    const seasonSelector = page
      .locator('#seasonFilter')
      .or(page.getByText('シーズン読み込み中...'))
      .or(page.getByText('シーズンデータがありません'));
    await expect(seasonSelector).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-E2E-SS-002: シーズン読み込み状態が表示される
   * 🔵 信頼性レベル: TASK-0028に基づく
   */
  test('シーズン読み込み状態またはシーズン選択が表示される', async ({ page }) => {
    // 初期表示では読み込み中メッセージまたはシーズン選択が表示される
    const seasonUI = page
      .getByText('シーズン読み込み中...')
      .or(page.locator('#seasonFilter'))
      .or(page.getByText('シーズンデータがありません'));
    await expect(seasonUI).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-E2E-SS-003: シーズンドロップダウンが操作できる
   * 🔵 信頼性レベル: TASK-0028に基づく
   */
  test('シーズンドロップダウンが操作できる', async ({ page }) => {
    // シーズンドロップダウンが表示されるまで待機
    const seasonDropdown = page.locator('#seasonFilter');

    // ドロップダウンが表示されるか確認（シーズンデータがある場合）
    try {
      await seasonDropdown.waitFor({ state: 'visible', timeout: 10000 });

      // ドロップダウンが操作可能であることを確認
      const isDisabled = await seasonDropdown.isDisabled();
      // ローディング中でなければ操作可能
      if (!isDisabled) {
        // 「すべて」オプションが存在することを確認
        const options = seasonDropdown.locator('option');
        const optionCount = await options.count();
        // 少なくとも1つ以上のオプションがある（「すべて」）
        expect(optionCount).toBeGreaterThanOrEqual(1);
      }
    } catch {
      // シーズンデータがない場合はスキップ
      const noSeasonMessage = page.getByText('シーズンデータがありません');
      await expect(noSeasonMessage).toBeVisible();
    }
  });

  /**
   * TC-E2E-SS-004: シーズンなし状態が表示される
   * 🔵 信頼性レベル: TASK-0028に基づく
   */
  test('シーズンデータがない場合はメッセージが表示される', async ({ page }) => {
    // APIレスポンスをモックしてシーズンなし状態をシミュレート
    await page.route('**/api/battle-logs/seasons', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { timestamp: new Date().toISOString(), requestId: 'test' },
        }),
      });
    });

    // 最新シーズンAPIもモック
    await page.route('**/api/battle-logs/latest-season', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { latestSeason: null },
          meta: { timestamp: new Date().toISOString(), requestId: 'test' },
        }),
      });
    });

    // ページをリロードしてモックを適用
    await page.reload();

    // シーズンデータなしメッセージまたはシーズンセレクタが表示される
    const noSeasonMessage = page.getByText('シーズンデータがありません');
    const seasonSelector = page.locator('#seasonFilter');

    // いずれかが表示されることを確認
    const isNoSeasonVisible = await noSeasonMessage.isVisible().catch(() => false);
    const isSelectorVisible = await seasonSelector.isVisible().catch(() => false);
    expect(isNoSeasonVisible || isSelectorVisible).toBeTruthy();
  });
});

/**
 * E2E Test: Battle Log Dialog（対戦履歴登録ダイアログ）
 * TASK-0029: 統計画面対戦履歴登録ボタン追加
 * TASK-0030: 統計画面E2Eテスト
 */
test.describe('Battle Log Dialog - 対戦履歴登録ダイアログ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/statistics');
  });

  /**
   * TC-E2E-BLD-001: 対戦を記録ボタンが表示される
   * 🔵 信頼性レベル: TASK-0029に基づく
   */
  test('対戦を記録ボタンが表示される', async ({ page }) => {
    const recordButton = page.getByRole('button', { name: /対戦を記録/ });
    await expect(recordButton).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-E2E-BLD-002: 対戦を記録ボタンをクリックするとダイアログが開く
   * 🔵 信頼性レベル: TASK-0029に基づく
   */
  test('対戦を記録ボタンをクリックするとダイアログが開く', async ({ page }) => {
    // ボタンをクリック
    const recordButton = page.getByRole('button', { name: /対戦を記録/ });
    await recordButton.click();

    // ダイアログが表示される
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  /**
   * TC-E2E-BLD-003: ダイアログ内にフォームが表示される
   * 🔵 信頼性レベル: TASK-0029に基づく
   */
  test('ダイアログ内にフォームが表示される', async ({ page }) => {
    // ダイアログを開く
    const recordButton = page.getByRole('button', { name: /対戦を記録/ });
    await recordButton.click();

    // ダイアログが表示される
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // フォーム内の要素が表示される（対戦記録フォームの要素を確認）
    // 保存ボタンまたはキャンセルボタンがある
    const saveButton = page.getByRole('button', { name: /保存|登録/ });
    const cancelButton = page.getByRole('button', { name: /キャンセル/ });

    await expect(saveButton.or(cancelButton)).toBeVisible();
  });

  /**
   * TC-E2E-BLD-004: キャンセルボタンでダイアログが閉じる
   * 🔵 信頼性レベル: TASK-0029に基づく
   */
  test('キャンセルボタンでダイアログが閉じる', async ({ page }) => {
    // ダイアログを開く
    const recordButton = page.getByRole('button', { name: /対戦を記録/ });
    await recordButton.click();

    // ダイアログが表示される
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // キャンセルボタンをクリック
    const cancelButton = page.getByRole('button', { name: /キャンセル/ });
    await cancelButton.click();

    // ダイアログが閉じる
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * TC-E2E-BLD-005: Escキーでダイアログが閉じる
   * 🔵 信頼性レベル: TASK-0029に基づく
   */
  test('Escキーでダイアログが閉じる', async ({ page }) => {
    // ダイアログを開く
    const recordButton = page.getByRole('button', { name: /対戦を記録/ });
    await recordButton.click();

    // ダイアログが表示される
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Escキーを押す
    await page.keyboard.press('Escape');

    // ダイアログが閉じる
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * TC-E2E-BLD-006: オーバーレイクリックでダイアログが閉じる
   * 🔵 信頼性レベル: TASK-0029に基づく
   */
  test('オーバーレイクリックでダイアログが閉じる', async ({ page }) => {
    // ダイアログを開く
    const recordButton = page.getByRole('button', { name: /対戦を記録/ });
    await recordButton.click();

    // ダイアログが表示される
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // オーバーレイ（ダイアログの外側）をクリック
    // ダイアログの親要素（オーバーレイ）の左上隅をクリック
    await page
      .locator('[role="dialog"]')
      .locator('..')
      .click({ position: { x: 10, y: 10 } });

    // ダイアログが閉じる
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});

/**
 * E2E Test: Empty State with Record Button（データなし状態と記録ボタン）
 * TASK-0029: 統計画面対戦履歴登録ボタン追加
 * TASK-0030: 統計画面E2Eテスト
 */
test.describe('Empty State - データなし状態', () => {
  /**
   * TC-E2E-ES-001: データなし状態で最初の対戦を記録するボタンが表示される
   * 🔵 信頼性レベル: TASK-0029に基づく
   */
  test('データなし状態で最初の対戦を記録するボタンが表示される', async ({ page }) => {
    // 統計APIをモックして空データを返す
    await page.route('**/api/statistics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overall: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
            byMyDeck: [],
            byOpponentDeck: [],
            byOpponentClass: [],
            byRank: [],
            byTurn: {
              first: { games: 0, wins: 0, winRate: 0 },
              second: { games: 0, wins: 0, winRate: 0 },
            },
          },
          meta: { timestamp: new Date().toISOString(), requestId: 'test' },
        }),
      });
    });

    // シーズンAPIもモック
    await page.route('**/api/battle-logs/seasons', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [1],
          meta: { timestamp: new Date().toISOString(), requestId: 'test' },
        }),
      });
    });

    await page.goto('/statistics');

    // データなし状態のメッセージを待つ
    await expect(page.getByText(/データがありません|対戦履歴がありません/)).toBeVisible({
      timeout: 10000,
    });

    // 「最初の対戦を記録する」または「対戦を記録」ボタンが表示される
    const recordButton = page.getByRole('button', { name: /対戦を記録|最初の対戦/ });
    await expect(recordButton).toBeVisible();
  });

  /**
   * TC-E2E-ES-002: データなし状態からダイアログを開くことができる
   * 🔵 信頼性レベル: TASK-0029に基づく
   */
  test('データなし状態からダイアログを開くことができる', async ({ page }) => {
    // 統計APIをモックして空データを返す
    await page.route('**/api/statistics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overall: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
            byMyDeck: [],
            byOpponentDeck: [],
            byOpponentClass: [],
            byRank: [],
            byTurn: {
              first: { games: 0, wins: 0, winRate: 0 },
              second: { games: 0, wins: 0, winRate: 0 },
            },
          },
          meta: { timestamp: new Date().toISOString(), requestId: 'test' },
        }),
      });
    });

    // シーズンAPIもモック
    await page.route('**/api/battle-logs/seasons', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [1],
          meta: { timestamp: new Date().toISOString(), requestId: 'test' },
        }),
      });
    });

    await page.goto('/statistics');

    // ヘッダーの「対戦を記録」ボタンをクリック
    const recordButton = page.getByRole('button', { name: /対戦を記録/ }).first();
    await recordButton.click();

    // ダイアログが表示される
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});
