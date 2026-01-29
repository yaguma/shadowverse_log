/**
 * 【テストファイル概要】: DeckManagePage（デッキ管理ページ）の単体テスト
 * 【テスト目的】: DeckManagePageコンポーネントのタブ切り替え、初期表示を検証する
 * 【タスク】: TASK-0022
 * 🔵 信頼性レベル: architecture.md 2.3より
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeckManagePage } from './DeckManagePage';

// 【モック設定】: DeckMasterListとMyDeckListをモック化
vi.mock('../components/deck-master/DeckMasterList', () => ({
  DeckMasterList: () => <div data-testid="deck-master-list">デッキ種別一覧</div>,
}));

vi.mock('../components/my-deck/MyDeckList', () => ({
  MyDeckList: () => <div data-testid="my-deck-list">マイデッキ一覧</div>,
}));

describe('DeckManagePage', () => {
  // ==================== 1. 初期表示テスト ====================

  describe('初期表示', () => {
    it('TC-DMP-001: ページタイトルが表示される', () => {
      // 【テスト目的】: DeckManagePageコンポーネントが正しくレンダリングされること 🔵
      // 【テスト内容】: ページタイトル「デッキ管理」が表示されることを確認 🔵
      // 🔵 信頼性レベル: TASK-0022仕様に準拠

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【結果検証】: ページタイトルが表示されることを確認
      expect(screen.getByRole('heading', { name: 'デッキ管理' })).toBeInTheDocument();
    });

    it('TC-DMP-002: デッキ種別タブがアクティブで表示される', () => {
      // 【テスト目的】: 初期状態で「デッキ種別」タブがアクティブであること 🔵
      // 【テスト内容】: デッキ種別タブがアクティブスタイル（border-blue-500）を持つことを確認 🔵
      // 🔵 信頼性レベル: TASK-0022仕様に準拠

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【結果検証】: デッキ種別タブがアクティブスタイルを持つことを確認（WAI-ARIAに対応してrole="tab"で取得）
      const deckMasterTab = screen.getByRole('tab', { name: 'デッキ種別' });
      expect(deckMasterTab).toHaveClass('border-blue-500');
    });

    it('TC-DMP-003: 初期表示でDeckMasterListが表示される', () => {
      // 【テスト目的】: 初期状態でDeckMasterListコンポーネントが表示されること 🔵
      // 【テスト内容】: DeckMasterListが表示され、MyDeckListが非表示であることを確認 🔵
      // 🔵 信頼性レベル: TASK-0022仕様に準拠

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【結果検証】: DeckMasterListが表示され、MyDeckListが非表示であることを確認
      expect(screen.getByTestId('deck-master-list')).toBeInTheDocument();
      expect(screen.queryByTestId('my-deck-list')).not.toBeInTheDocument();
    });
  });

  // ==================== 2. タブ切り替えテスト ====================

  describe('タブ切り替え', () => {
    it('TC-DMP-004: 使用デッキタブをクリックするとMyDeckListが表示される', () => {
      // 【テスト目的】: 「使用デッキ」タブをクリックするとMyDeckListが表示されること 🔵
      // 【テスト内容】: タブ切り替えでMyDeckListが表示され、DeckMasterListが非表示になることを確認 🔵
      // 🔵 信頼性レベル: TASK-0022仕様に準拠

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【タブ切り替え】: 使用デッキタブをクリック（WAI-ARIAに対応してrole="tab"で取得）
      const myDeckTab = screen.getByRole('tab', { name: '使用デッキ' });
      fireEvent.click(myDeckTab);

      // 【結果検証】: MyDeckListが表示され、DeckMasterListが非表示であることを確認
      expect(screen.getByTestId('my-deck-list')).toBeInTheDocument();
      expect(screen.queryByTestId('deck-master-list')).not.toBeInTheDocument();
    });

    it('TC-DMP-005: デッキ種別タブをクリックするとDeckMasterListが表示される', () => {
      // 【テスト目的】: 「デッキ種別」タブをクリックするとDeckMasterListが表示されること 🔵
      // 【テスト内容】: 使用デッキから切り替えてDeckMasterListが表示されることを確認 🔵
      // 🔵 信頼性レベル: TASK-0022仕様に準拠

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【タブ切り替え】: 一度使用デッキタブに切り替え（WAI-ARIAに対応してrole="tab"で取得）
      fireEvent.click(screen.getByRole('tab', { name: '使用デッキ' }));

      // 【タブ切り替え】: デッキ種別タブに戻る（WAI-ARIAに対応してrole="tab"で取得）
      fireEvent.click(screen.getByRole('tab', { name: 'デッキ種別' }));

      // 【結果検証】: DeckMasterListが表示され、MyDeckListが非表示であることを確認
      expect(screen.getByTestId('deck-master-list')).toBeInTheDocument();
      expect(screen.queryByTestId('my-deck-list')).not.toBeInTheDocument();
    });

    it('TC-DMP-006: タブ切り替え時にアクティブスタイルが変更される', () => {
      // 【テスト目的】: タブ切り替え時にアクティブスタイルが適切に切り替わること 🔵
      // 【テスト内容】: 選択されたタブがアクティブスタイルを持ち、他のタブは非アクティブスタイルになることを確認 🔵
      // 🔵 信頼性レベル: TASK-0022仕様に準拠

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // WAI-ARIAに対応してrole="tab"で取得
      const deckMasterTab = screen.getByRole('tab', { name: 'デッキ種別' });
      const myDeckTab = screen.getByRole('tab', { name: '使用デッキ' });

      // 【初期状態確認】: デッキ種別タブがアクティブ
      expect(deckMasterTab).toHaveClass('border-blue-500');
      expect(myDeckTab).not.toHaveClass('border-blue-500');

      // 【タブ切り替え】: 使用デッキタブをクリック
      fireEvent.click(myDeckTab);

      // 【結果検証】: スタイルが切り替わることを確認
      expect(deckMasterTab).not.toHaveClass('border-blue-500');
      expect(myDeckTab).toHaveClass('border-blue-500');
    });
  });
});
