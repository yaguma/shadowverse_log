import { expect, test } from '@playwright/test';

/**
 * E2E Test: デッキ管理画面
 * TASK-0024: デッキ管理画面E2Eテスト
 *
 * テスト対象:
 * - ナビゲーション遷移
 * - タブ切り替え
 * - アクティブ状態の表示
 */

test.describe('Deck Management - デッキ管理画面', () => {
  test.beforeEach(async ({ page }) => {
    // トップページにアクセス
    await page.goto('/');
  });

  /**
   * TC-E2E-DM-001: ナビゲーションからデッキ管理画面へ遷移できる
   * REQ: ヘッダーからデッキ管理画面へ遷移できる
   */
  test('TC-E2E-DM-001: ナビゲーションからデッキ管理画面へ遷移できる', async ({ page }) => {
    // Arrange: ナビゲーションにデッキ管理リンクがあることを確認
    const deckManagementLink = page.getByTestId('nav-deck-management');
    await expect(deckManagementLink).toBeVisible();

    // Act: デッキ管理リンクをクリック
    await deckManagementLink.click();

    // Assert: URLが /decks になる
    await expect(page).toHaveURL(/\/decks$/);

    // Assert: ページタイトルが表示される
    await expect(page.getByTestId('deck-manage-title')).toBeVisible();
    await expect(page.getByTestId('deck-manage-title')).toHaveText('デッキ管理');
  });

  /**
   * TC-E2E-DM-002: デッキ管理ページが直接アクセスで表示される
   * REQ: URLが /decks になる、ページタイトルが表示される
   */
  test('TC-E2E-DM-002: デッキ管理ページが直接アクセスで表示される', async ({ page }) => {
    // Act: デッキ管理ページに直接アクセス
    await page.goto('/decks');

    // Assert: ページが表示される
    await expect(page.getByTestId('deck-manage-page')).toBeVisible();
    await expect(page.getByTestId('deck-manage-title')).toHaveText('デッキ管理');
  });

  /**
   * TC-E2E-DM-003: 初期表示でデッキ種別タブがアクティブ
   * REQ: 初期表示でデッキ種別タブがアクティブ
   */
  test('TC-E2E-DM-003: 初期表示でデッキ種別タブがアクティブ', async ({ page }) => {
    // Arrange: デッキ管理ページにアクセス
    await page.goto('/decks');

    // Assert: デッキ種別タブがアクティブ（aria-selected="true"）
    const deckMasterTab = page.getByTestId('tab-deckMaster');
    await expect(deckMasterTab).toBeVisible();
    await expect(deckMasterTab).toHaveAttribute('aria-selected', 'true');

    // Assert: 使用デッキタブは非アクティブ
    const myDeckTab = page.getByTestId('tab-myDeck');
    await expect(myDeckTab).toBeVisible();
    await expect(myDeckTab).toHaveAttribute('aria-selected', 'false');

    // Assert: DeckMasterListが表示されている
    await expect(page.getByTestId('deck-master-list')).toBeVisible();
  });

  /**
   * TC-E2E-DM-004: 使用デッキタブをクリックするとMyDeckListが表示される
   * REQ: 使用デッキタブをクリックするとMyDeckListが表示される
   */
  test('TC-E2E-DM-004: 使用デッキタブをクリックするとMyDeckListが表示される', async ({ page }) => {
    // Arrange: デッキ管理ページにアクセス
    await page.goto('/decks');

    // Act: 使用デッキタブをクリック
    const myDeckTab = page.getByTestId('tab-myDeck');
    await myDeckTab.click();

    // Assert: 使用デッキタブがアクティブになる
    await expect(myDeckTab).toHaveAttribute('aria-selected', 'true');

    // Assert: デッキ種別タブが非アクティブになる
    const deckMasterTab = page.getByTestId('tab-deckMaster');
    await expect(deckMasterTab).toHaveAttribute('aria-selected', 'false');

    // Assert: MyDeckListが表示される
    await expect(page.getByTestId('my-deck-list')).toBeVisible();
  });

  /**
   * TC-E2E-DM-005: デッキ種別タブに戻るとDeckMasterListが表示される
   * REQ: デッキ種別タブに戻るとDeckMasterListが表示される
   */
  test('TC-E2E-DM-005: デッキ種別タブに戻るとDeckMasterListが表示される', async ({ page }) => {
    // Arrange: デッキ管理ページにアクセスし、使用デッキタブに切り替え
    await page.goto('/decks');
    const myDeckTab = page.getByTestId('tab-myDeck');
    await myDeckTab.click();
    await expect(page.getByTestId('my-deck-list')).toBeVisible();

    // Act: デッキ種別タブをクリック
    const deckMasterTab = page.getByTestId('tab-deckMaster');
    await deckMasterTab.click();

    // Assert: デッキ種別タブがアクティブになる
    await expect(deckMasterTab).toHaveAttribute('aria-selected', 'true');

    // Assert: 使用デッキタブが非アクティブになる
    await expect(myDeckTab).toHaveAttribute('aria-selected', 'false');

    // Assert: DeckMasterListが表示される
    await expect(page.getByTestId('deck-master-list')).toBeVisible();
  });

  /**
   * TC-E2E-DM-006: デッキ管理リンクのアクティブスタイル確認
   * REQ: デッキ管理リンクのアクティブスタイル確認
   */
  test('TC-E2E-DM-006: デッキ管理リンクのアクティブスタイル確認', async ({ page }) => {
    // Act: デッキ管理ページにアクセス
    await page.goto('/decks');

    // Assert: デッキ管理リンクがアクティブスタイルを持つ
    const deckManagementLink = page.getByTestId('nav-deck-management');
    await expect(deckManagementLink).toBeVisible();

    // アクティブなリンクはbg-blue-600クラスを持つ
    await expect(deckManagementLink).toHaveClass(/bg-blue-600/);
    await expect(deckManagementLink).toHaveClass(/text-white/);
  });

  /**
   * TC-E2E-DM-007: 他のナビゲーションリンクは非アクティブ
   * REQ: デッキ管理ページでは他のリンクが非アクティブ
   */
  test('TC-E2E-DM-007: 他のナビゲーションリンクは非アクティブ', async ({ page }) => {
    // Act: デッキ管理ページにアクセス
    await page.goto('/decks');

    // Assert: 対戦履歴リンクは非アクティブスタイル
    const battleLogLink = page.getByRole('link', { name: '対戦履歴' });
    await expect(battleLogLink).toBeVisible();
    await expect(battleLogLink).not.toHaveClass(/bg-blue-600/);
  });

  /**
   * TC-E2E-DM-008: タブパネルのアクセシビリティ属性確認
   * REQ: WAI-ARIAに準拠したタブコンポーネント
   */
  test('TC-E2E-DM-008: タブパネルのアクセシビリティ属性確認', async ({ page }) => {
    // Arrange: デッキ管理ページにアクセス
    await page.goto('/decks');

    // Assert: タブリストにrole="tablist"が存在
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    // Assert: タブにrole="tab"が存在
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(2);

    // Assert: タブパネルにrole="tabpanel"が存在
    const tabpanel = page.getByRole('tabpanel');
    await expect(tabpanel).toBeVisible();
  });
});
