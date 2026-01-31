'use client';

/**
 * 【機能概要】: Battle Log一覧ページコンポーネント
 * 【実装方針】: Zustand Storeと連携し、一覧表示・削除・新規登録機能を提供
 * 【テスト対応】: TC-LIST-PAGE-001〜TC-INT-003の全9ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書（REQ-009, REQ-010, REQ-011, REQ-032, REQ-033）に基づく
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BattleLogDetailModal } from '../components/battle-log/BattleLogDetailModal';
import { BattleLogForm } from '../components/battle-log/BattleLogForm';
import { BattleLogList } from '../components/battle-log/BattleLogList';
import { DeleteConfirmDialog } from '../components/battle-log/DeleteConfirmDialog';
import { useBattleLogStore } from '../store/battleLogStore';
import { useDeckStore } from '../store/deckStore';
import type { BattleLog, BattleLogWithDeckNames } from '../types';

/**
 * 【機能概要】: Battle Log一覧ページコンポーネント
 * 【実装方針】: 最小限の実装でテストを通す
 * 【テスト対応】: TC-LIST-PAGE-001〜TC-INT-003の全9ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書のBattleLogListPage仕様に準拠
 */
export function BattleLogListPage() {
  // 【Zustand Store取得】: useBattleLogStoreからストアの状態とアクションを取得 🔵
  const { battleLogs, isLoading, error, fetchBattleLogs, deleteBattleLog, clearError } =
    useBattleLogStore();

  // 【TASK-0050対応】: useDeckStoreからデッキマスター一覧を取得 🔵
  const { deckMasters, fetchDeckMasters } = useDeckStore();

  // 【ローカル状態管理】: フォーム表示、削除ダイアログ表示、詳細モーダル表示を管理 🔵
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [targetLog, setTargetLog] = useState<BattleLog | null>(null);
  const [detailLog, setDetailLog] = useState<BattleLog | null>(null);

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
    // 【TASK-0050対応】: デッキマスター一覧も取得 🔵
    fetchDeckMasters();
  }, [fetchBattleLogs, fetchDeckMasters]);

  /**
   * 【データ変換】: BattleLogをBattleLogWithDeckNamesに変換
   * 【実装方針】: deckMastersからデッキ名を解決してマージ
   * 🔵 信頼性レベル: BattleLogList型定義に基づく
   */
  const battleLogsWithDeckNames: BattleLogWithDeckNames[] = useMemo(() => {
    return battleLogs.map((log) => {
      const myDeck = deckMasters.find((d) => d.id === log.myDeckId);
      const opponentDeck = deckMasters.find((d) => d.id === log.opponentDeckId);
      return {
        ...log,
        myDeckName: myDeck?.deckName ?? '不明',
        opponentDeckName: opponentDeck?.deckName ?? '不明',
      };
    });
  }, [battleLogs, deckMasters]);

  /**
   * 【新規登録ボタンハンドラー】: 新規登録フォームを表示
   * 【実装方針】: isFormOpenをtrueに設定してモーダルを表示
   * 【テスト対応】: TC-LIST-PAGE-003を通すための実装
   * 🔵 信頼性レベル: データフロー図に基づく
   */
  const handleNewButtonClick = () => {
    // 【フォーム表示】: isFormOpenをtrueに設定 🔵
    // 【TC-LIST-PAGE-003対応】: 新規登録ボタンクリックでBattleLogFormが表示される
    setIsFormOpen(true);
  };

  /**
   * 【フォーム送信成功ハンドラー】: フォーム送信成功後にフォームを閉じる
   * 【実装方針】: isFormOpenをfalseに設定してモーダルを閉じる
   * 【テスト対応】: TC-LIST-PAGE-004、TC-INT-003を通すための実装
   * 🔵 信頼性レベル: データフロー図に基づく
   */
  const handleFormSuccess = () => {
    // 【フォームクローズ】: isFormOpenをfalseに設定 🔵
    // 【TC-LIST-PAGE-004対応】: フォーム送信成功後にフォームが閉じる
    // 【TC-INT-003対応】: fetchBattleLogs()はZustand Store経由で自動実行される
    setIsFormOpen(false);
  };

  /**
   * 【フォームキャンセルハンドラー】: フォームをキャンセルして閉じる
   * 【実装方針】: isFormOpenをfalseに設定してモーダルを閉じる
   * 🔵 信頼性レベル: 一般的なフォームUXパターンから
   */
  const handleFormCancel = useCallback(() => {
    // 【フォームクローズ】: isFormOpenをfalseに設定 🔵
    setIsFormOpen(false);
  }, []);

  /**
   * 【Escキーハンドリング】: Escキーでフォームモーダルを閉じる
   * 【実装方針】: キーボードイベントをリッスンしてEscキーでダイアログを閉じる
   * 🔵 信頼性レベル: アクセシビリティ要件に基づく
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFormOpen) {
        handleFormCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFormOpen, handleFormCancel]);

  /**
   * 【削除ボタンハンドラー】: 削除確認ダイアログを表示
   * 【実装方針】: 削除対象のlogを設定し、isDeleteDialogOpenをtrueに設定
   * 【テスト対応】: TC-ERR-003、TC-INT-002を通すための実装
   * 🔵 信頼性レベル: データフロー図に基づく
   */
  const handleDelete = (id: string) => {
    // 【削除対象設定】: battleLogsから削除対象を検索 🔵
    const log = battleLogs.find((log) => log.id === id);
    if (log) {
      setTargetLog(log);
      setIsDeleteDialogOpen(true);
    }
  };

  /**
   * 【削除確認ハンドラー】: 削除を実行
   * 【実装方針】: deleteBattleLog()を呼び出し、成功/失敗後にダイアログを閉じる
   * 【テスト対応】: TC-ERR-003、TC-INT-002を通すための実装
   * 🔵 信頼性レベル: データフロー図に基づく
   */
  const handleDeleteConfirm = async () => {
    if (!targetLog) return;

    try {
      // 【削除実行】: deleteBattleLog()を呼び出す 🔵
      // 【TC-INT-002対応】: deleteBattleLog()実行時に一覧が自動更新される
      await deleteBattleLog(targetLog.id);

      // 【ダイアログクローズ】: 削除成功後にダイアログを閉じる 🔵
      setIsDeleteDialogOpen(false);
      setTargetLog(null);
    } catch (_error) {
      // 【エラーハンドリング】: エラー発生時もダイアログを閉じる 🔵
      // 【TC-ERR-003対応】: 削除中にエラー発生時、ダイアログが閉じてエラーメッセージが表示される
      setIsDeleteDialogOpen(false);
      setTargetLog(null);
      // エラーメッセージはZustand Storeのerror状態に設定される
    }
  };

  /**
   * 【削除キャンセルハンドラー】: 削除をキャンセルしてダイアログを閉じる
   * 【実装方針】: isDeleteDialogOpenをfalseに設定してダイアログを閉じる
   * 🔵 信頼性レベル: 一般的なダイアログUXパターンから
   */
  const handleDeleteCancel = () => {
    // 【ダイアログクローズ】: isDeleteDialogOpenをfalseに設定 🔵
    setIsDeleteDialogOpen(false);
    setTargetLog(null);
  };

  /**
   * 【詳細ボタンハンドラー】: 詳細モーダルを表示
   * 【実装方針】: 詳細表示対象のlogを設定し、モーダルを表示
   * 【リファクタリング実装】: REQ-011対応で詳細モーダルUIを実装
   * 🔵 信頼性レベル: 要件定義書REQ-011に基づく
   */
  const handleDetail = (log: BattleLogWithDeckNames) => {
    // 【詳細モーダル表示】: 詳細表示対象のlogを設定 🔵
    setDetailLog(log);
  };

  /**
   * 【詳細モーダルクローズハンドラー】: 詳細モーダルを閉じる
   * 【実装方針】: detailLogをnullに設定してモーダルを閉じる
   * 🔵 信頼性レベル: 一般的なモーダルUXパターンから
   */
  const handleDetailClose = () => {
    // 【モーダルクローズ】: detailLogをnullに設定 🔵
    setDetailLog(null);
  };

  /**
   * 【再試行ボタンハンドラー】: エラー時に再試行
   * 【実装方針】: clearError()を呼び出してエラーをクリアし、fetchBattleLogs()を再実行
   * 【テスト対応】: TC-ERR-002を通すための実装
   * 🔵 信頼性レベル: EDGE-001（ネットワークエラー）に基づく
   */
  const handleRetry = () => {
    // 【エラークリア】: clearError()を呼び出す 🔵
    // 【TC-ERR-002対応】: clearError()が呼ばれる
    clearError();

    // 【再試行】: fetchBattleLogs()を再実行 🔵
    // 【TC-ERR-002対応】: fetchBattleLogs()が再実行される
    fetchBattleLogs();
  };

  return (
    <div className="container mx-auto p-4">
      {/* 【ヘッダー】: ページタイトルと新規登録ボタン 🔵 */}
      {/* 【TC-LIST-PAGE-001対応】: ページタイトル、新規登録ボタンの表示 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">対戦履歴一覧</h1>
        <button
          type="button"
          onClick={handleNewButtonClick}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          新規登録
        </button>
      </div>

      {/* 【エラーメッセージ表示】: エラーが発生した場合に表示 🔵 */}
      {/* 【TC-ERR-001、TC-ERR-002、TC-ERR-003対応】: エラーメッセージと再試行ボタンの表示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            再試行
          </button>
        </div>
      )}

      {/* 【ローディング表示】: データ取得中に表示 🔵 */}
      {/* 【TC-BND-004対応】: ローディングスピナーの表示（BattleLogListコンポーネント内で実装） */}
      {isLoading && (
        <div className="text-center py-8">
          <p>読み込み中...</p>
        </div>
      )}

      {/* 【一覧表示】: BattleLogListコンポーネントを表示 🔵 */}
      {/* 【TC-LIST-PAGE-001対応】: 一覧表示エリアの表示 */}
      {/* 【TASK-0050対応】: deckMastersを渡してデッキ名を表示 */}
      {!isLoading && (
        <BattleLogList
          battleLogs={battleLogsWithDeckNames}
          deckMasters={deckMasters}
          onDelete={handleDelete}
          onDetail={handleDetail}
        />
      )}

      {/* 【新規登録フォームモーダル】: BattleLogFormコンポーネントを表示 🔵 */}
      {/* 【TC-LIST-PAGE-003、TC-LIST-PAGE-004対応】: フォーム表示・クローズ */}
      {isFormOpen && (
        <div
          role="dialog"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <BattleLogForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
          </div>
        </div>
      )}

      {/* 【削除確認ダイアログ】: DeleteConfirmDialogコンポーネントを表示 🔵 */}
      {/* 【TC-ERR-003、TC-INT-002対応】: 削除確認ダイアログの表示・削除実行 */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        targetLog={targetLog}
        isLoading={isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* 【詳細モーダル】: BattleLogDetailModalコンポーネントを表示 🔵 */}
      {/* 【リファクタリング実装】: REQ-011対応で詳細モーダルUIを追加 */}
      <BattleLogDetailModal
        isOpen={detailLog !== null}
        log={detailLog}
        onClose={handleDetailClose}
      />
    </div>
  );
}
