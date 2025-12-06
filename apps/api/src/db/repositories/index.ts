/**
 * リポジトリ統合エクスポート
 * TASK-0024-5: リポジトリ統合とエクスポート
 *
 * @description 全リポジトリの統合エクスポートとファクトリ関数を提供
 */

// 基底インターフェースのエクスポート
export * from './base-repository';

// 各リポジトリクラスのエクスポート
export { BattleLogsRepository } from './battle-logs-repository';
export { DeckMasterRepository } from './deck-master-repository';
export { MyDecksRepository } from './my-decks-repository';

// リポジトリファクトリ
import type { Database } from '../index';
import { BattleLogsRepository } from './battle-logs-repository';
import { DeckMasterRepository } from './deck-master-repository';
import { MyDecksRepository } from './my-decks-repository';

/**
 * リポジトリコンテナインターフェース
 */
export interface Repositories {
  /** 対戦履歴リポジトリ */
  battleLogs: BattleLogsRepository;
  /** デッキマスターリポジトリ */
  deckMaster: DeckMasterRepository;
  /** マイデッキリポジトリ */
  myDecks: MyDecksRepository;
}

/**
 * リポジトリファクトリ関数
 * データベースコネクションを受け取り、全リポジトリのインスタンスを返す
 *
 * @param db - Drizzle ORMのデータベースインスタンス
 * @returns 全リポジトリのコンテナ
 */
export function createRepositories(db: Database): Repositories {
  return {
    battleLogs: new BattleLogsRepository(db),
    deckMaster: new DeckMasterRepository(db),
    myDecks: new MyDecksRepository(db),
  };
}
