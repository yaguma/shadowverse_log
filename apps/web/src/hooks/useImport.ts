import { useState } from 'react';
import { apiClient } from '../api/client';
import type { BattleResult, BattleType, Group, Rank, Turn } from '../types';

/**
 * 【型定義】: インポート結果
 * 【目的】: インポート処理の結果を格納する型
 * 🔵 信頼性レベル: import-data-requirements.md L96-L109より
 */
export interface ImportResult {
  /** インポート成功件数 */
  imported: number;

  /** スキップ件数 */
  skipped: number;

  /** 総件数 */
  total: number;
}

/**
 * 【型定義】: useImportフックの戻り値
 * 【目的】: useImportフックが返すデータと関数の型を定義
 * 🔵 信頼性レベル: import-data-requirements.mdより
 */
export interface UseImportReturn {
  /** インポート結果 */
  importResult: ImportResult | null;

  /** エラーメッセージ */
  error: string | null;

  /** ローディング状態 */
  isLoading: boolean;

  /** インポート処理関数 */
  handleImport: (file: File) => Promise<void>;
}

/**
 * 【定数定義】: 必須フィールドのリスト
 * 【目的】: BattleLogの必須フィールドを定義し、バリデーションで使用
 * 🔵 信頼性レベル: import-data-requirements.md L108より
 */
const REQUIRED_FIELDS = [
  'id',
  'date',
  'battleType',
  'rank',
  'group',
  'myDeckId',
  'turn',
  'result',
  'opponentDeckId',
] as const;

/**
 * 【定数定義】: 許可されているEnum値
 * 【目的】: バリデーション時にEnum値の妥当性をチェックするための定数
 * 🔵 信頼性レベル: types/index.tsのEnum定義より
 */
const ALLOWED_BATTLE_TYPES: readonly BattleType[] = ['ランクマッチ', '対戦台', 'ロビー大会'];
const ALLOWED_RANKS: readonly Rank[] = ['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-'];
const ALLOWED_GROUPS: readonly Group[] = [
  'A',
  'AA',
  'AAA',
  'Master',
  'GrandMaster0',
  'GrandMaster1',
  'GrandMaster2',
  'GrandMaster3',
  '-',
];
const ALLOWED_TURNS: readonly Turn[] = ['先攻', '後攻'];
const ALLOWED_BATTLE_RESULTS: readonly BattleResult[] = ['勝ち', '負け'];

/**
 * 【定数定義】: ファイルサイズの最大値（10MB）
 * 【目的】: DoS攻撃防止、メモリ不足エラー防止
 * 🔵 セキュリティ: 大容量ファイルの読み込みを制限
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * 【機能概要】: データインポート用カスタムフック
 * 【実装方針】: JSON/CSVファイルのインポート処理をカスタムフックとして実装
 * 【テスト対応】: TC-IMPORT-001〜TC-IMPORT-014の全10ケースを通すための実装
 * 🔵 信頼性レベル: import-data-requirements.md、import-data-testcases.mdに基づく
 *
 * @returns {UseImportReturn} インポート結果、エラー、ローディング状態、インポート処理関数
 */
