import { expect, test } from '@playwright/test';
import { errorMessages, testDeckMasters, updatedDeckName } from '../../fixtures/deck-master';
import { DeckMasterPage } from '../../pages/DeckMasterPage';

/**
 * E2E Test: デッキ種別編集機能
 * TASK-0014: デッキ種別管理E2Eテスト
 *
 * 注意: デッキ管理ページが未実装のため、すべてのテストはスキップマーク付きで実装
 */

test.describe('Deck Master Edit - デッキ種別編集機能', () => {
  let deckMasterPage: DeckMasterPage;

  test.beforeEach(async ({ page }) => {
    deckMasterPage = new DeckMasterPage(page);
  });

  /**
   * TC-E2E-DM-EDIT-001: デッキ種別編集 - 正常フロー
   * 🔵 信頼性レベル: dataflow.md 1.2に基づく
   */
  test.skip('デッキ種別を正常に編集できる', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // 既存のデッキ種別が表示されていることを確認
    const originalDeckName = testDeckMasters[0].deckName;
    await expect(page.locator(`text=${originalDeckName}`)).toBeVisible();

    // Act: 編集ボタンをクリックしてフォームを開く
    await deckMasterPage.clickEditButton(0);
    await expect(deckMasterPage.getDialog()).toBeVisible();

    // デッキ名を変更して送信
    await deckMasterPage.clearDeckName();
    await deckMasterPage.fillDeckName(updatedDeckName);
    await deckMasterPage.submitForm();

    // Assert: 編集後のデッキ名が一覧に表示される
    await expect(deckMasterPage.getDialog()).not.toBeVisible();
    await expect(page.locator(`text=${updatedDeckName}`)).toBeVisible();
    await expect(page.locator(`text=${originalDeckName}`)).not.toBeVisible();
  });

  /**
   * TC-E2E-DM-EDIT-002: 編集時にクラス名が変更不可（disabled）
   * 🔵 信頼性レベル: 要件定義書REQ-EXT-006に基づく
   */
  test.skip('編集時にクラス名のセレクトボックスが無効化されている', async () => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // Act: 編集ボタンをクリックしてフォームを開く
    await deckMasterPage.clickEditButton(0);
    await expect(deckMasterPage.getDialog()).toBeVisible();

    // Assert: クラス名セレクトボックスがdisabledになっている
    await expect(deckMasterPage.getClassNameSelect()).toBeDisabled();
  });

  /**
   * TC-E2E-DM-EDIT-003: 編集キャンセルで変更されない
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test.skip('編集をキャンセルすると変更が保存されない', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    const originalDeckName = testDeckMasters[0].deckName;
    await expect(page.locator(`text=${originalDeckName}`)).toBeVisible();

    // Act: 編集フォームを開き、デッキ名を変更してキャンセル
    await deckMasterPage.clickEditButton(0);
    await expect(deckMasterPage.getDialog()).toBeVisible();

    await deckMasterPage.clearDeckName();
    await deckMasterPage.fillDeckName(updatedDeckName);
    await deckMasterPage.cancelForm();

    // Assert: 元のデッキ名が表示されたまま（変更されていない）
    await expect(deckMasterPage.getDialog()).not.toBeVisible();
    await expect(page.locator(`text=${originalDeckName}`)).toBeVisible();
    await expect(page.locator(`text=${updatedDeckName}`)).not.toBeVisible();
  });

  /**
   * TC-E2E-DM-EDIT-004: デッキ名空で更新不可
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test.skip('デッキ名が空の場合は更新できない', async () => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // Act: 編集フォームを開き、デッキ名を空にして送信
    await deckMasterPage.clickEditButton(0);
    await expect(deckMasterPage.getDialog()).toBeVisible();

    await deckMasterPage.clearDeckName();
    await deckMasterPage.submitForm();

    // Assert: エラーメッセージが表示され、フォームは開いたまま
    await expect(deckMasterPage.getErrorMessage()).toContainText(errorMessages.deckNameRequired);
    await expect(deckMasterPage.getDialog()).toBeVisible();
  });

  /**
   * TC-E2E-DM-EDIT-005: 編集フォームに既存値が表示される
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test.skip('編集フォームを開くと既存の値が表示される', async () => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    const existingDeckMaster = testDeckMasters[0];

    // Act: 編集ボタンをクリックしてフォームを開く
    await deckMasterPage.clickEditButton(0);
    await expect(deckMasterPage.getDialog()).toBeVisible();

    // Assert: 既存の値がフォームに表示される
    await expect(deckMasterPage.getDeckNameInput()).toHaveValue(existingDeckMaster.deckName);
    // クラス名セレクトボックスの選択値も確認
    await expect(deckMasterPage.getClassNameSelect()).toHaveValue(existingDeckMaster.className);
  });
});
