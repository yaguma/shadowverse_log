/**
 * 【機能概要】: デッキ管理ページ
 * 【実装方針】: タブ切り替えでデッキ種別管理と使用デッキ管理を切り替え
 * 【タスク】: TASK-0022, TASK-0023
 * 信頼性レベル: architecture.md 2.2, 2.3より
 */

import { useState } from 'react';

/**
 * タブの種類
 */
type TabType = 'deckMaster' | 'myDeck';

/**
 * タブ情報の型
 */
interface TabInfo {
  id: TabType;
  label: string;
}

/**
 * タブ一覧
 */
const tabs: TabInfo[] = [
  { id: 'deckMaster', label: 'デッキ種別' },
  { id: 'myDeck', label: '使用デッキ' },
];

/**
 * デッキ管理ページコンポーネント
 */
export function DeckManagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('deckMaster');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">デッキ管理</h1>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 mb-6">
        <div className="-mb-px flex space-x-8" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div>
        {activeTab === 'deckMaster' && (
          <div data-testid="deck-master-content">
            <p className="text-gray-600">デッキ種別管理コンテンツ（実装予定）</p>
          </div>
        )}
        {activeTab === 'myDeck' && (
          <div data-testid="my-deck-content">
            <p className="text-gray-600">使用デッキ管理コンテンツ（実装予定）</p>
          </div>
        )}
      </div>
    </div>
  );
}
