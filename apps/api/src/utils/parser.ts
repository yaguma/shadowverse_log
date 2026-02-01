/**
 * JSON/CSVパーサー
 * TASK-0031: インポートAPI実装
 *
 * @description JSON/CSV文字列をパースしてBattleLog配列に変換
 */
import type { ImportBattleLogInput } from '../types/import';

/**
 * エラーメッセージ定数
 */
const ERROR_MESSAGES = {
  INVALID_JSON: 'JSON形式が不正です',
  NOT_ARRAY: 'JSONデータは配列である必要があります',
  EMPTY_CSV: 'CSVデータが空です',
  MISSING_HEADERS: '必須ヘッダーが不足しています',
} as const;

/**
 * 必須CSVヘッダー定数
 */
const REQUIRED_CSV_HEADERS = [
  'date',
  'battleType',
  'rank',
  'groupName',
  'myDeckId',
  'turn',
  'result',
  'opponentDeckId',
] as const;

/**
 * フィールド名のマッピング（後方互換性のため）
 * - group → groupName
 */
function normalizeFieldNames(
  item: Record<string, unknown>
): Record<string, unknown> {
  const normalized = { ...item };

  // group → groupName のマッピング
  if ('group' in normalized && !('groupName' in normalized)) {
    normalized.groupName = normalized.group;
    delete normalized.group;
  }

  // season を文字列から数値に変換
  if (typeof normalized.season === 'string' && normalized.season !== '') {
    const seasonNum = Number.parseInt(normalized.season, 10);
    if (!Number.isNaN(seasonNum)) {
      normalized.season = seasonNum;
    }
  }

  return normalized;
}

/**
 * JSON文字列をパース
 *
 * @param data - JSON文字列
 * @returns パースされたBattleLog配列
 * @throws Error - JSON形式不正、配列でない場合
 */
export function parseJSON(data: string): ImportBattleLogInput[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(data);
  } catch {
    throw new Error(ERROR_MESSAGES.INVALID_JSON);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(ERROR_MESSAGES.NOT_ARRAY);
  }

  // フィールド名を正規化
  return parsed.map((item) =>
    normalizeFieldNames(item as Record<string, unknown>)
  ) as ImportBattleLogInput[];
}

/**
 * CSVヘッダーを正規化（後方互換性のため）
 * - group → groupName
 */
function normalizeHeader(header: string): string {
  if (header === 'group') {
    return 'groupName';
  }
  return header;
}

/**
 * CSV文字列をパース
 *
 * @param data - CSV文字列
 * @returns パースされたBattleLog配列
 * @throws Error - 空データ、ヘッダー不足
 */
export function parseCSV(data: string): ImportBattleLogInput[] {
  const trimmedData = data.trim();

  // 空データチェック
  if (!trimmedData) {
    throw new Error(ERROR_MESSAGES.EMPTY_CSV);
  }

  const lines = trimmedData.split('\n');

  // ヘッダー行を解析
  const headerLine = lines[0];
  if (!headerLine) {
    throw new Error(ERROR_MESSAGES.EMPTY_CSV);
  }

  // ヘッダーを正規化（group → groupName）
  const headers = headerLine.split(',').map((h) => normalizeHeader(h.trim()));

  // 必須ヘッダーチェック
  const missingHeaders = REQUIRED_CSV_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`${ERROR_MESSAGES.MISSING_HEADERS}: ${missingHeaders.join(', ')}`);
  }

  // データ行を解析
  const battleLogs: ImportBattleLogInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    if (!currentLine) continue;
    const line = currentLine.trim();
    if (!line) continue; // 空行スキップ

    const values = line.split(',').map((v) => v.trim());

    // カラム数チェック
    if (values.length !== headers.length) {
      // カラム数不一致はスキップ
      continue;
    }

    // オブジェクトに変換
    const log: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      log[header] = values[index] || '';
    });

    // フィールド名を正規化（season の数値変換など）
    battleLogs.push(
      normalizeFieldNames(log) as unknown as ImportBattleLogInput
    );
  }

  return battleLogs;
}
