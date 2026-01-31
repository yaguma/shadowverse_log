import { expect, test } from '@playwright/test';
import { deletableMyDeck, nonDeletableMyDeck } from '../../fixtures/my-deck';
import { MyDeckPage } from '../../pages/MyDeckPage';

/**
 * E2E Test: マイデッキ削除機能
 * TASK-0021: 使用デッキ管理E2Eテスト
 *
 * 注意: 使用デッキ管理ページが未実装のため、すべてのテストはスキップマーク付きで実装
 */

test.describe('My Deck Delete - マイデッキ削除機能', () => {
  let myDeckPage: MyDeckPage;

  test.beforeEach(async ({ page }) => {
    myDeckPage = new MyDeckPage(page);
  });

  /**
   * TC-E2E-MD-DEL-001: マイデッキを削除できる
   * REQ-EXT-301 ~ REQ-EXT-305 対応
   *
   * 対戦履歴から参照されていないマイデッキを削除するテスト
   */
  test.skip('TC-E2E-MD-DEL-001: マイデッキを削除できる', async ({ page }) => {
    // Arrange: 使用デッキ管理ページにアクセス
    await myDeckPage.goto();
    await myDeckPage.waitForLoaded();

    // 削除対象のマイデッキが表示されていることを確認
    await expect(page.locator(`text=${deletableMyDeck.deckName}`)).toBeVisible();

    // 削除前のアイテム数を取得
    const initialCount = await myDeckPage.getMyDeckItems().count();

    // Act: 削除ボタンをクリックして確認ダイアログで削除を実行
    await myDeckPage.clickDeleteButton(0);
    await expect(myDeckPage.getConfirmDialog()).toBeVisible();
    await myDeckPage.confirmDelete();

    // Assert: 削除されたマイデッキが一覧から消える
    await expect(page.locator(`text=${deletableMyDeck.deckName}`)).not.toBeVisible();
    await expect(myDeckPage.getMyDeckItems()).toHaveCount(initialCount - 1);
  });

  /**
   * TC-E2E-MD-DEL-002: 削除確認でキャンセルすると削除されない
   */
  test.skip('TC-E2E-MD-DEL-002: 削除確認でキャンセルすると削除されない', async ({ page }) => {
    // Arrange: 使用デッキ管理ページにアクセス
    await myDeckPage.goto();
    await myDeckPage.waitForLoaded();

    const targetDeckName = deletableMyDeck.deckName;
    await expect(page.locator(`text=${targetDeckName}`)).toBeVisible();

    // 削除前のアイテム数を取得
    const initialCount = await myDeckPage.getMyDeckItems().count();

    // Act: 削除ボタンをクリックして確認ダイアログでキャンセル
    await myDeckPage.clickDeleteButton(0);
    await expect(myDeckPage.getConfirmDialog()).toBeVisible();
    await myDeckPage.cancelDelete();

    // Assert: マイデッキが削除されずに残っている
    await expect(myDeckPage.getConfirmDialog()).not.toBeVisible();
    await expect(page.locator(`text=${targetDeckName}`)).toBeVisible();
    await expect(myDeckPage.getMyDeckItems()).toHaveCount(initialCount);
  });

  /**
   * TC-E2E-MD-DEL-003: 対戦履歴から参照されているデッキは削除ボタンが無効
   * REQ-EXT-303 対応：参照チェック
   *
   * 対戦履歴に紐づいているマイデッキは削除できないようにUI上で制御
   */
  test.skip('TC-E2E-MD-DEL-003: 対戦履歴から参照されているデッキは削除ボタンが無効', async ({
    page,
  }) => {
    // Arrange: 使用デッキ管理ページにアクセス
    await myDeckPage.goto();
    await myDeckPage.waitForLoaded();

    // 参照ありのマイデッキが表示されていることを確認
    await expect(page.locator(`text=${nonDeletableMyDeck.deckName}`)).toBeVisible();

    // 参照ありのマイデッキ（nonDeletableMyDeck）のインデックスを特定
    // フィクスチャのtestMyDecksでは index=1 が参照ありデータ
    const nonDeletableIndex = 1;

    // Assert: 削除ボタンがdisabledになっている
    const deleteButton = myDeckPage.getDeleteButton(nonDeletableIndex);
    await expect(deleteButton).toBeDisabled();
  });
});
