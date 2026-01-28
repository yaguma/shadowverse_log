import { expect, test } from '@playwright/test';
import {
  consecutiveDeckMasters,
  errorMessages,
  newDeckMaster,
  validationTestData,
} from '../../fixtures/deck-master';
import { DeckMasterPage } from '../../pages/DeckMasterPage';

/**
 * E2E Test: デッキ種別追加機能
 * TASK-0014: デッキ種別管理E2Eテスト
 *
 * 注意: デッキ管理ページが未実装のため、すべてのテストはスキップマーク付きで実装
 */

test.describe('Deck Master Add - デッキ種別追加機能', () => {
  let deckMasterPage: DeckMasterPage;

  test.beforeEach(async ({ page }) => {
    deckMasterPage = new DeckMasterPage(page);
  });

  /**
   * TC-E2E-DM-ADD-001: デッキ種別追加 - 正常フロー
   * 🔵 信頼性レベル: dataflow.md 1.1に基づく
   */
  test.skip('デッキ種別を正常に追加できる', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // Act: 追加フォームを開き、データを入力して送信
    await deckMasterPage.clickAddButton();
    await expect(deckMasterPage.getDialog()).toBeVisible();

    await deckMasterPage.selectClassName(newDeckMaster.className);
    await deckMasterPage.fillDeckName(newDeckMaster.deckName);
    await deckMasterPage.submitForm();

    // Assert: 追加したデッキ種別が一覧に表示される
    await expect(page.locator(`text=${newDeckMaster.deckName}`)).toBeVisible();
    await expect(deckMasterPage.getDialog()).not.toBeVisible();
  });

  /**
   * TC-E2E-DM-ADD-002: 追加後に一覧が更新される
   * 🔵 信頼性レベル: dataflow.md 1.1に基づく
   */
  test.skip('追加後に一覧が更新される', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // 初期状態のアイテム数を取得
    const initialCount = await deckMasterPage.getDeckMasterItems().count();

    // Act: 新しいデッキ種別を追加
    await deckMasterPage.clickAddButton();
    await deckMasterPage.selectClassName(newDeckMaster.className);
    await deckMasterPage.fillDeckName(newDeckMaster.deckName);
    await deckMasterPage.submitForm();

    // Assert: アイテム数が1増加している
    await expect(deckMasterPage.getDeckMasterItems()).toHaveCount(initialCount + 1);

    // 追加したデッキ種別が一覧に存在する
    const addedItem = deckMasterPage.getDeckMasterItemByText(newDeckMaster.deckName);
    await expect(addedItem).toBeVisible();
  });

  /**
   * TC-E2E-DM-ADD-003: 連続追加が可能
   * 🔵 信頼性レベル: dataflow.md 1.1に基づく
   */
  test.skip('連続でデッキ種別を追加できる', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // Act: 複数のデッキ種別を連続で追加
    for (const deckMaster of consecutiveDeckMasters) {
      await deckMasterPage.clickAddButton();
      await expect(deckMasterPage.getDialog()).toBeVisible();

      await deckMasterPage.selectClassName(deckMaster.className);
      await deckMasterPage.fillDeckName(deckMaster.deckName);
      await deckMasterPage.submitForm();

      // ダイアログが閉じるのを待つ
      await expect(deckMasterPage.getDialog()).not.toBeVisible();
    }

    // Assert: すべてのデッキ種別が一覧に表示される
    for (const deckMaster of consecutiveDeckMasters) {
      await expect(page.locator(`text=${deckMaster.deckName}`)).toBeVisible();
    }
  });

  /**
   * TC-E2E-DM-ADD-004: デッキ名空で登録不可
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test.skip('デッキ名が空の場合は登録できない', async () => {
    // Arrange: デッキ種別管理ページにアクセスし、追加フォームを開く
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();
    await deckMasterPage.clickAddButton();

    // Act: クラス名のみ入力し、デッキ名を空のまま送信
    await deckMasterPage.selectClassName(newDeckMaster.className);
    await deckMasterPage.clearDeckName();
    await deckMasterPage.submitForm();

    // Assert: エラーメッセージが表示され、フォームは開いたまま
    await expect(deckMasterPage.getErrorMessage()).toContainText(errorMessages.deckNameRequired);
    await expect(deckMasterPage.getDialog()).toBeVisible();
  });

  /**
   * TC-E2E-DM-ADD-005: デッキ名51文字で登録不可
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test.skip('デッキ名が51文字以上の場合は登録できない', async () => {
    // Arrange: デッキ種別管理ページにアクセスし、追加フォームを開く
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();
    await deckMasterPage.clickAddButton();

    // Act: クラス名を入力し、51文字のデッキ名を入力して送信
    await deckMasterPage.selectClassName(newDeckMaster.className);
    await deckMasterPage.fillDeckName(validationTestData.overMaxLengthName);
    await deckMasterPage.submitForm();

    // Assert: エラーメッセージが表示され、フォームは開いたまま
    await expect(deckMasterPage.getErrorMessage()).toContainText(errorMessages.deckNameTooLong);
    await expect(deckMasterPage.getDialog()).toBeVisible();
  });

  /**
   * TC-E2E-DM-ADD-006: クラス名未選択で登録不可
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test.skip('クラス名が未選択の場合は登録できない', async () => {
    // Arrange: デッキ種別管理ページにアクセスし、追加フォームを開く
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();
    await deckMasterPage.clickAddButton();

    // Act: デッキ名のみ入力し、クラス名を選択せずに送信
    await deckMasterPage.fillDeckName(newDeckMaster.deckName);
    await deckMasterPage.submitForm();

    // Assert: エラーメッセージが表示され、フォームは開いたまま
    await expect(deckMasterPage.getErrorMessage()).toContainText(errorMessages.classNameRequired);
    await expect(deckMasterPage.getDialog()).toBeVisible();
  });

  /**
   * TC-E2E-DM-ADD-007: 最大文字数（50文字）のデッキ名で登録可能
   * 🔵 信頼性レベル: 境界値テスト
   */
  test.skip('デッキ名が50文字の場合は登録できる', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセスし、追加フォームを開く
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();
    await deckMasterPage.clickAddButton();

    // Act: クラス名を入力し、50文字のデッキ名を入力して送信
    await deckMasterPage.selectClassName(newDeckMaster.className);
    await deckMasterPage.fillDeckName(validationTestData.maxLengthName);
    await deckMasterPage.submitForm();

    // Assert: 登録が成功し、フォームが閉じる
    await expect(deckMasterPage.getDialog()).not.toBeVisible();
    await expect(page.locator(`text=${validationTestData.maxLengthName}`)).toBeVisible();
  });
});
