'use client';

/**
 * 【機能概要】: Battle Log登録フォームコンポーネント
 * 【実装方針】: React 19 + TypeScript + Zustand + Tailwind CSSを使用した実装
 * 【リファクタリング】: Issue 004対応 - ロジックをuseBattleLogFormフックに分離
 * 🔵 信頼性レベル: 要件定義書（REQ-001, REQ-002, REQ-003, REQ-030, REQ-031, REQ-603）に基づく
 */

import { BATTLE_RESULTS, BATTLE_TYPES, GROUPS, RANKS, TURNS } from '@shadowverse-log/shared';
import type React from 'react';
import { useBattleLogForm } from '../../hooks/useBattleLogForm';

/**
 * 【型定義】: BattleLogFormコンポーネントのプロップス型
 * 🔵 信頼性レベル: 要件定義書のBattleLogFormProps仕様に準拠
 */
interface BattleLogFormProps {
  /** フォーム送信成功時のコールバック関数 */
  onSuccess?: () => void;
  /** フォームキャンセル時のコールバック関数 */
  onCancel?: () => void;
}

/**
 * 【機能概要】: Battle Log登録フォームコンポーネント
 * 【実装方針】: カスタムフックでロジックを分離し、UIに集中
 * 🔵 信頼性レベル: 要件定義書のBattleLogForm仕様に準拠
 */
export const BattleLogForm: React.FC<BattleLogFormProps> = ({ onSuccess, onCancel }) => {
  const {
    formData,
    validationErrors,
    isLoading,
    error,
    deckError,
    myDecksError,
    deckMasterError,
    myDecks,
    deckMastersWithUsage,
    isSubmitDisabled,
    handleChange,
    handleBlur,
    handleSubmit,
    handleCancel,
    handleKeyDown,
  } = useBattleLogForm({ onSuccess, onCancel });

  return (
    <form className="flex flex-col max-h-[90vh]" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      {/* 【スクロール可能なフォームボディ】 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 【フォームタイトル】 */}
        <h2 className="text-2xl font-bold mb-4">対戦履歴登録</h2>

        {/* 【エラーメッセージ表示】 */}
        <ErrorMessages
          error={error}
          deckError={deckError}
          myDecksError={myDecksError}
          deckMasterError={deckMasterError}
        />

        {/* 【シーズン・対戦日フィールド】 */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SeasonField value={formData.season} onChange={handleChange} />
          <DateField
            value={formData.date}
            error={validationErrors.date}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        {/* 【詳細設定（折りたたみ）】 */}
        <AdvancedSettings formData={formData} onChange={handleChange} />

        {/* 【使用デッキフィールド】 */}
        <MyDeckField
          value={formData.myDeckId}
          error={validationErrors.myDeckId}
          myDecks={myDecks}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        {/* 【先攻後攻フィールド】 */}
        <TurnField value={formData.turn} onChange={handleChange} />

        {/* 【対戦結果フィールド】 */}
        <ResultField value={formData.result} onChange={handleChange} />

        {/* 【相手デッキフィールド】 */}
        <OpponentDeckField
          value={formData.opponentDeckId}
          error={validationErrors.opponentDeckId}
          deckMasters={deckMastersWithUsage}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        {/* 【ローディングスピナー】 */}
        {isLoading && (
          <output className="mb-4 text-center block">
            <span className="text-gray-600">送信中...</span>
          </output>
        )}
      </div>

      {/* 【フォームアクション】 - 固定フッターでモバイルビューでも常に見える */}
      <div className="flex-shrink-0 flex gap-4 justify-end p-4 border-t border-gray-200 bg-white">
        <button type="button" className="btn-secondary" onClick={handleCancel} disabled={isLoading}>
          キャンセル
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitDisabled}>
          登録
        </button>
      </div>
    </form>
  );
};

// ==================== サブコンポーネント ====================

/**
 * エラーメッセージ表示コンポーネント
 */
function ErrorMessages({
  error,
  deckError,
  myDecksError,
  deckMasterError,
}: {
  error: string | null;
  deckError: string | null;
  myDecksError: string | null;
  deckMasterError: string | null;
}) {
  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {deckError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {deckError}
        </div>
      )}
      {myDecksError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {myDecksError}
        </div>
      )}
      {deckMasterError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {deckMasterError}
        </div>
      )}
    </>
  );
}

/**
 * シーズンフィールドコンポーネント
 */
function SeasonField({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (field: 'season', value: number | undefined) => void;
}) {
  return (
    <div>
      <label htmlFor="season" className="label">
        シーズン
      </label>
      <input
        id="season"
        type="number"
        min="1"
        className="input-field"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange('season', v === '' ? undefined : Number(v));
        }}
        placeholder="例: 1"
      />
    </div>
  );
}

/**
 * 日付フィールドコンポーネント
 */
