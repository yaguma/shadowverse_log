'use client';

/**
 * 【機能概要】: Battle Log登録フォームコンポーネント
 * 【実装方針】: React 19 + TypeScript + Zustand + Tailwind CSSを使用した最小限の実装
 * 【テスト対応】: TC-FORM-001〜TC-FORM-EDGE-002の全28ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書（REQ-001, REQ-002, REQ-003, REQ-030, REQ-031, REQ-603）に基づく
 */

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { logger } from '../../utils/logger';
import { useBattleLogStore } from '../../store/battleLogStore';
import { useDeckStore } from '../../store/deckStore';
import type {
  BattleResult,
  BattleType,
  CreateBattleLogRequest,
  Group,
  Rank,
  Turn,
} from '../../types';
import { getTodayInJST } from '../../utils/date';

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
 * 【型定義】: バリデーションエラー状態の型
 * 🔵 信頼性レベル: REQ-031（インラインエラーメッセージ）に基づく
 */
interface ValidationErrors {
  date?: string;
  battleType?: string;
  rank?: string;
  groupName?: string;
  myDeckId?: string;
  turn?: string;
  result?: string;
  opponentDeckId?: string;
}

/**
 * 【定数定義】: 選択肢の定義
 * 【改善内容】: readonly化により型推論を改善し、不要な配列生成を防止
 * 【パフォーマンス】: 各レンダリングでの配列生成を防ぎ、メモリ効率を向上
 * 🔵 信頼性レベル: types/index.ts の定数定義に基づく
 * 🟡 改善: readonly化によるパフォーマンス最適化
 */
const BATTLE_TYPES_OPTIONS: readonly BattleType[] = [
  'ランクマッチ',
  '対戦台',
  'ロビー大会',
] as const;
const RANKS_OPTIONS: readonly Rank[] = [
  'サファイア',
  'ダイアモンド',
  'ルビー',
  'トパーズ',
  '-',
] as const;
const GROUPS_OPTIONS: readonly Group[] = [
  'A',
  'AA',
  'AAA',
  'Master',
  'GrandMaster0',
  'GrandMaster1',
  'GrandMaster2',
  'GrandMaster3',
  '-',
] as const;
const TURNS_OPTIONS: readonly Turn[] = ['先攻', '後攻'] as const;
const BATTLE_RESULTS_OPTIONS: readonly BattleResult[] = ['勝ち', '負け'] as const;

/**
 * 【機能概要】: Battle Log登録フォームコンポーネント
 * 【実装方針】: 最小限の実装でテストを通す
 * 【テスト対応】: TC-FORM-001〜TC-FORM-EDGE-002の全28ケースを通すための実装
 * 🔵 信頼性レベル: 要件定義書のBattleLogForm仕様に準拠
 */
