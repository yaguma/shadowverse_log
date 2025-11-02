/**
 * StatisticsService - 対戦履歴の統計計算サービス
 *
 * 【機能概要】: 対戦履歴データから統計情報を計算し、集計結果を返すサービスクラス
 *
 * 【実装方針】: TDD Greenフェーズとして、テストを通すために必要最小限の機能を実装
 *
 * 【テスト対応】: backend/tests/services/statisticsService.test.ts の16件のテストケースを通す
 * - TC-001〜008: 正常系（全体統計、デッキ別統計、ランク別統計、ターン別統計、期間フィルタリング）
 * - TC-101〜102: 異常系（エラーハンドリング）
 * - TC-201〜206: 境界値（データ0件、勝率計算、存在しないデッキID）
 *
 * 🔵 信頼性レベル: 青信号（requirements.md, testcases.md より）
 */

import type { BlobStorageClient } from '../storage/blobStorageClient';
import type { BattleLog, DeckMaster, Group, MyDeck, Rank, StatisticsResponse } from '../types';

/**
 * 【クラス定義】: StatisticsService
 * 【責務】: 対戦履歴データの統計計算
 * 【設計パターン】: サービスパターン（ビジネスロジックのカプセル化）
 * 🔵 信頼性レベル: 青信号
 */
export class StatisticsService {
  /**
   * 【コンストラクタ】: StatisticsService インスタンスを初期化
   *
   * 【機能概要】: BlobStorageClient の依存性注入
   *
   * 🔵 信頼性レベル: 青信号
   *
   * @param blobClient - Blob Storage アクセスクライアント
   */
  constructor(private blobClient: BlobStorageClient) {}

