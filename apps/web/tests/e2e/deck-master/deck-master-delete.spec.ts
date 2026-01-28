import { expect, test } from '@playwright/test';
import {
  deletableDeckMaster,
  errorMessages,
  nonDeletableDeckMaster,
} from '../../fixtures/deck-master';
import { DeckMasterPage } from '../../pages/DeckMasterPage';

/**
 * E2E Test: デッキ種別削除機能
 * TASK-0014: デッキ種別管理E2Eテスト
 *
 * 注意: デッキ管理ページが未実装のため、すべてのテストはスキップマーク付きで実装
 */

test.describe('Deck Master Delete - デッキ種別削除機能', () => {
  let deckMasterPage: DeckMasterPage;

  test.beforeEach(async ({ page }) => {
    deckMasterPage = new DeckMasterPage(page);
  });

  /**
   * TC-E2E-DM-DEL-001: デッキ種別削除 - 正常フロー
   * 🔵 信頼性レベル: dataflow.md 1.3に基づく
   *
   * 削除可能なデッキ種別（参照なし）を削除するテスト
   */
  test.skip('参照のないデッキ種別を正常に削除できる', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // 削除対象のデッキ種別が表示されていることを確認
    await expect(page.locator(`text=${deletableDeckMaster.deckName}`)).toBeVisible();

    // 削除前のアイテム数を取得
    const initialCount = await deckMasterPage.getDeckMasterItems().count();

    // Act: 削除ボタンをクリックして確認ダイアログで削除を実行
    await deckMasterPage.clickDeleteButton(0);
    await deckMasterPage.confirmDelete();

    // Assert: 削除されたデッキ種別が一覧から消える
    await expect(page.locator(`text=${deletableDeckMaster.deckName}`)).not.toBeVisible();
    await expect(deckMasterPage.getDeckMasterItems()).toHaveCount(initialCount - 1);
  });

  /**
   * TC-E2E-DM-DEL-002: 削除キャンセルで削除されない
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test.skip('削除をキャンセルするとデッキ種別が削除されない', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    const targetDeckName = deletableDeckMaster.deckName;
    await expect(page.locator(`text=${targetDeckName}`)).toBeVisible();

    // 削除前のアイテム数を取得
    const initialCount = await deckMasterPage.getDeckMasterItems().count();

    // Act: 削除ボタンをクリックして確認ダイアログでキャンセル
    await deckMasterPage.clickDeleteButton(0);
    await deckMasterPage.cancelDelete();

    // Assert: デッキ種別が削除されずに残っている
    await expect(page.locator(`text=${targetDeckName}`)).toBeVisible();
    await expect(deckMasterPage.getDeckMasterItems()).toHaveCount(initialCount);
  });

  /**
   * TC-E2E-DM-DEL-003: 参照ありデータは削除ボタンがdisabled
   * 🔵 信頼性レベル: 要件定義書REQ-EXT-008に基づく
   *
   * 対戦履歴に紐づいているデッキ種別は削除できないようにUI上で制御
   */
  test.skip('参照のあるデッキ種別の削除ボタンが無効化されている', async () => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // 参照ありのデッキ種別（nonDeletableDeckMaster）のインデックスを特定
    // フィクスチャのtestDeckMastersでは index=1 が参照ありデータ
    const nonDeletableIndex = 1;

    // Assert: 削除ボタンがdisabledになっている
    const deleteButton = deckMasterPage.getDeleteButton(nonDeletableIndex);
    await expect(deleteButton).toBeDisabled();
  });

  /**
   * TC-E2E-DM-DEL-004: 参照ありデータ削除で409エラー表示
   * 🔵 信頼性レベル: 要件定義書REQ-EXT-401に基づく
   *
   * APIレベルでの削除制約エラーを確認
   * （UIでは削除ボタンがdisabledで防止されるが、API直接呼び出しの場合のテスト）
   */
  test.skip('参照のあるデッキ種別を削除しようとするとエラーが表示される', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // 参照ありのデッキ種別が表示されていることを確認
    await expect(page.locator(`text=${nonDeletableDeckMaster.deckName}`)).toBeVisible();

    // Note: このテストはAPIの削除制約を検証するもの
    // 実際のUIでは削除ボタンがdisabledのため、このフローには到達しない
    // テストではAPIを直接呼び出すか、モックでdisabled解除して検証

    // Assert: エラーメッセージが表示される
    // （参照ありデータの削除を試みた場合）
    await expect(page.locator(`text=${errorMessages.deleteConflict}`)).toBeVisible();
  });

  /**
   * TC-E2E-DM-DEL-005: 削除確認ダイアログが表示される
   * 🔵 信頼性レベル: 要件定義書に基づく
   */
  test.skip('削除ボタンクリックで確認ダイアログが表示される', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    // Act: 削除ボタンをクリック
    await deckMasterPage.clickDeleteButton(0);

    // Assert: 確認ダイアログが表示される
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('削除してよろしいですか')).toBeVisible();
  });

  /**
   * TC-E2E-DM-DEL-006: 削除後に一覧が更新される
   * 🔵 信頼性レベル: dataflow.md 1.3に基づく
   */
  test.skip('削除後に一覧が自動的に更新される', async ({ page }) => {
    // Arrange: デッキ種別管理ページにアクセス
    await deckMasterPage.goto();
    await deckMasterPage.waitForLoaded();

    const targetDeckName = deletableDeckMaster.deckName;
    await expect(page.locator(`text=${targetDeckName}`)).toBeVisible();

    // 削除前のアイテム一覧を取得
    const initialItems = await deckMasterPage.getDeckMasterItems().allTextContents();

    // Act: 削除を実行
    await deckMasterPage.clickDeleteButton(0);
    await deckMasterPage.confirmDelete();

    // Assert: 一覧が更新され、削除したアイテムが含まれていない
    await expect(page.locator(`text=${targetDeckName}`)).not.toBeVisible();

    const updatedItems = await deckMasterPage.getDeckMasterItems().allTextContents();
    expect(updatedItems.length).toBe(initialItems.length - 1);
    expect(updatedItems).not.toContain(expect.stringContaining(targetDeckName));
  });
});
