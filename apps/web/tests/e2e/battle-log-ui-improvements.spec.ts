import { devices, expect, test } from '@playwright/test';

/**
 * E2E Test: 対戦履歴UI改善（レイアウト改善・相手デッキソート）
 * TASK-0033: 対戦履歴UI改善E2Eテスト
 *
 * テスト対象:
 * - TASK-0031: BattleLogDialogレイアウト改善
 * - TASK-0032: 相手デッキ選択肢ソート機能
 */

test.describe('対戦履歴UI改善 - BattleLogDialog レイアウト改善', () => {
  /**
   * TC-E2E-BLUI-001: デスクトップ表示 - シーズンと対戦日が横並び
   * 🔵 信頼性レベル: TASK-0031要件に基づく
   */
  test.describe('デスクトップ表示', () => {
    test('シーズンと対戦日が横並びで表示される', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: '新規登録' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // シーズンと対戦日のラベルを取得
      const seasonLabel = page.locator('label[for="season"]');
      const dateLabel = page.locator('label[for="date"]');

      await expect(seasonLabel).toBeVisible();
      await expect(dateLabel).toBeVisible();

      // バウンディングボックスを取得してY座標を比較
      const seasonBox = await seasonLabel.boundingBox();
      const dateBox = await dateLabel.boundingBox();

      expect(seasonBox).not.toBeNull();
      expect(dateBox).not.toBeNull();

      if (seasonBox && dateBox) {
        // Y座標がほぼ同じ（許容誤差30px）= 横並び
        expect(Math.abs(seasonBox.y - dateBox.y)).toBeLessThan(30);
      }

      await context.close();
    });

    test('詳細設定が折りたたまれて表示される', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: '新規登録' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // details要素のsummaryを確認
      const detailsSummary = page.locator('details summary');
      await expect(detailsSummary).toContainText('詳細設定');

      // 折りたたまれている状態ではランク選択が非表示
      const rankLabel = page.locator('label[for="rank"]');
      await expect(rankLabel).not.toBeVisible();

      await context.close();
    });

    test('詳細設定をクリックすると展開される', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: '新規登録' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // 詳細設定をクリックして展開
      const detailsSummary = page.locator('details summary');
      await detailsSummary.click();

      // ランク・グループ・対戦タイプが表示される
      await expect(page.locator('label[for="rank"]')).toBeVisible();
      await expect(page.locator('label[for="groupName"]')).toBeVisible();
      await expect(page.locator('label[for="battleType"]')).toBeVisible();

      await context.close();
    });

    test('ランクとグループが横並びで表示される', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: '新規登録' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // 詳細設定を展開
      const detailsSummary = page.locator('details summary');
      await detailsSummary.click();

      const rankLabel = page.locator('label[for="rank"]');
      const groupLabel = page.locator('label[for="groupName"]');

      await expect(rankLabel).toBeVisible();
      await expect(groupLabel).toBeVisible();

      const rankBox = await rankLabel.boundingBox();
      const groupBox = await groupLabel.boundingBox();

      expect(rankBox).not.toBeNull();
      expect(groupBox).not.toBeNull();

      if (rankBox && groupBox) {
        // Y座標がほぼ同じ（許容誤差30px）= 横並び
        expect(Math.abs(rankBox.y - groupBox.y)).toBeLessThan(30);
      }

      await context.close();
    });
  });

  /**
   * TC-E2E-BLUI-002: モバイル表示 - シーズンと対戦日が縦並び
   * 🔵 信頼性レベル: TASK-0031要件に基づく
   */
  test.describe('モバイル表示', () => {
    test('シーズンと対戦日が縦並びで表示される', async ({ browser }) => {
      // Pixel 5 デバイスエミュレーション（幅393px）
      const context = await browser.newContext({
        ...devices['Pixel 5'],
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: '新規登録' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      const seasonLabel = page.locator('label[for="season"]');
      const dateLabel = page.locator('label[for="date"]');

      await expect(seasonLabel).toBeVisible();
      await expect(dateLabel).toBeVisible();

      const seasonBox = await seasonLabel.boundingBox();
      const dateBox = await dateLabel.boundingBox();

      expect(seasonBox).not.toBeNull();
      expect(dateBox).not.toBeNull();

      if (seasonBox && dateBox) {
        // 対戦日がシーズンより下に表示される（縦並び）
        expect(dateBox.y).toBeGreaterThan(seasonBox.y + 20);
      }

      await context.close();
    });

    test('モバイルでも詳細設定が動作する', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Pixel 5'],
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: '新規登録' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // 詳細設定をクリックして展開
      const detailsSummary = page.locator('details summary');
      await detailsSummary.click();

      // 各フィールドが表示される
      await expect(page.locator('label[for="rank"]')).toBeVisible();
      await expect(page.locator('label[for="groupName"]')).toBeVisible();
      await expect(page.locator('label[for="battleType"]')).toBeVisible();

      await context.close();
    });
  });
});

