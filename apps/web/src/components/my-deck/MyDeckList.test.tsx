/**
 * 【テストファイル概要】: MyDeckList コンポーネントの単体テスト
 * 【テスト目的】: 使用デッキ一覧表示コンポーネントの機能を検証する
 * 【テスト範囲】: 正常系、ローディング状態、空リスト状態、エラー状態
 * 【タスク】: TASK-0018
 * 🔵 信頼性レベル: 要件定義書REQ-EXT-502に基づく
 */

import type { MyDeck } from '@shadowverse-log/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MyDeckList } from './MyDeckList';

describe('MyDeckList', () => {
  // ==================== テストデータ準備 ====================

  const sampleDecks: MyDeck[] = [
    {
      id: '1',
      deckId: 'deck-001',
      deckName: '秘術オデンスペル',
      deckCode: 'ABC123',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      deckId: 'deck-002',
      deckName: 'コントロールナイトメア',
      deckCode: 'DEF456',
      isActive: true,
      createdAt: '2025-01-02T00:00:00.000Z',
    },
  ];

  const defaultProps = {
    myDecks: [] as MyDeck[],
    isLoading: false,
    canDeleteMap: {} as Record<string, boolean>,
    onAddClick: vi.fn(),
    onDeleteClick: vi.fn(),
  };

  // ==================== 1. デッキ表示テストケース ====================

  describe('デッキ表示', () => {
    it('TC-MDL-001: 使用デッキが表示されること', () => {
      // 【テスト目的】: MyDeckListコンポーネントが使用デッキを正しく表示すること 🔵
      // 【テスト内容】: デッキデータが渡された場合、デッキ名が表示されることを確認 🔵
      // 【期待される動作】: "秘術オデンスペル"がDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      render(
        <MyDeckList {...defaultProps} myDecks={[sampleDecks[0]]} canDeleteMap={{ '1': true }} />
      );

      // 【結果検証】: デッキ名が表示されることを確認 🔵
      expect(screen.getByText('秘術オデンスペル')).toBeInTheDocument();
    });

    it('TC-MDL-002: 複数のデッキが表示されること', () => {
      // 【テスト目的】: 複数の使用デッキが正しく表示されること 🔵
      // 【テスト内容】: 2件のデッキデータが渡された場合、すべて表示されることを確認 🔵
      // 【期待される動作】: 2つのデッキ名がすべてDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      render(
        <MyDeckList
          {...defaultProps}
          myDecks={sampleDecks}
          canDeleteMap={{ '1': true, '2': true }}
        />
      );

      // 【結果検証】: 2件のデッキ名が表示されることを確認 🔵
      expect(screen.getByText('秘術オデンスペル')).toBeInTheDocument();
      expect(screen.getByText('コントロールナイトメア')).toBeInTheDocument();
    });

    it('TC-MDL-003: デッキリストが表示されること', () => {
      // 【テスト目的】: デッキリスト要素が存在すること 🔵
      // 【テスト内容】: data-testid="deck-list"が存在することを確認 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      render(
        <MyDeckList
          {...defaultProps}
          myDecks={sampleDecks}
          canDeleteMap={{ '1': true, '2': true }}
        />
      );

      // 【結果検証】: デッキリストが存在することを確認 🔵
      expect(screen.getByTestId('deck-list')).toBeInTheDocument();
    });
  });

  // ==================== 2. 空状態テストケース ====================

  describe('空状態', () => {
    it('TC-MDL-004: 0件時に空メッセージが表示されること', () => {
      // 【テスト目的】: データが0件の場合、空メッセージが表示されること 🔵
      // 【テスト内容】: myDecks: []の場合、空データメッセージが表示されることを確認 🔵
      // 【期待される動作】: 「使用デッキが登録されていません」がDOMに存在 🔵
      // 🔵 信頼性レベル: REQ-EXT-502に基づく

      render(<MyDeckList {...defaultProps} />);

      // 【結果検証】: 空データメッセージが表示されることを確認 🔵
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
      expect(screen.getByText(/使用デッキが登録されていません/)).toBeInTheDocument();
    });
  });

  // ==================== 3. ローディング状態テストケース ====================

  describe('ローディング状態', () => {
    it('TC-MDL-005: ローディング中にスピナーが表示されること', () => {
      // 【テスト目的】: ローディング中にスピナーが表示されること 🔵
      // 【テスト内容】: isLoading: trueの場合、ローディングインジケーターが表示されることを確認 🔵
      // 【期待される動作】: ローディングインジケーター（スピナー）がDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      render(<MyDeckList {...defaultProps} isLoading={true} />);

      // 【結果検証】: ローディングインジケーターが存在することを確認 🔵
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('TC-MDL-006: ローディング中はデッキ一覧が表示されないこと', () => {
      // 【テスト目的】: ローディング中はリストアイテムが表示されないこと 🔵
      // 【テスト内容】: isLoading: trueの場合、デッキ一覧が表示されないことを確認 🔵
      // 【期待される動作】: デッキ名がDOMに存在しない 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      render(<MyDeckList {...defaultProps} myDecks={sampleDecks} isLoading={true} />);

      // 【結果検証】: デッキ名が表示されないことを確認 🔵
      expect(screen.queryByText('秘術オデンスペル')).not.toBeInTheDocument();
    });
  });

  // ==================== 4. 追加ボタンテストケース ====================

  describe('追加ボタン', () => {
    it('TC-MDL-007: 追加ボタンが表示されること', () => {
      // 【テスト目的】: 「デッキを追加」ボタンが表示されること 🔵
      // 【テスト内容】: コンポーネントに「デッキを追加」ボタンが存在することを確認 🔵
      // 【期待される動作】: 追加ボタンがDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      render(<MyDeckList {...defaultProps} />);

      // 【結果検証】: 追加ボタンが存在することを確認 🔵
      expect(screen.getByTestId('add-deck-button')).toBeInTheDocument();
    });

    it('TC-MDL-008: 追加ボタンクリックでonAddClickが呼び出されること', () => {
      // 【テスト目的】: 追加ボタンをクリックするとonAddClickコールバックが呼ばれること 🔵
      // 【テスト内容】: ボタンクリック時にonAddClickが1回呼ばれることを確認 🔵
      // 【期待される動作】: onAddClickが1回呼ばれる 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      const onAddClick = vi.fn();
      render(<MyDeckList {...defaultProps} onAddClick={onAddClick} />);

      // 【ユーザー操作】: 追加ボタンをクリック 🔵
      fireEvent.click(screen.getByTestId('add-deck-button'));

      // 【結果検証】: onAddClickコールバックが呼ばれることを確認 🔵
      expect(onAddClick).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== 5. エラー状態テストケース ====================

  describe('エラー状態', () => {
    it('TC-MDL-009: エラーメッセージが表示されること', () => {
      // 【テスト目的】: エラーが発生した場合、エラーメッセージが表示されること 🔵
      // 【テスト内容】: error: "データの取得に失敗しました"の場合、エラーメッセージが表示されることを確認 🔵
      // 【期待される動作】: エラーメッセージがDOMに存在 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      render(<MyDeckList {...defaultProps} error="データの取得に失敗しました" />);

      // 【結果検証】: エラーメッセージが表示されることを確認 🔵
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  // ==================== 6. 削除ボタンテストケース ====================

  describe('削除機能', () => {
    it('TC-MDL-010: 削除ボタンクリックでonDeleteClickが呼び出されること', () => {
      // 【テスト目的】: 削除ボタンをクリックするとonDeleteClickコールバックが呼ばれること 🔵
      // 【テスト内容】: ボタンクリック時にonDeleteClickが正しいIDで呼ばれることを確認 🔵
      // 【期待される動作】: onDeleteClickがデッキIDで呼ばれる 🔵
      // 🔵 信頼性レベル: 要件定義書に基づく

      const onDeleteClick = vi.fn();
      render(
        <MyDeckList
          {...defaultProps}
          myDecks={[sampleDecks[0]]}
          canDeleteMap={{ '1': true }}
          onDeleteClick={onDeleteClick}
        />
      );

      // 【ユーザー操作】: 削除ボタンをクリック 🔵
      const deleteButton = screen.getByRole('button', { name: /削除/ });
      fireEvent.click(deleteButton);

      // 【結果検証】: onDeleteClickコールバックが正しいIDで呼ばれることを確認 🔵
      expect(onDeleteClick).toHaveBeenCalledTimes(1);
      expect(onDeleteClick).toHaveBeenCalledWith('1');
    });
  });
});