  /**
   * 【パブリックメソッド】: 統計情報を計算
   *
   * 【機能概要】:
   * 1. Blob Storage からデータを取得（battle-logs.json, deck-master.json, my-decks.json）
   * 2. クエリパラメータに基づいてフィルタリング（期間、対戦タイプ）
   * 3. 統計を計算（全体、デッキ別、ランク別、ターン別）
   * 4. 結果を返却
   *
   * 【実装方針】: テストケースを通すための最小限の実装
   *
   * 🔵 信頼性レベル: 青信号（requirements.md Lines 76-336 より）
   *
   * @param params - クエリパラメータ（startDate, endDate, battleType）
   * @returns Promise<StatisticsResponse> - 統計情報
   */
  async calculateStatistics(params: {
    startDate?: string;
    endDate?: string;
    battleType?: string;
  }): Promise<StatisticsResponse> {
    // 【データ取得】: Blob Storage から3つのJSONファイルを並列取得
    // 🔵 信頼性レベル: 青信号
    const [battleLogs, deckMasters, myDecks] = await Promise.all([
      this.blobClient.getBattleLogs(),
      this.blobClient.getDeckMasters(),
      this.blobClient.getMyDecks(),
    ]);

    // 【デフォルト期間設定】: パラメータが省略された場合のデフォルト値処理
    // 【endDate】: 今日の日付 (JST基準)
    // 【startDate】: endDate の7日前
    // 🔵 信頼性レベル: 青信号（requirements.md Lines 100-110 より）
    const today = new Date();
    const endDate = params.endDate ?? today.toISOString().split('T')[0] ?? '';
    const startDate = params.startDate ?? this.getDateBeforeDays(endDate, 7);

    // 【フィルタリング】: 期間と対戦タイプでフィルタリング
    // 🔵 信頼性レベル: 青信号
    const filteredLogs = this.filterBattleLogs(battleLogs, startDate, endDate, params.battleType);

    // 【統計計算】: 各種統計を計算
    // 🔵 信頼性レベル: 青信号
    const overall = this.calculateOverall(filteredLogs);
    const byMyDeck = this.calculateByMyDeck(filteredLogs, myDecks);
    const byOpponentDeck = this.calculateByOpponentDeck(filteredLogs, deckMasters);
    const byRank = this.calculateByRank(filteredLogs);
    const byTurn = this.calculateByTurn(filteredLogs);

    // 【レスポンス構築】: StatisticsResponse 形式で返却
    // 🔵 信頼性レベル: 青信号（requirements.md Lines 118-210 より）
    return {
      overall,
      byMyDeck,
      byOpponentDeck,
      byRank,
      byTurn,
      opponentDeckDistribution: [], // Phase 1では空配列
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * 【プライベートメソッド】: 対戦履歴をフィルタリング
   *
   * 【機能概要】: 期間と対戦タイプでフィルタリング
   *
   * 【実装方針】:
   * - 日付形式変換: YYYY/MM/DD → YYYY-MM-DD
   * - 期間フィルタリング: startDate以上、endDate以下
   * - 対戦タイプフィルタリング: battleType指定時のみ
   *
   * 🔵 信頼性レベル: 青信号（requirements.md Lines 260-289 より）
   *
   * @param logs - 対戦履歴配列
   * @param startDate - 開始日 (YYYY-MM-DD)
   * @param endDate - 終了日 (YYYY-MM-DD)
   * @param battleType - 対戦タイプ（オプション）
   * @returns フィルタリングされた対戦履歴配列
   */
  private filterBattleLogs(
    logs: BattleLog[],
    startDate: string,
    endDate: string,
    battleType?: string
  ): BattleLog[] {
    return logs.filter((log) => {
      // 【日付フィルタリング】: YYYY/MM/DD → YYYY-MM-DD に変換して比較
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 816-821 より）
      const logDate = log.date.replace(/\//g, '-'); // YYYY/MM/DD → YYYY-MM-DD
      const inDateRange = logDate >= startDate && logDate <= endDate;

      // 【対戦タイプフィルタリング】: battleType指定時のみフィルタリング
      // 🔵 信頼性レベル: 青信号
      const matchesBattleType = battleType ? log.battleType === battleType : true;

      return inDateRange && matchesBattleType;
    });
  }

  /**
   * 【プライベートメソッド】: 全体統計を計算
   *
   * 【機能概要】: totalGames、wins、losses、winRate を計算
   *
   * 【実装方針】:
   * - totalGames: 配列の長さ
   * - wins: result === "勝ち" の件数
   * - losses: result === "負け" の件数
   * - winRate: Math.round((wins / totalGames) * 1000) / 10
   *
   * 【パフォーマンス最適化】: 1回のループで wins と losses を同時にカウント
   * - 改善前: 2回の filter() 呼び出し（O(2n)）
   * - 改善後: 1回の reduce() 呼び出し（O(n)）
   *
   * 🔵 信頼性レベル: 青信号（requirements.md Lines 261-267 より）
   *
   * @param logs - フィルタリング済み対戦履歴配列
   * @returns 全体統計
   */
  private calculateOverall(logs: BattleLog[]): {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  } {
    const totalGames = logs.length;

    // 【パフォーマンス改善】: 1回のループで wins と losses を同時にカウント
    // 🔵 信頼性レベル: 青信号（パフォーマンスレビューの結果）
    const { wins, losses } = logs.reduce(
      (acc, log) => {
        if (log.result === '勝ち') {
          acc.wins++;
        } else if (log.result === '負け') {
          acc.losses++;
        }
        return acc;
      },
      { wins: 0, losses: 0 }
    );

    const winRate = this.calculateWinRate(wins, totalGames);

    return {
      totalGames,
      wins,
      losses,
      winRate,
    };
  }

  /**
   * 【プライベートメソッド】: マイデッキ別統計を計算
   *
   * 【機能概要】: myDeckId でグループ化し、試合数降順でソート
   *
   * 【実装方針】:
   * 1. myDeckId でグループ化
   * 2. deckName を myDecks から参照（存在しない場合は "不明なデッキ"）
   * 3. totalGames の降順でソート
   *
   * 🔵 信頼性レベル: 青信号（requirements.md Lines 269-273 より）
   *
   * @param logs - フィルタリング済み対戦履歴配列
   * @param myDecks - マイデッキマスターデータ
   * @returns マイデッキ別統計配列（試合数降順）
   */
  private calculateByMyDeck(
    logs: BattleLog[],
    myDecks: MyDeck[]
  ): Array<{
    deckId: string;
    deckName: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }> {
    // 【マップ作成】: myDeckId → deckName のマップ
    // 🔵 信頼性レベル: 青信号
    const myDeckMap = new Map(myDecks.map((deck) => [deck.id, deck.deckName]));

    // 【グループ化】: myDeckId でグループ化
    // 🔵 信頼性レベル: 青信号
    const grouped = logs.reduce(
      (acc, log) => {
        const key = log.myDeckId;
        if (!acc[key]) {
          acc[key] = {
            deckId: key,
            deckName: myDeckMap.get(key) ?? '不明なデッキ',
            totalGames: 0,
            wins: 0,
            losses: 0,
          };
        }
        acc[key].totalGames++;
        if (log.result === '勝ち') {
          acc[key].wins++;
        } else {
          acc[key].losses++;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          deckId: string;
          deckName: string;
          totalGames: number;
          wins: number;
          losses: number;
        }
      >
    );

    // 【ソート】: totalGames の降順でソート
    // 🔵 信頼性レベル: 青信号
    const sorted = Object.values(grouped).sort((a, b) => b.totalGames - a.totalGames);

    // 【勝率計算】: winRate を追加
    // 🔵 信頼性レベル: 青信号
    return sorted.map((stat) => ({
      ...stat,
      winRate: this.calculateWinRate(stat.wins, stat.totalGames),
    }));
  }

  /**
   * 【プライベートメソッド】: 相手デッキ別統計を計算
   *
   * 【機能概要】: opponentDeckId でグループ化し、試合数降順でソート
   *
   * 【実装方針】:
   * 1. opponentDeckId でグループ化
   * 2. deckName を deckMasters から参照（存在しない場合は "不明なデッキ"）
   * 3. totalGames の降順でソート
   *
   * 🔵 信頼性レベル: 青信号（requirements.md Lines 275-279 より）
   *
   * @param logs - フィルタリング済み対戦履歴配列
   * @param deckMasters - デッキマスターデータ
   * @returns 相手デッキ別統計配列（試合数降順）
   */
  private calculateByOpponentDeck(
    logs: BattleLog[],
    deckMasters: DeckMaster[]
  ): Array<{
    deckId: string;
    deckName: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }> {
    // 【マップ作成】: opponentDeckId → deckName のマップ
    // 🔵 信頼性レベル: 青信号
    const deckMasterMap = new Map(deckMasters.map((deck) => [deck.id, deck.deckName]));

    // 【グループ化】: opponentDeckId でグループ化
    // 🔵 信頼性レベル: 青信号
    const grouped = logs.reduce(
      (acc, log) => {
        const key = log.opponentDeckId;
        if (!acc[key]) {
          acc[key] = {
            deckId: key,
            deckName: deckMasterMap.get(key) ?? '不明なデッキ',
            totalGames: 0,
            wins: 0,
            losses: 0,
          };
        }
        acc[key].totalGames++;
        if (log.result === '勝ち') {
          acc[key].wins++;
        } else {
          acc[key].losses++;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          deckId: string;
          deckName: string;
          totalGames: number;
          wins: number;
          losses: number;
        }
      >
    );

    // 【ソート】: totalGames の降順でソート
    // 🔵 信頼性レベル: 青信号
    const sorted = Object.values(grouped).sort((a, b) => b.totalGames - a.totalGames);

    // 【勝率計算】: winRate を追加
    // 🔵 信頼性レベル: 青信号
    return sorted.map((stat) => ({
      ...stat,
      winRate: this.calculateWinRate(stat.wins, stat.totalGames),
    }));
  }

  /**
   * 【プライベートメソッド】: ランク帯別統計を計算
   *
   * 【機能概要】: rank + group の組み合わせでグループ化し、試合数降順でソート
   *
   * 【実装方針】:
   * 1. rank + group の複合キーでグループ化
   * 2. totalGames の降順でソート
   *
   * 🔵 信頼性レベル: 青信号（requirements.md Lines 281-284 より）
   *
   * @param logs - フィルタリング済み対戦履歴配列
   * @returns ランク帯別統計配列（試合数降順）
   */
  private calculateByRank(logs: BattleLog[]): Array<{
    rank: Rank;
    group: Group;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }> {
    // 【グループ化】: rank + group の複合キーでグループ化
    // 🔵 信頼性レベル: 青信号
    const grouped = logs.reduce(
      (acc, log) => {
        const key = `${log.rank}|${log.group}`; // 複合キー
        if (!acc[key]) {
          acc[key] = {
            rank: log.rank,
            group: log.group,
            totalGames: 0,
            wins: 0,
            losses: 0,
          };
        }
        acc[key].totalGames++;
        if (log.result === '勝ち') {
          acc[key].wins++;
        } else {
          acc[key].losses++;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          rank: Rank;
          group: Group;
          totalGames: number;
          wins: number;
          losses: number;
        }
      >
    );

    // 【ソート】: totalGames の降順でソート
    // 🔵 信頼性レベル: 青信号
    const sorted = Object.values(grouped).sort((a, b) => b.totalGames - a.totalGames);

    // 【勝率計算】: winRate を追加
    // 🔵 信頼性レベル: 青信号
    return sorted.map((stat) => ({
      ...stat,
      winRate: this.calculateWinRate(stat.wins, stat.totalGames),
    }));
  }

  /**
   * 【プライベートメソッド】: 先攻後攻別統計を計算
   *
   * 【機能概要】: turn === "先攻" と turn === "後攻" で分けて統計を計算
   *
   * 【実装方針】: turnフィールドでフィルタリングして統計を計算
   *
   * 【パフォーマンス最適化】: 1回のループで先攻・後攻の統計を同時に計算
   * - 改善前: 6回の filter() 呼び出し（O(6n)）
   * - 改善後: 1回の reduce() 呼び出し（O(n)）
   *
   * 🔵 信頼性レベル: 青信号（requirements.md Lines 286-289 より）
   *
   * @param logs - フィルタリング済み対戦履歴配列
   * @returns 先攻後攻別統計
   */
  private calculateByTurn(logs: BattleLog[]): {
    先攻: { totalGames: number; wins: number; losses: number; winRate: number };
    後攻: { totalGames: number; wins: number; losses: number; winRate: number };
  } {
    // 【パフォーマンス改善】: 1回のループで先攻・後攻の統計を同時に計算
    // 🔵 信頼性レベル: 青信号（パフォーマンスレビューの結果）
    const stats = logs.reduce(
      (acc, log) => {
        if (log.turn === '先攻') {
          acc.先攻.totalGames++;
          if (log.result === '勝ち') {
            acc.先攻.wins++;
          } else if (log.result === '負け') {
            acc.先攻.losses++;
          }
        } else if (log.turn === '後攻') {
          acc.後攻.totalGames++;
          if (log.result === '勝ち') {
            acc.後攻.wins++;
          } else if (log.result === '負け') {
            acc.後攻.losses++;
          }
        }
        return acc;
      },
      {
        先攻: { totalGames: 0, wins: 0, losses: 0 },
        後攻: { totalGames: 0, wins: 0, losses: 0 },
      }
    );

    return {
      先攻: {
        ...stats.先攻,
        winRate: this.calculateWinRate(stats.先攻.wins, stats.先攻.totalGames),
      },
      後攻: {
        ...stats.後攻,
        winRate: this.calculateWinRate(stats.後攻.wins, stats.後攻.totalGames),
      },
    };
  }

  /**
   * 【プライベートメソッド】: 勝率を計算
   *
   * 【機能概要】: 勝率を小数点第1位まで四捨五入して返す
   *
   * 【実装方針】:
   * - 計算式: Math.round((wins / totalGames) * 1000) / 10
   * - ゼロ除算回避: totalGames === 0 の場合は 0 を返す
   *
   * 🔵 信頼性レベル: 青信号（requirements.md Lines 266 より）
   *
   * @param wins - 勝利数
   * @param totalGames - 総試合数
   * @returns 勝率（小数点第1位まで）
   */
  private calculateWinRate(wins: number, totalGames: number): number {
    // 【ゼロ除算回避】: totalGames === 0 の場合は 0 を返す
    // 🔵 信頼性レベル: 青信号
    if (totalGames === 0) {
      return 0;
    }

    // 【勝率計算】: 小数点第1位まで四捨五入
    // 【計算式】: Math.round((wins / totalGames) * 1000) / 10
    // 【例】: 2 / 3 = 0.6666... → Math.round(666.666...) / 10 = 66.7
    // 🔵 信頼性レベル: 青信号
    return Math.round((wins / totalGames) * 1000) / 10;
  }

  /**
   * 【プライベートメソッド】: 指定日から指定日数前の日付を取得
   *
   * 【機能概要】: YYYY-MM-DD 形式の日付から指定日数前の日付を YYYY-MM-DD 形式で返す
   *
   * 【実装方針】: Date オブジェクトを使用して日付計算
   *
   * 🔵 信頼性レベル: 青信号
   *
   * @param date - 基準日 (YYYY-MM-DD)
   * @param days - 日数
   * @returns 指定日数前の日付 (YYYY-MM-DD)
   */
  private getDateBeforeDays(date: string, days: number): string {
    // 【Date オブジェクト作成】: YYYY-MM-DD 形式の文字列から Date オブジェクトを作成
    // 🔵 信頼性レベル: 青信号
    const baseDate = new Date(date);

    // 【日付計算】: setDate() で日数を減算
    // 🔵 信頼性レベル: 青信号
    baseDate.setDate(baseDate.getDate() - days);

    // 【フォーマット】: YYYY-MM-DD 形式で返却
    // 🔵 信頼性レベル: 青信号
    return baseDate.toISOString().split('T')[0] ?? '';
  }
}