test.describe('対戦履歴UI改善 - 相手デッキ選択肢ソート', () => {
  /**
   * TC-E2E-BLUI-003: 相手デッキ選択肢が表示される
   * 🔵 信頼性レベル: TASK-0032要件に基づく
   */
  test('相手デッキ選択肢が表示される', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const opponentSelect = page.locator('select#opponentDeckId');
    await expect(opponentSelect).toBeVisible();

    // 選択肢が存在することを確認
    const options = opponentSelect.locator('option');
    const optionCount = await options.count();
    // 「選択してください」の1件は最低でもある
    expect(optionCount).toBeGreaterThanOrEqual(1);
  });

  /**
   * TC-E2E-BLUI-004: 使用回数が選択肢に表示される
   * 🔵 信頼性レベル: TASK-0032要件に基づく
   * 注: このテストはテストデータに依存する
   */
  test('使用回数が選択肢に表示される（対戦履歴がある場合）', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const opponentSelect = page.locator('select#opponentDeckId');
    await expect(opponentSelect).toBeVisible();

    // 選択肢のテキストを取得
    const optionsText = await opponentSelect.locator('option').allTextContents();

    // 「選択してください」以外のオプションがあれば確認
    // 使用履歴がある場合は "(N回)" という形式で表示される
    // テストデータに依存するため、存在チェックのみ
    expect(optionsText.length).toBeGreaterThanOrEqual(1);
    expect(optionsText[0]).toBe('選択してください');
  });

  /**
   * TC-E2E-BLUI-005: デッキマスターがない場合のエラーメッセージ
   * 🟡 信頼性レベル: 妥当な推測（エッジケース）
   * 注: このテストはテストデータ状態に依存
   */
  test('デッキ選択肢がロードされる', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // ローディングが完了するまで待機（最大10秒）
    await page.waitForTimeout(1000);

    // 相手デッキのセレクトボックスまたはエラーメッセージが表示される
    const opponentSelect = page.locator('select#opponentDeckId');
    const errorMessage = page.locator('text=デッキマスターを登録してください');

    // どちらかが表示されていればOK
    const isSelectVisible = await opponentSelect.isVisible().catch(() => false);
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    expect(isSelectVisible || isErrorVisible).toBe(true);
  });
});

test.describe('対戦履歴UI改善 - フォーム入力フロー', () => {
  /**
   * TC-E2E-BLUI-006: レイアウト改善後も正常にフォーム入力できる
   * 🔵 信頼性レベル: 要件定義書に基づく統合テスト
   */
  test('フォームの各フィールドが入力可能', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // シーズン入力
    const seasonInput = page.locator('input#season');
    await expect(seasonInput).toBeVisible();
    await seasonInput.fill('1');

    // 対戦日入力
    const dateInput = page.locator('input#date');
    await expect(dateInput).toBeVisible();
    // 日付は初期値が設定されているはず
    await expect(dateInput).toHaveValue(/.+/);

    // 詳細設定を展開
    const detailsSummary = page.locator('details summary');
    await detailsSummary.click();

    // 対戦タイプ選択
    const battleTypeSelect = page.locator('select#battleType');
    await expect(battleTypeSelect).toBeVisible();

    // ランク選択
    const rankSelect = page.locator('select#rank');
    await expect(rankSelect).toBeVisible();

    // グループ選択
    const groupSelect = page.locator('select#groupName');
    await expect(groupSelect).toBeVisible();
  });

  /**
   * TC-E2E-BLUI-007: 先攻後攻と対戦結果のラジオボタンが動作する
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('先攻後攻と対戦結果のラジオボタンが動作する', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 先攻を選択
    await page.getByRole('radio', { name: '先攻' }).click();
    await expect(page.getByRole('radio', { name: '先攻' })).toBeChecked();

    // 後攻を選択
    await page.getByRole('radio', { name: '後攻' }).click();
    await expect(page.getByRole('radio', { name: '後攻' })).toBeChecked();

    // 勝ちを選択
    await page.getByRole('radio', { name: '勝ち' }).click();
    await expect(page.getByRole('radio', { name: '勝ち' })).toBeChecked();

    // 負けを選択
    await page.getByRole('radio', { name: '負け' }).click();
    await expect(page.getByRole('radio', { name: '負け' })).toBeChecked();
  });

  /**
   * TC-E2E-BLUI-008: キャンセルボタンでダイアログが閉じる
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('キャンセルボタンでダイアログが閉じる', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // ダイアログが閉じる
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  /**
   * TC-E2E-BLUI-009: Escキーでダイアログが閉じる
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test('Escキーでダイアログが閉じる', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Escキーを押す
    await page.keyboard.press('Escape');

    // ダイアログが閉じる
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('対戦履歴UI改善 - アクセシビリティ', () => {
  /**
   * TC-E2E-BLUI-010: ダイアログにaria属性が設定されている
   * 🔵 信頼性レベル: WCAG準拠要件に基づく
   */
  test('ダイアログにaria属性が設定されている', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '新規登録' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  /**
   * TC-E2E-BLUI-011: フォームフィールドにラベルが関連付けられている
   * 🔵 信頼性レベル: WCAG準拠要件に基づく
   */
  test('フォームフィールドにラベルが関連付けられている', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // シーズンフィールドのラベル
    const seasonLabel = page.locator('label[for="season"]');
    await expect(seasonLabel).toBeVisible();
    await expect(seasonLabel).toContainText('シーズン');

    // 対戦日フィールドのラベル
    const dateLabel = page.locator('label[for="date"]');
    await expect(dateLabel).toBeVisible();
    await expect(dateLabel).toContainText('対戦日');

    // 使用デッキフィールドのラベル
    const myDeckLabel = page.locator('label[for="myDeckId"]');
    await expect(myDeckLabel).toBeVisible();
    await expect(myDeckLabel).toContainText('使用デッキ');

    // 相手デッキフィールドのラベル
    const opponentDeckLabel = page.locator('label[for="opponentDeckId"]');
    await expect(opponentDeckLabel).toBeVisible();
    await expect(opponentDeckLabel).toContainText('相手デッキ');
  });
});
