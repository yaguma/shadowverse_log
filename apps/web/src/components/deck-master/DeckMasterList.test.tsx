/**
 * 【テストファイル概要】: DeckMasterList コンポーネントの単体テスト
 * 【テスト目的】: デッキ種別一覧表示コンポーネントの機能を検証する
 * 【テスト範囲】: 正常系、ローディング状態、空リスト状態、エラー状態
 * 【タスク】: TASK-0010
 * 🔵 信頼性レベル: 要件定義書REQ-EXT-501に基づく
 */

import type { DeckMasterWithUsage } from '@shadowverse-log/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeckMasterList } from './DeckMasterList';

describe('DeckMasterList', () => {
  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-DML-001: デッキ種別が表示される', () => {
      // 【テスト目的】: DeckMasterListコンポーネントがデッキ種別を正しく表示すること 🔵
      // 【テスト内容】: デッキ種別データが渡された場合、クラス名とデッキ名が表示されることを確認 🔵
      // 【期待される動作】: "ウィッチ"、"秘術"がDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      // 【テストデータ準備】: 1件のデッキ種別モックデータ 🔵
      const mockDeckMasters: DeckMasterWithUsage[] = [
        {
          id: 'dm-001',
          className: 'ウィッチ',
          deckName: '秘術',
          sortOrder: 1,
          lastUsedDate: '2025/01/01',
          usageCount: 10,
        },
      ];

      const onAdd = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      // 【実際の処理実行】: DeckMasterListコンポーネントをレンダリング 🔵
      render(
        <DeckMasterList
          deckMasters={mockDeckMasters}
          isLoading={false}
          error={null}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      // 【結果検証】: クラス名とデッキ名が表示されることを確認 🔵
      expect(screen.getByText('ウィッチ')).toBeInTheDocument();
      expect(screen.getByText('秘術')).toBeInTheDocument();
    });

    it('TC-DML-002: 複数件表示される', () => {
      // 【テスト目的】: 複数のデッキ種別が正しく表示されること 🔵
      // 【テスト内容】: 3件のデッキ種別データが渡された場合、すべて表示されることを確認 🔵
      // 【期待される動作】: 3つのデッキ種別がすべてDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      // 【テストデータ準備】: 3件のデッキ種別モックデータ 🔵
      const mockDeckMasters: DeckMasterWithUsage[] = [
        {
          id: 'dm-001',
          className: 'ウィッチ',
          deckName: '秘術',
          sortOrder: 1,
          lastUsedDate: '2025/01/01',
          usageCount: 10,
        },
        {
          id: 'dm-002',
          className: 'エルフ',
          deckName: 'コントロール',
          sortOrder: 2,
          lastUsedDate: '2025/01/02',
          usageCount: 5,
        },
        {
          id: 'dm-003',
          className: 'ロイヤル',
          deckName: 'アグロ',
          sortOrder: 3,
          lastUsedDate: null,
          usageCount: 0,
        },
      ];

      const onAdd = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      // 【実際の処理実行】: DeckMasterListコンポーネントをレンダリング 🔵
      render(
        <DeckMasterList
          deckMasters={mockDeckMasters}
          isLoading={false}
          error={null}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      // 【結果検証】: 3件のデッキ種別が表示されることを確認 🔵
      expect(screen.getByText('ウィッチ')).toBeInTheDocument();
      expect(screen.getByText('秘術')).toBeInTheDocument();
      expect(screen.getByText('エルフ')).toBeInTheDocument();
      expect(screen.getByText('コントロール')).toBeInTheDocument();
      expect(screen.getByText('ロイヤル')).toBeInTheDocument();
      expect(screen.getByText('アグロ')).toBeInTheDocument();
    });

    it('TC-DML-003: 追加ボタンが表示される', () => {
      // 【テスト目的】: 「新規追加」ボタンが表示されること 🔵
      // 【テスト内容】: コンポーネントに「新規追加」ボタンが存在することを確認 🔵
      // 【期待される動作】: "新規追加"ボタンがDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      const mockDeckMasters: DeckMasterWithUsage[] = [];

      const onAdd = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      // 【実際の処理実行】: DeckMasterListコンポーネントをレンダリング 🔵
      render(
        <DeckMasterList
          deckMasters={mockDeckMasters}
          isLoading={false}
          error={null}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      // 【結果検証】: 「新規追加」ボタンが存在することを確認 🔵
      expect(screen.getByRole('button', { name: /新規追加/ })).toBeInTheDocument();
    });

    it('TC-DML-004: 追加ボタンクリックでonAddが呼ばれる', () => {
      // 【テスト目的】: 「新規追加」ボタンをクリックするとonAddコールバックが呼ばれること 🔵
      // 【テスト内容】: ボタンクリック時にonAddが1回呼ばれることを確認 🔵
      // 【期待される動作】: onAddが1回呼ばれる 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      const mockDeckMasters: DeckMasterWithUsage[] = [];

      const onAdd = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      // 【実際の処理実行】: DeckMasterListコンポーネントをレンダリング 🔵
      render(
        <DeckMasterList
          deckMasters={mockDeckMasters}
          isLoading={false}
          error={null}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      // 【ユーザー操作】: 「新規追加」ボタンをクリック 🔵
      const addButton = screen.getByRole('button', { name: /新規追加/ });
      fireEvent.click(addButton);

      // 【結果検証】: onAddコールバックが呼ばれることを確認 🔵
      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== 2. ローディング状態テストケース ====================

  describe('ローディング状態テスト', () => {
    it('TC-DML-005: ローディング中にスピナーが表示される', () => {
      // 【テスト目的】: ローディング中にスピナーが表示されること 🔵
      // 【テスト内容】: isLoading: trueの場合、ローディングインジケーターが表示されることを確認 🔵
      // 【期待される動作】: ローディングインジケーター（スピナー）がDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      const mockDeckMasters: DeckMasterWithUsage[] = [];

      const onAdd = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      // 【実際の処理実行】: ローディング状態でレンダリング 🔵
      render(
        <DeckMasterList
          deckMasters={mockDeckMasters}
          isLoading={true}
          error={null}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      // 【結果検証】: ローディングインジケーターが存在することを確認 🔵
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('TC-DML-006: ローディング中はリストが非表示', () => {
      // 【テスト目的】: ローディング中はリストアイテムが表示されないこと 🔵
      // 【テスト内容】: isLoading: trueの場合、デッキ種別リストが表示されないことを確認 🔵
      // 【期待される動作】: デッキ種別の内容がDOMに存在しない 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      const mockDeckMasters: DeckMasterWithUsage[] = [
        {
          id: 'dm-001',
          className: 'ウィッチ',
          deckName: '秘術',
          sortOrder: 1,
          lastUsedDate: '2025/01/01',
          usageCount: 10,
        },
      ];

      const onAdd = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      // 【実際の処理実行】: ローディング状態でレンダリング 🔵
      render(
        <DeckMasterList
          deckMasters={mockDeckMasters}
          isLoading={true}
          error={null}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      // 【結果検証】: デッキ種別の内容が表示されないことを確認 🔵
      expect(screen.queryByText('ウィッチ')).not.toBeInTheDocument();
      expect(screen.queryByText('秘術')).not.toBeInTheDocument();
    });
  });

  // ==================== 3. 空リスト状態テストケース ====================

  describe('空リスト状態テスト', () => {
    it('TC-DML-007: 0件時に空メッセージが表示される', () => {
      // 【テスト目的】: データが0件の場合、空メッセージが表示されること 🔵
      // 【テスト内容】: deckMasters: []の場合、空データメッセージが表示されることを確認 🔵
      // 【期待される動作】: 「デッキ種別が登録されていません」がDOMに存在 🔵
      // 🔵 信頼性レベル: REQ-EXT-501に基づく

      const mockDeckMasters: DeckMasterWithUsage[] = [];

      const onAdd = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      // 【実際の処理実行】: 空データでレンダリング 🔵
      render(
        <DeckMasterList
          deckMasters={mockDeckMasters}
          isLoading={false}
          error={null}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      // 【結果検証】: 空データメッセージが表示されることを確認 🔵
      expect(screen.getByText('デッキ種別が登録されていません')).toBeInTheDocument();
    });
  });

  // ==================== 4. エラー状態テストケース ====================

  describe('エラー状態テスト', () => {
    it('TC-DML-008: エラー時にエラーメッセージが表示される', () => {
      // 【テスト目的】: エラーが発生した場合、エラーメッセージが表示されること 🔵
      // 【テスト内容】: error: "エラーが発生しました"の場合、エラーメッセージが表示されることを確認 🔵
      // 【期待される動作】: エラーメッセージがDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      const mockDeckMasters: DeckMasterWithUsage[] = [];

      const onAdd = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      // 【実際の処理実行】: エラー状態でレンダリング 🔵
      render(
        <DeckMasterList
          deckMasters={mockDeckMasters}
          isLoading={false}
          error="エラーが発生しました"
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      // 【結果検証】: エラーメッセージが表示されることを確認 🔵
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });
});
