/**
 * デッキ種別管理E2Eテスト用フィクスチャ
 * TASK-0014: デッキ種別管理E2Eテスト
 *
 * テストデータとして使用するデッキ種別情報を定義する
 */

/**
 * クラス名の一覧
 * Shadowverseのクラス名を定義
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
 * テスト用デッキ種別データ
 */
export interface TestDeckMaster {
  id: string;
  className: ClassName;
  deckName: string;
  sortOrder: number;
  usageCount: number;
}

/**
 * 削除可能なテスト用デッキ種別（参照なし）
 */
export const deletableDeckMaster: TestDeckMaster = {
  id: 'test-uuid-deletable',
  className: 'ウィッチ',
  deckName: '秘術ウィッチ',
  sortOrder: 1,
  usageCount: 0, // 削除可能
};

/**
 * 削除不可能なテスト用デッキ種別（参照あり）
 */
export const nonDeletableDeckMaster: TestDeckMaster = {
  id: 'test-uuid-non-deletable',
  className: 'ドラゴン',
  deckName: '原初ドラゴン',
  sortOrder: 2,
  usageCount: 10, // 削除不可
};

/**
 * テスト用デッキ種別一覧
 */
export const testDeckMasters: TestDeckMaster[] = [
  deletableDeckMaster,
  nonDeletableDeckMaster,
  {
    id: 'test-uuid-3',
    className: 'エルフ',
    deckName: 'アマツエルフ',
    sortOrder: 3,
    usageCount: 5,
  },
  {
    id: 'test-uuid-4',
    className: 'ロイヤル',
    deckName: '連携ロイヤル',
    sortOrder: 4,
    usageCount: 0,
  },
];

/**
 * 新規追加テスト用データ
 */
export const newDeckMaster = {
  className: 'ビショップ' as ClassName,
  deckName: 'テストデッキ',
};

/**
 * 連続追加テスト用データ
 */
export const consecutiveDeckMasters = [
  {
    className: 'ネクロマンサー' as ClassName,
    deckName: '葬送ネクロ',
  },
  {
    className: 'ヴァンパイア' as ClassName,
    deckName: '狂乱ヴァンプ',
  },
];

/**
 * 編集テスト用の新しいデッキ名
 */
export const updatedDeckName = '編集後デッキ名';

/**
 * バリデーションエラーテスト用データ
 */
export const validationTestData = {
  // 50文字のデッキ名（最大文字数の境界値）
  maxLengthName: 'あ'.repeat(50),
  // 51文字のデッキ名（最大文字数を超過）
  overMaxLengthName: 'あ'.repeat(51),
  // 空文字
  emptyName: '',
};

/**
 * エラーメッセージ定義
 */
export const errorMessages = {
  deckNameRequired: 'デッキ名を入力してください',
  deckNameTooLong: 'デッキ名は50文字以内で入力してください',
  classNameRequired: 'クラス名を選択してください',
  deleteConflict: '対戦履歴に紐づいているため削除できません',
};
