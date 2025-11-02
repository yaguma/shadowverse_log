/**
 * StatisticsService のテストスイート
 *
 * テストフレームワーク: Jest 29.7.0 + ts-jest
 * テスト対象: backend/src/services/statisticsService.ts
 *
 * 🔵 テストケース定義書: docs/implements/shadowverse-battle-log/TASK-0010/statistics-api-testcases.md
 * 🔵 要件定義書: docs/implements/shadowverse-battle-log/TASK-0010/statistics-api-requirements.md
 */

import { StatisticsService } from '../../src/services/statisticsService';
import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import type { BattleLog, DeckMaster, MyDeck } from '../../src/types';

// BlobStorageClient のモック
jest.mock('../../src/storage/blobStorageClient');

describe('StatisticsService', () => {
  let service: StatisticsService;
  let mockBlobClient: jest.Mocked<BlobStorageClient>;

  // =============================================================================
  // テスト環境のセットアップとクリーンアップ
  // =============================================================================

  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをリセットし、一貫したテスト条件を保証
    // 【環境初期化】: 前のテストの影響を受けないよう、モックの状態をクリーンにリセット
    jest.clearAllMocks();

    // BlobStorageClient のモックインスタンスを作成
    mockBlobClient = new BlobStorageClient('', '') as jest.Mocked<BlobStorageClient>;

    // デフォルトのモック実装（空配列を返す）
    mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue([]);
    mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
    mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

    // StatisticsService インスタンスを作成（モックされた BlobStorageClient を使用）
    service = new StatisticsService(mockBlobClient);
  });

  afterEach(() => {
    // 【テスト後処理】: テスト実行後にモックをクリーンアップ
    // 【状態復元】: 次のテストに影響しないよう、モックの状態を復元
    jest.restoreAllMocks();
  });

  // =============================================================================
  // 1. 正常系テストケース（基本的な動作）
  // =============================================================================

  describe('正常系: TC-001 - 全体統計の正常計算', () => {
    test('期間内の全体統計が正しく計算される', async () => {
      // 【テスト目的】: StatisticsService.calculateStatistics() メソッドが全体統計（overall）を正しく計算すること
      // 【テスト内容】: 期間内の対戦履歴から totalGames、wins、losses、winRate を正確に集計
      // 【期待される動作】: 勝率計算式 Math.round((wins / totalGames) * 1000) / 10 により小数点第1位まで四捨五入
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 28-57より）

      // 【テストデータ準備】: 典型的な1ヶ月の統計取得ケース、バランスの取れた勝敗数
      // 【初期条件設定】: 2025年1月に10件の対戦履歴（勝ち6件、負け4件）
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250110_001',
          date: '2025/01/10',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'log_20250110_002',
          date: '2025/01/10',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
        {
          id: 'log_20250111_001',
          date: '2025/01/11',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'log_20250112_001',
          date: '2025/01/12',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_003',
        },
        {
          id: 'log_20250113_001',
          date: '2025/01/13',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'log_20250114_001',
          date: '2025/01/14',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_002',
        },
        {
          id: 'log_20250115_001',
          date: '2025/01/15',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'log_20250116_001',
          date: '2025/01/16',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_003',
        },
        {
          id: 'log_20250117_001',
          date: '2025/01/17',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'log_20250118_001',
          date: '2025/01/18',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_002',
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: 期間フィルタリング → 統計計算（全体、デッキ別、ランク別、ターン別）
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: 全体統計が期待値と一致することを確認
      // 【期待値確認】: totalGames=10, wins=6, losses=4, winRate=60.0
      expect(result.overall.totalGames).toBe(10); // 【確認内容】: 期間内の全対戦数が正しく集計されることを確認 🔵
      expect(result.overall.wins).toBe(6); // 【確認内容】: 勝利数が正しく集計されることを確認 🔵
      expect(result.overall.losses).toBe(4); // 【確認内容】: 敗北数が正しく集計されることを確認 🔵
      expect(result.overall.winRate).toBe(60.0); // 【確認内容】: 勝率が小数点第1位まで四捨五入されることを確認（6/10*100=60.0） 🔵

      // 【追加検証】: dateRange が正しく設定されることを確認
      expect(result.dateRange.startDate).toBe('2025-01-01'); // 【確認内容】: 期間開始日が正しく設定される 🔵
      expect(result.dateRange.endDate).toBe('2025-01-31'); // 【確認内容】: 期間終了日が正しく設定される 🔵
    });
  });

  describe('正常系: TC-002 - マイデッキ別統計の正常計算とソート', () => {
    test('マイデッキ別統計が試合数降順でソートされる', async () => {
      // 【テスト目的】: byMyDeck配列が正しくグループ化され、totalGamesの降順でソートされること
      // 【テスト内容】: 各マイデッキごとに統計が集計され、試合数が多い順に返却される
      // 【期待される動作】: myDeckIdでのグループ化、deckNameの参照、降順ソート
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 60-104より）

      // 【テストデータ準備】: 複数デッキを使用するプレイヤーの典型的な使用パターン
      // 【初期条件設定】: deck_001（12試合）、deck_002（8試合）
      const mockBattleLogs: BattleLog[] = [
        // deck_001: 12試合（勝ち8、負け4）
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/01',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_001',
        })),
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `log_20250102_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/02',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck_master_002',
        })),
        // deck_002: 8試合（勝ち5、負け3）
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `log_20250103_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/03',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_002',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_003',
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `log_20250104_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/04',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_002',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck_master_004',
        })),
      ];

      const mockMyDecks: MyDeck[] = [
        {
          id: 'deck_001',
          deckId: 'deck_master_001',
          deckCode: 'code_001',
          deckName: '秘術オデンスペル',
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'deck_002',
          deckId: 'deck_master_002',
          deckCode: 'code_002',
          deckName: '進化葬送ネクロ',
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue(mockMyDecks);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: myDeckIdでグループ化 → deckNameの参照 → totalGamesで降順ソート
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: byMyDeck配列が正しくソートされていることを確認
      // 【期待値確認】: deck_001（12試合）が先、deck_002（8試合）が後
      expect(result.byMyDeck).toHaveLength(2); // 【確認内容】: 2つのデッキが集計される 🔵

      // deck_001の検証
      expect(result.byMyDeck[0]?.deckId).toBe('deck_001'); // 【確認内容】: 試合数が多いデッキが先頭に来る 🔵
      expect(result.byMyDeck[0]?.deckName).toBe('秘術オデンスペル'); // 【確認内容】: デッキ名が正しく参照される 🔵
      expect(result.byMyDeck[0]?.totalGames).toBe(12); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.byMyDeck[0]?.wins).toBe(8); // 【確認内容】: 勝利数が正しく集計される 🔵
      expect(result.byMyDeck[0]?.losses).toBe(4); // 【確認内容】: 敗北数が正しく集計される 🔵
      expect(result.byMyDeck[0]?.winRate).toBe(66.7); // 【確認内容】: 勝率が小数点第1位まで四捨五入される（8/12*100=66.666...→66.7） 🔵

      // deck_002の検証
      expect(result.byMyDeck[1]?.deckId).toBe('deck_002'); // 【確認内容】: 試合数が少ないデッキが後に来る 🔵
      expect(result.byMyDeck[1]?.deckName).toBe('進化葬送ネクロ'); // 【確認内容】: デッキ名が正しく参照される 🔵
      expect(result.byMyDeck[1]?.totalGames).toBe(8); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.byMyDeck[1]?.wins).toBe(5); // 【確認内容】: 勝利数が正しく集計される 🔵
      expect(result.byMyDeck[1]?.losses).toBe(3); // 【確認内容】: 敗北数が正しく集計される 🔵
      expect(result.byMyDeck[1]?.winRate).toBe(62.5); // 【確認内容】: 勝率が小数点第1位まで四捨五入される（5/8*100=62.5） 🔵
    });
  });

  describe('正常系: TC-003 - 相手デッキ別統計の正常計算', () => {
    test('相手デッキ別統計が正しく集計される', async () => {
      // 【テスト目的】: byOpponentDeck配列が正しくグループ化され、deckMasterから名前を取得すること
      // 【テスト内容】: 各相手デッキごとに統計が集計され、試合数降順でソートされる
      // 【期待される動作】: opponentDeckIdでのグループ化、deckMasterからの名前取得
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 107-161より）

      // 【テストデータ準備】: 環境に多い相手デッキとの対戦が集中するケース
      // 【初期条件設定】: 進化ネクロ（7試合）、ミッドレンジロイヤル（5試合）、連携ロイヤル（3試合）
      const mockBattleLogs: BattleLog[] = [
        // deck_master_005（進化ネクロ）: 7試合（勝ち5、負け2）
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/01',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_005',
        })),
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `log_20250102_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/02',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck_master_005',
        })),
        // deck_master_002（ミッドレンジロイヤル）: 5試合（勝ち3、負け2）
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `log_20250103_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/03',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_002',
        })),
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `log_20250104_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/04',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck_master_002',
        })),
        // deck_master_010（連携ロイヤル）: 3試合（勝ち2、負け1）
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `log_20250105_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/05',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_010',
        })),
        {
          id: 'log_20250106_001',
          date: '2025/01/06',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_010',
        },
      ];

      const mockDeckMasters: DeckMaster[] = [
        { id: 'deck_master_005', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 5 },
        { id: 'deck_master_002', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 2 },
        { id: 'deck_master_010', className: 'ロイヤル', deckName: '連携ロイヤル', sortOrder: 10 },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue(mockDeckMasters);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: opponentDeckIdでグループ化 → deckMasterからの名前取得 → totalGamesで降順ソート
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: byOpponentDeck配列が正しくソートされていることを確認
      // 【期待値確認】: 進化ネクロ（7試合）が先頭、ミッドレンジロイヤル（5試合）が2番目、連携ロイヤル（3試合）が最後
      expect(result.byOpponentDeck).toHaveLength(3); // 【確認内容】: 3種類の相手デッキが集計される 🔵

      // 進化ネクロの検証
      expect(result.byOpponentDeck[0]?.deckId).toBe('deck_master_005'); // 【確認内容】: 対戦頻度が高いデッキが先頭に来る 🔵
      expect(result.byOpponentDeck[0]?.deckName).toBe('進化ネクロ'); // 【確認内容】: デッキマスターから名前が正しく参照される 🔵
      expect(result.byOpponentDeck[0]?.totalGames).toBe(7); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.byOpponentDeck[0]?.wins).toBe(5); // 【確認内容】: 勝利数が正しく集計される 🔵
      expect(result.byOpponentDeck[0]?.losses).toBe(2); // 【確認内容】: 敗北数が正しく集計される 🔵
      expect(result.byOpponentDeck[0]?.winRate).toBe(71.4); // 【確認内容】: 勝率が小数点第1位まで四捨五入される（5/7*100=71.428...→71.4） 🔵

      // ミッドレンジロイヤルの検証
      expect(result.byOpponentDeck[1]?.deckId).toBe('deck_master_002'); // 【確認内容】: 対戦頻度が2番目のデッキ 🔵
      expect(result.byOpponentDeck[1]?.deckName).toBe('ミッドレンジロイヤル'); // 【確認内容】: デッキマスターから名前が正しく参照される 🔵
      expect(result.byOpponentDeck[1]?.totalGames).toBe(5); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.byOpponentDeck[1]?.winRate).toBe(60.0); // 【確認内容】: 勝率が正しく計算される（3/5*100=60.0） 🔵

      // 連携ロイヤルの検証
      expect(result.byOpponentDeck[2]?.deckId).toBe('deck_master_010'); // 【確認内容】: 対戦頻度が最も少ないデッキが最後 🔵
      expect(result.byOpponentDeck[2]?.deckName).toBe('連携ロイヤル'); // 【確認内容】: デッキマスターから名前が正しく参照される 🔵
      expect(result.byOpponentDeck[2]?.totalGames).toBe(3); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.byOpponentDeck[2]?.winRate).toBe(66.7); // 【確認内容】: 勝率が正しく計算される（2/3*100=66.666...→66.7） 🔵
    });
  });

  describe('正常系: TC-004 - ランク帯別統計の正常計算', () => {
    test('ランク帯別統計がrank+group単位で集計される', async () => {
      // 【テスト目的】: byRank配列がrank+groupの組み合わせでグループ化されること
      // 【テスト内容】: 各ランク+グループごとに統計が集計され、試合数降順でソートされる
      // 【期待される動作】: 複合キーでのグループ化、降順ソート
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 164-201より）

      // 【テストデータ準備】: ランク帯を上げながら対戦するプレイヤーの典型パターン
      // 【初期条件設定】: ダイアモンド・AAA（15試合）、ルビー・Master（10試合）
      const mockBattleLogs: BattleLog[] = [
        // ダイアモンド・AAA: 15試合（勝ち10、負け5）
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/01',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_001',
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `log_20250102_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/02',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck_master_002',
        })),
        // ルビー・Master: 10試合（勝ち6、負け4）
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `log_20250103_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/03',
          battleType: 'ランクマッチ' as const,
          rank: 'ルビー' as const,
          group: 'Master' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_001',
        })),
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `log_20250104_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/04',
          battleType: 'ランクマッチ' as const,
          rank: 'ルビー' as const,
          group: 'Master' as const,
          myDeckId: 'deck_001',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck_master_002',
        })),
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: rank+groupでグループ化 → totalGamesで降順ソート
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: byRank配列が正しくソートされていることを確認
      // 【期待値確認】: ダイアモンド・AAA（15試合）が先頭、ルビー・Master（10試合）が後
      expect(result.byRank).toHaveLength(2); // 【確認内容】: 2つのランク帯が集計される 🔵

      // ダイアモンド・AAAの検証
      expect(result.byRank[0]?.rank).toBe('ダイアモンド'); // 【確認内容】: ランクが正しく設定される 🔵
      expect(result.byRank[0]?.group).toBe('AAA'); // 【確認内容】: グループが正しく設定される 🔵
      expect(result.byRank[0]?.totalGames).toBe(15); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.byRank[0]?.wins).toBe(10); // 【確認内容】: 勝利数が正しく集計される 🔵
      expect(result.byRank[0]?.losses).toBe(5); // 【確認内容】: 敗北数が正しく集計される 🔵
      expect(result.byRank[0]?.winRate).toBe(66.7); // 【確認内容】: 勝率が小数点第1位まで四捨五入される（10/15*100=66.666...→66.7） 🔵

      // ルビー・Masterの検証
      expect(result.byRank[1]?.rank).toBe('ルビー'); // 【確認内容】: ランクが正しく設定される 🔵
      expect(result.byRank[1]?.group).toBe('Master'); // 【確認内容】: グループが正しく設定される 🔵
      expect(result.byRank[1]?.totalGames).toBe(10); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.byRank[1]?.wins).toBe(6); // 【確認内容】: 勝利数が正しく集計される 🔵
      expect(result.byRank[1]?.losses).toBe(4); // 【確認内容】: 敗北数が正しく集計される 🔵
      expect(result.byRank[1]?.winRate).toBe(60.0); // 【確認内容】: 勝率が正しく計算される（6/10*100=60.0） 🔵
    });
  });

  describe('正常系: TC-005 - 先攻後攻別統計の正常計算', () => {
    test('先攻後攻別統計が正しく集計される', async () => {
      // 【テスト目的】: byTurnオブジェクトが先攻・後攻それぞれの統計を保持すること
      // 【テスト内容】: turn === "先攻" と turn === "後攻" で分けて統計を計算
      // 【期待される動作】: turnフィールドでの分類、両方の統計が独立して計算される
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 204-237より）

      // 【テストデータ準備】: 先攻後攻がランダムに振り分けられる自然な対戦分布
      // 【初期条件設定】: 先攻（10試合）、後攻（8試合）
      const mockBattleLogs: BattleLog[] = [
        // 先攻: 10試合（勝ち7、負け3）
        ...Array.from({ length: 7 }, (_, i) => ({
          id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/01',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_001',
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `log_20250102_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/02',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck_master_002',
        })),
        // 後攻: 8試合（勝ち5、負け3）
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `log_20250103_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/03',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '後攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_001',
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `log_20250104_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/04',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck_master_002',
        })),
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: turnフィールドで分類 → 先攻・後攻それぞれの統計を計算
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: byTurn.先攻の統計が正しく計算されることを確認
      // 【期待値確認】: totalGames=10, wins=7, losses=3, winRate=70.0
      expect(result.byTurn.先攻.totalGames).toBe(10); // 【確認内容】: 先攻の試合数が正しく集計される 🔵
      expect(result.byTurn.先攻.wins).toBe(7); // 【確認内容】: 先攻の勝利数が正しく集計される 🔵
      expect(result.byTurn.先攻.losses).toBe(3); // 【確認内容】: 先攻の敗北数が正しく集計される 🔵
      expect(result.byTurn.先攻.winRate).toBe(70.0); // 【確認内容】: 先攻の勝率が正しく計算される（7/10*100=70.0） 🔵

      // 【結果検証】: byTurn.後攻の統計が正しく計算されることを確認
      // 【期待値確認】: totalGames=8, wins=5, losses=3, winRate=62.5
      expect(result.byTurn.後攻.totalGames).toBe(8); // 【確認内容】: 後攻の試合数が正しく集計される 🔵
      expect(result.byTurn.後攻.wins).toBe(5); // 【確認内容】: 後攻の勝利数が正しく集計される 🔵
      expect(result.byTurn.後攻.losses).toBe(3); // 【確認内容】: 後攻の敗北数が正しく集計される 🔵
      expect(result.byTurn.後攻.winRate).toBe(62.5); // 【確認内容】: 後攻の勝率が正しく計算される（5/8*100=62.5） 🔵
    });
  });

  describe('正常系: TC-006 - 期間フィルタリングの正常動作', () => {
    test('期間フィルタリングが正しく動作する', async () => {
      // 【テスト目的】: startDateとendDateの範囲内の対戦履歴のみが集計されること
      // 【テスト内容】: 日付がYYYY/MM/DD形式で保存されているデータをYYYY-MM-DD形式で比較
      // 【期待される動作】: startDate以上、endDate以下の期間のみが集計される
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 240-272より）

      // 【テストデータ準備】: 特定期間の成績を確認する典型的なユースケース
      // 【初期条件設定】: 期間内（15〜20日）と期間外（10日、25日）のデータを混在
      const mockBattleLogs: BattleLog[] = [
        // 範囲外: 2025/01/10（2件）
        { id: 'log_20250110_001', date: '2025/01/10', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_001' },
        { id: 'log_20250110_002', date: '2025/01/10', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
        // 範囲内: 2025/01/15（3件）
        { id: 'log_20250115_001', date: '2025/01/15', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_001' },
        { id: 'log_20250115_002', date: '2025/01/15', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
        { id: 'log_20250115_003', date: '2025/01/15', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_003' },
        // 範囲内: 2025/01/18（5件）
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `log_20250118_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/18',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_001',
        })),
        // 範囲内: 2025/01/20（2件）
        { id: 'log_20250120_001', date: '2025/01/20', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_001' },
        { id: 'log_20250120_002', date: '2025/01/20', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '負け', opponentDeckId: 'deck_master_002' },
        // 範囲外: 2025/01/25（3件）
        { id: 'log_20250125_001', date: '2025/01/25', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_001' },
        { id: 'log_20250125_002', date: '2025/01/25', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '負け', opponentDeckId: 'deck_master_002' },
        { id: 'log_20250125_003', date: '2025/01/25', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_003' },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す（期間: 2025-01-15 〜 2025-01-20）
      // 【処理内容】: 日付フィルタリング（YYYY/MM/DD形式をYYYY-MM-DD形式に変換して比較）
      const result = await service.calculateStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-20',
      });

      // 【結果検証】: 期間内の10件のみが集計されることを確認（範囲外5件は除外）
      // 【期待値確認】: totalGames=10（3+5+2）
      expect(result.overall.totalGames).toBe(10); // 【確認内容】: 期間内の全対戦数が正しく集計される（範囲外5件は除外） 🔵
      expect(result.dateRange.startDate).toBe('2025-01-15'); // 【確認内容】: 開始日が正しく設定される 🔵
      expect(result.dateRange.endDate).toBe('2025-01-20'); // 【確認内容】: 終了日が正しく設定される 🔵
    });
  });

  describe('正常系: TC-007 - 対戦タイプフィルタリングの正常動作', () => {
    test('battleTypeフィルタリングが正しく動作する', async () => {
      // 【テスト目的】: battleTypeパラメータで指定された対戦タイプのみが集計されること
      // 【テスト内容】: 指定された対戦タイプに一致する履歴のみが統計に含まれる
      // 【期待される動作】: battleTypeでの厳密な比較、他の対戦タイプの除外
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 275-302より）

      // 【テストデータ準備】: ランクマッチのみの成績を確認したいケース
      // 【初期条件設定】: ランクマッチ（12件）、対戦台（5件）、ロビー大会（3件）
      const mockBattleLogs: BattleLog[] = [
        // ランクマッチ: 12件（勝ち8、負け4）
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/01',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_001',
        })),
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `log_20250102_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/02',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AAA' as const,
          myDeckId: 'deck_001',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck_master_002',
        })),
        // 対戦台: 5件
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `log_20250103_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/03',
          battleType: '対戦台' as const,
          rank: '-' as const,
          group: '-' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_003',
        })),
        // ロビー大会: 3件
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `log_20250104_${String(i + 1).padStart(3, '0')}`,
          date: '2025/01/04',
          battleType: 'ロビー大会' as const,
          rank: '-' as const,
          group: '-' as const,
          myDeckId: 'deck_001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck_master_004',
        })),
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す（対戦タイプ: ランクマッチのみ）
      // 【処理内容】: battleTypeでフィルタリング → ランクマッチ以外の対戦タイプを除外
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        battleType: 'ランクマッチ',
      });

      // 【結果検証】: ランクマッチのみが集計されることを確認（対戦台5件、ロビー大会3件は除外）
      // 【期待値確認】: totalGames=12, wins=8, losses=4, winRate=66.7
      expect(result.overall.totalGames).toBe(12); // 【確認内容】: ランクマッチのみの試合数が集計される 🔵
      expect(result.overall.wins).toBe(8); // 【確認内容】: ランクマッチの勝利数が正しく集計される 🔵
      expect(result.overall.losses).toBe(4); // 【確認内容】: ランクマッチの敗北数が正しく集計される 🔵
      expect(result.overall.winRate).toBe(66.7); // 【確認内容】: ランクマッチの勝率が正しく計算される（8/12*100=66.666...→66.7） 🔵
    });
  });

  describe('正常系: TC-008 - デフォルト期間の正常動作（直近7日間）', () => {
    test('startDateとendDateが省略された場合、直近7日間の統計が取得される', async () => {
      // 【テスト目的】: クエリパラメータが省略された場合のデフォルト値処理
      // 【テスト内容】: endDateは今日、startDateはendDateの7日前に設定される
      // 【期待される動作】: getDateBeforeDays()メソッドの動作、JST基準の日付取得
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 305-328より）

      // 【テストデータ準備】: 最も一般的な使用パターン（直近の成績確認）
      // 【初期条件設定】: パラメータなし（デフォルト期間: 直近7日間）
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const expectedEndDate = today.toISOString().split('T')[0] ?? '';
      const expectedStartDate = sevenDaysAgo.toISOString().split('T')[0] ?? '';

      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250101_001',
          date: expectedEndDate.replace(/-/g, '/'),
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す（パラメータなし）
      // 【処理内容】: デフォルト期間（直近7日間）を自動設定 → 統計計算
      const result = await service.calculateStatistics({});

      // 【結果検証】: dateRangeが直近7日間に設定されることを確認
      // 【期待値確認】: startDateは7日前、endDateは今日
      expect(result.dateRange.startDate).toBe(expectedStartDate); // 【確認内容】: 開始日が7日前に設定される 🔵
      expect(result.dateRange.endDate).toBe(expectedEndDate); // 【確認内容】: 終了日が今日に設定される 🔵
    });
  });

  // =============================================================================
  // 2. 異常系テストケース（エラーハンドリング）
  // =============================================================================

  describe('異常系: TC-101 - Blob Storage接続エラー', () => {
    test('Blob Storage接続エラー時に適切なエラーがスローされる', async () => {
      // 【テスト目的】: Blob Storage接続エラー時に適切なエラーがスローされること
      // 【エラーケースの概要】: Azure Blob Storageへの接続に失敗した場合
      // 【エラー処理の重要性】: インフラ障害時の適切なエラーハンドリングとユーザーへの通知
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 333-350より）

      // 【不正な理由】: ネットワーク障害、Storageアカウントの設定ミス、認証エラー
      // 【実際の発生シナリオ】: ネットワーク障害、Azure Storage障害、接続文字列の設定ミス
      mockBlobClient.getBattleLogs = jest.fn().mockRejectedValue(new Error('Blob Storage connection failed'));

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: エラーハンドリング → エラーのスロー
      const promise = service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: エラーがスローされることを確認
      // 【エラーメッセージの内容】: ユーザーに一時的な障害であることを伝える
      // 【システムの安全性】: エラー時もサーバーがクラッシュせず、500エラーを返す
      await expect(promise).rejects.toThrow('Blob Storage connection failed'); // 【確認内容】: エラーメッセージが正しくスローされる 🔵
    });
  });

  describe('異常系: TC-102 - データ取得失敗時のリトライ後エラー', () => {
    test('BlobStorageClientが3回リトライ後にエラーをスローする', async () => {
      // 【テスト目的】: BlobStorageClientが3回リトライ後にエラーをスローすること
      // 【エラーケースの概要】: 一時的なネットワークエラーが3回リトライ後も回復しない場合
      // 【エラー処理の重要性】: リトライ機構が正しく動作し、最終的にエラーを伝播すること
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 354-369より）

      // 【不正な理由】: 継続的なネットワーク障害、Storageサービスのダウン
      // 【実際の発生シナリオ】: 長時間のネットワーク障害、Azureメンテナンス
      mockBlobClient.getBattleLogs = jest
        .fn()
        .mockRejectedValue(new Error('Failed to read battle-logs.json after 3 attempts'));

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: リトライ3回 → エラーのスロー
      const promise = service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: リトライ回数と失敗理由を明示したエラーがスローされることを確認
      // 【エラーメッセージの内容】: リトライ回数と失敗理由を明示
      // 【システムの安全性】: リトライロジックがBlobStorageClient側で実行される
      await expect(promise).rejects.toThrow('Failed to read battle-logs.json after 3 attempts'); // 【確認内容】: リトライ失敗メッセージが正しくスローされる 🔵
    });
  });

  // =============================================================================
  // 3. 境界値テストケース（最小値、最大値、null等）
  // =============================================================================

  describe('境界値: TC-201 - データ0件の場合の統計計算', () => {
    test('期間内に対戦履歴が0件の場合、totalGames=0の統計が返される', async () => {
      // 【テスト目的】: データ件数がゼロ（最小値）の状態での安全な動作確認
      // 【境界値の意味】: データ件数がゼロ（最小値）の状態
      // 【境界値での動作保証】: ゼロ除算エラーを起こさず、適切なデータ構造を返す
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 374-412より）

      // 【境界値選択の根拠】: データが存在しない期間での統計取得
      // 【実際の使用場面】: システム初回利用時、まだ対戦していない期間の指定
      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue([]);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す（未来の期間を指定）
      // 【処理内容】: ゼロ除算を避け、winRate=0として安全に処理
      const result = await service.calculateStatistics({
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      });

      // 【結果検証】: totalGames=0の統計データが返されることを確認（エラーではない）
      // 【境界での正確性】: ゼロ除算を避け、winRate=0として安全に処理
      // 【一貫した動作】: エラーではなく、空の統計データを返す（REQ-405）
      expect(result.overall.totalGames).toBe(0); // 【確認内容】: 試合数が0件として集計される 🔵
      expect(result.overall.wins).toBe(0); // 【確認内容】: 勝利数が0件として集計される 🔵
      expect(result.overall.losses).toBe(0); // 【確認内容】: 敗北数が0件として集計される 🔵
      expect(result.overall.winRate).toBe(0); // 【確認内容】: ゼロ除算を避け、winRate=0として処理される 🔵

      expect(result.byMyDeck).toEqual([]); // 【確認内容】: マイデッキ別統計が空配列 🔵
      expect(result.byOpponentDeck).toEqual([]); // 【確認内容】: 相手デッキ別統計が空配列 🔵
      expect(result.byRank).toEqual([]); // 【確認内容】: ランク別統計が空配列 🔵

      expect(result.byTurn.先攻.totalGames).toBe(0); // 【確認内容】: 先攻の試合数が0件 🔵
      expect(result.byTurn.先攻.winRate).toBe(0); // 【確認内容】: 先攻の勝率が0 🔵
      expect(result.byTurn.後攻.totalGames).toBe(0); // 【確認内容】: 後攻の試合数が0件 🔵
      expect(result.byTurn.後攻.winRate).toBe(0); // 【確認内容】: 後攻の勝率が0 🔵

      expect(result.dateRange.startDate).toBe('2025-12-01'); // 【確認内容】: 開始日が正しく設定される 🔵
      expect(result.dateRange.endDate).toBe('2025-12-31'); // 【確認内容】: 終了日が正しく設定される 🔵
    });
  });

  describe('境界値: TC-202 - 勝率が割り切れない場合の丸め処理', () => {
    test('勝率が割り切れない場合、小数点第1位まで四捨五入される', async () => {
      // 【テスト目的】: 勝率計算の精度（小数点第1位）確認
      // 【境界値の意味】: 勝率計算の精度（小数点第1位）
      // 【境界値での動作保証】: 丸め処理が仕様通りに動作する
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 416-442より）

      // 【境界値選択の根拠】: 2 / 3 = 0.6666... の丸め処理を確認
      // 【実際の使用場面】: 少数試合での勝率計算
      const mockBattleLogs: BattleLog[] = [
        { id: 'log_20250101_001', date: '2025/01/01', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_001' },
        { id: 'log_20250102_001', date: '2025/01/02', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
        { id: 'log_20250103_001', date: '2025/01/03', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '負け', opponentDeckId: 'deck_master_003' },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: Math.round((2 / 3) * 1000) / 10 = 66.7
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: 勝率が小数点第1位まで四捨五入されることを確認
      // 【境界での正確性】: 66.666...が66.7に四捨五入される
      // 【一貫した動作】: すべての統計で同じ丸め処理が適用される
      expect(result.overall.totalGames).toBe(3); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.overall.wins).toBe(2); // 【確認内容】: 勝利数が正しく集計される 🔵
      expect(result.overall.losses).toBe(1); // 【確認内容】: 敗北数が正しく集計される 🔵
      expect(result.overall.winRate).toBe(66.7); // 【確認内容】: 勝率が小数点第1位まで四捨五入される（2/3*100=66.666...→66.7） 🔵
    });
  });

  describe('境界値: TC-203 - すべて勝利の場合の勝率計算', () => {
    test('すべて勝利の場合、winRate=100.0が返される', async () => {
      // 【テスト目的】: 勝率100%の正常処理確認
      // 【境界値の意味】: 勝率の最大値（100%）
      // 【境界値での動作保証】: 勝率100%が正しく計算される
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 445-472より）

      // 【境界値選択の根拠】: 勝率の上限値をテスト
      // 【実際の使用場面】: 特定のデッキで連勝している場合
      const mockBattleLogs: BattleLog[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
        date: '2025/01/01',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_001',
      }));

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: (10 / 10) * 100 = 100.0
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: 勝率100%が正しく計算されることを確認
      // 【境界での正確性】: 100.0が正しく返される
      // 【一貫した動作】: 小数点第1位まで表示
      expect(result.overall.totalGames).toBe(10); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.overall.wins).toBe(10); // 【確認内容】: 勝利数が正しく集計される 🔵
      expect(result.overall.losses).toBe(0); // 【確認内容】: 敗北数が0件として集計される 🔵
      expect(result.overall.winRate).toBe(100.0); // 【確認内容】: 勝率が100.0として計算される 🔵
    });
  });

  describe('境界値: TC-204 - すべて敗北の場合の勝率計算', () => {
    test('すべて敗北の場合、winRate=0.0が返される', async () => {
      // 【テスト目的】: 勝率0%の正常処理確認
      // 【境界値の意味】: 勝率の最小値（0%）
      // 【境界値での動作保証】: 勝率0%が正しく計算される
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 476-502より）

      // 【境界値選択の根拠】: 勝率の下限値をテスト
      // 【実際の使用場面】: 特定のデッキで全敗している場合
      const mockBattleLogs: BattleLog[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
        date: '2025/01/01',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '負け' as const,
        opponentDeckId: 'deck_master_001',
      }));

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: (0 / 10) * 100 = 0.0
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: 勝率0%が正しく計算されることを確認
      // 【境界での正確性】: 0.0が正しく返される
      // 【一貫した動作】: 小数点第1位まで表示
      expect(result.overall.totalGames).toBe(10); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.overall.wins).toBe(0); // 【確認内容】: 勝利数が0件として集計される 🔵
      expect(result.overall.losses).toBe(10); // 【確認内容】: 敗北数が正しく集計される 🔵
      expect(result.overall.winRate).toBe(0.0); // 【確認内容】: 勝率が0.0として計算される 🔵
    });
  });

  describe('境界値: TC-205 - 存在しないデッキIDが含まれる場合', () => {
    test('存在しないデッキIDが含まれる場合、"不明なデッキ"として統計に含まれる', async () => {
      // 【テスト目的】: マスターデータ不整合時の安全な動作確認
      // 【境界値の意味】: マスターデータとの不整合
      // 【境界値での動作保証】: 参照エラーを起こさず、フォールバック値を使用
      // 🔵 信頼性レベル: 青信号（testcases.md Lines 505-535より）

      // 【境界値選択の根拠】: デッキ削除後も対戦履歴が残るケース
      // 【実際の使用場面】: ユーザーがデッキを削除した後、過去の統計を確認
      const mockBattleLogs: BattleLog[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
        date: '2025/01/01',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deleted_deck_001',
        turn: '先攻' as const,
        result: i < 6 ? ('勝ち' as const) : ('負け' as const),
        opponentDeckId: 'deck_master_001',
      }));

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]); // deleted_deck_001は存在しない

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す
      // 【処理内容】: デッキ名取得時にフォールバック → "不明なデッキ"
      const result = await service.calculateStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      // 【結果検証】: "不明なデッキ"として統計に含まれることを確認
      // 【境界での正確性】: 存在しないIDでもエラーにならず、統計に含まれる
      // 【一貫した動作】: デッキ名のみフォールバック、統計は正常に計算
      expect(result.byMyDeck).toHaveLength(1); // 【確認内容】: 1つのデッキが集計される 🔵
      expect(result.byMyDeck[0]?.deckId).toBe('deleted_deck_001'); // 【確認内容】: デッキIDが正しく設定される 🔵
      expect(result.byMyDeck[0]?.deckName).toBe('不明なデッキ'); // 【確認内容】: フォールバック値が使用される 🔵
      expect(result.byMyDeck[0]?.totalGames).toBe(10); // 【確認内容】: 試合数が正しく集計される 🔵
      expect(result.byMyDeck[0]?.wins).toBe(6); // 【確認内容】: 勝利数が正しく集計される 🔵
      expect(result.byMyDeck[0]?.losses).toBe(4); // 【確認内容】: 敗北数が正しく集計される 🔵
      expect(result.byMyDeck[0]?.winRate).toBe(60.0); // 【確認内容】: 勝率が正しく計算される 🔵
    });
  });

  describe('境界値: TC-206 - 期間の境界値（startDate = endDate）', () => {
    test('startDateとendDateが同一の場合、1日分の統計が返される', async () => {
      // 【テスト目的】: 最小期間での正常動作確認
      // 【境界値の意味】: 期間の最小単位（1日）
      // 【境界値での動作保証】: 1日のみの期間指定でも正常に動作
      // 🟡 信頼性レベル: 黄信号（一般的な境界値テストから推測）

      // 【境界値選択の根拠】: 特定の1日の成績を確認するケース
      // 【実際の使用場面】: 特定日の成績を詳細に分析
      const mockBattleLogs: BattleLog[] = [
        { id: 'log_20250115_001', date: '2025/01/15', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_001' },
        { id: 'log_20250115_002', date: '2025/01/15', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
        { id: 'log_20250115_003', date: '2025/01/15', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_003' },
        { id: 'log_20250115_004', date: '2025/01/15', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '負け', opponentDeckId: 'deck_master_004' },
        { id: 'log_20250115_005', date: '2025/01/15', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '負け', opponentDeckId: 'deck_master_005' },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: calculateStatistics() メソッドを呼び出す（同一日を指定）
      // 【処理内容】: 期間フィルタリング（1日のみ） → 統計計算
      const result = await service.calculateStatistics({
        startDate: '2025-01-15',
        endDate: '2025-01-15',
      });

      // 【結果検証】: 同一日の範囲でも正常に集計されることを確認
      // 【境界での正確性】: 同一日の範囲でも正常に集計される
      // 【一貫した動作】: 期間フィルタリングロジックが境界値でも動作
      expect(result.overall.totalGames).toBe(5); // 【確認内容】: 1日分の試合数が集計される 🟡
      expect(result.overall.wins).toBe(3); // 【確認内容】: 勝利数が正しく集計される 🟡
      expect(result.overall.losses).toBe(2); // 【確認内容】: 敗北数が正しく集計される 🟡
      expect(result.overall.winRate).toBe(60.0); // 【確認内容】: 勝率が正しく計算される（3/5*100=60.0） 🟡
      expect(result.dateRange.startDate).toBe('2025-01-15'); // 【確認内容】: 開始日が正しく設定される 🟡
      expect(result.dateRange.endDate).toBe('2025-01-15'); // 【確認内容】: 終了日が正しく設定される 🟡
    });
  });
});
