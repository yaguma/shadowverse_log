/**
 * 【機能概要】: Battle Log詳細表示モーダルコンポーネント
 * 【実装方針】: 対戦履歴の全情報を見やすく表示するモーダル
 * 【リファクタリング実装】: REQ-011対応で詳細表示機能を追加
 * 🔵 信頼性レベル: 要件定義書（REQ-011）に基づく
 */

import type { BattleLog } from '../../types';

/**
 * 【型定義】: BattleLogDetailModalコンポーネントのプロップス型
 * 🔵 信頼性レベル: 要件定義書のDetailModal仕様に準拠
 */
interface BattleLogDetailModalProps {
  /** モーダル表示状態 */
  isOpen: boolean;
  /** 表示対象の対戦履歴 */
  log: BattleLog | null;
  /** モーダルクローズ時のコールバック関数 */
  onClose: () => void;
}

/**
 * 【機能概要】: Battle Log詳細表示モーダルコンポーネント
 * 【実装方針】: 全フィールドを見やすく表示し、Escキーやモーダル外クリックで閉じられる
 * 【リファクタリング実装】: Greenフェーズで省略した詳細モーダルUIを実装
 * 🔵 信頼性レベル: 要件定義書のDetailModal仕様に準拠
 */
export const BattleLogDetailModal: React.FC<BattleLogDetailModalProps> = ({
  isOpen,
  log,
  onClose,
}) => {
  // 【エッジケース処理】: isOpen=false or log=null の場合は非表示 🔵
  if (!isOpen || !log) {
    return null;
  }

  // 【Escキーハンドリング】: Escキー押下時にモーダルを閉じる 🟡
  // 【アクセシビリティ対応】: キーボード操作でモーダルを閉じられるようにする
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* 【モーダル背景】: 背景クリックでクローズ 🟡 */}
      {/* 【アクセシビリティ対応】: role="dialog"を設定 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
        onKeyDown={handleKeyDown}
      >
        {/* 【モーダルコンテンツ】: 詳細情報を表示 🔵 */}
        {/* 【実装方針】: クリックイベントの伝播を停止して、モーダル内クリックで閉じないようにする */}
        <div
          role="document"
          className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* 【モーダルヘッダー】: タイトルと閉じるボタン 🔵 */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h2 id="detail-modal-title" className="text-2xl font-bold">
              対戦履歴詳細
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="詳細モーダルを閉じる"
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* 【モーダルボディ】: 対戦履歴の全フィールドを表示 🔵 */}
          <div className="space-y-4">
            {/* 【対戦日・対戦結果】: ハイライト表示 🔵 */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-500">対戦日</span>
                <p className="text-xl font-semibold text-gray-800">{log.date}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">対戦結果</span>
                <p
                  className={`text-xl font-bold ${
                    log.result === '勝ち' ? 'text-blue-600' : 'text-red-600'
                  }`}
                >
                  {log.result}
                </p>
              </div>
            </div>

            {/* 【対戦タイプ・ランク・グループ】: グリッド表示 🔵 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500">対戦タイプ</span>
                <p className="text-base font-semibold text-gray-800">{log.battleType}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">ランク</span>
                <p className="text-base font-semibold text-gray-800">{log.rank}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">グループ</span>
                <p className="text-base font-semibold text-gray-800">{log.group}</p>
              </div>
            </div>

            {/* 【デッキ情報】: カード形式で表示 🔵 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 【使用デッキ】 */}
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-600 font-semibold">使用デッキ</span>
                <p className="text-base font-semibold text-gray-800 mt-1">{log.myDeckId}</p>
              </div>
              {/* 【相手デッキ】 */}
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <span className="text-sm text-red-600 font-semibold">相手デッキ</span>
                <p className="text-base font-semibold text-gray-800 mt-1">{log.opponentDeckId}</p>
              </div>
            </div>

            {/* 【先攻後攻】: 単独表示 🔵 */}
            <div>
              <span className="text-sm text-gray-500">先攻後攻</span>
              <p className="text-base font-semibold text-gray-800">{log.turn}</p>
            </div>

            {/* 【ID情報】: デバッグ用（小さく表示） 🟡 */}
            <div className="pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-400">ID</span>
              <p className="text-xs text-gray-500">{log.id}</p>
            </div>
          </div>

          {/* 【モーダルフッター】: 閉じるボタン 🔵 */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
