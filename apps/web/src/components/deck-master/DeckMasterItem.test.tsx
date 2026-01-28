/**
 * 【テストファイル概要】: DeckMasterItemコンポーネントの単体テスト
 * 【テスト目的】: デッキ種別の個別アイテム表示、編集/削除ボタン、削除確認ダイアログの機能を検証する
 * 【テスト範囲】: 表示テスト、編集ボタン、削除ボタン、削除確認ダイアログ
 * 🔵 信頼性レベル: TASK-0011の要件に基づく
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DeckMasterWithUsage } from '../../types';
import { DeckMasterItem } from './DeckMasterItem';

describe('DeckMasterItem', () => {
  // ==================== テストデータ準備 ====================
  const createMockDeckMaster = (
    overrides: Partial<DeckMasterWithUsage> = {}
  ): DeckMasterWithUsage => ({
    id: 'deck-master-001',
    className: 'ウィッチ',
    deckName: '秘術ウィッチ',
    sortOrder: 1,
    usageCount: 15,
    lastUsedDate: '2024-01-15T10:30:00.000Z',
    ...overrides,
  });

  // ==================== 1. 表示テスト ====================

  describe('表示テスト', () => {
    it('TC-001: className、deckNameが表示される', () => {
      // 【テスト目的】: className、deckNameが正しく表示されること 🔵
      // 【期待される動作】: "ウィッチ"、"秘術ウィッチ"がDOMに存在

      const deckMaster = createMockDeckMaster();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={true}
        />
      );

      // 【結果検証】: className、deckNameが表示されることを確認
      expect(screen.getByText('ウィッチ')).toBeInTheDocument();
      expect(screen.getByText('秘術ウィッチ')).toBeInTheDocument();
    });

    it('TC-002: 使用回数が表示される', () => {
      // 【テスト目的】: 使用回数が正しく表示されること 🔵
      // 【期待される動作】: "15回"がDOMに存在

      const deckMaster = createMockDeckMaster({ usageCount: 15 });
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={true}
        />
      );

      // 【結果検証】: 使用回数が表示されることを確認
      expect(screen.getByText(/15回/)).toBeInTheDocument();
    });

    it('TC-003: 最終使用日が表示される', () => {
      // 【テスト目的】: 最終使用日が正しくフォーマットされて表示されること 🔵
      // 【期待される動作】: "2024/01/15"がDOMに存在

      const deckMaster = createMockDeckMaster({
        lastUsedDate: '2024-01-15T10:30:00.000Z',
      });
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={true}
        />
      );

      // 【結果検証】: 最終使用日がフォーマットされて表示されることを確認
      expect(screen.getByText(/2024\/01\/15/)).toBeInTheDocument();
    });

    it('TC-004: 最終使用日がnullの場合「未使用」表示', () => {
      // 【テスト目的】: lastUsedDate=nullの場合「未使用」が表示されること 🔵
      // 【期待される動作】: "未使用"がDOMに存在

      const deckMaster = createMockDeckMaster({ lastUsedDate: null });
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={true}
        />
      );

      // 【結果検証】: 「未使用」が表示されることを確認
      // テキストが「最終使用: 未使用」として表示されるため、部分一致で検証
      expect(screen.getByText(/未使用/)).toBeInTheDocument();
    });
  });

  // ==================== 2. 編集ボタンテスト ====================

  describe('編集ボタンテスト', () => {
    it('TC-005: 編集ボタンクリックでonEditが呼ばれる', async () => {
      // 【テスト目的】: 編集ボタンクリック時にonEditがdeckMasterと共に呼ばれること 🔵
      // 【期待される動作】: onEditがdeckMasterオブジェクトと共に呼ばれる

      const deckMaster = createMockDeckMaster();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={true}
        />
      );

      // 【実際の処理実行】: 編集ボタンをクリック
      const editButton = screen.getByRole('button', { name: '編集' });
      await userEvent.click(editButton);

      // 【結果検証】: onEditがdeckMasterと共に呼ばれることを確認
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(deckMaster);
    });
  });

  // ==================== 3. 削除ボタンテスト ====================

  describe('削除ボタンテスト', () => {
    it('TC-006: 削除ボタンクリックで確認ダイアログが表示される', async () => {
      // 【テスト目的】: 削除ボタンクリック時に確認ダイアログが表示されること 🔵
      // 【期待される動作】: 確認ダイアログがDOMに存在

      const deckMaster = createMockDeckMaster();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={true}
        />
      );

      // 【実際の処理実行】: 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: '削除' });
      await userEvent.click(deleteButton);

      // 【結果検証】: 確認ダイアログが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('デッキ種別の削除')).toBeInTheDocument();
        expect(
          screen.getByText(/「秘術ウィッチ」を削除してもよろしいですか？/)
        ).toBeInTheDocument();
      });
    });

    it('TC-007: 確認ダイアログでキャンセルするとonDeleteが呼ばれない', async () => {
      // 【テスト目的】: キャンセルボタンクリック時にonDeleteが呼ばれないこと 🔵
      // 【期待される動作】: onDeleteが呼ばれない、ダイアログが閉じる

      const deckMaster = createMockDeckMaster();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={true}
        />
      );

      // 【実際の処理実行】: 削除ボタンをクリック → キャンセルボタンをクリック
      const deleteButton = screen.getByRole('button', { name: '削除' });
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('デッキ種別の削除')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await userEvent.click(cancelButton);

      // 【結果検証】: onDeleteが呼ばれず、ダイアログが閉じることを確認
      expect(onDelete).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByText('デッキ種別の削除')).not.toBeInTheDocument();
      });
    });

    it('TC-008: 確認ダイアログで削除するとonDeleteが呼ばれる', async () => {
      // 【テスト目的】: 削除ボタンクリック時にonDeleteがidと共に呼ばれること 🔵
      // 【期待される動作】: onDeleteがidと共に呼ばれる

      const deckMaster = createMockDeckMaster();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={true}
        />
      );

      // 【実際の処理実行】: 削除ボタンをクリック → 削除確認ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: '削除' });
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('デッキ種別の削除')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: '削除する' });
      await userEvent.click(confirmDeleteButton);

      // 【結果検証】: onDeleteがidと共に呼ばれることを確認
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith('deck-master-001');
    });

    it('TC-009: canDelete=falseで削除ボタンが無効化される', () => {
      // 【テスト目的】: canDelete=falseの場合、削除ボタンがdisabled状態になること 🔵
      // 【期待される動作】: 削除ボタンがdisabled

      const deckMaster = createMockDeckMaster();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={false}
        />
      );

      // 【結果検証】: 削除ボタンが無効化されていることを確認
      const deleteButton = screen.getByRole('button', { name: '削除' });
      expect(deleteButton).toBeDisabled();
    });

    it('TC-010: canDelete=falseでツールチップが表示される', async () => {
      // 【テスト目的】: canDelete=falseの場合、ホバー時にツールチップが表示されること 🔵
      // 【期待される動作】: ホバー時に「対戦履歴で使用中」ツールチップ

      const deckMaster = createMockDeckMaster();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DeckMasterItem
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={false}
        />
      );

      // 【結果検証】: ツールチップ用のtitle属性またはaria-labelが存在することを確認
      const deleteButton = screen.getByRole('button', { name: '削除' });
      expect(deleteButton).toHaveAttribute('title', '対戦履歴で使用中');
    });
  });
});
