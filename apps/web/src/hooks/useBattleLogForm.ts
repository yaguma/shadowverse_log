/**
 * 【機能概要】: BattleLogFormのロジックを管理するカスタムフック
 * 【実装方針】: フォーム状態、バリデーション、API呼び出しを一元管理
 * 【リファクタリング】: Issue 004対応 - BattleLogFormからロジックを分離
 * 🔵 信頼性レベル: 要件定義書（REQ-001, REQ-002, REQ-003, REQ-030, REQ-031）に基づく
 */

import { useCallback, useEffect, useState } from 'react';
import { useBattleLogStore } from '../store/battleLogStore';
import { useDeckStore } from '../store/deckStore';
import type { CreateBattleLogRequest } from '../types';
import { getTodayInJST } from '../utils/date';
import { logger } from '../utils/logger';

/**
 * 【型定義】: バリデーションエラー状態の型
 * 🔵 信頼性レベル: REQ-031（インラインエラーメッセージ）に基づく
 */
export interface ValidationErrors {
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
 * 【型定義】: カスタムフックのプロップス
 */
interface UseBattleLogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 【型定義】: カスタムフックの戻り値
 */
export interface UseBattleLogFormReturn {
  // フォームデータ
  formData: CreateBattleLogRequest;
  validationErrors: ValidationErrors;

  // ローディング・エラー状態
  isLoading: boolean;
  isDeckLoading: boolean;
  isMyDecksLoading: boolean;
  isLoadingDeckMasters: boolean;
  error: string | null;
  deckError: string | null;
  myDecksError: string | null;
  deckMasterError: string | null;

  // データ
  myDecks: ReturnType<typeof useDeckStore>['myDecks'];
  deckMastersWithUsage: ReturnType<typeof useDeckStore>['deckMastersWithUsage'];

  // 送信ボタン無効化判定
  isSubmitDisabled: boolean;

  // ハンドラ
  handleChange: (field: keyof CreateBattleLogRequest, value: string | number | undefined) => void;
  handleBlur: (field: keyof CreateBattleLogRequest) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * 【機能概要】: BattleLogFormのロジックを管理するカスタムフック
 * 【実装方針】: フォーム状態、バリデーション、API呼び出しを一元管理
 * 🔵 信頼性レベル: 要件定義書に基づく
 */
export function useBattleLogForm({
  onSuccess,
  onCancel,
}: UseBattleLogFormProps): UseBattleLogFormReturn {
  // 【Zustand Store取得】: useBattleLogStoreからストアの状態とアクションを取得 🔵
  const { previousInput, lastSeason, isLoading, error, createBattleLog, setLastSeason } =
    useBattleLogStore();

  // 【Zustand Store取得】: useDeckStoreからデッキマスター一覧とマイデッキ一覧を取得 🔵
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
    date: getTodayInJST(),
    battleType: '' as BattleType,
    rank: '' as Rank,
    groupName: '' as Group,
    myDeckId: '',
    turn: '' as Turn,
    result: '' as BattleResult,
    opponentDeckId: '',
    season: undefined,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  /**
   * 【初期化処理】: previousInputから前回入力値を引き継ぐ（日付以外）
   * 🔵 信頼性レベル: 要件定義書 REQ-003 に基づく
   */
  useEffect(() => {
    if (previousInput) {
      setFormData((prev) => ({
        ...prev,
        date: getTodayInJST(),
        battleType: previousInput.battleType || ('' as BattleType),
        rank: previousInput.rank || ('' as Rank),
        groupName: previousInput.groupName || ('' as Group),
        myDeckId: previousInput.myDeckId || '',
        turn: previousInput.turn || ('' as Turn),
        result: previousInput.result || ('' as BattleResult),
        opponentDeckId: previousInput.opponentDeckId || '',
        season: previousInput.season ?? lastSeason ?? undefined,
      }));
    } else if (lastSeason) {
      setFormData((prev) => ({
        ...prev,
        season: lastSeason,
      }));
    }
  }, [previousInput, lastSeason]);

  /**
   * 【マイデッキ一覧取得】: 初期化時にマイデッキ一覧をAPIから取得
   */
  useEffect(() => {
    fetchMyDecks();
  }, [fetchMyDecks]);

  /**
   * 【デッキマスター一覧取得】: 初期化時にデッキマスター一覧（使用履歴付き）をAPIから取得
   */
  useEffect(() => {
    fetchDeckMastersWithUsage(true);
  }, [fetchDeckMastersWithUsage]);

  /**
   * 【日付バリデーション】: 未来日付を禁止するバリデーション
   * 🔵 信頼性レベル: 要件定義書 REQ-030 に基づく
   */
  const validateDate = useCallback((date: string): string | undefined => {
    if (!date) {
      return undefined;
    }
    const today = getTodayInJST();
    if (date > today) {
      return '未来の日付は入力できません';
    }
    return undefined;
  }, []);

  /**
   * 【必須項目バリデーション】: 必須項目の未入力チェック
   * 🔵 信頼性レベル: 要件定義書 REQ-002 に基づく
   */
  const validateRequired = useCallback((value: string, fieldName: string): string | undefined => {
    if (!value || value === '') {
      return `${fieldName}は必須です`;
    }
    return undefined;
  }, []);

  /**
   * 【フォームバリデーション】: 全フィールドのバリデーションを実行
   */
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    const dateError = validateDate(formData.date || '');
    if (dateError) {
      errors.date = dateError;
    }

    const myDeckError = validateRequired(formData.myDeckId, '使用デッキ');
    if (myDeckError) {
      errors.myDeckId = myDeckError;
    }

    const opponentDeckError = validateRequired(formData.opponentDeckId, '相手デッキ');
    if (opponentDeckError) {
      errors.opponentDeckId = opponentDeckError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateDate, validateRequired]);

  /**
   * 【入力ハンドラ】: フィールドの変更を処理
   */
  const handleChange = useCallback(
    (field: keyof CreateBattleLogRequest, value: string | number | undefined) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (field === 'date' && typeof value === 'string') {
        const dateError = validateDate(value);
        setValidationErrors((prev) => ({
          ...prev,
          date: dateError,
        }));
      }

      if (field === 'season' && typeof value === 'number') {
        setLastSeason(value);
      }
    },
    [validateDate, setLastSeason]
  );

  /**
   * 【Blurハンドラ】: フィールドからフォーカスが外れた時のバリデーション
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
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const isValid = validateForm();
      if (!isValid) {
        return;
      }

      try {
        await createBattleLog(formData);

        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        logger.error('Failed to create battle log:', err);
      }
    },
    [formData, validateForm, createBattleLog, onSuccess]
  );

  /**
   * 【キャンセルハンドラ】: フォームをキャンセル
   */
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  /**
   * 【キーボードイベントハンドラ】: Enterキー / Escキーの処理
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
   * 【送信ボタン無効化判定】
   */
  const isSubmitDisabled =
    isLoading ||
    isDeckLoading ||
    isMyDecksLoading ||
    isLoadingDeckMasters ||
    myDecks.length === 0 ||
    deckMastersWithUsage.length === 0 ||
    (Object.keys(validationErrors).length > 0 &&
      Object.values(validationErrors).some((err) => err !== undefined));

  return {
    formData,
    validationErrors,
    isLoading,
    isDeckLoading,
    isMyDecksLoading,
    isLoadingDeckMasters,
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
  };
}
