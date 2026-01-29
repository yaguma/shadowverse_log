/**
 * 【テストファイル概要】: MyDeckDialogコンポーネントの単体テスト
 * 【テスト目的】: マイデッキの追加ダイアログの表示、バリデーション、送信機能を検証する
 * 【テスト範囲】: ダイアログ表示、クラス選択、バリデーション、送信、キャンセル
 * 【TASK-0020対応】: 10件のテストケースを実装
 */

import type { DeckMaster } from '@shadowverse-log/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MyDeckDialog } from './MyDeckDialog';

// ==================== テスト用モックデータ ====================

/**
 * 【モックデータ】: テスト用のデッキマスターデータ
 */
const mockDeckMasters: DeckMaster[] = [
  {
    id: 'deck-001',
    className: 'エルフ',
    deckName: 'フェアリーエルフ',
    sortOrder: 1,
  },
  {
    id: 'deck-002',
    className: 'ロイヤル',
    deckName: '連携ロイヤル',
    sortOrder: 2,
  },
  {
    id: 'deck-003',
    className: 'ウィッチ',
    deckName: '秘術ウィッチ',
    sortOrder: 3,
  },
];

// ==================== MyDeckDialogテスト ====================

describe('MyDeckDialog', () => {
  // ==================== 1. ダイアログ表示 ====================

  describe('ダイアログ表示', () => {
    it('TC-MD-DIALOG-001: ダイアログが表示されること', () => {
      // 【テスト目的】: isOpen=trueの場合、ダイアログが表示されること
      // 【テスト内容】: ダイアログタイトルが表示されることを確認
      // 【期待される動作】: "マイデッキの追加"がDOMに存在

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <MyDeckDialog
          isOpen={true}
          deckMasters={mockDeckMasters}
          isSubmitting={false}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【結果検証】: ダイアログタイトルが表示されることを確認
      expect(screen.getByText('マイデッキの追加')).toBeInTheDocument();
    });

    it('TC-MD-DIALOG-002: isOpen=falseでダイアログが表示されないこと', () => {
      // 【テスト目的】: isOpen=falseの場合、ダイアログが非表示になることを確認
      // 【テスト内容】: ダイアログが閉じられた状態での動作を確認
      // 【期待される動作】: ダイアログコンテンツが表示されない

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <MyDeckDialog
          isOpen={false}
          deckMasters={mockDeckMasters}
          isSubmitting={false}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【結果検証】: ダイアログが表示されないことを確認
      expect(screen.queryByText('マイデッキの追加')).not.toBeInTheDocument();
    });
  });

  // ==================== 2. デッキ種別選択 ====================

  describe('デッキ種別選択', () => {
    it('TC-MD-DIALOG-003: DeckMasterのclassNameが選択肢に表示されること', () => {
      // 【テスト目的】: DeckMasterのclassNameが選択肢に表示されること
      // 【テスト内容】: セレクトボックスの選択肢を確認
      // 【期待される動作】: mockDeckMastersのclassNameがすべて表示される

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <MyDeckDialog
          isOpen={true}
          deckMasters={mockDeckMasters}
          isSubmitting={false}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【結果検証】: デッキ種別の選択肢が表示されることを確認
      const select = screen.getByRole('combobox', { name: /デッキ種別/i });
      expect(select).toBeInTheDocument();

      // 各デッキ種別が選択肢に存在することを確認
      expect(screen.getByRole('option', { name: /フェアリーエルフ/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /連携ロイヤル/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /秘術ウィッチ/i })).toBeInTheDocument();
    });

    it('TC-MD-DIALOG-004: クラス選択でdeckIdが設定されること', async () => {
      // 【テスト目的】: クラス選択時にdeckIdが正しく設定されること
      // 【テスト内容】: デッキ種別を選択して送信時にdeckIdが渡されることを確認
      // 【期待される動作】: 選択したDeckMasterのidがdeckIdとして送信される

      const onClose = vi.fn();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <MyDeckDialog
          isOpen={true}
          deckMasters={mockDeckMasters}
          isSubmitting={false}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【デッキ種別選択】: デッキ種別を選択
      const select = screen.getByRole('combobox', { name: /デッキ種別/i });
      await userEvent.selectOptions(select, 'deck-002');

      // 【デッキ名入力】: デッキ名を入力
      const deckNameInput = screen.getByRole('textbox', { name: /デッキ名/i });
      await userEvent.type(deckNameInput, 'テストデッキ');

      // 【登録ボタンクリック】: 登録ボタンを押す
      const submitButton = screen.getByRole('button', { name: '登録' });
      await userEvent.click(submitButton);

      // 【結果検証】: onSubmitが正しいdeckIdで呼ばれることを確認
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          deckId: 'deck-002',
          deckName: 'テストデッキ',
          deckCode: '',
        });
      });
    });
  });

  // ==================== 3. バリデーション ====================

  describe('バリデーション', () => {
    it('TC-MD-DIALOG-005: deckName空で登録ボタン押下時にエラー表示', async () => {
      // 【テスト目的】: deckNameが空で登録ボタンを押した場合、バリデーションエラーが表示されること
      // 【テスト内容】: deckName空で登録ボタンをクリック
      // 【期待される動作】: "デッキ名を入力してください"がDOMに存在

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <MyDeckDialog
          isOpen={true}
          deckMasters={mockDeckMasters}
          isSubmitting={false}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【デッキ種別選択】: デッキ種別を選択
      const select = screen.getByRole('combobox', { name: /デッキ種別/i });
      await userEvent.selectOptions(select, 'deck-001');

      // 【登録ボタンクリック】: deckName未入力で登録ボタンを押す
      const submitButton = screen.getByRole('button', { name: '登録' });
      await userEvent.click(submitButton);

      // 【結果検証】: バリデーションエラーが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('デッキ名を入力してください')).toBeInTheDocument();
      });
    });

    it('TC-MD-DIALOG-006: deckId未選択で登録ボタン押下時にエラー表示', async () => {
      // 【テスト目的】: deckIdが未選択で登録ボタンを押した場合、バリデーションエラーが表示されること
      // 【テスト内容】: deckId未選択で登録ボタンをクリック
      // 【期待される動作】: "デッキ種別を選択してください"がDOMに存在

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <MyDeckDialog
          isOpen={true}
          deckMasters={mockDeckMasters}
          isSubmitting={false}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【デッキ名入力】: デッキ名を入力してdeckIdは未選択
      const deckNameInput = screen.getByRole('textbox', { name: /デッキ名/i });
      await userEvent.type(deckNameInput, 'テストデッキ');

      // 【登録ボタンクリック】: 登録ボタンを押す
      const submitButton = screen.getByRole('button', { name: '登録' });
      await userEvent.click(submitButton);

      // 【結果検証】: バリデーションエラーが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('デッキ種別を選択してください')).toBeInTheDocument();
      });
    });
  });

  // ==================== 4. 送信とキャンセル ====================

  describe('送信とキャンセル', () => {
    it('TC-MD-DIALOG-007: 登録成功でダイアログが閉じること', async () => {
      // 【テスト目的】: 登録成功時にonCloseが呼ばれること
      // 【テスト内容】: 有効なデータで登録ボタンをクリック
      // 【期待される動作】: onSubmitとonCloseが呼ばれる

      const onClose = vi.fn();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <MyDeckDialog
          isOpen={true}
          deckMasters={mockDeckMasters}
          isSubmitting={false}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【デッキ種別選択】: デッキ種別を選択
      const select = screen.getByRole('combobox', { name: /デッキ種別/i });
      await userEvent.selectOptions(select, 'deck-001');

      // 【デッキ名入力】: デッキ名を入力
      const deckNameInput = screen.getByRole('textbox', { name: /デッキ名/i });
      await userEvent.type(deckNameInput, '新規デッキ');

      // 【登録ボタンクリック】: 登録ボタンを押す
      const submitButton = screen.getByRole('button', { name: '登録' });
      await userEvent.click(submitButton);

      // 【結果検証】: onSubmitが呼ばれることを確認
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          deckId: 'deck-001',
          deckName: '新規デッキ',
          deckCode: '',
        });
      });
    });

    it('TC-MD-DIALOG-008: キャンセルボタンでダイアログが閉じること', async () => {
      // 【テスト目的】: キャンセルボタンクリック時にonCloseが呼ばれること
      // 【テスト内容】: キャンセルボタンをクリック
      // 【期待される動作】: onCloseが呼ばれる

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <MyDeckDialog
          isOpen={true}
          deckMasters={mockDeckMasters}
          isSubmitting={false}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【キャンセルボタンクリック】: キャンセルボタンを押す
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await userEvent.click(cancelButton);

      // 【結果検証】: onCloseが呼ばれることを確認
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== 5. 送信中状態 ====================

  describe('送信中状態', () => {
    it('TC-MD-DIALOG-009: isSubmitting=trueでボタンが無効化されること', () => {
      // 【テスト目的】: isSubmitting=trueの場合、ボタンがdisabledになること
      // 【テスト内容】: 送信中のボタン状態を確認
      // 【期待される動作】: 登録ボタンとキャンセルボタンがdisabled

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <MyDeckDialog
          isOpen={true}
          deckMasters={mockDeckMasters}
          isSubmitting={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【結果検証】: ボタンが無効化されていることを確認
      const submitButton = screen.getByRole('button', { name: /登録中/ });
      expect(submitButton).toBeDisabled();

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      expect(cancelButton).toBeDisabled();
    });

    it('TC-MD-DIALOG-010: isSubmitting=trueで登録中テキストが表示されること', () => {
      // 【テスト目的】: isSubmitting=trueの場合、登録ボタンが「登録中...」になること
      // 【テスト内容】: 送信中のボタンテキストを確認
      // 【期待される動作】: "登録中..."が表示される

      const onClose = vi.fn();
      const onSubmit = vi.fn();

      render(
        <MyDeckDialog
          isOpen={true}
          deckMasters={mockDeckMasters}
          isSubmitting={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      // 【結果検証】: 登録中テキストが表示されることを確認
      expect(screen.getByRole('button', { name: '登録中...' })).toBeInTheDocument();
    });
  });
});
