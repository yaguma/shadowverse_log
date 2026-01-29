/**
 * 【テストファイル概要】: Navigationコンポーネントの単体テスト
 * 【テスト目的】: ナビゲーションリンクの表示とルーティングを検証する
 * 【テスト範囲】: TASK-0023 ナビゲーション拡張（デッキ管理リンク追加）
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Navigation } from './Navigation';

/**
 * ルーターでラップしてコンポーネントをレンダリングするヘルパー関数
 */
const renderWithRouter = (component: React.ReactNode, initialEntries?: string[]) => {
  if (initialEntries) {
    return render(<MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>);
  }
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Navigation', () => {
  describe('リンク表示テスト', () => {
    it('TC-NAV-001: すべてのナビゲーションリンクが表示される', () => {
      // 【テスト目的】: ナビゲーションに必要なリンクがすべて表示されることを確認
      // 【期待される動作】: 対戦履歴、統計、インポート、デッキ管理のリンクが表示される
      renderWithRouter(<Navigation />);

      expect(screen.getByRole('link', { name: '対戦履歴' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '統計' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'インポート' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'デッキ管理' })).toBeInTheDocument();
    });

    it('TC-NAV-002: デッキ管理リンクが表示される', () => {
      // 【テスト目的】: デッキ管理リンクが正しく表示されることを確認
      // 【期待される動作】: 「デッキ管理」リンクがナビゲーションに存在する
      renderWithRouter(<Navigation />);

      const deckManageLink = screen.getByRole('link', { name: 'デッキ管理' });
      expect(deckManageLink).toBeInTheDocument();
    });

    it('TC-NAV-003: デッキ管理リンクのhrefが正しい', () => {
      // 【テスト目的】: デッキ管理リンクのhref属性が正しいことを確認
      // 【期待される動作】: href="/decks" が設定されている
      renderWithRouter(<Navigation />);

      const deckManageLink = screen.getByRole('link', { name: 'デッキ管理' });
      expect(deckManageLink).toHaveAttribute('href', '/decks');
    });
  });

  describe('アクティブ状態テスト', () => {
    it('TC-NAV-004: 対戦履歴ページでアクティブスタイルが適用される', () => {
      // 【テスト目的】: 対戦履歴ページでリンクがアクティブ状態になることを確認
      renderWithRouter(<Navigation />, ['/']);

      const battleLogLink = screen.getByRole('link', { name: '対戦履歴' });
      expect(battleLogLink).toHaveClass('bg-blue-600');
    });

    it('TC-NAV-005: 統計ページでアクティブスタイルが適用される', () => {
      // 【テスト目的】: 統計ページでリンクがアクティブ状態になることを確認
      renderWithRouter(<Navigation />, ['/statistics']);

      const statisticsLink = screen.getByRole('link', { name: '統計' });
      expect(statisticsLink).toHaveClass('bg-blue-600');
    });

    it('TC-NAV-006: デッキ管理ページでアクティブスタイルが適用される', () => {
      // 【テスト目的】: デッキ管理ページでリンクがアクティブ状態になることを確認
      renderWithRouter(<Navigation />, ['/decks']);

      const deckManageLink = screen.getByRole('link', { name: 'デッキ管理' });
      expect(deckManageLink).toHaveClass('bg-blue-600');
    });
  });
});
