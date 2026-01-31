import { expect, test } from '@playwright/test';
import {
  errorMessages,
  newMyDeck,
  newMyDeckWithoutCode,
  validationTestData,
} from '../../fixtures/my-deck';
import { MyDeckPage } from '../../pages/MyDeckPage';

/**
 * E2E Test: マイデッキ追加機能
 * TASK-0021: 使用デッキ管理E2Eテスト
 *
 * 注意: 使用デッキ管理ページが未実装のため、すべてのテストはスキップマーク付きで実装
 */

test.describe('My Deck Add - マイデッキ追加機能', () => {
  let myDeckPage: MyDeckPage;

  test.beforeEach(async ({ page }) => {
    myDeckPage = new MyDeckPage(page);
  });

  /**
   * TC-E2E-MD-ADD-001: マイデッキを正常に追加できる
   * REQ-EXT-101 ~ REQ-EXT-107 対応
   */
  test.skip('TC-E2E-MD-ADD-001: マイデッキを正常に追加できる', async ({ page }) => {
    // Arrange: 使用デッキ管理ページにアクセス
    await myDeckPage.goto();
    await myDeckPage.waitForLoaded();

    // Act: 追加フォームを開き、データを入力して送信
    await myDeckPage.clickAddButton();
    await expect(myDeckPage.getDialog()).toBeVisible();

    await myDeckPage.selectDeckClass(newMyDeck.deckClass);
    await myDeckPage.fillDeckName(newMyDeck.deckName);
    await myDeckPage.fillDeckCode(newMyDeck.deckCode);
    await myDeckPage.submitForm();

    // Assert: 追加したマイデッキが一覧に表示される
    await expect(page.locator(`text=${newMyDeck.deckName}`)).toBeVisible();
    await expect(myDeckPage.getDialog()).not.toBeVisible();
  });

  /**
   * TC-E2E-MD-ADD-002: デッキコード無しでも追加できる
   * REQ-EXT-105 対応：デッキコードは任意
   */
  test.skip('TC-E2E-MD-ADD-002: デッキコード無しでも追加できる', async ({ page }) => {
    // Arrange: 使用デッキ管理ページにアクセス
    await myDeckPage.goto();
    await myDeckPage.waitForLoaded();

    // Act: 追加フォームを開き、デッキコードなしでデータを入力して送信
    await myDeckPage.clickAddButton();
    await expect(myDeckPage.getDialog()).toBeVisible();

    await myDeckPage.selectDeckClass(newMyDeckWithoutCode.deckClass);
    await myDeckPage.fillDeckName(newMyDeckWithoutCode.deckName);
    // デッキコードは入力しない
    await myDeckPage.submitForm();

    // Assert: 追加したマイデッキが一覧に表示される
    await expect(page.locator(`text=${newMyDeckWithoutCode.deckName}`)).toBeVisible();
    await expect(myDeckPage.getDialog()).not.toBeVisible();
  });

  /**
   * TC-E2E-MD-ADD-003: デッキ名空で登録不可
   * REQ-EXT-102 対応：デッキ名は必須
   */
  test.skip('TC-E2E-MD-ADD-003: デッキ名空で登録不可', async () => {
    // Arrange: 使用デッキ管理ページにアクセスし、追加フォームを開く
    await myDeckPage.goto();
    await myDeckPage.waitForLoaded();
    await myDeckPage.clickAddButton();

    // Act: デッキ種別のみ選択し、デッキ名を空のまま送信
    await myDeckPage.selectDeckClass(newMyDeck.deckClass);
    await myDeckPage.clearDeckName();
    await myDeckPage.submitForm();

    // Assert: エラーメッセージが表示され、フォームは開いたまま
    await expect(myDeckPage.getErrorMessage()).toContainText(errorMessages.deckNameRequired);
    await expect(myDeckPage.getDialog()).toBeVisible();
  });

  /**
   * TC-E2E-MD-ADD-004: デッキ種別未選択で登録不可
   * REQ-EXT-101 対応：デッキ種別は必須
   */
  test.skip('TC-E2E-MD-ADD-004: デッキ種別未選択で登録不可', async () => {
    // Arrange: 使用デッキ管理ページにアクセスし、追加フォームを開く
    await myDeckPage.goto();
    await myDeckPage.waitForLoaded();
    await myDeckPage.clickAddButton();

    // Act: デッキ名のみ入力し、デッキ種別を選択せずに送信
    await myDeckPage.fillDeckName(validationTestData.validDeckName);
    await myDeckPage.submitForm();

    // Assert: エラーメッセージが表示され、フォームは開いたまま
    await expect(myDeckPage.getErrorMessage()).toContainText(errorMessages.deckClassRequired);
    await expect(myDeckPage.getDialog()).toBeVisible();
  });

  /**
   * TC-E2E-MD-ADD-005: キャンセルボタンでダイアログが閉じる
   */
  test.skip('TC-E2E-MD-ADD-005: キャンセルボタンでダイアログが閉じる', async () => {
    // Arrange: 使用デッキ管理ページにアクセスし、追加フォームを開く
    await myDeckPage.goto();
    await myDeckPage.waitForLoaded();
    await myDeckPage.clickAddButton();
    await expect(myDeckPage.getDialog()).toBeVisible();

    // Act: 一部データを入力してからキャンセル
    await myDeckPage.selectDeckClass(newMyDeck.deckClass);
    await myDeckPage.fillDeckName(newMyDeck.deckName);
    await myDeckPage.cancelForm();

    // Assert: ダイアログが閉じる
    await expect(myDeckPage.getDialog()).not.toBeVisible();
  });
});
