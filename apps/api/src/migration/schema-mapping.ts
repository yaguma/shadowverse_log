/**
 * TASK-0025-1: スキーママッピング定義
 *
 * 既存JSONデータ構造とD1スキーマ間のマッピングを定義する
 * @see data/json/battle-logs.json
 * @see data/json/deck-master.json
 * @see data/json/my-decks.json
 */

import type { NewBattleLog } from '../db/schema/battle-logs';
import type { NewDeckMaster } from '../db/schema/deck-master';
import type { NewMyDeck } from '../db/schema/my-decks';

// ============================================================
// 既存JSONスキーマ定義（Legacy Schema）
// ============================================================

/**
 * 既存の対戦履歴JSONスキーマ
 * @example
 * {
 *   "id": "1",
 *   "date": "2025/08/07",
 *   "battleType": "ランクマッチ",
 *   "rank": "サファイア",
 *   "group": "A",
 *   "myDeckId": "1",
 *   "turn": "後攻",
 *   "result": "WIN",
 *   "opponentDeckId": "3"
 * }
 */
export interface LegacyBattleLog {
  id: string;
  date: string; // "YYYY/MM/DD" 形式
  battleType: string;
  rank: string;
  group: string;
  myDeckId: string;
  turn: string; // "先行" | "後攻"
  result: string; // "WIN" | "LOSE"
  opponentDeckId: string;
}

/**
 * 既存のデッキマスターJSONスキーマ
 * @example
 * {
 *   "id": "1",
 *   "className": "ウィッチ",
 *   "deckName": "土スペルウィッチ",
 *   "sortOrder": 1
 * }
 */
export interface LegacyDeckMaster {
  id: string;
  className: string;
  deckName: string;
  sortOrder: number;
}

/**
 * 既存のマイデッキJSONスキーマ
 * @example
 * {
 *   "id": "1",
 *   "deckId": "1",
 *   "deckCode": "3.1.3.1...",
 *   "deckName": "秘術オデンスペル",
 *   "isActive": true,
 *   "createdAt": "2024-01-01T00:00:00.000Z"
 * }
 */
export interface LegacyMyDeck {
  id: string;
  deckId: string;
  deckCode: string;
  deckName: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================
// マッピング関数
// ============================================================

/**
 * 日付形式を変換（YYYY/MM/DD → YYYY-MM-DD）
 * @param legacyDate - 既存形式の日付文字列
 * @returns D1スキーマ形式の日付文字列
 */
export function convertDateFormat(legacyDate: string): string {
  // "2025/08/07" → "2025-08-07"
  return legacyDate.replace(/\//g, '-');
}

/**
 * 対戦履歴のマッピング
 * @param legacy - 既存JSONデータ
 * @param userId - ユーザーID（Phase 2対応、オプショナル）
 * @returns D1スキーマ形式の対戦履歴データ
 */
export function mapLegacyBattleLogToNew(
  legacy: LegacyBattleLog,
  userId?: string
): NewBattleLog {
  return {
    id: legacy.id,
    userId: userId ?? null,
    date: convertDateFormat(legacy.date),
    battleType: legacy.battleType,
    rank: legacy.rank,
    groupName: legacy.group,
    myDeckId: legacy.myDeckId,
    turn: legacy.turn,
    result: legacy.result,
    opponentDeckId: legacy.opponentDeckId,
  };
}

/**
 * デッキマスターのマッピング
 * @param legacy - 既存JSONデータ
 * @returns D1スキーマ形式のデッキマスターデータ
 */
export function mapLegacyDeckMasterToNew(legacy: LegacyDeckMaster): NewDeckMaster {
  return {
    id: legacy.id,
    className: legacy.className,
    deckName: legacy.deckName,
    sortOrder: legacy.sortOrder,
  };
}

/**
 * マイデッキのマッピング
 * @param legacy - 既存JSONデータ
 * @param userId - ユーザーID（Phase 2対応、オプショナル）
 * @returns D1スキーマ形式のマイデッキデータ
 */
export function mapLegacyMyDeckToNew(
  legacy: LegacyMyDeck,
  userId?: string
): NewMyDeck {
  return {
    id: legacy.id,
    userId: userId ?? null,
    deckCode: legacy.deckCode,
    deckName: legacy.deckName,
    isActive: legacy.isActive,
    // createdAtはスキーマのデフォルト値を使用するため省略
  };
}

// ============================================================
// バリデーション関数
// ============================================================

/**
 * 対戦履歴データのバリデーション
 */
export function validateLegacyBattleLog(data: unknown): data is LegacyBattleLog {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.battleType === 'string' &&
    typeof obj.rank === 'string' &&
    typeof obj.group === 'string' &&
    typeof obj.myDeckId === 'string' &&
    typeof obj.turn === 'string' &&
    typeof obj.result === 'string' &&
    typeof obj.opponentDeckId === 'string'
  );
}

/**
 * デッキマスターデータのバリデーション
 */
export function validateLegacyDeckMaster(data: unknown): data is LegacyDeckMaster {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.className === 'string' &&
    typeof obj.deckName === 'string' &&
    typeof obj.sortOrder === 'number'
  );
}

/**
 * マイデッキデータのバリデーション
 */
export function validateLegacyMyDeck(data: unknown): data is LegacyMyDeck {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.deckId === 'string' &&
    typeof obj.deckCode === 'string' &&
    typeof obj.deckName === 'string' &&
    typeof obj.isActive === 'boolean' &&
    typeof obj.createdAt === 'string'
  );
}
