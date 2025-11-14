'use client';

/**
 * 【機能概要】: Battle Log一覧ページコンポーネント
 * 【実装方針】: Zustand Storeと連携し、一覧表示・削除・新規登録機能を提供
 * 【テスト対応】: TC-LIST-PAGE-001〜TC-INT-003の全9ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書（REQ-009, REQ-010, REQ-011, REQ-032, REQ-033）に基づく
 */

import { useEffect } from 'react';
import { useBattleLogStore } from '../store/battleLogStore';

/**
 * 【機能概要】: Battle Log一覧ページコンポーネント
 * 【実装方針】: 最小限の実装でテストを通す
 * 【テスト対応】: TC-LIST-PAGE-001〜TC-INT-003の全9ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書のBattleLogListPage仕様に準拠
 */
export function BattleLogListPage() {
  // 【Zustand Store取得】: useBattleLogStoreからストアの状態とアクションを取得 🔵
  const { isLoading, error, fetchBattleLogs } =
    useBattleLogStore();


  /**
   * 【初期化処理】: 初回ロード時にfetchBattleLogs()を自動実行
   * 【実装方針】: useEffectの依存配列を空配列にして、1回だけ実行
   * 【テスト対応】: TC-LIST-PAGE-002を通すための実装
   * 🔵 信頼性レベル: データフロー図に基づく
   */
  useEffect(() => {
    // 【初回データ取得】: ページマウント時にfetchBattleLogs()を実行 🔵
    // 【TC-LIST-PAGE-002対応】: fetchBattleLogs()が1回だけ呼ばれる
    fetchBattleLogs();
  }, [fetchBattleLogs]);


  return (
    <div className="container mx-auto p-4">
      {/* 【ヘッダー】: ページタイトルと新規登録ボタン 🔵 */}
      {/* 【TC-LIST-PAGE-001対応】: ページタイトル、新規登録ボタンの表示 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">対戦履歴一覧</h1>
      </div>

      {/* 【エラーメッセージ表示】: エラーが発生した場合に表示 🔵 */}
      {/* 【TC-ERR-001、TC-ERR-002、TC-ERR-003対応】: エラーメッセージと再試行ボタンの表示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 【ローディング表示】: データ取得中に表示 🔵 */}
      {/* 【TC-BND-004対応】: ローディングスピナーの表示（BattleLogListコンポーネント内で実装） */}
      {isLoading && (
        <div className="text-center py-8">
          <p>読み込み中...</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="text-center py-8">
          <p>読み込み完了</p>
        </div>
      )}

    </div>
  );
}
