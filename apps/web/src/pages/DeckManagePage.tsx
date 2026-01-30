/**
 * 【機能概要】: デッキ管理ページコンポーネント
 * 【実装方針】: タブ切り替えによるデッキ種別管理とマイデッキ管理の表示切り替え
 * 【タスク】: TASK-0022
 * 【TDDステップ】: Green - テストが通る最小実装
 */

import { useState } from 'react';
import { DeckMasterList } from '../components/deck-master/DeckMasterList';
import { MyDeckList } from '../components/my-deck/MyDeckList';

/**
 * 【型定義】: タブの種類
 */
type TabType = 'deckMaster' | 'myDeck';

/**
 * 【型定義】: タブ情報
 */
interface TabInfo {
  id: TabType;
  label: string;
  testId: string;
}

/**
 * 【定数定義】: タブ一覧
 */
const TABS: TabInfo[] = [
  { id: 'deckMaster', label: 'デッキ種別', testId: 'tab-deck-master' },
  { id: 'myDeck', label: '使用デッキ', testId: 'tab-my-deck' },
];

/**
 * 【機能概要】: デッキ管理ページコンポーネント
 * 【実装方針】: タブ切り替えでDeckMasterListとMyDeckListを表示/非表示
 */
export const DeckManagePage: React.FC = () => {
  // 【状態管理】: アクティブタブの状態（初期値: deckMaster）
  const [activeTab, setActiveTab] = useState<TabType>('deckMaster');

  /**
   * 【イベントハンドラ】: タブ切り替え処理
   */
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  /**
   * 【レンダリング】: タブコンテンツの表示
   */
  const renderTabContent = () => {
    if (activeTab === 'deckMaster') {
      return (
        <DeckMasterList
          deckMasters={[]}
          isLoading={false}
          error={null}
          onAdd={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );
    }

    return (
      <MyDeckList
        myDecks={[]}
        isLoading={false}
        error={null}
        canDeleteMap={{}}
        onAddClick={() => {}}
        onDeleteClick={() => {}}
      />
    );
  };

  return (
    <div className="p-4" data-testid="deck-manage-page">
      {/* 【ページタイトル】 */}
      <h1 className="text-2xl font-bold mb-6">デッキ管理</h1>

      {/* 【タブナビゲーション】 */}
      <div className="border-b border-gray-300 mb-4" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            data-testid={tab.testId}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 【タブコンテンツ】 */}
      <div data-testid="tab-content">{renderTabContent()}</div>
    </div>
  );
};