function DateField({
  value,
  error,
  onChange,
  onBlur,
}: {
  value: string | undefined;
  error?: string;
  onChange: (field: 'date', value: string) => void;
  onBlur: (field: 'date') => void;
}) {
  return (
    <div>
      <label htmlFor="date" className="label">
        対戦日
      </label>
      <input
        id="date"
        type="date"
        className="input-field"
        value={value ?? ''}
        onChange={(e) => onChange('date', e.target.value)}
        onBlur={() => onBlur('date')}
        aria-invalid={!!error}
        aria-describedby={error ? 'date-error' : undefined}
      />
      {error && (
        <p id="date-error" className="error-message">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * 詳細設定コンポーネント（対戦タイプ、ランク、グループ）
 */
function AdvancedSettings({
  formData,
  onChange,
}: {
  formData: { battleType: string; rank: string; groupName: string };
  onChange: (field: 'battleType' | 'rank' | 'groupName', value: string) => void;
}) {
  return (
    <details className="mb-4 border border-gray-200 rounded-md">
      <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
        詳細設定（対戦タイプ・ランク・グループ）
      </summary>
      <div className="px-4 py-3 space-y-4 border-t border-gray-200">
        <div>
          <label htmlFor="battleType" className="label">
            対戦タイプ
          </label>
          <select
            id="battleType"
            className="input-field"
            value={formData.battleType}
            onChange={(e) => onChange('battleType', e.target.value)}
          >
            <option value="">選択してください</option>
            {BATTLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rank" className="label">
              ランク
            </label>
            <select
              id="rank"
              className="input-field"
              value={formData.rank}
              onChange={(e) => onChange('rank', e.target.value)}
            >
              <option value="">選択してください</option>
              {RANKS.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="groupName" className="label">
              グループ
            </label>
            <select
              id="groupName"
              className="input-field"
              value={formData.groupName}
              onChange={(e) => onChange('groupName', e.target.value)}
            >
              <option value="">選択してください</option>
              {GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </details>
  );
}

/**
 * マイデッキフィールドコンポーネント
 */
function MyDeckField({
  value,
  error,
  myDecks,
  onChange,
  onBlur,
}: {
  value: string;
  error?: string;
  myDecks: { id: string; deckName: string }[];
  onChange: (field: 'myDeckId', value: string) => void;
  onBlur: (field: 'myDeckId') => void;
}) {
  return (
    <div className="mb-4">
      <label htmlFor="myDeckId" className="label">
        使用デッキ
      </label>
      {myDecks.length === 0 ? (
        <p className="error-message">マイデッキを登録してください</p>
      ) : (
        <select
          id="myDeckId"
          className="input-field"
          value={value}
          onChange={(e) => onChange('myDeckId', e.target.value)}
          onBlur={() => onBlur('myDeckId')}
          aria-invalid={!!error}
          aria-describedby={error ? 'myDeckId-error' : undefined}
        >
          <option value="">選択してください</option>
          {myDecks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.deckName}
            </option>
          ))}
        </select>
      )}
      {error && (
        <p id="myDeckId-error" className="error-message">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * 先攻後攻フィールドコンポーネント
 */
function TurnField({
  value,
  onChange,
}: {
  value: string;
  onChange: (field: 'turn', value: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="label">先攻後攻</div>
      <div className="flex gap-4" role="radiogroup" aria-label="先攻後攻">
        {TURNS.map((turn) => (
          <label key={turn} className="flex items-center">
            <input
              type="radio"
              name="turn"
              value={turn}
              checked={value === turn}
              onChange={(e) => onChange('turn', e.target.value)}
              className="mr-2"
            />
            {turn}
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * 対戦結果フィールドコンポーネント
 */
function ResultField({
  value,
  onChange,
}: {
  value: string;
  onChange: (field: 'result', value: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="label">対戦結果</div>
      <div className="flex gap-4" role="radiogroup" aria-label="対戦結果">
        {BATTLE_RESULTS.map((result) => (
          <label key={result} className="flex items-center">
            <input
              type="radio"
              name="result"
              value={result}
              checked={value === result}
              onChange={(e) => onChange('result', e.target.value)}
              className="mr-2"
            />
            {result}
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * 相手デッキフィールドコンポーネント
 */
function OpponentDeckField({
  value,
  error,
  deckMasters,
  onChange,
  onBlur,
}: {
  value: string;
  error?: string;
  deckMasters: { id: string; deckName: string; usageCount: number }[];
  onChange: (field: 'opponentDeckId', value: string) => void;
  onBlur: (field: 'opponentDeckId') => void;
}) {
  return (
    <div className="mb-4">
      <label htmlFor="opponentDeckId" className="label">
        相手デッキ
      </label>
      {deckMasters.length === 0 ? (
        <p className="error-message">デッキマスターを登録してください</p>
      ) : (
        <select
          id="opponentDeckId"
          className="input-field"
          value={value}
          onChange={(e) => onChange('opponentDeckId', e.target.value)}
          onBlur={() => onBlur('opponentDeckId')}
          aria-invalid={!!error}
          aria-describedby={error ? 'opponentDeckId-error' : undefined}
        >
          <option value="">選択してください</option>
          {deckMasters.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.deckName}
              {deck.usageCount > 0 && ` (${deck.usageCount}回)`}
            </option>
          ))}
        </select>
      )}
      {error && (
        <p id="opponentDeckId-error" className="error-message">
          {error}
        </p>
      )}
    </div>
  );
}
