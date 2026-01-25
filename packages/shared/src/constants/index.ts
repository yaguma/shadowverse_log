import type { BattleResult, BattleType, Group, Rank, Turn } from '../types/battle-log.js';

/**
 * 対戦タイプの定数配列
 */
export const BATTLE_TYPES: readonly BattleType[] = ['ランクマッチ', '対戦台', 'ロビー大会'] as const;

/**
 * ランクの定数配列
 */
export const RANKS: readonly Rank[] = ['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-'] as const;

/**
 * グループの定数配列
 */
export const GROUPS: readonly Group[] = [
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

/**
 * ターンの定数配列
 */
export const TURNS: readonly Turn[] = ['先攻', '後攻'] as const;

/**
 * 対戦結果の定数配列
 */
export const BATTLE_RESULTS: readonly BattleResult[] = ['勝ち', '負け'] as const;

/**
 * クラス名の定数配列
 */
export const CLASS_NAMES = [
  'エルフ',
  'ロイヤル',
  'ウィッチ',
  'ドラゴン',
  'ネクロマンサー',
  'ヴァンパイア',
  'ビショップ',
  'ネメシス',
] as const;

export type ClassName = (typeof CLASS_NAMES)[number];

/**
 * APIエラーコード定数
 */
export const API_ERROR_CODES = {
  /** バリデーションエラー */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** 削除制約エラー */
  DELETE_CONSTRAINT_ERROR: 'DELETE_CONSTRAINT_ERROR',
  /** 見つからない */
  NOT_FOUND: 'NOT_FOUND',
  /** 内部エラー */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
