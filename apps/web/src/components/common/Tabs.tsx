/**
 * 【機能概要】: 汎用タブコンポーネント
 * 【実装方針】: 再利用可能なタブUIを提供
 * 【タスク】: TASK-0022
 * 🔵 信頼性レベル: architecture.md 2.3に基づく
 */

import type { ReactNode } from 'react';

/**
 * 【型定義】: タブアイテム
 * 🔵 信頼性レベル: TASK-0022仕様に準拠
 */
export interface Tab {
  /** タブの一意識別子 */
  id: string;
  /** タブのラベル */
  label: string;
}

/**
 * 【型定義】: Tabsコンポーネントのプロップス
 * 🔵 信頼性レベル: TASK-0022仕様に準拠
 */
export interface TabsProps {
  /** タブの定義配列 */
  tabs: Tab[];
  /** アクティブなタブのID */
  activeTab: string;
  /** タブ切り替え時のコールバック */
  onTabChange: (tabId: string) => void;
  /** タブコンテンツ（children） */
  children: ReactNode;
}

/**
 * 【機能概要】: 汎用タブコンポーネント
 * 【実装方針】: タブナビゲーションとコンテンツエリアを提供
 * 🔵 信頼性レベル: TASK-0022仕様に準拠
 */
export const Tabs = ({ tabs, activeTab, onTabChange, children }: TabsProps) => {
  return (
    <div>
      {/* 【タブナビゲーション】 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
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
        </nav>
      </div>

      {/* 【タブコンテンツ】 */}
      <div>{children}</div>
    </div>
  );
};
