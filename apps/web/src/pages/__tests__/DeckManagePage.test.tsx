/**
 * 【テストファイル概要】: DeckManagePage コンポーネントの単体テスト
 * 【テスト目的】: デッキ管理ページのタブ切り替え機能を検証する
 * 【タスク】: TASK-0022
 * 【TDDステップ】: Red - まずテストを作成
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeckManagePage } from '../DeckManagePage';

// 【モック設定】: DeckMasterListとMyDeckListをモック化
vi.mock('../../components/deck-master/DeckMasterList', () => ({
  DeckMasterList: () => <div data-testid="deck-master-list">DeckMasterList Mock</div>,
}));

vi.mock('../../components/my-deck/MyDeckList', () => ({
  MyDeckList: () => <div data-testid="my-deck-list">MyDeckList Mock</div>,
}));

describe('DeckManagePage', () => {
  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-DMP-001: ページタイトルが表示される', () => {
      // 【テスト目的】: DeckManagePageコンポーネントが正しくレンダリングされること
      // 【テスト内容】: ページタイトル「デッキ管理」が表示されることを確認
      // 【期待される動作】: ページタイトルが表示される

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【結果検証】: ページタイトルが表示されることを確認
      expect(screen.getByText('デッキ管理')).toBeInTheDocument();
    });

    it('TC-DMP-002: 初期表示でデッキ種別タブがアクティブである', () => {
      // 【テスト目的】: 初期表示時に「デッキ種別」タブがアクティブ状態であること
      // 【テスト内容】: activeTab = 'deckMaster' が初期値であることを確認
      // 【期待される動作】: デッキ種別タブがアクティブ、DeckMasterListが表示される

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【結果検証】: デッキ種別タブがアクティブ状態であることを確認
      const deckMasterTab = screen.getByRole('tab', { name: 'デッキ種別' });
      expect(deckMasterTab).toHaveAttribute('aria-selected', 'true');

      // 【結果検証】: DeckMasterListが表示されていることを確認
      expect(screen.getByTestId('deck-master-list')).toBeInTheDocument();

      // 【結果検証】: MyDeckListが表示されていないことを確認
      expect(screen.queryByTestId('my-deck-list')).not.toBeInTheDocument();
    });

    it('TC-DMP-003: 使用デッキタブをクリックするとMyDeckListが表示される', () => {
      // 【テスト目的】: 「使用デッキ」タブクリック時にMyDeckListが表示されること
      // 【テスト内容】: タブ切り替えでactiveTab = 'myDeck' になることを確認
      // 【期待される動作】: 使用デッキタブがアクティブ、MyDeckListが表示される

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【タブ切り替え】: 使用デッキタブをクリック
      const myDeckTab = screen.getByRole('tab', { name: '使用デッキ' });
      fireEvent.click(myDeckTab);

      // 【結果検証】: 使用デッキタブがアクティブ状態であることを確認
      expect(myDeckTab).toHaveAttribute('aria-selected', 'true');

      // 【結果検証】: デッキ種別タブが非アクティブ状態であることを確認
      const deckMasterTab = screen.getByRole('tab', { name: 'デッキ種別' });
      expect(deckMasterTab).toHaveAttribute('aria-selected', 'false');

      // 【結果検証】: MyDeckListが表示されていることを確認
      expect(screen.getByTestId('my-deck-list')).toBeInTheDocument();

      // 【結果検証】: DeckMasterListが表示されていないことを確認
      expect(screen.queryByTestId('deck-master-list')).not.toBeInTheDocument();
    });

    it('TC-DMP-004: デッキ種別タブに戻すとDeckMasterListが表示される', () => {
      // 【テスト目的】: タブを切り替えて元に戻せることを確認
      // 【テスト内容】: 使用デッキ → デッキ種別の切り替えで元の状態に戻ることを確認
      // 【期待される動作】: デッキ種別タブがアクティブ、DeckMasterListが表示される

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【タブ切り替え】: 使用デッキタブをクリック
      const myDeckTab = screen.getByRole('tab', { name: '使用デッキ' });
      fireEvent.click(myDeckTab);

      // 【タブ切り替え】: デッキ種別タブをクリック
      const deckMasterTab = screen.getByRole('tab', { name: 'デッキ種別' });
      fireEvent.click(deckMasterTab);

      // 【結果検証】: デッキ種別タブがアクティブ状態であることを確認
      expect(deckMasterTab).toHaveAttribute('aria-selected', 'true');

      // 【結果検証】: DeckMasterListが表示されていることを確認
      expect(screen.getByTestId('deck-master-list')).toBeInTheDocument();

      // 【結果検証】: MyDeckListが表示されていないことを確認
      expect(screen.queryByTestId('my-deck-list')).not.toBeInTheDocument();
    });

    it('TC-DMP-005: タブにはdata-testid属性が付与されている', () => {
      // 【テスト目的】: テスト容易性のためdata-testid属性が付与されていること
      // 【テスト内容】: 各要素にdata-testid属性があることを確認
      // 【期待される動作】: 必要な要素にdata-testid属性が存在する

      // 【実際の処理実行】: DeckManagePageコンポーネントをレンダリング
      render(<DeckManagePage />);

      // 【結果検証】: 各要素にdata-testid属性があることを確認
      expect(screen.getByTestId('deck-manage-page')).toBeInTheDocument();
      expect(screen.getByTestId('tab-deck-master')).toBeInTheDocument();
      expect(screen.getByTestId('tab-my-deck')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content')).toBeInTheDocument();
    });
  });
});
