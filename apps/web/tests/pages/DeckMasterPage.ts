import type { Locator, Page } from '@playwright/test';

/**
 * デッキ種別管理ページのPage Objectパターン
 * TASK-0014: デッキ種別管理E2Eテスト
 *
 * Page Objectパターンにより、UIの変更に対する影響を局所化し、
 * テストコードの保守性を向上させる
 */
export class DeckMasterPage {
  // ページ内要素のロケーター
  private readonly addButton: Locator;
  private readonly classNameSelect: Locator;
  private readonly deckNameInput: Locator;
  private readonly submitButton: Locator;
  private readonly cancelButton: Locator;
  private readonly confirmDeleteButton: Locator;
  private readonly cancelDeleteButton: Locator;
  private readonly dialog: Locator;
  private readonly deckMasterItems: Locator;
  private readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    // data-testid属性によるロケーター定義
    this.addButton = page.getByTestId('add-deck-master-button');
    this.classNameSelect = page.getByTestId('class-name-select');
    this.deckNameInput = page.getByTestId('deck-name-input');
    this.submitButton = page.getByTestId('submit-button');
    this.cancelButton = page.getByTestId('cancel-button');
    this.confirmDeleteButton = page.getByTestId('confirm-delete-button');
    this.cancelDeleteButton = page.getByTestId('cancel-delete-button');
    this.dialog = page.getByRole('dialog');
    this.deckMasterItems = page.getByTestId('deck-master-item');
    this.errorMessage = page.getByTestId('error-message');
  }

  /**
   * デッキ種別管理ページに遷移する
   */
  async goto(): Promise<void> {
    await this.page.goto('/deck-master');
  }

  /**
   * 追加ボタンをクリックする
   */
  async clickAddButton(): Promise<void> {
    await this.addButton.click();
  }

  /**
   * クラス名を選択する
   * @param className - 選択するクラス名
   */
  async selectClassName(className: string): Promise<void> {
    await this.classNameSelect.selectOption({ label: className });
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
   * デッキ種別アイテム一覧を取得する
   * @returns デッキ種別アイテムのロケーター
   */
  getDeckMasterItems(): Locator {
    return this.deckMasterItems;
  }

  /**
   * 指定インデックスの編集ボタンをクリックする
   * @param index - 編集対象のインデックス
   */
  async clickEditButton(index: number): Promise<void> {
    await this.page.getByTestId(`edit-button-${index}`).click();
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
    await this.confirmDeleteButton.click();
  }

  /**
   * 削除確認ダイアログをキャンセルする
   */
  async cancelDelete(): Promise<void> {
    await this.cancelDeleteButton.click();
  }

  /**
   * ダイアログを取得する
   * @returns ダイアログのロケーター
   */
  getDialog(): Locator {
    return this.dialog;
  }

  /**
   * クラス名セレクトボックスを取得する
   * @returns クラス名セレクトボックスのロケーター
   */
  getClassNameSelect(): Locator {
    return this.classNameSelect;
  }

  /**
   * デッキ名入力フィールドを取得する
   * @returns デッキ名入力フィールドのロケーター
   */
  getDeckNameInput(): Locator {
    return this.deckNameInput;
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
   * 特定のテキストを含むデッキ種別アイテムが表示されているか確認する
   * @param text - 検索するテキスト
   * @returns 該当するロケーター
   */
  getDeckMasterItemByText(text: string): Locator {
    return this.page.locator(`[data-testid="deck-master-item"]:has-text("${text}")`);
  }

  /**
   * ページ読み込み完了を待機する
   */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}
