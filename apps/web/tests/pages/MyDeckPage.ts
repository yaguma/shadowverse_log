import type { Locator, Page } from '@playwright/test';

/**
 * 使用デッキ管理ページのPage Objectパターン
 * TASK-0021: 使用デッキ管理E2Eテスト
 *
 * Page Objectパターンにより、UIの変更に対する影響を局所化し、
 * テストコードの保守性を向上させる
 */
export class MyDeckPage {
  // ページ内要素のロケーター
  private readonly addButton: Locator;
  private readonly deckClassSelect: Locator;
  private readonly deckNameInput: Locator;
  private readonly deckCodeInput: Locator;
  private readonly submitButton: Locator;
  private readonly cancelButton: Locator;
  private readonly dialog: Locator;
  private readonly myDeckItems: Locator;
  private readonly errorMessage: Locator;
  private readonly confirmDialog: Locator;
  private readonly confirmDialogConfirm: Locator;
  private readonly confirmDialogCancel: Locator;

  constructor(private readonly page: Page) {
    // data-testid属性とaria-labelによるロケーター定義
    this.addButton = page.getByTestId('add-deck-button');
    this.deckClassSelect = page.getByLabel('デッキ種別');
    this.deckNameInput = page.getByLabel('デッキ名');
    this.deckCodeInput = page.getByLabel('デッキコード');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.getByTestId('cancel-button');
    this.dialog = page.getByTestId('mydeck-dialog');
    this.myDeckItems = page.getByTestId('my-deck-item');
    this.errorMessage = page.getByTestId('error-message');
    this.confirmDialog = page.getByTestId('confirm-dialog');
    this.confirmDialogConfirm = page.getByTestId('confirm-dialog-confirm');
    this.confirmDialogCancel = page.getByTestId('confirm-dialog-cancel');
  }

  /**
   * 使用デッキ管理ページに遷移する
   */
  async goto(): Promise<void> {
    await this.page.goto('/my-deck');
  }

  /**
   * 追加ボタンをクリックする
   */
  async clickAddButton(): Promise<void> {
    await this.addButton.click();
  }

  /**
   * デッキ種別を選択する
   * @param deckClass - 選択するデッキ種別名
   */
  async selectDeckClass(deckClass: string): Promise<void> {
    await this.deckClassSelect.selectOption({ label: deckClass });
  }

  /**
   * デッキ名を入力する
   * @param deckName - 入力するデッキ名
   */
  async fillDeckName(deckName: string): Promise<void> {
    await this.deckNameInput.fill(deckName);
  }

  /**
   * デッキ名入力フィールドをクリアする
   */
  async clearDeckName(): Promise<void> {
    await this.deckNameInput.clear();
  }

  /**
   * デッキコードを入力する
   * @param deckCode - 入力するデッキコード
   */
  async fillDeckCode(deckCode: string): Promise<void> {
    await this.deckCodeInput.fill(deckCode);
  }

  /**
   * デッキコード入力フィールドをクリアする
   */
  async clearDeckCode(): Promise<void> {
    await this.deckCodeInput.clear();
  }

  /**
   * フォームを送信する
   */
  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * フォームをキャンセルする
   */
  async cancelForm(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * 使用デッキアイテム一覧を取得する
   * @returns 使用デッキアイテムのロケーター
   */
  getMyDeckItems(): Locator {
    return this.myDeckItems;
  }

  /**
   * 指定インデックスの削除ボタンをクリックする
   * @param index - 削除対象のインデックス
   */
  async clickDeleteButton(index: number): Promise<void> {
    await this.page.getByTestId(`delete-button-${index}`).click();
  }

  /**
   * 削除確認ダイアログで削除を実行する
   */
  async confirmDelete(): Promise<void> {
    await this.confirmDialogConfirm.click();
  }

  /**
   * 削除確認ダイアログをキャンセルする
   */
  async cancelDelete(): Promise<void> {
    await this.confirmDialogCancel.click();
  }

  /**
   * ダイアログを取得する
   * @returns ダイアログのロケーター
   */
  getDialog(): Locator {
    return this.dialog;
  }

  /**
   * 確認ダイアログを取得する
   * @returns 確認ダイアログのロケーター
   */
  getConfirmDialog(): Locator {
    return this.confirmDialog;
  }

  /**
   * デッキ種別セレクトボックスを取得する
   * @returns デッキ種別セレクトボックスのロケーター
   */
  getDeckClassSelect(): Locator {
    return this.deckClassSelect;
  }

  /**
   * デッキ名入力フィールドを取得する
   * @returns デッキ名入力フィールドのロケーター
   */
  getDeckNameInput(): Locator {
    return this.deckNameInput;
  }

  /**
   * デッキコード入力フィールドを取得する
   * @returns デッキコード入力フィールドのロケーター
   */
  getDeckCodeInput(): Locator {
    return this.deckCodeInput;
  }

  /**
   * エラーメッセージを取得する
   * @returns エラーメッセージのロケーター
   */
  getErrorMessage(): Locator {
    return this.errorMessage;
  }

  /**
   * 送信ボタンを取得する
   * @returns 送信ボタンのロケーター
   */
  getSubmitButton(): Locator {
    return this.submitButton;
  }

  /**
   * 指定インデックスの削除ボタンを取得する
   * @param index - 対象のインデックス
   * @returns 削除ボタンのロケーター
   */
  getDeleteButton(index: number): Locator {
    return this.page.getByTestId(`delete-button-${index}`);
  }

  /**
   * 特定のテキストを含む使用デッキアイテムが表示されているか確認する
   * @param text - 検索するテキスト
   * @returns 該当するロケーター
   */
  getMyDeckItemByText(text: string): Locator {
    return this.page.locator(`[data-testid="my-deck-item"]:has-text("${text}")`);
  }

  /**
   * ページ読み込み完了を待機する
   */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}