export function useImport(): UseImportReturn {
  // 【状態管理】: インポート結果を保持するstate 🔵
  // 【初期値】: null（インポート前は結果がない）
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // 【状態管理】: エラーメッセージを保持するstate 🔵
  // 【初期値】: null（エラーがない状態）
  const [error, setError] = useState<string | null>(null);

  // 【状態管理】: ローディング状態を保持するstate 🔵
  // 【初期値】: false（処理中でない状態）
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 【機能概要】: ファイルをテキストとして読み込む
   * 【実装方針】: FileReaderを使用してファイル内容を文字列として取得
   * 【テスト対応】: TC-IMPORT-001, TC-IMPORT-002を通すための実装
   * 🔵 信頼性レベル: FileReader API標準仕様に基づく
   *
   * @param file - 読み込むFileオブジェクト
   * @returns Promise<string> - ファイルの内容（文字列）
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 【FileReader作成】: ファイル読み込み用のFileReaderインスタンスを作成 🔵
      const reader = new FileReader();

      // 【読み込み成功時】: ファイル内容を文字列として返す 🔵
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('ファイルの読み込みに失敗しました'));
        }
      };

      // 【読み込みエラー時】: エラーメッセージを返す 🔵
      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'));
      };

      // 【ファイル読み込み開始】: テキストとしてファイルを読み込む 🔵
      reader.readAsText(file);
    });
  };

  /**
   * 【機能概要】: CSV文字列をJSONに変換する
   * 【実装方針】: CSVヘッダー行を解析し、データ行をJSONオブジェクト配列に変換
   * 【テスト対応】: TC-IMPORT-002, TC-IMPORT-011を通すための実装
   * 🔵 信頼性レベル: CSV RFC 4180準拠（シンプルな実装）
   *
   * @param csvContent - CSV文字列
   * @returns JSONオブジェクト配列
   * @throws Error - CSVヘッダーが不正な場合
   */
  const parseCSV = (csvContent: string): unknown[] => {
    // 【行分割】: CSV文字列を行ごとに分割 🔵
    const lines = csvContent.trim().split('\n');

    if (lines.length === 0) {
      throw new Error('CSV形式が不正です');
    }

    // 【ヘッダー行取得】: 1行目をヘッダーとして取得 🔵
    const headerLine = lines[0] || '';
    const headers = headerLine.split(',').map((h) => h.trim());

    // 【ヘッダーバリデーション】: 必須ヘッダーがすべて含まれているかチェック 🔵
    // 【テスト対応】: TC-IMPORT-011（CSVヘッダー不正エラー）
    const missingHeaders: string[] = [];
    for (const requiredField of REQUIRED_FIELDS) {
      if (!headers.includes(requiredField)) {
        missingHeaders.push(requiredField);
      }
    }

    if (missingHeaders.length > 0) {
      throw new Error(`CSV形式が不正です。不足しているヘッダー: ${missingHeaders.join(', ')}`);
    }

    // 【データ行解析】: 2行目以降のデータ行をJSONオブジェクトに変換 🔵
    const data: unknown[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = (lines[i] || '').trim();
      if (line === '') continue; // 空行はスキップ

      const values = line.split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      data.push(row);
    }

    return data;
  };

  /**
   * 【機能概要】: 必須フィールドの存在チェック
   * 【実装方針】: すべての必須フィールドが存在し、空でないことを確認
   * 【テスト対応】: TC-IMPORT-012（必須フィールド欠落エラー）
   * 🔵 信頼性レベル: import-data-requirements.md REQ-303より
   *
   * @param row - チェック対象の行データ
   * @param rowNumber - エラーメッセージ用の行番号
   * @throws Error - 必須フィールドが欠けている場合
   */
  const validateRequiredFields = (row: Record<string, unknown>, rowNumber: number): void => {
    for (const field of REQUIRED_FIELDS) {
      if (!row[field] || row[field] === '') {
        throw new Error(`${field}フィールドが必要です（行番号: ${rowNumber}）`);
      }
    }
  };

  /**
   * 【機能概要】: 日付形式の検証
   * 【実装方針】: YYYY/MM/DD形式であることを正規表現で確認
   * 【テスト対応】: TC-IMPORT-006（正常パース）、TC-IMPORT-013（日付形式エラー）
   * 🔵 信頼性レベル: import-data-requirements.md REQ-303より
   *
   * @param dateValue - チェック対象の日付文字列
   * @param rowNumber - エラーメッセージ用の行番号
   * @throws Error - 日付形式が不正な場合
   */
  const validateDateFormat = (dateValue: string, rowNumber: number): void => {
    const datePattern = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!datePattern.test(dateValue)) {
      throw new Error(
        `日付形式が不正です。YYYY/MM/DD形式で入力してください（例: 2025/10/23）（行番号: ${rowNumber}）`
      );
    }
  };

  /**
   * 【機能概要】: Enum値のバリデーション
   * 【実装方針】: 許可されているEnum値のリストに含まれているかチェック
   * 【テスト対応】: TC-IMPORT-007（正常インポート）、TC-IMPORT-014（Enum値エラー）
   * 🔵 信頼性レベル: import-data-requirements.md REQ-303より
   *
   * @param row - チェック対象の行データ
   * @param rowNumber - エラーメッセージ用の行番号
   * @throws Error - Enum値が不正な場合
   */
  const validateEnumValues = (row: Record<string, unknown>, rowNumber: number): void => {
    const battleTypeValue = row.battleType as string;
    if (!ALLOWED_BATTLE_TYPES.includes(battleTypeValue as BattleType)) {
      throw new Error(
        `不正なbattleType値です。許可されている値: ${ALLOWED_BATTLE_TYPES.join(', ')}（行番号: ${rowNumber}）`
      );
    }

    const rankValue = row.rank as string;
    if (!ALLOWED_RANKS.includes(rankValue as Rank)) {
      throw new Error(
        `不正なrank値です。許可されている値: ${ALLOWED_RANKS.join(', ')}（行番号: ${rowNumber}）`
      );
    }

    const groupValue = row.group as string;
    if (!ALLOWED_GROUPS.includes(groupValue as Group)) {
      throw new Error(
        `不正なgroup値です。許可されている値: ${ALLOWED_GROUPS.join(', ')}（行番号: ${rowNumber}）`
      );
    }

    const turnValue = row.turn as string;
    if (!ALLOWED_TURNS.includes(turnValue as Turn)) {
      throw new Error(
        `不正なturn値です。許可されている値: ${ALLOWED_TURNS.join(', ')}（行番号: ${rowNumber}）`
      );
    }

    const resultValue = row.result as string;
    if (!ALLOWED_BATTLE_RESULTS.includes(resultValue as BattleResult)) {
      throw new Error(
        `不正なresult値です。許可されている値: ${ALLOWED_BATTLE_RESULTS.join(', ')}（行番号: ${rowNumber}）`
      );
    }
  };

  /**
   * 【機能概要】: データ全体のバリデーションを実行
   * 【実装方針】: 各行に対して、必須フィールド、日付形式、Enum値の検証を順次実行
   * 【テスト対応】: TC-IMPORT-006, TC-IMPORT-007, TC-IMPORT-012, TC-IMPORT-013, TC-IMPORT-014
   * 🔵 信頼性レベル: import-data-requirements.md REQ-303より
   *
   * @param data - バリデーション対象のデータ配列
   * @throws Error - バリデーションエラー時
   */
  const validateData = (data: unknown[]): void => {
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      const rowNumber = i + 1;

      validateRequiredFields(row, rowNumber);
      validateDateFormat(row.date as string, rowNumber);
      validateEnumValues(row, rowNumber);
    }
  };

  /**
   * 【機能概要】: インポート処理のメイン関数
   * 【実装方針】: ファイルを読み込み、パース、バリデーション、API送信を順番に実行
   * 【テスト対応】: TC-IMPORT-001〜TC-IMPORT-014の全10ケースを通すための実装
   * 🔵 信頼性レベル: import-data-requirements.md、import-data-testcases.mdに基づく
   *
   * @param file - インポートするFileオブジェクト
   */
  const handleImport = async (file: File): Promise<void> => {
    try {
      // 【ローディング開始】: ローディング状態をtrueに設定 🔵
      setIsLoading(true);

      // 【エラークリア】: 前回のエラーをクリア 🔵
      setError(null);

      // 【結果クリア】: 前回の結果をクリア 🔵
      setImportResult(null);

      // 【ファイルサイズチェック】: DoS攻撃防止、メモリ不足エラー防止 🔵
      // 【セキュリティ】: 10MB以上のファイルは拒否
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `ファイルサイズが大きすぎます。最大${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MBまでです。`
        );
      }

      // 【ファイル読み込み】: FileReaderでファイル内容を読み込む 🔵
      // 【テスト対応】: TC-IMPORT-001, TC-IMPORT-002
      const fileContent = await readFileAsText(file);

      let parsedData: unknown[];

      // 【ファイル形式判定】: 拡張子またはMIMEタイプでJSON/CSVを判定 🔵
      const isJSON = file.name.endsWith('.json') || file.type === 'application/json';
      const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv';

      if (isJSON) {
        // 【JSONパース】: JSON.parse()でパース 🔵
        // 【テスト対応】: TC-IMPORT-001, TC-IMPORT-010（JSON形式エラー）
        try {
          parsedData = JSON.parse(fileContent);
        } catch (_jsonError) {
          throw new Error('JSON形式が不正です');
        }

        // 【配列チェック】: パース結果が配列であることを確認 🔵
        if (!Array.isArray(parsedData)) {
          throw new Error('JSON形式が不正です');
        }
      } else if (isCSV) {
        // 【CSVパース】: parseCSV関数でパース 🔵
        // 【テスト対応】: TC-IMPORT-002, TC-IMPORT-011（CSVヘッダー不正エラー）
        parsedData = parseCSV(fileContent);
      } else {
        throw new Error('対応していないファイル形式です');
      }

      // 【バリデーション実行】: データの妥当性をチェック 🔵
      // 【テスト対応】: TC-IMPORT-006, TC-IMPORT-007, TC-IMPORT-012, TC-IMPORT-013, TC-IMPORT-014
      validateData(parsedData);

      // 【API送信】: POST /api/importにデータを送信 🔵
      // 【テスト対応】: TC-IMPORT-001〜TC-IMPORT-007（正常系）
      const result = await apiClient.post<ImportResult>('/import', {
        data: parsedData,
        format: isJSON ? 'json' : 'csv',
      });

      // 【結果設定】: インポート結果をstateに設定 🔵
      setImportResult(result);
    } catch (err) {
      // 【エラーハンドリング】: すべてのエラーを捕捉し、エラーメッセージを設定 🔵
      // 【テスト対応】: TC-IMPORT-010〜TC-IMPORT-014（異常系）
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);

      // 【結果クリア】: エラー時は結果をnullに設定 🔵
      setImportResult(null);
    } finally {
      // 【ローディング終了】: ローディング状態をfalseに設定 🔵
      setIsLoading(false);
    }
  };

  // 【戻り値】: state変数とhandleImport関数を返す 🔵
  return {
    importResult,
    error,
    isLoading,
    handleImport,
  };
}