export const BattleLogForm: React.FC<BattleLogFormProps> = ({ onSuccess, onCancel }) => {
  // 【Zustand Store取得】: useBattleLogStoreからストアの状態とアクションを取得 🔵
  const { previousInput, lastSeason, isLoading, error, createBattleLog, setLastSeason } =
    useBattleLogStore();

  // 【Zustand Store取得】: useDeckStoreからデッキマスター一覧とマイデッキ一覧を取得 🔵
  // 🔵 TASK-0049: API連携のため、デッキマスター一覧をStoreから取得
  // 🔵 TASK-0032: 相手デッキ選択肢を最近使用順でソートするため、deckMastersWithUsageを使用
  const {
    deckMastersWithUsage,
    myDecks,
    isLoading: isDeckLoading,
    isMyDecksLoading,
    isLoadingDeckMasters,
    error: deckError,
    myDecksError,
    deckMasterError,
    fetchDeckMastersWithUsage,
    fetchMyDecks,
  } = useDeckStore();

  // 【ローカル状態管理】: フォームデータとバリデーションエラーを管理 🔵
  const [formData, setFormData] = useState<CreateBattleLogRequest>({
    date: getTodayInJST(), // 今日の日付（日本時間、YYYY-MM-DD形式） 🔵
    battleType: '' as BattleType,
    rank: '' as Rank,
    groupName: '' as Group,
    myDeckId: '',
    turn: '' as Turn,
    result: '' as BattleResult,
    opponentDeckId: '',
    season: undefined, // シーズン番号（任意）
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  /**
   * 【初期化処理】: previousInputから前回入力値を引き継ぐ（日付以外）
   * 【実装方針】: REQ-003に基づき、日付以外の7フィールドに前回値を設定
   * 【テスト対応】: TC-FORM-002, TC-FORM-EDGE-001, TC-FORM-EDGE-002を通すための実装
   * 🔵 信頼性レベル: 要件定義書 REQ-003 に基づく
   */
  useEffect(() => {
    // 【前回値引き継ぎ】: previousInputが存在する場合、日付以外のフィールドに前回値を設定 🔵
    if (previousInput) {
      setFormData((prev) => ({
        ...prev,
        date: getTodayInJST(), // 日付は常に今日（日本時間、前回値を引き継がない） 🔵
        battleType: previousInput.battleType || ('' as BattleType),
        rank: previousInput.rank || ('' as Rank),
        groupName: previousInput.groupName || ('' as Group),
        myDeckId: previousInput.myDeckId || '',
        turn: previousInput.turn || ('' as Turn),
        result: previousInput.result || ('' as BattleResult),
        opponentDeckId: previousInput.opponentDeckId || '',
        season: previousInput.season ?? lastSeason ?? undefined, // シーズンは前回値を引き継ぐ
      }));
    } else if (lastSeason) {
      // previousInputがなくてもlastSeasonがあれば設定
      setFormData((prev) => ({
        ...prev,
        season: lastSeason,
      }));
    }
  }, [previousInput, lastSeason]);

  /**
   * 【マイデッキ一覧取得】: 初期化時にマイデッキ一覧をAPIから取得
   * 【実装方針】: TC-FORM-INT-001を通すための実装
   * 【テスト対応】: TC-FORM-INT-001, TC-FORM-BND-004を通すための実装
   * 🔵 信頼性レベル: API連携の本実装
   */
  useEffect(() => {
    // 【API呼び出し】: useDeckStoreのfetchMyDecksを呼び出してマイデッキ一覧を取得 🔵
    fetchMyDecks();
  }, [fetchMyDecks]);

  /**
   * 【デッキマスター一覧取得】: 初期化時にデッキマスター一覧（使用履歴付き）をAPIから取得
   * 【実装方針】: TC-FORM-INT-002, TC-0049-001, TC-0049-002を通すための実装
   * 【テスト対応】: TC-FORM-INT-002, TC-FORM-BND-005, TASK-0049テストケース、TASK-0032テストケースを通すための実装
   * 🔵 信頼性レベル: TASK-0049 REQ-0049-001、TASK-0032 REQ-EXT-302に基づく
   */
  useEffect(() => {
    // 【API呼び出し】: useDeckStoreのfetchDeckMastersWithUsageを呼び出して使用履歴付きデッキマスター一覧を取得 🔵
    // 🔵 TASK-0032: 相手デッキ選択肢を最近使用順でソートするため、includeUsage=trueで取得
    fetchDeckMastersWithUsage(true);
  }, [fetchDeckMastersWithUsage]);

  /**
   * 【日付バリデーション】: 未来日付を禁止するバリデーション
   * 【実装方針】: REQ-030に基づき、未来日付をエラーとする
   * 【テスト対応】: TC-FORM-ERR-001, TC-FORM-BND-001, TC-FORM-BND-002を通すための実装
   * 🔵 信頼性レベル: 要件定義書 REQ-030 に基づく
   */
  const validateDate = useCallback((date: string): string | undefined => {
    if (!date) {
      return undefined; // 日付は省略可能 🔵
    }

    // 【日付比較】: YYYY-MM-DD形式の文字列で比較（日本時間） 🔵
    const today = getTodayInJST();

    if (date > today) {
      return '未来の日付は入力できません'; // 🔵 REQ-030
    }

    return undefined;
  }, []);

  /**
   * 【必須項目バリデーション】: 必須項目の未入力チェック
   * 【実装方針】: REQ-002に基づき、必須項目をチェック
   * 【テスト対応】: TC-FORM-ERR-002, TC-FORM-ERR-003を通すための実装
   * 🔵 信頼性レベル: 要件定義書 REQ-002 に基づく
   */
  const validateRequired = useCallback((value: string, fieldName: string): string | undefined => {
    if (!value || value === '') {
      return `${fieldName}は必須です`; // 🔵 REQ-002
    }
    return undefined;
  }, []);

  /**
   * 【フォームバリデーション】: 全フィールドのバリデーションを実行
   * 【実装方針】: すべてのフィールドをバリデーションし、エラーを収集
   * 【テスト対応】: TC-FORM-ERR-001〜TC-FORM-ERR-003を通すための実装
   * 🔵 信頼性レベル: 要件定義書 REQ-002, REQ-030 に基づく
   */
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // 【日付バリデーション】: 未来日付チェック 🔵
    const dateError = validateDate(formData.date || '');
    if (dateError) {
      errors.date = dateError;
    }

    // 【必須項目バリデーション】: すべての必須項目をチェック 🔵
    const myDeckError = validateRequired(formData.myDeckId, '使用デッキ');
    if (myDeckError) {
      errors.myDeckId = myDeckError;
    }

    const opponentDeckError = validateRequired(formData.opponentDeckId, '相手デッキ');
    if (opponentDeckError) {
      errors.opponentDeckId = opponentDeckError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // エラーがない場合はtrue 🔵
  }, [formData, validateDate, validateRequired]);

  /**
   * 【入力ハンドラ】: フィールドの変更を処理
   * 【実装方針】: onChange イベントでフォームデータを更新
   * 【テスト対応】: TC-FORM-003を通すための実装
   * 🔵 信頼性レベル: Reactの基本的な動作パターンに基づく
   */
  const handleChange = useCallback(
    (field: keyof CreateBattleLogRequest, value: string | number | undefined) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // 【リアルタイムバリデーション】: 日付フィールドのみリアルタイムでバリデーション 🔵
      if (field === 'date' && typeof value === 'string') {
        const dateError = validateDate(value);
        setValidationErrors((prev) => ({
          ...prev,
          date: dateError,
        }));
      }

      // 【シーズン変更時】: lastSeasonを更新 🔵
      if (field === 'season' && typeof value === 'number') {
        setLastSeason(value);
      }
    },
    [validateDate, setLastSeason]
  );

  /**
   * 【Blurハンドラ】: フィールドからフォーカスが外れた時のバリデーション
   * 【実装方針】: onBlur イベントでバリデーションを実行
   * 【テスト対応】: TC-FORM-ERR-001, TC-FORM-ERR-002, TC-FORM-ERR-003を通すための実装
   * 🔵 信頼性レベル: 要件定義書 REQ-031（リアルタイムバリデーション）に基づく
   */
  const handleBlur = useCallback(
    (field: keyof CreateBattleLogRequest) => {
      if (field === 'date') {
        const dateError = validateDate(formData.date || '');
        setValidationErrors((prev) => ({
          ...prev,
          date: dateError,
        }));
      } else if (field === 'myDeckId') {
        const myDeckError = validateRequired(formData.myDeckId, '使用デッキ');
        setValidationErrors((prev) => ({
          ...prev,
          myDeckId: myDeckError,
        }));
      } else if (field === 'opponentDeckId') {
        const opponentDeckError = validateRequired(formData.opponentDeckId, '相手デッキ');
        setValidationErrors((prev) => ({
          ...prev,
          opponentDeckId: opponentDeckError,
        }));
      }
    },
    [formData, validateDate, validateRequired]
  );

  /**
   * 【フォーム送信ハンドラ】: フォームを送信
   * 【実装方針】: createBattleLog()を呼び出し、成功時にonSuccessコールバックを実行
   * 【テスト対応】: TC-FORM-004, TC-FORM-UI-002を通すための実装
   * 🔵 信頼性レベル: 要件定義書 REQ-001、データフロー図に基づく
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 【バリデーション実行】: フォーム送信前にバリデーションを実行 🔵
      const isValid = validateForm();
      if (!isValid) {
        return; // バリデーションエラーがある場合は送信しない 🔵
      }

      try {
        // 【API呼び出し】: createBattleLog()を呼び出して対戦履歴を登録 🔵
        await createBattleLog(formData);

        // 【成功時処理】: onSuccessコールバックを実行 🔵
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        // 【エラー処理】: エラーはZustand Storeで管理されているため、ここでは何もしない 🔵
        logger.error('Failed to create battle log:', error);
      }
    },
    [formData, validateForm, createBattleLog, onSuccess]
  );

  /**
   * 【キャンセルハンドラ】: フォームをキャンセル
   * 【実装方針】: onCancelコールバックを実行
   * 【テスト対応】: TC-FORM-005を通すための実装
   * 🟡 信頼性レベル: 一般的なフォームUIパターンから推測
   */
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  /**
   * 【キーボードイベントハンドラ】: Enterキー / Escキーの処理
   * 【実装方針】: Enterキーでフォーム送信、Escキーでキャンセル
   * 【テスト対応】: TC-FORM-A11Y-004, TC-FORM-A11Y-005を通すための実装
   * 🟡 信頼性レベル: 一般的なフォームUXから推測
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit(e as unknown as React.FormEvent);
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSubmit, handleCancel]
  );

  /**
   * 【送信ボタン無効化判定】: マイデッキまたはデッキマスターが0件、またはローディング中、またはバリデーションエラーがある場合は無効化
   * 【実装方針】: TC-FORM-BND-004, TC-FORM-BND-005, TC-FORM-UI-001, TC-0049-004, TC-0032-004を通すための実装
   * 【改善】: バリデーションエラーがある場合のみ無効化（必須フィールドの入力状態は validateForm で確認）
   * 🔵 信頼性レベル: TASK-0049 REQ-0049-003、TASK-0032 REQ-0032-004に基づく
   */
  const isSubmitDisabled =
    isLoading ||
    isDeckLoading || // 🔵 TASK-0049: デッキマスター取得中も無効化
    isMyDecksLoading || // 🔵 マイデッキ取得中も無効化
    isLoadingDeckMasters || // 🔵 TASK-0032: 使用履歴付きデッキマスター取得中も無効化
    myDecks.length === 0 ||
    deckMastersWithUsage.length === 0 || // 🔵 TASK-0032: deckMastersWithUsageを使用
    (Object.keys(validationErrors).length > 0 &&
      Object.values(validationErrors).some((error) => error !== undefined));

  /**
   * 【レンダリング】: フォームUIの描画
   * 【改善内容】: global.innerWidthを削除し、Tailwind CSSレスポンシブクラスに統一
   * 【パフォーマンス】: 各レンダリングでのwindow.innerWidth計算を削減、SSR対応
   * 🟡 改善: Tailwind CSSベストプラクティスへの準拠
   */
  return (
    <form
      className="p-6 bg-white rounded-lg shadow-md w-full max-w-2xl mx-auto"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      {/* 【フォームタイトル】: フォームのタイトルを表示 🔵 */}
      <h2 className="text-2xl font-bold mb-4">対戦履歴登録</h2>

      {/* 【グローバルエラーメッセージ】: API エラーメッセージを表示 🔵 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 【デッキエラーメッセージ】: デッキマスター取得エラーを表示 🔵 TASK-0049 */}
      {deckError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {deckError}
        </div>
      )}

      {/* 【マイデッキエラーメッセージ】: マイデッキ取得エラーを表示 🔵 */}
      {myDecksError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {myDecksError}
        </div>
      )}

      {/* 【デッキマスターエラーメッセージ】: デッキマスター取得エラーを表示 🔵 TASK-0032 */}
      {deckMasterError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {deckMasterError}
        </div>
      )}

      {/* 🔵 TASK-0031: シーズンと対戦日を横並びレイアウト（モバイルは縦並び） */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 【シーズンフィールド】: シーズン番号入力 🔵 */}
        <div>
          <label htmlFor="season" className="label">
            シーズン
          </label>
          <input
            id="season"
            type="number"
            min="1"
            className="input-field"
            value={formData.season ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              handleChange('season', value === '' ? undefined : Number(value));
            }}
            placeholder="例: 1"
          />
        </div>

        {/* 【日付フィールド】: 対戦日入力 🔵 */}
        <div>
          <label htmlFor="date" className="label">
            対戦日
          </label>
          <input
            id="date"
            type="date"
            className="input-field"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            onBlur={() => handleBlur('date')}
            aria-invalid={!!validationErrors.date}
            aria-describedby={validationErrors.date ? 'date-error' : undefined}
          />
          {validationErrors.date && (
            <p id="date-error" className="error-message">
              {validationErrors.date}
            </p>
          )}
        </div>
      </div>

      {/* 🔵 TASK-0031: 詳細設定（対戦タイプ、ランク、グループ）を折りたたみ可能に */}
      <details className="mb-4 border border-gray-200 rounded-md">
        <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
          詳細設定（対戦タイプ・ランク・グループ）
        </summary>
        <div className="px-4 py-3 space-y-4 border-t border-gray-200">
          {/* 【対戦タイプフィールド】: 対戦タイプ選択 🔵 */}
          <div>
            <label htmlFor="battleType" className="label">
              対戦タイプ
            </label>
            <select
              id="battleType"
              className="input-field"
              value={formData.battleType}
              onChange={(e) => handleChange('battleType', e.target.value)}
            >
              <option value="">選択してください</option>
              {BATTLE_TYPES_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 🔵 TASK-0031: ランクとグループを横並びレイアウト */}
          <div className="grid grid-cols-2 gap-4">
            {/* 【ランクフィールド】: ランク選択 🔵 */}
            <div>
              <label htmlFor="rank" className="label">
                ランク
              </label>
              <select
                id="rank"
                className="input-field"
                value={formData.rank}
                onChange={(e) => handleChange('rank', e.target.value)}
              >
                <option value="">選択してください</option>
                {RANKS_OPTIONS.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>

            {/* 【グループフィールド】: グループ選択 🔵 */}
            <div>
              <label htmlFor="groupName" className="label">
                グループ
              </label>
              <select
                id="groupName"
                className="input-field"
                value={formData.groupName}
                onChange={(e) => handleChange('groupName', e.target.value)}
              >
                <option value="">選択してください</option>
                {GROUPS_OPTIONS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </details>

      {/* 【マイデッキフィールド】: 使用デッキ選択 🔵 */}
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
            value={formData.myDeckId}
            onChange={(e) => handleChange('myDeckId', e.target.value)}
            onBlur={() => handleBlur('myDeckId')}
            aria-invalid={!!validationErrors.myDeckId}
            aria-describedby={validationErrors.myDeckId ? 'myDeckId-error' : undefined}
          >
            <option value="">選択してください</option>
            {myDecks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.deckName}
              </option>
            ))}
          </select>
        )}
        {validationErrors.myDeckId && (
          <p id="myDeckId-error" className="error-message">
            {validationErrors.myDeckId}
          </p>
        )}
      </div>

      {/* 【ターンフィールド】: 先攻後攻選択 🔵 */}
      <div className="mb-4">
        <div className="label">先攻後攻</div>
        <div className="flex gap-4" role="radiogroup" aria-label="先攻後攻">
          {TURNS_OPTIONS.map((turn) => (
            <label key={turn} className="flex items-center">
              <input
                type="radio"
                name="turn"
                value={turn}
                checked={formData.turn === turn}
                onChange={(e) => handleChange('turn', e.target.value)}
                className="mr-2"
              />
              {turn}
            </label>
          ))}
        </div>
      </div>

      {/* 【対戦結果フィールド】: 勝ち負け選択 🔵 */}
      <div className="mb-4">
        <div className="label">対戦結果</div>
        <div className="flex gap-4" role="radiogroup" aria-label="対戦結果">
          {BATTLE_RESULTS_OPTIONS.map((result) => (
            <label key={result} className="flex items-center">
              <input
                type="radio"
                name="result"
                value={result}
                checked={formData.result === result}
                onChange={(e) => handleChange('result', e.target.value)}
                className="mr-2"
              />
              {result}
            </label>
          ))}
        </div>
      </div>

      {/* 【相手デッキフィールド】: 相手デッキ選択（最近使用順でソート）🔵 TASK-0032 */}
      <div className="mb-4">
        <label htmlFor="opponentDeckId" className="label">
          相手デッキ
        </label>
        {deckMastersWithUsage.length === 0 ? (
          <p className="error-message">デッキマスターを登録してください</p>
        ) : (
          <select
            id="opponentDeckId"
            className="input-field"
            value={formData.opponentDeckId}
            onChange={(e) => handleChange('opponentDeckId', e.target.value)}
            onBlur={() => handleBlur('opponentDeckId')}
            aria-invalid={!!validationErrors.opponentDeckId}
            aria-describedby={validationErrors.opponentDeckId ? 'opponentDeckId-error' : undefined}
          >
            <option value="">選択してください</option>
            {deckMastersWithUsage.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.deckName}
                {deck.usageCount > 0 && ` (${deck.usageCount}回)`}
              </option>
            ))}
          </select>
        )}
        {validationErrors.opponentDeckId && (
          <p id="opponentDeckId-error" className="error-message">
            {validationErrors.opponentDeckId}
          </p>
        )}
      </div>

      {/* 【ローディングスピナー】: ローディング中に表示 🔵 */}
      {isLoading && (
        <output className="mb-4 text-center block">
          <span className="text-gray-600">送信中...</span>
        </output>
      )}

      {/* 【フォームアクション】: キャンセル・登録ボタン 🔵 */}
      <div className="flex gap-4 justify-end">
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
