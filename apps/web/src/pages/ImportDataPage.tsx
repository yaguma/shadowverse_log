'use client';

/**
 * 【機能概要】: データインポートページコンポーネント
 * 【実装方針】: React 19 + TypeScript + useImportフック + Tailwind CSSを使用
 * 【テスト対応】: useImport.test.tsの全テストケースをUIから実行可能にする
 * 🔵 信頼性レベル: TASK-0020要件定義書（REQ-301, REQ-302, REQ-303, REQ-404）に基づく
 */

import type React from 'react';
import { useRef } from 'react';
import { Loading } from '../components/statistics/Loading';
import { useImport } from '../hooks/useImport';

/**
 * 【機能概要】: データインポートページコンポーネント
 * 【実装方針】: useImportフックを使用してファイルインポート機能を提供
 * 【UI要素】:
 *   - ファイル選択ボタン（JSON/CSV対応）
 *   - インポート結果表示エリア（成功件数、スキップ件数、総件数）
 *   - エラーメッセージ表示エリア
 *   - ローディング表示
 * 🔵 信頼性レベル: REQ-301, REQ-302, REQ-303, REQ-404に準拠
 */
export function ImportDataPage() {
  // 【useImportフック取得】: インポート処理とステート管理を担当 🔵
  const { importResult, error, isLoading, handleImport } = useImport();

  // 【fileInputRef】: ファイル入力要素への参照を保持 🔵
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 【ファイル選択処理】: ファイル選択ボタンクリック時の処理
   * 【実装方針】: fileInputRef経由でネイティブのファイル選択ダイアログを開く
   * 🔵 信頼性レベル: 標準のHTML5 File API仕様に基づく
   */
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  /**
   * 【ファイル変更処理】: ファイル選択後の処理
   * 【実装方針】: 選択されたファイルをuseImportフックに渡してインポート処理を開始
   * 【テスト対応】: TC-IMPORT-001〜TC-IMPORT-014の全テストケースに対応
   * 🔵 信頼性レベル: useImport.test.tsの仕様に基づく
   *
   * @param event - ファイル入力変更イベント
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImport(file);
      // ファイル選択後に入力をクリアして、同じファイルの再選択を可能にする
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 【ページヘッダー】: ページタイトルと説明 🔵 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">データインポート</h1>
        <p className="text-gray-600">
          JSON形式またはCSV形式のファイルから対戦履歴データをインポートできます。
        </p>
      </div>

      {/* 【ファイル選択エリア】: ファイル選択ボタンとファイル入力要素 🔵 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">ファイル選択</h2>

        {/* 【ファイル入力要素】: 非表示のファイル入力要素（accept属性でJSON/CSVのみ許可） 🔵 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          onChange={handleFileChange}
          className="hidden"
          aria-label="ファイル選択"
        />

        {/* 【ファイル選択ボタン】: クリックでファイル選択ダイアログを開く 🔵 */}
        <button
          type="button"
          onClick={handleFileSelect}
          disabled={isLoading}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
          }`}
          aria-label="ファイルを選択"
        >
          {isLoading ? 'インポート中...' : 'ファイルを選択'}
        </button>

        {/* 【ファイル形式説明】: 対応ファイル形式の説明 🔵 */}
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">対応ファイル形式:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>JSON形式 (.json)</li>
            <li>CSV形式 (.csv)</li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">※ファイルサイズ: 最大10MBまで</p>
        </div>
      </div>

      {/* 【ローディング表示エリア】: インポート処理中のローディング表示 🔵 */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <Loading />
        </div>
      )}

      {/* 【エラー表示エリア】: エラーメッセージ表示 🔵 */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {/* 【エラーアイコン】: 赤い×印のアイコン 🔵 */}
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">インポートエラー</h3>
              <p className="text-red-700 whitespace-pre-wrap">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 【成功表示エリア】: インポート成功時の結果表示 🔵 */}
      {importResult && !isLoading && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {/* 【成功アイコン】: 緑のチェックマークアイコン 🔵 */}
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-green-800 mb-4">インポート完了</h3>

              {/* 【インポート結果統計】: 成功件数、スキップ件数、総件数を表示 🔵 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">インポート成功</p>
                  <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-xs text-gray-500 mt-1">件</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">スキップ</p>
                  <p className="text-3xl font-bold text-yellow-600">{importResult.skipped}</p>
                  <p className="text-xs text-gray-500 mt-1">件</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">総件数</p>
                  <p className="text-3xl font-bold text-blue-600">{importResult.total}</p>
                  <p className="text-xs text-gray-500 mt-1">件</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 【使用方法説明エリア】: データ形式の説明 🔵 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">データ形式について</h2>

        {/* 【JSON形式の説明】 🔵 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">JSON形式</h3>
          <div className="bg-white rounded p-4 overflow-x-auto">
            <pre className="text-sm text-gray-800">
              {`[
  {
    "id": "log_001",
    "date": "2025-10-23",
    "battleType": "ランクマッチ",
    "rank": "ダイアモンド",
    "group": "A",
    "myDeckId": "my_deck_001",
    "turn": "先攻",
    "result": "勝ち",
    "opponentDeckId": "deck_001"
  }
]`}
            </pre>
          </div>
        </div>

        {/* 【CSV形式の説明】 🔵 */}
        <div>
          <h3 className="text-lg font-medium mb-2">CSV形式</h3>
          <div className="bg-white rounded p-4 overflow-x-auto">
            <pre className="text-sm text-gray-800">
              {`id,date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
log_001,2025-10-23,ランクマッチ,ダイアモンド,A,my_deck_001,先攻,勝ち,deck_001`}
            </pre>
          </div>
        </div>

        {/* 【必須フィールド一覧】 🔵 */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">必須フィールド</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">id</code>: 対戦ログID（省略可、自動生成）
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">date</code>: 日付（YYYY-MM-DD形式）
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">battleType</code>:
              対戦タイプ（ランクマッチ / 対戦台 / ロビー大会）
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">rank</code>: ランク（サファイア /
              ダイアモンド / ルビー / トパーズ / -）
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">group</code>: グループ（A / AA / AAA /
              Master / -）
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">myDeckId</code>: 自分のデッキID
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">turn</code>: ターン（先攻 / 後攻）
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">result</code>: 結果（勝ち / 負け）
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">opponentDeckId</code>: 相手のデッキID
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
