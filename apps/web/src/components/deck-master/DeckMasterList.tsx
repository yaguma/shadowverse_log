/**
 * 【機能概要】: DeckMaster一覧表示コンポーネント
 * 【実装方針】: デッキ種別の一覧表示、ローディング/エラー/空リスト状態の制御
 * 【テスト対応】: TC-DML-001〜TC-DML-008の全8ケースを通すための実装
 * 【タスク】: TASK-0010
 * 🔵 信頼性レベル: 要件定義書のDeckMasterList仕様とREQ-EXT-501に基づく
 */

import type { DeckMasterWithUsage } from '@shadowverse-log/shared';

/**
 * 【型定義】: DeckMasterListコンポーネントのプロップス型
 * 🔵 信頼性レベル: TASK-0010仕様に準拠
 */
interface DeckMasterListProps {
  /** デッキ種別一覧データ（使用履歴付き） */
  deckMasters: DeckMasterWithUsage[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** 追加ボタンクリック時のコールバック */
  onAdd: () => void;
  /** 編集ボタンクリック時のコールバック */
  onEdit: (deckMaster: DeckMasterWithUsage) => void;
  /** 削除ボタンクリック時のコールバック */
  onDelete: (id: string) => void;
}

/**
 * 【機能概要】: ヘッダー部分のサブコンポーネント（DRY原則適用）
 * 【実装方針】: タイトルと追加ボタンを共通化
 * 🔵 信頼性レベル: リファクタリングによる共通化
 */
const DeckMasterListHeader: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold">デッキ種別管理</h2>
    <button
      type="button"
      onClick={onAdd}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      + 新規追加
    </button>
  </div>
);

/**
 * 【機能概要】: ローディング表示のサブコンポーネント
 * 【実装方針】: 読み込み中状態の表示を共通化
 * 🔵 信頼性レベル: リファクタリングによる共通化
 */
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2" />
      <p className="text-gray-600">読み込み中...</p>
    </div>
  </div>
);

/**
 * 【機能概要】: 空リスト表示のサブコンポーネント
 * 【実装方針】: REQ-EXT-501に基づく空データメッセージ表示
 * 🔵 信頼性レベル: REQ-EXT-501に基づく
 */
const EmptyState: React.FC = () => (
  <div className="text-center py-8 text-gray-500">
    <p>デッキ種別が登録されていません</p>
    <p className="text-sm mt-2">新規追加ボタンから登録してください</p>
  </div>
);

/**
 * 【機能概要】: エラー表示のサブコンポーネント
 * 【実装方針】: エラーメッセージの表示
 * 🔵 信頼性レベル: エラーハンドリング要件に基づく
 */
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-8 text-red-500">{message}</div>
);

/**
 * 【機能概要】: デッキ種別アイテムのサブコンポーネント
 * 【実装方針】: 個別のデッキ種別表示カード
 * 🔵 信頼性レベル: TASK-0011で拡張予定のDeckMasterItemコンポーネントの基本形
 */
const DeckMasterItem: React.FC<{
  deckMaster: DeckMasterWithUsage;
  onEdit: (deckMaster: DeckMasterWithUsage) => void;
  onDelete: (id: string) => void;
}> = ({ deckMaster, onEdit, onDelete }) => (
  <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
    <div className="flex justify-between items-center">
      <div>
        <span className="font-semibold text-gray-700">{deckMaster.className}</span>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">{deckMaster.deckName}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(deckMaster)}
          aria-label="デッキ種別を編集"
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => onDelete(deckMaster.id)}
          aria-label="デッキ種別を削除"
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
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
  deckMasters: DeckMasterWithUsage[],
  isLoading: boolean,
  error: string | null,
  onEdit: (deckMaster: DeckMasterWithUsage) => void,
  onDelete: (id: string) => void
): React.ReactNode => {
  // 【ローディング状態】: TC-DML-005, TC-DML-006対応
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 【エラー状態】: TC-DML-008対応
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // 【空リスト状態】: TC-DML-007対応（REQ-EXT-501）
  if (deckMasters.length === 0) {
    return <EmptyState />;
  }

  // 【通常表示】: TC-DML-001, TC-DML-002対応
  return (
    <div className="space-y-4">
      {deckMasters.map((deckMaster) => (
        <DeckMasterItem
          key={deckMaster.id}
          deckMaster={deckMaster}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

/**
 * 【機能概要】: DeckMaster一覧表示コンポーネント
 * 【実装方針】: 条件分岐でローディング/エラー/空リスト/通常表示を制御
 * 【テスト対応】: TC-DML-001〜TC-DML-008の全8ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書のDeckMasterList仕様に準拠
 */
export const DeckMasterList: React.FC<DeckMasterListProps> = ({
  deckMasters,
  isLoading,
  error,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="p-4">
      {/* 【ヘッダー部分】: タイトルと追加ボタン（共通化）🔵 */}
      <DeckMasterListHeader onAdd={onAdd} />

      {/* 【コンテンツ部分】: 状態に応じた表示を切り替え 🔵 */}
      {renderContent(deckMasters, isLoading, error, onEdit, onDelete)}
    </div>
  );
};
