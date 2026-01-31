/**
 * 【機能概要】: MyDeck一覧表示コンポーネント
 * 【実装方針】: 使用デッキの一覧表示、ローディング/エラー/空リスト状態の制御
 * 【テスト対応】: TC-MDL-001〜TC-MDL-010の全10ケースを通すための実装
 * 【タスク】: TASK-0018
 * 🔵 信頼性レベル: 要件定義書のMyDeckList仕様とREQ-EXT-502に基づく
 */

import type { MyDeck } from '@shadowverse-log/shared';

/**
 * 【型定義】: MyDeckListコンポーネントのプロップス型
 * 🔵 信頼性レベル: TASK-0018仕様に準拠
 */
export interface MyDeckListProps {
  /** 使用デッキ一覧 */
  myDecks: MyDeck[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error?: string | null;
  /** 削除可能かどうかのマップ（id -> canDelete） */
  canDeleteMap: Record<string, boolean>;
  /** 追加ボタンクリック時のコールバック */
  onAddClick: () => void;
  /** 削除ボタンクリック時のコールバック */
  onDeleteClick: (id: string) => void;
}

/**
 * 【機能概要】: ヘッダー部分のサブコンポーネント（DRY原則適用）
 * 【実装方針】: タイトルと追加ボタンを共通化
 * 🔵 信頼性レベル: リファクタリングによる共通化
 */
const MyDeckListHeader: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold">使用デッキ一覧</h2>
    <button
      type="button"
      onClick={onAddClick}
      data-testid="add-deck-button"
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      + デッキを追加
    </button>
  </div>
);

/**
 * 【機能概要】: ローディング表示のサブコンポーネント
 * 【実装方針】: 読み込み中状態の表示を共通化
 * 🔵 信頼性レベル: リファクタリングによる共通化
 */
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-8" data-testid="loading-spinner">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2" />
      <p className="text-gray-600">読み込み中...</p>
    </div>
  </div>
);

/**
 * 【機能概要】: 空リスト表示のサブコンポーネント
 * 【実装方針】: REQ-EXT-502に基づく空データメッセージ表示
 * 🔵 信頼性レベル: REQ-EXT-502に基づく
 */
const EmptyState: React.FC = () => (
  <div
    className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500"
    data-testid="empty-message"
  >
    <p className="mb-2">使用デッキが登録されていません</p>
    <p className="text-sm">「デッキを追加」ボタンから新しいデッキを登録してください</p>
  </div>
);

/**
 * 【機能概要】: エラー表示のサブコンポーネント
 * 【実装方針】: エラーメッセージの表示
 * 🔵 信頼性レベル: エラーハンドリング要件に基づく
 */
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div
    className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
    data-testid="error-message"
  >
    {message}
  </div>
);

/**
 * 【機能概要】: デッキアイテムのサブコンポーネント
 * 【実装方針】: 個別のデッキ表示カード
 * 🔵 信頼性レベル: TASK-0017で拡張予定のMyDeckItemコンポーネントの基本形
 */
const MyDeckItem: React.FC<{
  deck: MyDeck;
  canDelete: boolean;
  onDeleteClick: (id: string) => void;
}> = ({ deck, canDelete, onDeleteClick }) => (
  <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
    <div className="flex justify-between items-center">
      <div>
        <span className="font-semibold text-gray-700">{deck.deckName}</span>
        {deck.deckCode && (
          <>
            <span className="mx-2 text-gray-400">|</span>
            <span className="text-gray-500 text-sm">{deck.deckCode}</span>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onDeleteClick(deck.id)}
          aria-label="削除"
          disabled={!canDelete}
          className={`px-3 py-1 rounded text-sm ${
            canDelete
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          削除
        </button>
      </div>
    </div>
  </div>
);

/**
 * 【機能概要】: コンテンツ部分をレンダリングするヘルパー関数
 * 【実装方針】: ローディング/エラー/空リスト/通常表示を条件分岐
 * 🔵 信頼性レベル: リファクタリングによる可読性向上
 */
const renderContent = (
  myDecks: MyDeck[],
  isLoading: boolean,
  error: string | null | undefined,
  canDeleteMap: Record<string, boolean>,
  onDeleteClick: (id: string) => void
): React.ReactNode => {
  // 【ローディング状態】: TC-MDL-005, TC-MDL-006対応
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 【エラー状態】: TC-MDL-009対応
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // 【空リスト状態】: TC-MDL-004対応（REQ-EXT-502）
  if (myDecks.length === 0) {
    return <EmptyState />;
  }

  // 【通常表示】: TC-MDL-001, TC-MDL-002, TC-MDL-003対応
  return (
    <ul className="space-y-2" data-testid="deck-list">
      {myDecks.map((deck) => (
        <li key={deck.id}>
          <MyDeckItem
            deck={deck}
            canDelete={canDeleteMap[deck.id] ?? true}
            onDeleteClick={onDeleteClick}
          />
        </li>
      ))}
    </ul>
  );
};

/**
 * 【機能概要】: MyDeck一覧表示コンポーネント
 * 【実装方針】: 条件分岐でローディング/エラー/空リスト/通常表示を制御
 * 【テスト対応】: TC-MDL-001〜TC-MDL-010の全10ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書のMyDeckList仕様に準拠
 */
export const MyDeckList: React.FC<MyDeckListProps> = ({
  myDecks,
  isLoading,
  error,
  canDeleteMap,
  onAddClick,
  onDeleteClick,
}) => {
  return (
    <div className="p-4" data-testid="my-deck-list">
      {/* 【ヘッダー部分】: タイトルと追加ボタン（共通化）🔵 */}
      <MyDeckListHeader onAddClick={onAddClick} />

      {/* 【コンテンツ部分】: 状態に応じた表示を切り替え 🔵 */}
      {renderContent(myDecks, isLoading, error, canDeleteMap, onDeleteClick)}
    </div>
  );
};
