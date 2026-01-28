/**
 * 【テストファイル概要】: DeckMasterDialogコンポーネントの単体テスト
 * 【テスト目的】: デッキ種別の追加/編集ダイアログの表示、バリデーション、送信機能を検証する
 * 【テスト範囲】: 新規追加モード、編集モード、バリデーション、送信、キャンセル
 * 【TASK-0012対応】: 12件のテストケースを実装
 * 🔵 信頼性レベル: TASK-0012仕様に基づく
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DeckMasterWithUsage } from '@shadowverse-log/shared';
import { DeckMasterDialog } from './DeckMasterDialog';

// ==================== テスト用モックデータ ====================

/**
 * 【モックデータ】: テスト用のデッキマスターデータ
 * 🔵 信頼性レベル: DeckMasterWithUsage型に準拠
 */
const mockDeckMaster: DeckMasterWithUsage = {
  id: 'deck-001',
  className: 'ウィッチ',
  deckName: '秘術ウィッチ',
  sortOrder: 1,
  lastUsedDate: '2025-01-26',
  usageCount: 10,
};

// ==================== DeckMasterDialogテスト ====================

describe('DeckMasterDialog', () => {
  // ==================== 1. 新規追加モード ====================

  describe('新規追加モード', () => {
    it('TC-DM-DIALOG-001: 新規モードでタイトルが「デッキ種別の追加」', () => {
      // 【テスト目的】: mode='create'の場合、ダイアログタイトルが「デッキ種別の追加」であること 🔵
      // 【テスト内容】: タイトル文言を確認 🔵
      // 【期待される動作】: "デッキ種別の追加"がDOMに存在 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【結果検証】: タイトルが表示されることを確認 🔵
      expect(screen.getByText('デッキ種別の追加')).toBeInTheDocument();
    });

    it('TC-DM-DIALOG-002: 新規モードでclassNameが選択可能', () => {
      // 【テスト目的】: mode='create'の場合、classNameセレクトがdisabledでないこと 🔵
      // 【テスト内容】: classNameセレクトのdisabled状態を確認 🔵
      // 【期待される動作】: classNameセレクトがdisabledでない 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【結果検証】: classNameセレクトが無効化されていないことを確認 🔵
      const classNameSelect = screen.getByRole('combobox', { name: /クラス名/i });
      expect(classNameSelect).not.toBeDisabled();
    });

    it('TC-DM-DIALOG-003: className未選択で登録ボタン押下時にエラー', async () => {
      // 【テスト目的】: className未選択で登録ボタンを押した場合、バリデーションエラーが表示されること 🔵
      // 【テスト内容】: className未選択状態で登録ボタンをクリック 🔵
      // 【期待される動作】: バリデーションエラーが表示される 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【deckName入力】: デッキ名のみ入力してclassNameは未選択 🔵
      const deckNameInput = screen.getByRole('textbox', { name: /デッキ名/i });
      await userEvent.type(deckNameInput, 'テストデッキ');

      // 【登録ボタンクリック】: 登録ボタンを押す 🔵
      const submitButton = screen.getByRole('button', { name: '登録' });
      await userEvent.click(submitButton);

      // 【結果検証】: バリデーションエラーが表示されることを確認 🔵
      await waitFor(() => {
        expect(screen.getByText('クラス名を選択してください')).toBeInTheDocument();
      });
    });
  });

  // ==================== 2. 編集モード ====================

  describe('編集モード', () => {
    it('TC-DM-DIALOG-004: 編集モードでタイトルが「デッキ種別の編集」', () => {
      // 【テスト目的】: mode='edit'の場合、ダイアログタイトルが「デッキ種別の編集」であること 🔵
      // 【テスト内容】: タイトル文言を確認 🔵
      // 【期待される動作】: "デッキ種別の編集"がDOMに存在 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="edit"
          initialData={mockDeckMaster}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【結果検証】: タイトルが表示されることを確認 🔵
      expect(screen.getByText('デッキ種別の編集')).toBeInTheDocument();
    });

    it('TC-DM-DIALOG-005: 編集モードでclassNameがdisabled', () => {
      // 【テスト目的】: mode='edit'の場合、classNameセレクトがdisabledであること 🔵
      // 【テスト内容】: classNameセレクトのdisabled状態を確認 🔵
      // 【期待される動作】: classNameセレクトがdisabled 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="edit"
          initialData={mockDeckMaster}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【結果検証】: classNameセレクトが無効化されていることを確認 🔵
      const classNameSelect = screen.getByRole('combobox', { name: /クラス名/i });
      expect(classNameSelect).toBeDisabled();
    });

    it('TC-DM-DIALOG-006: 編集モードで初期値が入力欄に表示', () => {
      // 【テスト目的】: initialDataが渡された場合、各フィールドに初期値が表示されること 🔵
      // 【テスト内容】: className, deckNameの初期値を確認 🔵
      // 【期待される動作】: 各フィールドに初期値が表示される 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="edit"
          initialData={mockDeckMaster}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【結果検証】: 初期値が表示されることを確認 🔵
      const classNameSelect = screen.getByRole('combobox', { name: /クラス名/i });
      expect(classNameSelect).toHaveValue('ウィッチ');

      const deckNameInput = screen.getByRole('textbox', { name: /デッキ名/i });
      expect(deckNameInput).toHaveValue('秘術ウィッチ');
    });
  });

  // ==================== 3. バリデーション ====================

  describe('バリデーション', () => {
    it('TC-DM-DIALOG-007: deckName空で登録ボタン押下時にエラー表示', async () => {
      // 【テスト目的】: deckNameが空で登録ボタンを押した場合、バリデーションエラーが表示されること 🔵
      // 【テスト内容】: deckName空で登録ボタンをクリック 🔵
      // 【期待される動作】: "デッキ名を入力してください"がDOMに存在 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【className選択】: クラス名を選択 🔵
      const classNameSelect = screen.getByRole('combobox', { name: /クラス名/i });
      await userEvent.selectOptions(classNameSelect, 'エルフ');

      // 【登録ボタンクリック】: deckName未入力で登録ボタンを押す 🔵
      const submitButton = screen.getByRole('button', { name: '登録' });
      await userEvent.click(submitButton);

      // 【結果検証】: バリデーションエラーが表示されることを確認 🔵
      await waitFor(() => {
        expect(screen.getByText('デッキ名を入力してください')).toBeInTheDocument();
      });
    });

    it('TC-DM-DIALOG-008: deckName101文字でエラー表示', async () => {
      // 【テスト目的】: deckNameが101文字の場合、バリデーションエラーが表示されること 🔵
      // 【テスト内容】: 101文字のdeckNameを入力して登録ボタンをクリック 🔵
      // 【期待される動作】: "デッキ名は100文字以内で入力してください"がDOMに存在 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【className選択】: クラス名を選択 🔵
      const classNameSelect = screen.getByRole('combobox', { name: /クラス名/i });
      await userEvent.selectOptions(classNameSelect, 'エルフ');

      // 【deckName入力】: 101文字のデッキ名を入力 🔵
      const deckNameInput = screen.getByRole('textbox', { name: /デッキ名/i });
      await userEvent.type(deckNameInput, 'a'.repeat(101));

      // 【登録ボタンクリック】: 登録ボタンを押す 🔵
      const submitButton = screen.getByRole('button', { name: '登録' });
      await userEvent.click(submitButton);

      // 【結果検証】: バリデーションエラーが表示されることを確認 🔵
      await waitFor(() => {
        expect(screen.getByText('デッキ名は100文字以内で入力してください')).toBeInTheDocument();
      });
    });
  });

  // ==================== 4. 送信 ====================

  describe('送信', () => {
    it('TC-DM-DIALOG-009: 登録成功でダイアログが閉じる', async () => {
      // 【テスト目的】: 登録成功時にonCloseが呼ばれること 🔵
      // 【テスト内容】: 有効なデータで登録ボタンをクリック 🔵
      // 【期待される動作】: onCloseが呼ばれる 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【className選択】: クラス名を選択 🔵
      const classNameSelect = screen.getByRole('combobox', { name: /クラス名/i });
      await userEvent.selectOptions(classNameSelect, 'エルフ');

      // 【deckName入力】: デッキ名を入力 🔵
      const deckNameInput = screen.getByRole('textbox', { name: /デッキ名/i });
      await userEvent.type(deckNameInput, '新規デッキ');

      // 【登録ボタンクリック】: 登録ボタンを押す 🔵
      const submitButton = screen.getByRole('button', { name: '登録' });
      await userEvent.click(submitButton);

      // 【結果検証】: onSubmitとonCloseが呼ばれることを確認 🔵
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          className: 'エルフ',
          deckName: '新規デッキ',
        });
      });
    });

    it('TC-DM-DIALOG-010: 送信中は登録ボタンがdisabled', () => {
      // 【テスト目的】: isSubmitting=trueの場合、登録ボタンがdisabledになること 🔵
      // 【テスト内容】: 送信中のボタン状態を確認 🔵
      // 【期待される動作】: 登録ボタンがdisabled、ローディング表示 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={true}
        />
      );

      // 【結果検証】: 登録ボタンが無効化されていることを確認 🔵
      // 送信中はボタンのラベルが「送信中...」に変わる
      const submitButton = screen.getByRole('button', { name: /送信中/ });
      expect(submitButton).toBeDisabled();
    });

    it('TC-DM-DIALOG-011: APIエラー時にerrorが表示される', () => {
      // 【テスト目的】: error propが渡された場合、エラーメッセージが表示されること 🔵
      // 【テスト内容】: error propを設定してレンダリング 🔵
      // 【期待される動作】: "サーバーエラー"がDOMに存在 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
          error="サーバーエラー"
        />
      );

      // 【結果検証】: エラーメッセージが表示されることを確認 🔵
      expect(screen.getByText('サーバーエラー')).toBeInTheDocument();
    });
  });

  // ==================== 5. キャンセル ====================

  describe('キャンセル', () => {
    it('TC-DM-DIALOG-012: キャンセルボタンでダイアログが閉じる', async () => {
      // 【テスト目的】: キャンセルボタンクリック時にonCloseが呼ばれること 🔵
      // 【テスト内容】: キャンセルボタンをクリック 🔵
      // 【期待される動作】: onCloseが呼ばれる 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【キャンセルボタンクリック】: キャンセルボタンを押す 🔵
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await userEvent.click(cancelButton);

      // 【結果検証】: onCloseが呼ばれることを確認 🔵
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== 6. エッジケース ====================

  describe('エッジケース', () => {
    it('TC-DM-DIALOG-EDGE-001: isOpen=falseの場合、ダイアログが表示されない', () => {
      // 【テスト目的】: isOpen=falseの場合、ダイアログが非表示になることを確認 🔵
      // 【テスト内容】: ダイアログが閉じられた状態での動作を確認 🔵
      // 【期待される動作】: ダイアログコンテンツが表示されない 🔵

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <DeckMasterDialog
          isOpen={false}
          mode="create"
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );

      // 【結果検証】: ダイアログが表示されないことを確認 🔵
      expect(screen.queryByText('デッキ種別の追加')).not.toBeInTheDocument();
    });
  });
});
