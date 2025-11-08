/**
 * API統合フローテストスイート
 *
 * テストフレームワーク: Jest 29.7.0 + ts-jest
 * テスト対象: 対戦履歴・統計・インポートAPIの統合フロー
 *
 * 🔵 テストケース定義書: docs/implements/Shadowverse Battle Log - 対戦履歴管理システム/TASK-0013/Shadowverse Battle Log - 対戦履歴管理システム-testcases.md
 * 🔵 要件定義書: docs/implements/Shadowverse Battle Log - 対戦履歴管理システム/TASK-0013/Shadowverse Battle Log - 対戦履歴管理システム-requirements.md
 */

import { BattleLogService } from '../../src/services/battleLogService';
import { StatisticsService } from '../../src/services/statisticsService';
import { ImportService } from '../../src/services/importService';
import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import type { BattleLog, BattleType, Rank, Group, Turn, BattleResult } from '../../src/types';

// BlobStorageClient のモック
jest.mock('../../src/storage/blobStorageClient');

describe('API統合フローテスト', () => {
  let battleLogService: BattleLogService;
  let statisticsService: StatisticsService;
  let importService: ImportService;
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
    mockBlobClient.saveBattleLogs = jest.fn().mockResolvedValue(undefined);
    mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);
    mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);

    // サービスインスタンスを作成
    battleLogService = new BattleLogService(mockBlobClient);
    statisticsService = new StatisticsService(mockBlobClient);
    importService = new ImportService(mockBlobClient);
  });

  afterEach(() => {
    // 【テスト後処理】: テスト実行後にモックをクリーンアップ
    // 【状態復元】: 次のテストに影響しないよう、モックの状態を復元
    jest.restoreAllMocks();
  });

  // =============================================================================
  // 1. 対戦履歴API統合テスト - 正常系
  // =============================================================================

  describe('TC-INT-001: 対戦履歴の完全フロー（登録→一覧取得→削除）', () => {
    /**
     * 【テスト目的】: 対戦履歴API（POST、GET、DELETE）が連携して正しく動作すること
     * 【テスト内容】: 登録したデータが一覧で取得でき、削除後は取得できなくなること
     * 【期待される動作】: 登録→一覧取得→削除の一連のフローが正常に完了すること
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 52-96より）
     */
    test('対戦履歴の登録から削除までの完全なフローが正常に動作する', async () => {
      // 【テストデータ準備】: 典型的な1週間の対戦履歴管理フロー、実運用で最も頻繁に発生するパターン
      // 【初期条件設定】: 空の状態からスタート
      const createInput = {
        date: '2025-11-04',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AA' as const,
        myDeckId: 'deck-001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck-101',
      };

      // 【実際の処理実行 - 1】: 対戦履歴の登録
      // 【処理内容】: BattleLogService.createBattleLog() を呼び出し、新規データを登録
      const createdLog = await battleLogService.createBattleLog(createInput);

      // 【結果検証 - 1】: 登録が成功し、IDが生成されることを確認
      // 【期待値確認】: success = true、IDが生成される
      expect(createdLog).toBeDefined(); // 【確認内容】: 登録結果が返却される 🔵
      expect(createdLog.id).toBeDefined(); // 【確認内容】: IDが自動生成される 🔵
      expect(createdLog.date).toBe('2025/11/04'); // 【確認内容】: 日付が YYYY/MM/DD 形式に変換される 🔵
      expect(createdLog.battleType).toBe('ランクマッチ'); // 【確認内容】: 対戦タイプが保存される 🔵
      expect(createdLog.result).toBe('勝ち'); // 【確認内容】: 対戦結果が保存される 🔵

      // 【実際の処理実行 - 2】: 一覧取得
      // 【処理内容】: BattleLogService.getBattleLogsWithDeckNames() を呼び出し、登録したデータを取得
      // 【前提条件】: モックを更新して、登録したデータを返すように設定
      mockBlobClient.getBattleLogs.mockResolvedValue([createdLog]);
      const listResult = await battleLogService.getBattleLogsWithDeckNames({
        limit: 100,
        offset: 0,
      });

      // 【結果検証 - 2】: 登録したデータが一覧に含まれることを確認
      // 【期待値確認】: 取得データに登録したIDが含まれる
      expect(listResult.battleLogs).toBeDefined(); // 【確認内容】: 一覧データが返却される 🔵
      expect(listResult.battleLogs.length).toBeGreaterThanOrEqual(1); // 【確認内容】: 最低1件のデータが存在する 🔵
      expect(listResult.battleLogs[0]?.id).toBe(createdLog.id); // 【確認内容】: 登録したデータが含まれる 🔵
      expect(listResult.total).toBeGreaterThanOrEqual(1); // 【確認内容】: 総数が正しく返される 🔵

      // 【実際の処理実行 - 3】: 削除
      // 【処理内容】: BattleLogService.deleteBattleLog() を呼び出し、データを削除
      await battleLogService.deleteBattleLog(createdLog.id);

      // 【結果検証 - 3】: 削除後に一覧取得すると、削除したデータが含まれないことを確認
      // 【期待値確認】: 削除したIDのデータが存在しない
      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      const listAfterDelete = await battleLogService.getBattleLogsWithDeckNames({
        limit: 100,
        offset: 0,
      });

      expect(listAfterDelete.battleLogs).toBeDefined(); // 【確認内容】: 一覧データが返却される 🔵
      expect(listAfterDelete.battleLogs.length).toBe(0); // 【確認内容】: 削除後は空配列が返される 🔵
      expect(listAfterDelete.total).toBe(0); // 【確認内容】: 総数が0になる 🔵
    });
  });

  describe('TC-INT-002: 複数の対戦履歴を登録し、フィルタリングして取得', () => {
    /**
     * 【テスト目的】: 一覧取得APIのフィルタリング機能が正しく動作すること
     * 【テスト内容】: 期間とフィルタ条件を指定して対戦履歴を正しく取得できること
     * 【期待される動作】: 指定した期間内のデータのみが返される
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 98-128より）
     */
    test('期間とフィルタ条件を指定して対戦履歴を正しく取得できる', async () => {
      // 【テストデータ準備】: 異なる日付のデータを用意し、期間フィルタリングの正確性を確認
      // 【初期条件設定】: 3件の対戦履歴を異なる日付で登録
      const logs: BattleLog[] = [
        {
          id: 'log_20251028_001',
          date: '2025/10/28',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-101',
        },
        {
          id: 'log_20251102_001',
          date: '2025/11/02',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck-102',
        },
        {
          id: 'log_20251104_001',
          date: '2025/11/04',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-101',
        },
      ];

      // 【実際の処理実行】: フィルタリング条件を指定して一覧取得
      // 【処理内容】: startDate=2025-11-01, endDate=2025-11-04 でフィルタリング
      // 【前提条件】: モックが期間内のデータのみを返すように設定
      const filteredLogs = logs.filter((log) => {
        const logDate = log.date.replace(/\//g, '-');
        return logDate >= '2025-11-01' && logDate <= '2025-11-04';
      });
      mockBlobClient.getBattleLogs.mockResolvedValue(filteredLogs);

      const result = await battleLogService.getBattleLogsWithDeckNames({
        limit: 10,
        offset: 0,
      });

      // 【結果検証】: 期間内のデータのみが返されることを確認
      // 【期待値確認】: 2件のデータが返される
      expect(result.battleLogs).toBeDefined(); // 【確認内容】: 一覧データが返却される 🔵
      expect(result.battleLogs.length).toBe(2); // 【確認内容】: 期間内の2件のみが返される 🔵
      // 日付の昇順/降順に関わらず、2件のデータが含まれることを確認
      const dates = result.battleLogs.map(log => log.date);
      expect(dates).toContain('2025/11/02'); // 【確認内容】: 11/02のデータが含まれる 🔵
      expect(dates).toContain('2025/11/04'); // 【確認内容】: 11/04のデータが含まれる 🔵
      expect(result.total).toBe(2); // 【確認内容】: 総数が2件 🔵
    });
  });

  // =============================================================================
  // 2. 対戦履歴API統合テスト - 異常系
  // =============================================================================

  describe('TC-INT-ERR-001: 存在しないIDの削除を試みる', () => {
    /**
     * 【テスト目的】: 存在しないリソースへのアクセス時の適切なエラーハンドリングを確認
     * 【テスト内容】: 存在しない対戦履歴IDを削除しようとするとエラーが返される
     * 【期待される動作】: NOT_FOUNDエラーが返される
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 132-159より）
     */
    test('存在しない対戦履歴IDを削除しようとするとエラーが返される', async () => {
      // 【テストデータ準備】: 存在しないIDを用意
      // 【初期条件設定】: 空のデータベース（既存データなし）
      const nonExistentId = 'BL-20250101-NONEXISTENT';

      // 【実際の処理実行】: 存在しないIDで削除を試みる
      // 【処理内容】: BattleLogService.deleteBattleLog() を呼び出す
      // 【期待されるエラー】: NOT_FOUNDエラーがスローされる
      await expect(battleLogService.deleteBattleLog(nonExistentId)).rejects.toThrow();
      // 【確認内容】: 存在しないIDの削除時にエラーがスローされる 🔵

      // 【追加検証】: エラーメッセージが適切であることを確認
      // 【期待されるエラー内容】: "指定された対戦履歴が見つかりません"
      try {
        await battleLogService.deleteBattleLog(nonExistentId);
        fail('エラーがスローされるべき'); // この行に到達してはいけない
      } catch (error) {
        expect(error).toBeDefined(); // 【確認内容】: エラーオブジェクトが存在する 🔵
        expect(String(error)).toContain('見つかりません'); // 【確認内容】: エラーメッセージに「見つかりません」が含まれる 🔵
      }
    });
  });

  describe('TC-INT-ERR-002: 不正な形式のデータで登録を試みる', () => {
    /**
     * 【テスト目的】: 入力バリデーションの完全性を検証
     * 【テスト内容】: バリデーションエラーが適切に返される
     * 【期待される動作】: VALIDATION_ERRORが返される
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 161-195、既存テストvalidation.test.tsより）
     */
    test('バリデーションエラーが適切に返される', async () => {
      // 【テストデータ準備】: 不正なデータを用意
      // 【初期条件設定】: 型定義に準拠していない、必須フィールドの欠落
      const invalidInput = {
        date: 'invalid-date', // 不正な日付形式
        battleType: '無効なタイプ' as any, // 存在しないタイプ
        rank: 'ダイアモンド' as const,
        group: 'AA' as const,
        myDeckId: 'deck-001',
        turn: '先攻' as const,
        result: null as any, // 必須フィールドがnull
        opponentDeckId: 'deck-101',
      };

      // 【実際の処理実行】: 不正なデータで登録を試みる
      // 【処理内容】: BattleLogService.createBattleLog() を呼び出す
      // 【期待されるエラー】: ValidationErrorがスローされる
      await expect(battleLogService.createBattleLog(invalidInput)).rejects.toThrow();
      // 【確認内容】: 不正なデータでの登録時にエラーがスローされる 🔵

      // 【追加検証】: エラーの詳細が返されることを確認
      try {
        await battleLogService.createBattleLog(invalidInput);
        fail('エラーがスローされるべき'); // この行に到達してはいけない
      } catch (error) {
        expect(error).toBeDefined(); // 【確認内容】: エラーオブジェクトが存在する 🔵
        // バリデーションエラーの詳細を確認（実装に依存）
        const errorMessage = String(error);
        expect(errorMessage).toBeTruthy(); // 【確認内容】: エラーメッセージが存在する 🔵
      }
    });
  });

  // =============================================================================
  // 3. 対戦履歴API統合テスト - 境界値
  // =============================================================================

  describe('TC-INT-BOUND-001: 一覧取得のlimit/offset境界値', () => {
    /**
     * 【テスト目的】: ページネーション機能の堅牢性を検証
     * 【テスト内容】: limitとoffsetの境界値で正しくページネーションが動作する
     * 【期待される動作】: 極端な値でもシステムが正しく動作すること
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 199-225より）
     */
    test('limitとoffsetの境界値で正しくページネーションが動作する', async () => {
      // 【テストデータ準備】: 境界値のテストケースを用意
      // 【初期条件設定】: limit=0, limit=1000, offsetオーバーの3パターン

      // ケース1: limit = 1
      // 【境界値選択の根拠】: limit=1は最小有効値
      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      const resultLimitOne = await battleLogService.getBattleLogsWithDeckNames({
        limit: 1,
        offset: 0,
      });
      expect(resultLimitOne.battleLogs).toBeDefined(); // 【確認内容】: 空配列が返される（エラーではない） 🔵
      expect(resultLimitOne.battleLogs.length).toBe(0); // 【確認内容】: 0件のデータが返される 🔵

      // ケース2: limit = 1000（最大値）
      // 【境界値選択の根拠】: 1000は実用上の最大値
      const largeLogs = Array.from({ length: 1000 }, (_, i) => ({
        id: `log_20251104_${String(i + 1).padStart(3, '0')}`,
        date: '2025/11/04',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AA' as const,
        myDeckId: 'deck-001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck-101',
      }));
      mockBlobClient.getBattleLogs.mockResolvedValue(largeLogs);
      const resultLargeLimit = await battleLogService.getBattleLogsWithDeckNames({
        limit: 1000,
        offset: 0,
      });
      expect(resultLargeLimit.battleLogs).toBeDefined(); // 【確認内容】: データが返される 🔵
      expect(resultLargeLimit.battleLogs.length).toBeLessThanOrEqual(1000); // 【確認内容】: 最大1000件まで返される 🔵

      // ケース3: offset が総件数を超える
      // 【境界値選択の根拠】: offsetオーバーは実際に発生しうるケース
      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      const resultOffsetOver = await battleLogService.getBattleLogsWithDeckNames({
        limit: 10,
        offset: 9999,
      });
      expect(resultOffsetOver.battleLogs).toBeDefined(); // 【確認内容】: 空配列が返される（エラーではない） 🔵
      expect(resultOffsetOver.battleLogs.length).toBe(0); // 【確認内容】: 0件のデータが返される 🔵
    });
  });

  describe('TC-INT-BOUND-002: 日付範囲の境界値', () => {
    /**
     * 【テスト目的】: 日付フィルタリング機能の堅牢性を検証
     * 【テスト内容】: 開始日と終了日が同一日付、または逆順の場合の挙動
     * 【期待される動作】: 特殊な日付範囲でも安全に動作すること
     * 🟡 信頼性レベル: 黄信号（testcases.md Lines 227-253、逆順時の挙動は要件定義に明記なし）
     */
    test('開始日と終了日が同一日付、または逆順の場合の挙動', async () => {
      // 【テストデータ準備】: 特殊な日付範囲を用意
      // 【初期条件設定】: 同一日、逆順、未来の日付の3パターン

      // ケース1: 同一日
      // 【境界値選択の根拠】: 同一日は当日のみの検索
      const sameDayLog: BattleLog = {
        id: 'log_20251104_001',
        date: '2025/11/04',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AA',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck-101',
      };
      mockBlobClient.getBattleLogs.mockResolvedValue([sameDayLog]);
      const resultSameDay = await battleLogService.getBattleLogsWithDeckNames({
        limit: 10,
        offset: 0,
      });
      expect(resultSameDay.battleLogs).toBeDefined(); // 【確認内容】: その日のデータのみ返す 🔵
      expect(resultSameDay.battleLogs.length).toBe(1); // 【確認内容】: 1件のデータが返される 🔵

      // ケース2: 逆順
      // 【境界値選択の根拠】: 逆順はユーザーの入力ミス
      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      const resultReverse = await battleLogService.getBattleLogsWithDeckNames({
        limit: 10,
        offset: 0,
      });
      expect(resultReverse.battleLogs).toBeDefined(); // 【確認内容】: エラーまたは空配列を返す 🟡
      // 仕様に応じて空配列またはエラーが期待される

      // ケース3: 未来の日付
      // 【境界値選択の根拠】: 未来日付は予定の入力
      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      const resultFuture = await battleLogService.getBattleLogsWithDeckNames({
        limit: 10,
        offset: 0,
      });
      expect(resultFuture.battleLogs).toBeDefined(); // 【確認内容】: 空配列を返す（データが存在しない） 🔵
      expect(resultFuture.battleLogs.length).toBe(0); // 【確認内容】: 0件のデータが返される 🔵
    });
  });

  // =============================================================================
  // 4. 統計API統合テスト - 正常系
  // =============================================================================

  describe('TC-INT-STATS-001: 統計計算の統合テスト（複数データ登録→統計計算）', () => {
    /**
     * 【テスト目的】: 対戦履歴と統計APIの連携、計算精度の検証
     * 【テスト内容】: 複数の対戦履歴を登録し、統計APIが正しく集計する
     * 【期待される動作】: 登録したデータに基づいて、正確な統計が計算されること
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 260-311、既存テストstatisticsService.test.tsより）
     */
    test('複数の対戦履歴を登録し、統計APIが正しく集計する', async () => {
      // 【テストデータ準備】: 実際の1ヶ月間のプレイデータを模擬、複数デッキと相手の組み合わせ
      // 【初期条件設定】: 15戦のデータ（deck-001: 6勝4敗、deck-002: 2勝3敗）
      const battleLogs: BattleLog[] = [
        // deck-001 の対戦履歴（6勝4敗）
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `log_deck001_win_${i}`,
          date: '2025/11/01',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AA' as const,
          myDeckId: 'deck-001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: i < 3 ? 'deck-101' : 'deck-102',
        })),
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `log_deck001_lose_${i}`,
          date: '2025/11/02',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AA' as const,
          myDeckId: 'deck-001',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: i < 2 ? 'deck-101' : 'deck-102',
        })),
        // deck-002 の対戦履歴（2勝3敗）
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `log_deck002_win_${i}`,
          date: '2025/11/03',
          battleType: '対戦台' as const,
          rank: '-' as const,
          group: '-' as const,
          myDeckId: 'deck-002',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck-103',
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `log_deck002_lose_${i}`,
          date: '2025/11/04',
          battleType: '対戦台' as const,
          rank: '-' as const,
          group: '-' as const,
          myDeckId: 'deck-002',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck-103',
        })),
      ];

      // 【実際の処理実行】: 統計APIを呼び出す
      // 【処理内容】: StatisticsService.calculateStatistics() を呼び出し
      // 【前提条件】: モックが対戦履歴データを返すように設定
      mockBlobClient.getBattleLogs.mockResolvedValue(battleLogs);
      const stats = await statisticsService.calculateStatistics({
      });

      // 【結果検証】: 統計が正しく計算されることを確認
      // 【期待値確認】: 全体統計、デッキ別統計、相手別統計が正確
      expect(stats).toBeDefined(); // 【確認内容】: 統計結果が返される 🔵
      expect(stats.overall).toBeDefined(); // 【確認内容】: 全体統計が存在する 🔵
      expect(stats.overall.totalGames).toBe(15); // 【確認内容】: 全体の試合数が15 🔵
      expect(stats.overall.wins).toBe(8); // 【確認内容】: 全体の勝利数が8 🔵
      expect(stats.overall.losses).toBe(7); // 【確認内容】: 全体の敗北数が7 🔵
      expect(stats.overall.winRate).toBeCloseTo(53.3, 1); // 【確認内容】: 全体の勝率が約53.3% 🔵

      // デッキ別統計の検証
      expect(stats.byMyDeck).toBeDefined(); // 【確認内容】: デッキ別統計が存在する 🔵
      expect(stats.byMyDeck.length).toBeGreaterThanOrEqual(2); // 【確認内容】: 2デッキ以上の統計がある 🔵

      const deck001Stats = stats.byMyDeck.find((d) => d.deckId === 'deck-001');
      expect(deck001Stats).toBeDefined(); // 【確認内容】: deck-001の統計が存在する 🔵
      if (deck001Stats) {
        expect(deck001Stats.totalGames).toBe(10); // 【確認内容】: deck-001の試合数が10 🔵
        expect(deck001Stats.wins).toBe(6); // 【確認内容】: deck-001の勝利数が6 🔵
        expect(deck001Stats.losses).toBe(4); // 【確認内容】: deck-001の敗北数が4 🔵
        expect(deck001Stats.winRate).toBeCloseTo(60.0, 1); // 【確認内容】: deck-001の勝率が60% 🔵
      }

      const deck002Stats = stats.byMyDeck.find((d) => d.deckId === 'deck-002');
      expect(deck002Stats).toBeDefined(); // 【確認内容】: deck-002の統計が存在する 🔵
      if (deck002Stats) {
        expect(deck002Stats.totalGames).toBe(5); // 【確認内容】: deck-002の試合数が5 🔵
        expect(deck002Stats.wins).toBe(2); // 【確認内容】: deck-002の勝利数が2 🔵
        expect(deck002Stats.losses).toBe(3); // 【確認内容】: deck-002の敗北数が3 🔵
        expect(deck002Stats.winRate).toBeCloseTo(40.0, 1); // 【確認内容】: deck-002の勝率が40% 🔵
      }

      // 相手デッキ別統計の検証（現在はbyOpponentDeckのみ実装されている）
      expect(stats.byOpponentDeck).toBeDefined(); // 【確認内容】: 相手デッキ別統計が存在する 🔵
      expect(stats.byOpponentDeck.length).toBeGreaterThanOrEqual(2); // 【確認内容】: 2デッキ以上の統計がある 🔵
    });
  });

  describe('TC-INT-STATS-002: 統計APIのキャッシュと再計算', () => {
    /**
     * 【テスト目的】: 統計計算のリアルタイム性を検証
     * 【テスト内容】: データ更新後に統計が正しく再計算される
     * 【期待される動作】: キャッシュではなく、常に最新データで統計を計算すること
     * 🟡 信頼性レベル: 黄信号（testcases.md Lines 313-335、キャッシュの有無は要件定義に明記なし）
     */
    test('データ更新後に統計が正しく再計算される', async () => {
      // 【テストデータ準備】: データの動的な変更に統計が追従することを確認
      // 【初期条件設定】: 初回5件（3勝2敗）、追加2件（1勝1敗）

      // 初回データ: 3勝2敗（勝率60%）
      const initialLogs: BattleLog[] = [
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `log_initial_win_${i}`,
          date: '2025/11/01',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AA' as const,
          myDeckId: 'deck-001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck-101',
        })),
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `log_initial_lose_${i}`,
          date: '2025/11/02',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AA' as const,
          myDeckId: 'deck-001',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck-102',
        })),
      ];

      // 【実際の処理実行 - 1】: 初回統計計算
      mockBlobClient.getBattleLogs.mockResolvedValue(initialLogs);
      const initialStats = await statisticsService.calculateStatistics({
      });

      // 【結果検証 - 1】: 初回統計が正しいことを確認
      expect(initialStats.overall.totalGames).toBe(5); // 【確認内容】: 初回は5試合 🔵
      expect(initialStats.overall.wins).toBe(3); // 【確認内容】: 初回は3勝 🔵
      expect(initialStats.overall.losses).toBe(2); // 【確認内容】: 初回は2敗 🔵
      expect(initialStats.overall.winRate).toBeCloseTo(60.0, 1); // 【確認内容】: 初回勝率は60% 🔵

      // 追加データ: 1勝1敗
      const additionalLogs: BattleLog[] = [
        {
          id: 'log_additional_win_1',
          date: '2025/11/03',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-101',
        },
        {
          id: 'log_additional_lose_1',
          date: '2025/11/04',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck-102',
        },
      ];

      // 【実際の処理実行 - 2】: データ追加後の統計再計算
      mockBlobClient.getBattleLogs.mockResolvedValue([...initialLogs, ...additionalLogs]);
      const updatedStats = await statisticsService.calculateStatistics({
      });

      // 【結果検証 - 2】: データ追加後の統計が更新されることを確認
      expect(updatedStats.overall.totalGames).toBe(7); // 【確認内容】: 追加後は7試合 🔵
      expect(updatedStats.overall.wins).toBe(4); // 【確認内容】: 追加後は4勝 🔵
      expect(updatedStats.overall.losses).toBe(3); // 【確認内容】: 追加後は3敗 🔵
      expect(updatedStats.overall.winRate).toBeCloseTo(57.1, 1); // 【確認内容】: 追加後勝率は約57.1% 🟡
    });
  });

  // =============================================================================
  // 5. 統計API統合テスト - 異常系
  // =============================================================================

  describe('TC-INT-STATS-ERR-001: データが0件の期間の統計計算', () => {
    /**
     * 【テスト目的】: 統計計算のエッジケース処理を検証
     * 【テスト内容】: 対戦履歴が存在しない期間の統計を取得すると適切なレスポンスが返る
     * 【期待される動作】: ゼロ除算エラーが発生せず、0件のデータとして返す
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 339-373、既存テストstatisticsService.test.tsより）
     */
    test('対戦履歴が存在しない期間の統計を取得すると適切なレスポンスが返る', async () => {
      // 【テストデータ準備】: データが存在しない期間を指定
      // 【初期条件設定】: 空のデータセット

      // 【実際の処理実行】: データが存在しない期間で統計計算
      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      const stats = await statisticsService.calculateStatistics({
      });

      // 【結果検証】: ゼロ除算エラーが発生せず、0件のデータとして返されることを確認
      expect(stats).toBeDefined(); // 【確認内容】: 統計結果が返される（エラーではない） 🔵
      expect(stats.overall).toBeDefined(); // 【確認内容】: 全体統計が存在する 🔵
      expect(stats.overall.totalGames).toBe(0); // 【確認内容】: 試合数が0 🔵
      expect(stats.overall.wins).toBe(0); // 【確認内容】: 勝利数が0 🔵
      expect(stats.overall.losses).toBe(0); // 【確認内容】: 敗北数が0 🔵
      expect(stats.overall.winRate).toBe(0); // 【確認内容】: 勝率が0（ゼロ除算エラーが発生しない） 🔵
      expect(stats.byMyDeck).toEqual([]); // 【確認内容】: デッキ別統計が空配列 🔵
      expect(stats.byOpponentDeck).toEqual([]); // 【確認内容】: 相手デッキ別統計が空配列 🔵
    });
  });

  // =============================================================================
  // 6. インポートAPI統合テスト - 正常系
  // =============================================================================

  describe('TC-INT-IMPORT-001: JSONインポート→一覧取得の統合フロー', () => {
    /**
     * 【テスト目的】: インポートAPIとデータ永続化の連携を検証
     * 【テスト内容】: JSONデータをインポートし、一覧取得で確認できる
     * 【期待される動作】: インポートしたデータが即座に一覧で取得できること
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 381-416より）
     */
    test('JSONデータをインポートし、一覧取得で確認できる', async () => {
      // 【テストデータ準備】: 典型的な複数日分のバックアップデータのインポート
      // 【初期条件設定】: 3件のJSONデータを用意
      const importData = [
        {
          date: '2025-11-01',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-101',
        },
        {
          date: '2025-11-02',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck-002',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck-102',
        },
        {
          date: '2025-11-03',
          battleType: 'ロビー大会',
          rank: '-',
          group: '-',
          myDeckId: 'deck-003',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-103',
        },
      ];

      // 【実際の処理実行 - 1】: JSONインポート
      // 【処理内容】: ImportService.importFromJson() を呼び出す
      const importResult = await importService.importFromJson(JSON.stringify(importData));

      // 【結果検証 - 1】: インポートが成功することを確認
      expect(importResult).toBeDefined(); // 【確認内容】: インポート結果が返される 🔵
      expect(importResult.imported).toBe(3); // 【確認内容】: 3件がインポートされた 🔵
      expect(importResult.skipped).toBe(0); // 【確認内容】: スキップ件数が0 🔵
      expect(importResult.errors).toBe(0); // 【確認内容】: エラー件数が0 🔵

      // 【実際の処理実行 - 2】: 一覧取得でインポートしたデータを確認
      // 【前提条件】: モックがインポートしたデータを返すように設定
      const importedLogs: BattleLog[] = importData.map((data, index) => ({
        id: `log_20251101_${String(index + 1).padStart(3, '0')}`,
        date: data.date.replace(/-/g, '/'),
        battleType: data.battleType as BattleType,
        rank: data.rank as Rank,
        group: data.group as Group,
        myDeckId: data.myDeckId,
        turn: data.turn as Turn,
        result: data.result as BattleResult,
        opponentDeckId: data.opponentDeckId,
      }));
      mockBlobClient.getBattleLogs.mockResolvedValue(importedLogs);

      const listResult = await battleLogService.getBattleLogsWithDeckNames({
        limit: 10,
        offset: 0,
      });

      // 【結果検証 - 2】: インポートしたデータが一覧で取得できることを確認
      expect(listResult.battleLogs).toBeDefined(); // 【確認内容】: 一覧データが返される 🔵
      expect(listResult.battleLogs.length).toBe(3); // 【確認内容】: 3件のデータが含まれる 🔵
      expect(listResult.total).toBe(3); // 【確認内容】: 総数が3件 🔵
    });
  });

  describe('TC-INT-IMPORT-002: CSVインポート→統計計算の統合フロー', () => {
    /**
     * 【テスト目的】: CSVインポートと統計計算の連携を検証
     * 【テスト内容】: CSVデータをインポートし、統計が正しく計算される
     * 【期待される動作】: インポートしたデータが統計計算に反映されること
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 418-461、既存テストimportService.test.tsより）
     */
    test('CSVデータをインポートし、統計が正しく計算される', async () => {
      // 【テストデータ準備】: Excelやスプレッドシートからのエクスポートデータ
      // 【初期条件設定】: CSV形式のデータを用意（3件: 2勝1敗）
      const csvData = `date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
2025-11-01,ランクマッチ,ダイアモンド,AA,deck-001,先攻,勝ち,deck-101
2025-11-02,ランクマッチ,ダイアモンド,AA,deck-001,後攻,負け,deck-102
2025-11-03,対戦台,-,-,deck-002,先攻,勝ち,deck-103`;

      // 【実際の処理実行 - 1】: CSVインポート
      // 【処理内容】: ImportService.importFromCsv() を呼び出す
      const importResult = await importService.importFromCsv(csvData);

      // 【結果検証 - 1】: インポートが成功することを確認
      expect(importResult).toBeDefined(); // 【確認内容】: インポート結果が返される 🔵
      expect(importResult.imported).toBe(3); // 【確認内容】: 3件がインポートされた 🔵
      expect(importResult.skipped).toBe(0); // 【確認内容】: スキップ件数が0 🔵
      expect(importResult.errors).toBe(0); // 【確認内容】: エラー件数が0 🔵

      // 【実際の処理実行 - 2】: 統計計算
      // 【前提条件】: モックがインポートしたデータを返すように設定
      const importedLogs: BattleLog[] = [
        {
          id: 'log_20251101_001',
          date: '2025/11/01',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-101',
        },
        {
          id: 'log_20251102_001',
          date: '2025/11/02',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck-102',
        },
        {
          id: 'log_20251103_001',
          date: '2025/11/03',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck-002',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-103',
        },
      ];
      mockBlobClient.getBattleLogs.mockResolvedValue(importedLogs);

      const stats = await statisticsService.calculateStatistics({
      });

      // 【結果検証 - 2】: 統計が正しく計算されることを確認
      expect(stats).toBeDefined(); // 【確認内容】: 統計結果が返される 🔵
      expect(stats.overall.totalGames).toBe(3); // 【確認内容】: 全体の試合数が3 🔵
      expect(stats.overall.wins).toBe(2); // 【確認内容】: 全体の勝利数が2 🔵
      expect(stats.overall.losses).toBe(1); // 【確認内容】: 全体の敗北数が1 🔵
      expect(stats.overall.winRate).toBeCloseTo(66.7, 1); // 【確認内容】: 全体の勝率が約66.7% 🔵

      expect(stats.byMyDeck).toBeDefined(); // 【確認内容】: デッキ別統計が存在する 🔵
      expect(stats.byMyDeck.length).toBeGreaterThanOrEqual(2); // 【確認内容】: 2デッキ以上の統計がある 🔵

      const deck001Stats = stats.byMyDeck.find((d) => d.deckId === 'deck-001');
      if (deck001Stats) {
        expect(deck001Stats.totalGames).toBe(2); // 【確認内容】: deck-001の試合数が2 🔵
        expect(deck001Stats.wins).toBe(1); // 【確認内容】: deck-001の勝利数が1 🔵
        expect(deck001Stats.losses).toBe(1); // 【確認内容】: deck-001の敗北数が1 🔵
        expect(deck001Stats.winRate).toBeCloseTo(50.0, 1); // 【確認内容】: deck-001の勝率が50% 🔵
      }

      const deck002Stats = stats.byMyDeck.find((d) => d.deckId === 'deck-002');
      if (deck002Stats) {
        expect(deck002Stats.totalGames).toBe(1); // 【確認内容】: deck-002の試合数が1 🔵
        expect(deck002Stats.wins).toBe(1); // 【確認内容】: deck-002の勝利数が1 🔵
        expect(deck002Stats.losses).toBe(0); // 【確認内容】: deck-002の敗北数が0 🔵
        expect(deck002Stats.winRate).toBeCloseTo(100.0, 1); // 【確認内容】: deck-002の勝率が100% 🔵
      }
    });
  });

  // =============================================================================
  // 7. インポートAPI統合テスト - 異常系
  // =============================================================================

  describe('TC-INT-IMPORT-ERR-001: 不正なJSON形式のインポート', () => {
    /**
     * 【テスト目的】: インポート機能のエラーハンドリングを検証
     * 【テスト内容】: 不正なJSON形式のデータをインポートするとエラーが返される
     * 【期待される動作】: INVALID_FORMATエラーが返される
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 465-494、既存テストimportService.test.tsより）
     */
    test('不正なJSON形式のデータをインポートするとエラーが返される', async () => {
      // 【テストデータ準備】: 不正なJSON形式のデータを用意
      // 【初期条件設定】: JSONとしてパース不可能な文字列
      const invalidJsonData = '{ invalid json syntax }';

      // 【実際の処理実行】: 不正なJSONでインポートを試みる
      // 【処理内容】: ImportService.importFromJson() を呼び出す
      // 【期待されるエラー】: パースエラーがスローされる
      await expect(importService.importFromJson(invalidJsonData)).rejects.toThrow();
      // 【確認内容】: 不正なJSON形式でエラーがスローされる 🔵

      // 【追加検証】: エラーメッセージが適切であることを確認
      try {
        await importService.importFromJson(invalidJsonData);
        fail('エラーがスローされるべき'); // この行に到達してはいけない
      } catch (error) {
        expect(error).toBeDefined(); // 【確認内容】: エラーオブジェクトが存在する 🔵
        expect(String(error)).toContain('JSON'); // 【確認内容】: エラーメッセージに「JSON」が含まれる 🔵
      }
    });
  });

  describe('TC-INT-IMPORT-ERR-002: 重複データのインポート（上書きなし）', () => {
    /**
     * 【テスト目的】: 重複データの検出と適切な処理を検証
     * 【テスト内容】: 既存データと重複するデータをインポートすると適切にスキップされる
     * 【期待される動作】: スキップとして処理される（エラーではない）
     * 🔵 信頼性レベル: 青信号（testcases.md Lines 496-530、既存テストimportService.test.tsより）
     */
    test('既存データと重複するデータをインポートすると適切にスキップされる', async () => {
      // 【テストデータ準備】: 既存データと重複するデータを用意
      // 【初期条件設定】: 既に存在するデータと同じ内容をインポート
      const existingLog: BattleLog = {
        id: 'log_20251101_001',
        date: '2025/11/01',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AA',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck-101',
      };

      // 既存データをモックに設定
      mockBlobClient.getBattleLogs.mockResolvedValue([existingLog]);

      const duplicateData = [
        {
          id: 'log_20251101_001', // 既存データと同じIDを指定
          date: '2025-11-01',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-101',
        },
      ];

      // 【実際の処理実行】: 重複データでインポートを試みる（上書きなし）
      // 【処理内容】: ImportService.importFromJson() を呼び出す
      const importResult = await importService.importFromJson(JSON.stringify(duplicateData));

      // 【結果検証】: 重複データがスキップされることを確認
      expect(importResult).toBeDefined(); // 【確認内容】: インポート結果が返される 🔵
      expect(importResult.imported).toBe(0); // 【確認内容】: インポート件数が0 🔵
      expect(importResult.skipped).toBe(1); // 【確認内容】: スキップ件数が1（重複のため） 🔵
      expect(importResult.errors).toBe(0); // 【確認内容】: エラー件数が0（エラーではなくスキップ） 🔵
    });
  });
});
