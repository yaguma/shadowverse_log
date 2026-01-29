/**
 * 【テストファイル概要】: DeckManagePageコンポーネントの単体テスト
 * 【テスト目的】: デッキ管理ページのタブ切り替え機能を検証する
 * 【テスト範囲】: TASK-0022 DeckManagePageタブ切り替え実装, TASK-0023 ナビゲーション拡張
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeckManagePage } from './DeckManagePage';

describe('DeckManagePage', () => {
  describe('初期表示テスト', () => {
    it('TC-DMP-001: ページタイトルが表示される', () => {
      // 【テスト目的】: デッキ管理ページのタイトルが正しく表示されることを確認
      // 【期待される動作】: "デッキ管理" というタイトルが表示される
      render(<DeckManagePage />);

      expect(screen.getByRole('heading', { name: 'デッキ管理' })).toBeInTheDocument();
    });

    it('TC-DMP-002: タブナビゲーションが表示される', () => {
      // 【テスト目的】: タブナビゲーションが正しく表示されることを確認
      // 【期待される動作】: "デッキ種別" と "使用デッキ" のタブが表示される
      render(<DeckManagePage />);

      expect(screen.getByRole('tab', { name: 'デッキ種別' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '使用デッキ' })).toBeInTheDocument();
    });

    it('TC-DMP-003: 初期表示でデッキ種別タブがアクティブ', () => {
      // 【テスト目的】: 初期表示時にデッキ種別タブがアクティブ状態であることを確認
      // 【期待される動作】: デッキ種別タブに aria-selected="true" が設定されている
      render(<DeckManagePage />);

      const deckMasterTab = screen.getByRole('tab', { name: 'デッキ種別' });
      expect(deckMasterTab).toHaveAttribute('aria-selected', 'true');
    });

    it('TC-DMP-004: 初期表示でデッキ種別コンテンツが表示される', () => {
      // 【テスト目的】: 初期表示時にデッキ種別コンテンツが表示されることを確認
      // 【期待される動作】: デッキ種別コンテンツが表示され、使用デッキコンテンツは非表示
      render(<DeckManagePage />);

      expect(screen.getByTestId('deck-master-content')).toBeInTheDocument();
      expect(screen.queryByTestId('my-deck-content')).not.toBeInTheDocument();
    });
  });

  describe('タブ切り替えテスト', () => {
    it('TC-DMP-005: 使用デッキタブをクリックするとコンテンツが切り替わる', () => {
      // 【テスト目的】: 使用デッキタブをクリックした時にコンテンツが切り替わることを確認
      // 【期待される動作】: 使用デッキコンテンツが表示され、デッキ種別コンテンツは非表示になる
      render(<DeckManagePage />);

      const myDeckTab = screen.getByRole('tab', { name: '使用デッキ' });
      fireEvent.click(myDeckTab);

      expect(screen.getByTestId('my-deck-content')).toBeInTheDocument();
      expect(screen.queryByTestId('deck-master-content')).not.toBeInTheDocument();
    });

    it('TC-DMP-006: デッキ種別タブをクリックするとコンテンツが切り替わる', () => {
      // 【テスト目的】: デッキ種別タブをクリックした時にコンテンツが切り替わることを確認
      // 【期待される動作】: デッキ種別コンテンツが表示され、使用デッキコンテンツは非表示になる
      render(<DeckManagePage />);

      // まず使用デッキタブに切り替え
      const myDeckTab = screen.getByRole('tab', { name: '使用デッキ' });
      fireEvent.click(myDeckTab);

      // デッキ種別タブに戻る
      const deckMasterTab = screen.getByRole('tab', { name: 'デッキ種別' });
      fireEvent.click(deckMasterTab);

      expect(screen.getByTestId('deck-master-content')).toBeInTheDocument();
      expect(screen.queryByTestId('my-deck-content')).not.toBeInTheDocument();
    });

    it('TC-DMP-007: タブ切り替え時にアクティブスタイルが変更される', () => {
      // 【テスト目的】: タブ切り替え時にアクティブ状態のスタイルが正しく更新されることを確認
      // 【期待される動作】: アクティブなタブにのみアクティブスタイルが適用される
      render(<DeckManagePage />);

      const deckMasterTab = screen.getByRole('tab', { name: 'デッキ種別' });
      const myDeckTab = screen.getByRole('tab', { name: '使用デッキ' });

      // 初期状態: デッキ種別タブがアクティブ
      expect(deckMasterTab).toHaveClass('border-blue-500');
      expect(myDeckTab).not.toHaveClass('border-blue-500');
      expect(deckMasterTab).toHaveAttribute('aria-selected', 'true');
      expect(myDeckTab).toHaveAttribute('aria-selected', 'false');

      // 使用デッキタブをクリック
      fireEvent.click(myDeckTab);

      // 使用デッキタブがアクティブになる
      expect(deckMasterTab).not.toHaveClass('border-blue-500');
      expect(myDeckTab).toHaveClass('border-blue-500');
      expect(deckMasterTab).toHaveAttribute('aria-selected', 'false');
      expect(myDeckTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});
