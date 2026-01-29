/**
 * 使用デッキ管理E2Eテスト用フィクスチャ
 * TASK-0021: 使用デッキ管理E2Eテスト
 *
 * テストデータとして使用するマイデッキ情報を定義する
 */

/**
 * テスト用マイデッキデータ
 */
export interface TestMyDeck {
  id: string;
  deckClass: string; // デッキ種別名（クラス名 + デッキ名形式）
  deckName: string;
  deckCode?: string;
  usageCount: number; // 対戦履歴での使用回数
}

/**
 * 削除可能なテスト用マイデッキ（対戦履歴から参照なし）
 */
export const deletableMyDeck: TestMyDeck = {
  id: 'test-uuid-my-deck-deletable',
  deckClass: '秘術ウィッチ',
  deckName: 'マイ秘術ウィッチ',
  deckCode: 'g3.0m.6.L',
  usageCount: 0, // 削除可能
};

/**
 * 削除不可能なテスト用マイデッキ（対戦履歴から参照あり）
 */
export const nonDeletableMyDeck: TestMyDeck = {
  id: 'test-uuid-my-deck-non-deletable',
  deckClass: '原初ドラゴン',
  deckName: 'マイ原初ドラゴン',
  deckCode: 'a3.2x.4.B',
  usageCount: 10, // 削除不可
};

/**
 * テスト用マイデッキ一覧
 */
export const testMyDecks: TestMyDeck[] = [
  deletableMyDeck,
  nonDeletableMyDeck,
  {
    id: 'test-uuid-my-deck-3',
    deckClass: 'アマツエルフ',
    deckName: 'マイアマツエルフ',
    deckCode: 'c1.0a.2.X',
    usageCount: 5,
  },
  {
    id: 'test-uuid-my-deck-4',
    deckClass: '連携ロイヤル',
    deckName: 'マイ連携ロイヤル',
    usageCount: 0,
  },
];

/**
 * 新規追加テスト用データ
 */
export const newMyDeck = {
  deckClass: '秘術ウィッチ', // デッキ種別選択のラベル
  deckName: 'テストマイデッキ',
  deckCode: 'z9.1a.3.T',
};

/**
 * デッキコードなしの新規追加テスト用データ
 */
export const newMyDeckWithoutCode = {
  deckClass: '葬送ネクロ',
  deckName: 'コードなしデッキ',
};

/**
 * バリデーションエラーテスト用データ
 */
export const validationTestData = {
  // 空のデッキ名
  emptyDeckName: '',
  // 正常なデッキ名
  validDeckName: 'テストデッキ名',
};

/**
 * エラーメッセージ定義
 */
export const errorMessages = {
  deckNameRequired: 'デッキ名を入力してください',
  deckClassRequired: 'デッキ種別を選択してください',
  deleteConflict: '対戦履歴に紐づいているため削除できません',
};
