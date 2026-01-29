/**
 * 【機能概要】: デッキ管理ページコンポーネント
 * 【実装方針】: タブ切り替えによるデッキ種別管理とマイデッキ管理の統合画面
 * 【タスク】: TASK-0022
 * 🔵 信頼性レベル: architecture.md 2.3に基づく
 */

import { useState } from 'react';
import type { Tab } from '../components/common/Tabs';
import { Tabs } from '../components/common/Tabs';
import { DeckMasterList } from '../components/deck-master/DeckMasterList';
import { MyDeckList } from '../components/my-deck/MyDeckList';
import { useDeckStore } from '../store/deckStore';

/**
 * 【型定義】: タブ種別
 * 🔵 信頼性レベル: TASK-0022仕様に準拠
 */
type TabType = 'deckMaster' | 'myDeck';

/**
 * 【定数】: タブ定義
 * 🔵 信頼性レベル: TASK-0022仕様に準拠
 */
const DECK_MANAGE_TABS: Tab[] = [
  { id: 'deckMaster', label: 'デッキ種別' },
  { id: 'myDeck', label: '使用デッキ' },
];

/**
 * 【機能概要】: デッキ管理ページコンポーネント
 * 【実装方針】: useState でタブ状態を管理し、汎用Tabsコンポーネントで表示を切り替え
 * 🔵 信頼性レベル: TASK-0022仕様に準拠
 */
export const DeckManagePage = () => {
  // 【State管理】: アクティブなタブ（初期値はデッキ種別）
  const [activeTab, setActiveTab] = useState<TabType>('deckMaster');

  // 【Deck Store】: デッキ管理用の状態と操作
  const {
    deckMastersWithUsage,
    myDecks,
    isLoadingDeckMasters,
    isMyDecksLoading,
    deckMasterError,
    myDecksError,
  } = useDeckStore();

  // 【削除可能判定マップ】: マイデッキの削除可否を判定
  // 使用履歴がないデッキは削除可能（TASK-0023で詳細実装予定）
  const canDeleteMap: Record<string, boolean> = myDecks.reduce(
    (acc, deck) => {
      // TODO: 使用履歴に基づいた削除可否判定を実装（TASK-0023）
      acc[deck.id] = true;
      return acc;
    },
    {} as Record<string, boolean>
  );

  // 【DeckMaster操作ハンドラ】: 新規追加
  const handleDeckMasterAdd = () => {
    // TODO: モーダル表示処理を追加（TASK-0023で実装予定）
    console.log('DeckMaster add clicked');
  };

  // 【DeckMaster操作ハンドラ】: 編集
  const handleDeckMasterEdit = () => {
    // TODO: モーダル表示処理を追加（TASK-0023で実装予定）
    console.log('DeckMaster edit clicked');
  };

  // 【DeckMaster操作ハンドラ】: 削除
  const handleDeckMasterDelete = () => {
    // TODO: 削除確認ダイアログ表示処理を追加（TASK-0023で実装予定）
    console.log('DeckMaster delete clicked');
  };

  // 【MyDeck操作ハンドラ】: 新規追加
  const handleMyDeckAdd = () => {
    // TODO: モーダル表示処理を追加（TASK-0023で実装予定）
    console.log('MyDeck add clicked');
  };

  // 【MyDeck操作ハンドラ】: 削除
  const handleMyDeckDelete = () => {
    // TODO: 削除確認ダイアログ表示処理を追加（TASK-0023で実装予定）
    console.log('MyDeck delete clicked');
  };

  // 【タブ切り替えハンドラ】
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabType);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 【ページタイトル】 */}
      <h1 className="text-2xl font-bold mb-6">デッキ管理</h1>

      {/* 【タブナビゲーションとコンテンツ】: 汎用Tabsコンポーネントを使用 */}
      <Tabs tabs={DECK_MANAGE_TABS} activeTab={activeTab} onTabChange={handleTabChange}>
        {/* 【タブコンテンツ】: アクティブタブに応じたコンポーネント表示 */}
        {activeTab === 'deckMaster' && (
          <DeckMasterList
            deckMasters={deckMastersWithUsage}
            isLoading={isLoadingDeckMasters}
            error={deckMasterError}
            onAdd={handleDeckMasterAdd}
            onEdit={handleDeckMasterEdit}
            onDelete={handleDeckMasterDelete}
          />
        )}
        {activeTab === 'myDeck' && (
          <MyDeckList
            myDecks={myDecks}
            isLoading={isMyDecksLoading}
            error={myDecksError}
            canDeleteMap={canDeleteMap}
            onAddClick={handleMyDeckAdd}
            onDeleteClick={handleMyDeckDelete}
          />
        )}
      </Tabs>
    </div>
  );
};
