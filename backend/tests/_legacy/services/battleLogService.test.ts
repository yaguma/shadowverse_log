/**
 * BattleLogService のテストスイート
 *
 * テストフレームワーク: Jest 29.7.0 + ts-jest
 * テスト対象: backend/src/services/battleLogService.ts
 *
 * 🔵 テストケース定義書: docs/implements/shadowverse-battle-log/TASK-0007/testcases.md
 * 🔵 要件定義書: docs/implements/shadowverse-battle-log/TASK-0007/requirements.md
 */

import { BattleLogService } from '../../src/services/battleLogService';
import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import type { BattleLog } from '../../src/types';

// BlobStorageClient のモック
jest.mock('../../src/storage/blobStorageClient');

describe('BattleLogService', () => {
  let service: BattleLogService;
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

    // BattleLogService インスタンスを作成（モックされた BlobStorageClient を使用）
    service = new BattleLogService(mockBlobClient);
  });

  afterEach(() => {
    // 【テスト後処理】: テスト実行後にモックをクリーンアップ
    // 【状態復元】: 次のテストに影響しないよう、モックの状態を復元
    jest.restoreAllMocks();
  });

  // =============================================================================
  // 1. 正常系テストケース（基本的な動作）
  // =============================================================================

  describe('正常系: TC-001 - 基本的な対戦履歴登録', () => {
    test('必須項目をすべて指定した対戦履歴が正しく作成される', async () => {
      // 【テスト目的】: BattleLogService.createBattleLog() メソッドが、有効な8項目のデータを受け取り、正常に対戦履歴を作成できることを確認
      // 【テスト内容】: バリデーション、ID自動生成、日付形式変換、Blob Storage保存の一連のフローをテスト
      // 【期待される動作】:
      //   - バリデーションが成功する
      //   - ID が `log_YYYYMMDD_NNN` 形式で自動生成される
      //   - 日付が YYYY-MM-DD → YYYY/MM/DD に変換される
      //   - Blob Storage に正しく保存される
      //   - 作成された BattleLog オブジェクトが返却される
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 349-390、testcases.md Lines 36-82 より）

      // 【テストデータ準備】: 典型的なランクマッチの対戦結果を表すデータ
      // 【初期条件設定】: すべての必須項目が有効な値で埋まっている代表的なケース
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出す
      // 【処理内容】: バリデーション → ID生成 → 日付形式変換 → Blob Storage保存
      const result = await service.createBattleLog(input);

      // 【結果検証】: 作成された BattleLog オブジェクトが期待値と一致することを確認
      // 【期待値確認】: ID生成、日付形式変換が正しく行われている
      expect(result).toBeDefined(); // 【確認内容】: 結果が返却される 🔵
      expect(result.id).toBe('log_20250124_001'); // 【確認内容】: 初回登録のため連番001が生成される（REQ-004） 🔵
      expect(result.date).toBe('2025/01/24'); // 【確認内容】: YYYY-MM-DD → YYYY/MM/DD に変換される（REQ-601: 既存データ互換性） 🔵
      expect(result.battleType).toBe('ランクマッチ'); // 【確認内容】: 入力値がそのまま保存される 🔵
      expect(result.rank).toBe('ダイアモンド'); // 【確認内容】: 入力値がそのまま保存される 🔵
      expect(result.group).toBe('AAA'); // 【確認内容】: 入力値がそのまま保存される 🔵
      expect(result.myDeckId).toBe('deck_001'); // 【確認内容】: 入力値がそのまま保存される 🔵
      expect(result.turn).toBe('先攻'); // 【確認内容】: 入力値がそのまま保存される 🔵
      expect(result.result).toBe('勝ち'); // 【確認内容】: 入力値がそのまま保存される ��
      expect(result.opponentDeckId).toBe('deck_master_002'); // 【確認内容】: 入力値がそのまま保存される 🔵

      // 【追加検証】: Blob Storage への保存が呼び出されたことを確認
      expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledTimes(1); // 【確認内容】: saveBattleLogs が1回呼び出された 🔵
      expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'log_20250124_001',
            date: '2025/01/24',
          }),
        ])
      ); // 【確認内容】: 正しいデータで保存が呼び出された 🔵
    });
  });

  describe('正常系: TC-002 - 日付省略時に今日の日付が自動設定される', () => {
    test('date フィールドを省略した場合、今日の日付が自動的に設定される', async () => {
      // 【テスト目的】: date フィールドがオプショナルであり、省略時に Zod のデフォルト値処理で今日の日付（JST基準）が設定されることを確認
      // 【テスト内容】: date フィールドを省略したリクエストでバリデーションが成功し、今日の日付が補完される
      // 【期待される動作】:
      //   - バリデーション時に date が今日の日付に補完される
      //   - ID生成時に今日の日付が使用される
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 392-432、testcases.md Lines 86-128 より）

      // 【テストデータ準備】: ユーザーが日付を入力せず、対戦直後に記録するケース（最も一般的な使用パターン）
      // 【初期条件設定】: date フィールドを省略したリクエスト
      const input = {
        // date フィールドなし
        battleType: '対戦台' as const,
        rank: 'ルビー' as const,
        group: 'A' as const,
        myDeckId: 'deck_002',
        turn: '後攻' as const,
        result: '負け' as const,
        opponentDeckId: 'deck_master_005',
      };

      // 今日の日付を取得（テスト実行日）
      const today = new Date().toISOString().split('T')[0] ?? ''; // YYYY-MM-DD
      const todayFormatted = today.replace(/-/g, '/'); // YYYY/MM/DD
      const expectedId = `log_${today.replace(/-/g, '')}_001`; // log_YYYYMMDD_001

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出す
      // 【処理内容】: Zodスキーマの `.default(() => new Date().toISOString().split('T')[0])` により、今日の日付が自動設定される
      const result = await service.createBattleLog(input);

      // 【結果検証】: date フィールドが今日の日付に自動補完されることを確認
      // 【期待値確認】: 補完された日付が今日の日付と一致する（タイムゾーン考慮）
      expect(result).toBeDefined(); // 【確認内容】: 結果が返却される 🔵
      expect(result.id).toBe(expectedId); // 【確認内容】: テスト実行日を基にしたIDが生成される 🔵
      expect(result.date).toBe(todayFormatted); // 【確認内容】: 今日の日付が自動設定される（YYYY/MM/DD形式） 🔵
      expect(result.battleType).toBe('対戦台'); // 【確認内容】: 入力値がそのまま保存される 🔵
    });
  });

  describe('正常系: TC-003 - 同日の複数登録で連番が正しく生成される', () => {
    test('同じ日付に複数の対戦履歴を登録した場合、連番が正しくインクリメントされる', async () => {
      // 【テスト目的】: ID生成ロジックが既存のログを読み込み、同日の最大連番を取得して +1 する動作を確認
      // 【テスト内容】: 既存ログに同日の履歴がある場合、最大連番+1でIDが生成される
      // 【期待される動作】:
      //   - 既存ログから同日の履歴をフィルタリング
      //   - 最大連番を取得（001, 002 → 最大002）
      //   - 新規IDは003として生成される
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 436-458、testcases.md Lines 133-170 より）

      // 【テストデータ準備】: 同日に3件目の対戦結果を記録するケース（エッジケース1）
      // 【初期条件設定】: 既存ログに `log_20250124_001`, `log_20250124_002` が存在
      const existingLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'log_20250124_002',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_002',
        },
      ];

      // モックの戻り値を既存ログに設定
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);

      // 【新規登録データ】: 同日の3件目
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_003',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出す
      // 【処理内容】: 既存ログから同日のログをフィルタリング → 最大連番を取得（002） → 新規IDは003として生成
      const result = await service.createBattleLog(input);

      // 【結果検証】: 既存の最大002 + 1 = 003 が生成されることを確認
      // 【期待値確認】: ID生成ロジックの正確性を保証（REQ-004, EDGE-103）
      expect(result).toBeDefined(); // 【確認内容】: 結果が返却される 🔵
      expect(result.id).toBe('log_20250124_003'); // 【確認内容】: 既存の最大002 + 1 = 003 が生成される 🔵

      // 【追加検証】: 既存ログが正しく読み込まれたことを確認
      expect(mockBlobClient.getBattleLogs).toHaveBeenCalledTimes(1); // 【確認内容】: getBattleLogs が1回呼び出された 🔵

      // 【追加検証】: 保存時に既存ログ + 新規ログが渡されることを確認
      expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...existingLogs,
          expect.objectContaining({ id: 'log_20250124_003' }),
        ])
      ); // 【確認内容】: 既存ログ + 新規ログが保存される 🔵
    });
  });

  describe('正常系: TC-004 - 連番が飛んでいる場合に最大値から+1される', () => {
    test('既存ログの連番に欠番がある場合、最大値から+1された連番が生成される', async () => {
      // 【テスト目的】: ID生成ロジックが連番の欠番を無視し、常に最大値から+1する動作を確認
      // 【テスト内容】: 連番に欠番がある場合でも、最大値+1でIDが生成される
      // 【期待される動作】:
      //   - 既存ログの連番: 001, 005 (002-004は削除済み)
      //   - 新規IDは最大値005 + 1 = 006 として生成される
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 460-466、testcases.md Lines 174-212 より）

      // 【テストデータ準備】: 過去に対戦履歴を削除した後、新規登録するケース（エッジケース2）
      // 【初期条件設定】: 既存ログに `log_20250124_001`, `log_20250124_005` が存在（002-004は削除済み）
      const existingLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
        {
          id: 'log_20250124_005',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_002',
        },
      ];

      // モックの戻り値を既存ログに設定
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);

      // 【新規登録データ】: 同日の新規登録
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_003',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出す
      // 【処理内容】: 欠番を無視して最大値（005）を取得 → 新規IDは006として生成
      const result = await service.createBattleLog(input);

      // 【結果検証】: 既存の最大005 + 1 = 006 が生成されることを確認（002-004は無視）
      // 【期待値確認】:
      //   - 連番の欠番を埋めない（削除した履歴のIDを再利用しない）
      //   - 単調増加を保証することでID衝突を防ぐ
      expect(result).toBeDefined(); // 【確認内容】: 結果が返却される 🔵
      expect(result.id).toBe('log_20250124_006'); // 【確認内容】: 既存の最大005 + 1 = 006（002-004は無視） 🔵
    });
  });

  describe('正常系: TC-005 - 空のbattle-logs.jsonで初回登録時にID=001が生成される', () => {
    test('battle-logs.json が空配列の場合、ID = log_YYYYMMDD_001 が生成される', async () => {
      // 【テスト目的】: システム初回起動時、またはすべての対戦履歴を削除した後の初回登録時の動作を確認
      // 【テスト内容】: 既存ログが空の場合、ID = log_YYYYMMDD_001 が生成される
      // 【期待される動作】:
      //   - 既存ログ = [] の場合
      //   - 同日のログが0件 → 最大連番 = 0
      //   - 新規IDは001として生成される
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 468-474、testcases.md Lines 216-254 より）

      // 【テストデータ準備】: システム初回利用時、または全データ削除後の初回登録（エッジケース3）
      // 【初期条件設定】: battle-logs.json が `[]`（空配列）
      mockBlobClient.getBattleLogs.mockResolvedValue([]);

      // 【新規登録データ】: 初回登録
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出す
      // 【処理内容】: 空配列から最大連番0を取得し、0 + 1 = 1 → "001" として生成
      const result = await service.createBattleLog(input);

      // 【結果検証】: 初回登録のため001が生成されることを確認
      // 【期待値確認】: 空配列が正しく処理される
      expect(result).toBeDefined(); // 【確認内容】: 結果が返却される 🔵
      expect(result.id).toBe('log_20250124_001'); // 【確認内容】: 初回登録のため001が生成される 🔵
    });
  });

  describe('正常系: TC-006 - 各enum型のすべての値が正しく保存される', () => {
    test('battleType, rank, group, turn, result の各enum型で許可されたすべての値が正しく保存される', async () => {
      // 【テスト目的】: Zodバリデーションが各enumの許可値をすべて受け入れ、正しく保存されることを確認
      // 【テスト内容】: 各enum値でバリデーションがパスし、正しく保存される
      // 【期待される動作】:
      //   - すべてのenum値でバリデーションがパスする
      //   - 各値が正しく Blob Storage に保存される
      // 🔵 信頼性レベル: 青信号（types/index.ts Lines 85-93、requirements.md Lines 113-146、testcases.md Lines 258-281 より）

      // 【テストデータ準備】: enum型の網羅的なバリエーションテスト（境界値ではないが、型の完全性を保証）
      // 【パターン1】: battleType = "対戦台"
      const input1 = {
        date: '2025-01-24',
        battleType: '対戦台' as const,
        rank: 'サファイア' as const,
        group: 'A' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      const result1 = await service.createBattleLog(input1);
      expect(result1.battleType).toBe('対戦台'); // 【確認内容】: battleType = "対戦台" が保存される 🔵

      // 【パターン2】: battleType = "ロビー大会"
      const input2 = {
        date: '2025-01-24',
        battleType: 'ロビー大会' as const,
        rank: 'トパーズ' as const,
        group: 'AA' as const,
        myDeckId: 'deck_001',
        turn: '後攻' as const,
        result: '負け' as const,
        opponentDeckId: 'deck_master_002',
      };

      const result2 = await service.createBattleLog(input2);
      expect(result2.battleType).toBe('ロビー大会'); // 【確認内容】: battleType = "ロビー大会" が保存される 🔵
      expect(result2.rank).toBe('トパーズ'); // 【確認内容】: rank = "トパーズ" が保存される 🔵
      expect(result2.group).toBe('AA'); // 【確認内容】: group = "AA" が保存される 🔵
      expect(result2.turn).toBe('後攻'); // 【確認内容】: turn = "後攻" が保存される 🔵
      expect(result2.result).toBe('負け'); // 【確認内容】: result = "負け" が保存される 🔵

      // 【パターン3】: rank = "-", group = "Master"
      const input3 = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: '-' as const,
        group: 'Master' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      const result3 = await service.createBattleLog(input3);
      expect(result3.rank).toBe('-'); // 【確認内容】: rank = "-" が保存される 🔵
      expect(result3.group).toBe('Master'); // 【確認内容】: group = "Master" が保存される 🔵
    });
  });

  // =============================================================================
  // 2. 異常系テストケース（エラーハンドリング）
  // =============================================================================

  describe('異常系: TC-101 - 未来日付の入力でバリデーションエラー', () => {
    test('未来の日付を入力した場合、バリデーションエラーが発生する', async () => {
      // 【テスト目的】: 未来日付バリデーションの動作確認（REQ-401）
      // 【エラーケースの概要】: ユーザーが誤って未来の日付を入力したケース
      // 【エラー処理の重要性】:
      //   - データ整合性の保証（過去の対戦履歴のみを記録）
      //   - ユーザーの入力ミスを早期に検出
      //   - 統計計算の正確性を保証（REQ-401）
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 477-512、testcases.md Lines 286-319 より）

      // 【テストデータ準備】: 未来日付を入力
      // 【不正な理由】: 対戦履歴は過去または今日の記録であるべき（未来の対戦は存在しない）
      // 【実際の発生シナリオ】:
      //   - ユーザーの入力ミス（年の桁を間違える）
      //   - カレンダーUIの操作ミス
      //   - タイムゾーンの設定ミス
      const input = {
        date: '2099-12-31',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出し、ZodErrorがスローされることを確認
      // 【期待される結果】:
      //   - ZodError がスローされる
      //   - エラーメッセージ: `"未来の日付は入力できません"`
      //   - バリデーションで拒否され、Blob Storage への保存は行われない
      await expect(service.createBattleLog(input)).rejects.toThrow('未来の日付は入力できません'); // 【確認内容】: 未来日付でエラーがスローされる 🔵
    });
  });

  describe('異常系: TC-102 - 必須項目が欠落している場合にバリデーションエラー', () => {
    test('必須項目（rank, group, myDeckId, turn, result, opponentDeckId）が欠けている場合、バリデーションエラーが発生する', async () => {
      // 【テスト目的】: 必須項目バリデーションの動作確認（REQ-402）
      // 【エラーケースの概要】: フロントエンドのバグやネットワークエラーにより、必須項目が欠落したリクエストが送信されるケース
      // 【エラー処理の重要性】:
      //   - データ完全性の保証（8項目すべてが必須: REQ-004）
      //   - 不完全なデータの保存を防止
      //   - フロントエンドのバグを早期に検出
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 514-549、testcases.md Lines 323-357 より）

      // 【テストデータ準備】: 必須項目が欠落したリクエスト
      // 【不正な理由】: 対戦履歴は8項目すべてが必須（REQ-002, REQ-004）
      // 【実際の発生シナリオ】:
      //   - フロントエンドのバグ（フォーム送信前のバリデーション漏れ）
      //   - ネットワークエラーによるデータ欠落
      //   - APIの誤用（手動でリクエストを構築した場合）
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        // rank, group, myDeckId, turn, result, opponentDeckId が欠けている
        // biome-ignore lint/suspicious/noExplicitAny: Testing missing required fields requires any type
      } as any;

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出し、ZodErrorがスローされることを確認
      // 【期待される結果】:
      //   - ZodError がスローされる
      //   - エラーメッセージ（複数フィールド）:
      //     - `rank`: "Required"
      //     - `group`: "Required"
      //     - `myDeckId`: "マイデッキIDは必須です"
      //     - `turn`: "Required"
      //     - `result`: "Required"
      //     - `opponentDeckId`: "相手デッキIDは必須です"
      await expect(service.createBattleLog(input)).rejects.toThrow(); // 【確認内容】: 必須項目欠落でエラーがスローされる 🔵
    });
  });

  describe('異常系: TC-103 - 不正なenum値でバリデーションエラー', () => {
    test('battleType に不正な値（許可されていない文字列）を入力した場合、バリデーションエラーが発生する', async () => {
      // 【テスト目的】: enum型バリデーションの厳密性確認
      // 【エラーケースの概要】: enum型に定義されていない値が入力されるケース
      // 【エラー処理の重要性】:
      //   - データ整合性の保証（統計計算でのフィルタリング精度）
      //   - フロントエンドとバックエンドの型定義の一致を保証
      //   - 予期しない値による不具合を防止
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 551-586、testcases.md Lines 361-394 より）

      // 【テストデータ準備】: enum型に定義されていない値を入力
      // 【不正な理由】: battleType は `"ランクマッチ" | "対戦台" | "ロビー大会"` のみ許可（types/index.ts Line 4）
      // 【実際の発生シナリオ】:
      //   - フロントエンドのバグ（セレクトボックスの値が不正）
      //   - APIの誤用（手動でリクエストを構築した場合）
      //   - 型定義の不一致（フロントエンドとバックエンドの型が同期していない）
      const input = {
        date: '2025-01-24',
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid enum value requires any type
        battleType: '不正なタイプ' as any,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出し、ZodErrorがスローされることを確認
      // 【期待される結果】:
      //   - ZodError がスローされる
      //   - エラーメッセージ: `"対戦タイプが不正です"`
      await expect(service.createBattleLog(input)).rejects.toThrow('対戦タイプが不正です'); // 【確認内容】: 不正なenum値でエラーがスローされる 🔵
    });
  });

  describe('異常系: TC-104 - 日付形式が不正な場合にバリデーションエラー', () => {
    test('date フィールドが YYYY-MM-DD 形式ではない場合、バリデーションエラーが発生する', async () => {
      // 【テスト目的】: 日付形式バリデーションの動作確認
      // 【エラーケースの概要】: 日付のフォーマットが不正なケース（スラッシュ区切り、ドット区切り、順序違い等）
      // 【エラー処理の重要性】:
      //   - データ形式の統一性を保証
      //   - ID生成ロジックの正常動作を保証（日付文字列から YYYYMMDD を抽出）
      //   - フロントエンドとバックエンドのデータ形式の一致を保証
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 588-623、testcases.md Lines 398-431 より）

      // 【テストデータ準備】: 日付形式が不正なリクエスト
      // 【不正な理由】: API入力は `YYYY-MM-DD` 形式のみ許可（requirements.md Lines 103-111）
      // 【実際の発生シナリオ】:
      //   - フロントエンドの日付フォーマットミス
      //   - 手動でリクエストを構築した場合のフォーマット誤り
      //   - 国際化対応の不備（地域によって異なる日付形式）
      const input = {
        date: '2025/01/24', // スラッシュ区切り（誤り）
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出し、ZodErrorがスローされることを確認
      // 【期待される結果】:
      //   - ZodError がスローされる
      //   - エラーメッセージ: `"日付はYYYY-MM-DD形式で入力してください"`
      await expect(service.createBattleLog(input)).rejects.toThrow(
        '日付はYYYY-MM-DD形式で入力してください'
      ); // 【確認内容】: 日付形式が不正な場合エラーがスローされる 🔵
    });
  });

  describe('異常系: TC-105 - myDeckId が空文字列の場合にバリデーションエラー', () => {
    test('myDeckId が空文字列の場合、バリデーションエラーが発生する', async () => {
      // 【テスト目的】: 文字列型フィールドの空文字列バリデーション
      // 【エラーケースの概要】: 文字列型のフィールドが空文字列で送信されるケース
      // 【エラー処理の重要性】:
      //   - データ完全性の保証（空文字列は無効なデッキID）
      //   - 外部キー制約のような論理的整合性を保証
      //   - 統計計算でのデッキ別集計の正確性を保証
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 128-131、testcases.md Lines 435-468 より）

      // 【テストデータ準備】: 空文字列のmyDeckId
      // 【不正な理由】: myDeckId は `.min(1)` 制約により、空文字列は不可（requirements.md Lines 128-131）
      // 【実際の発生シナリオ】:
      //   - フロントエンドのバリデーション漏れ
      //   - ユーザーがセレクトボックスで何も選択せずに送信
      //   - APIの誤用
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: '', // 空文字列
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出し、ZodErrorがスローされることを確認
      // 【期待される結果】:
      //   - ZodError がスローされる
      //   - エラーメッセージ: `"マイデッキIDは必須です"`
      await expect(service.createBattleLog(input)).rejects.toThrow('マイデッキIDは必須です'); // 【確認内容】: 空文字列のmyDeckIdでエラーがスローされる 🔵
    });
  });

  describe('異常系: TC-107 - Blob Storage読み込みエラー時に例外がスロー', () => {
    test('getBattleLogs() が失敗した場合、エラーがスローされる', async () => {
      // 【テスト目的】: Blob Storage障害時のエラーハンドリング確認（EDGE-001, EDGE-002）
      // 【エラーケースの概要】: Blob Storage接続エラー、タイムアウト、ネットワーク障害等
      // 【エラー処理の重要性】:
      //   - インフラ障害時の適切なエラーハンドリング
      //   - ユーザーへのフィードバック（500エラー）
      //   - リトライ処理の動作確認（BlobStorageClientで3回リトライ）
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 625-647、testcases.md Lines 503-527 より）

      // 【テストデータ準備】: BlobStorageClient.getBattleLogs() がエラーをスローする環境（モック）
      // 【不正な理由】: Blob Storage側の障害（インフラレイヤーのエラー）
      // 【実際の発生シナリオ】:
      //   - Azure Blob Storage の一時的な障害
      //   - ネットワークの切断
      //   - 接続文字列の設定ミス
      //   - コンテナが削除された
      const error = new Error('Failed to read battle-logs.json after 3 attempts: Network error');
      mockBlobClient.getBattleLogs.mockRejectedValue(error);

      // 正常なリクエストボディ
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出し、エラーがスローされることを確認
      // 【期待される結果】:
      //   - BattleLogService.createBattleLog() がエラーをスロー
      //   - エラーメッセージ: `"Failed to read battle-logs.json after 3 attempts: [元のエラー]"` (BlobStorageClientのリトライ後)
      await expect(service.createBattleLog(input)).rejects.toThrow(
        'Failed to read battle-logs.json after 3 attempts'
      ); // 【確認内容】: Blob Storage読み込みエラーがスローされる 🔵
    });
  });

  describe('異常系: TC-108 - Blob Storage書き込みエラー時に例外がスロー', () => {
    test('saveBattleLogs() が失敗した場合、エラーがスローされる', async () => {
      // 【テスト目的】: Blob Storage障害時のエラーハンドリング確認（EDGE-001, EDGE-002）
      // 【エラーケースの概要】: Blob Storage書き込み時のエラー
      // 【エラー処理の重要性】:
      //   - データ保存失敗時の適切なエラーハンドリング
      //   - データ損失の防止（トランザクション的な動作）
      //   - ユーザーへのフィードバック（500エラー）
      // 🔵 信頼性レベル: 青信号（requirements.md Lines 625-647、testcases.md Lines 531-558 より）

      // 【テストデータ準備】: BlobStorageClient.saveBattleLogs() がエラーをスローする環境（モック）
      // 【不正な理由】: Blob Storage側の障害（書き込み権限不足、ストレージ容量不足等）
      // 【実際の発生シナリオ】:
      //   - Azure Blob Storage の一時的な障害
      //   - 書き込み権限の不足（SAS tokenの期限切れ）
      //   - ストレージ容量の不足
      //   - ネットワークの切断
      const error = new Error(
        'Failed to write battle-logs.json after 3 attempts: Permission denied'
      );
      mockBlobClient.saveBattleLogs.mockRejectedValue(error);

      // 正常なリクエストボディ
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      // 【実際の処理実行】: createBattleLog() メソッドを呼び出し、エラーがスローされることを確認
      // 【期待される結果】:
      //   - BattleLogService.createBattleLog() がエラーをスロー
      //   - エラーメッセージ: `"Failed to write battle-logs.json after 3 attempts: [元のエラー]"` (BlobStorageClientのリトライ後)
      await expect(service.createBattleLog(input)).rejects.toThrow(
        'Failed to write battle-logs.json after 3 attempts'
      ); // 【確認内容】: Blob Storage書き込みエラーがスローされる 🔵
    });
  });

  // =============================================================================
  // TASK-0008: Battle Log一覧取得・削除機能のテスト
  // =============================================================================

  // =============================================================================
  // 2. 一覧取得API - 正常系テストケース
  // =============================================================================

  describe('正常系: TC-001 - デフォルトパラメータでの一覧取得', () => {
    test('デフォルトパラメータで対戦履歴一覧が正しく取得される', async () => {
      // 【テスト目的】: getBattleLogsWithDeckNames() がデフォルトパラメータ（limit=100, offset=0, sortBy="date", sortOrder="desc"）で正しく動作することを確認
      // 【テスト内容】: パラメータを省略した場合、デフォルト値が適用され、日付降順でソートされた一覧が取得される
      // 【期待される動作】: 最新の対戦履歴が先頭に来る形で、ページネーション情報を含むレスポンスが返却される
      // 🔵 信頼性レベル: 青信号（requirements.md L206-215より）

      // 【テストデータ準備】: 3件の対戦履歴データを用意（日付がバラバラ）
      // 【初期条件設定】: Blob Storageに3件のデータが存在する状態をモック
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
        {
          id: 'log_20250123_001',
          date: '2025/01/23', // 1日前
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_003',
        },
        {
          id: 'log_20250125_001',
          date: '2025/01/25', // 1日後（最新）
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck_002',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ];

      const mockMyDecks = [
        {
          id: 'deck_001',
          deckId: '1',
          deckCode: '3.1.3.1',
          deckName: '秘術オデンスペル',
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'deck_002',
          deckId: '2',
          deckCode: '3.2.3.2',
          deckName: '進化ロイヤル',
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const mockDeckMasters = [
        {
          id: 'deck_master_001',
          className: 'ウィッチ',
          deckName: '土スペルウィッチ',
          sortOrder: 1,
        },
        {
          id: 'deck_master_002',
          className: 'ロイヤル',
          deckName: 'ミッドレンジロイヤル',
          sortOrder: 2,
        },
        {
          id: 'deck_master_003',
          className: 'エルフ',
          deckName: 'OTKエルフ',
          sortOrder: 3,
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue(mockMyDecks);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue(mockDeckMasters);

      // 【実際の処理実行】: getBattleLogsWithDeckNames() をパラメータなしで呼び出す
      // 【処理内容】: デフォルトパラメータの適用 → Blob Storage取得 → ソート → ページネーション → デッキ名付与
      const result = await service.getBattleLogsWithDeckNames({});

      // 【結果検証】: 返却されたデータが期待値と一致することを確認
      // 【期待値確認】: 日付降順、デッキ名付与、ページネーション情報が正しい

      // 【検証項目】: ページネーション情報が正しい
      // 🔵 信頼性レベル: 青信号
      expect(result.total).toBe(3); // 【確認内容】: 総件数が3件
      expect(result.limit).toBe(100); // 【確認内容】: デフォルトlimit=100
      expect(result.offset).toBe(0); // 【確認内容】: デフォルトoffset=0

      // 【検証項目】: 日付降順でソートされている
      // 🔵 信頼性レベル: 青信号
      expect(result.battleLogs).toHaveLength(3); // 【確認内容】: 3件すべて取得
      expect(result.battleLogs[0]?.id).toBe('log_20250125_001'); // 【確認内容】: 最新（1/25）が先頭
      expect(result.battleLogs[1]?.id).toBe('log_20250124_001'); // 【確認内容】: 2番目（1/24）
      expect(result.battleLogs[2]?.id).toBe('log_20250123_001'); // 【確認内容】: 最古（1/23）が最後

      // 【検証項目】: デッキ名が正しく付与されている
      // 🔵 信頼性レベル: 青信号（REQ-106）
      expect(result.battleLogs[0]?.myDeckName).toBe('進化ロイヤル'); // 【確認内容】: deck_002の名前
      expect(result.battleLogs[0]?.opponentDeckName).toBe('土スペルウィッチ'); // 【確認内容】: deck_master_001の名前
      expect(result.battleLogs[1]?.myDeckName).toBe('秘術オデンスペル'); // 【確認内容】: deck_001の名前
      expect(result.battleLogs[1]?.opponentDeckName).toBe('ミッドレンジロイヤル'); // 【確認内容】: deck_master_002の名前
    });
  });

  describe('正常系: TC-002 - limit と offset を指定したページネーション', () => {
    test('limitとoffsetを指定して、正しくページネーションが動作する', async () => {
      // 【テスト目的】: limit=20, offset=10を指定した場合、11〜30件目のデータが取得される
      // 【テスト内容】: 指定された範囲のデータのみが返却され、total, limit, offset情報が正しく含まれる
      // 【期待される動作】: slice(offset, offset + limit) が正しく動作し、指定範囲のデータが取得される
      // 🔵 信頼性レベル: 青信号（requirements.md L217-224より）

      // 【テストデータ準備】: 30件の対戦履歴を用意
      // 【初期条件設定】: 実際のページネーションシナリオをシミュレート
      const mockBattleLogs: BattleLog[] = Array.from({ length: 30 }, (_, i) => ({
        id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
        date: '2025/01/01',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck_001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck_master_002',
      }));

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: limit=20, offset=10を指定して呼び出す
      // 【処理内容】: ページネーション処理（slice(10, 30)）が実行される
      const result = await service.getBattleLogsWithDeckNames({
        limit: 20,
        offset: 10,
      });

      // 【結果検証】: 11〜30件目のデータが取得される
      // 【期待値確認】: ページネーション情報とデータ範囲が正しい

      expect(result.total).toBe(30); // 【確認内容】: 総件数が30件
      expect(result.limit).toBe(20); // 【確認内容】: 指定したlimit=20
      expect(result.offset).toBe(10); // 【確認内容】: 指定したoffset=10
      expect(result.battleLogs).toHaveLength(20); // 【確認内容】: 20件取得（11〜30件目）
      expect(result.battleLogs[0]?.id).toBe('log_20250101_011'); // 【確認内容】: 11件目から開始
      expect(result.battleLogs[19]?.id).toBe('log_20250101_030'); // 【確認内容】: 30件目まで取得
    });
  });

  describe('正常系: TC-003 - sortOrder を "asc" に指定した昇順ソート', () => {
    test('sortOrder="asc"を指定して、古い順（昇順）にソートされる', async () => {
      // 【テスト目的】: 日付の古い順に対戦履歴が並び替えられる
      // 【テスト内容】: sortOrder="asc"を指定した場合、最も古い対戦履歴が配列の先頭に来る
      // 【期待される動作】: battleLogs[0].date ≤ battleLogs[1].date ≤ ... が成立
      // 🔵 信頼性レベル: 青信号（requirements.md L226-232より）

      // 【テストデータ準備】: 日付がバラバラの3件のデータ
      // 【初期条件設定】: 古い順にソートされるべきデータ
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250125_001',
          date: '2025/01/25', // 最新
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
        {
          id: 'log_20250123_001',
          date: '2025/01/23', // 最古
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_003',
        },
        {
          id: 'log_20250124_001',
          date: '2025/01/24', // 中間
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck_002',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: sortOrder="asc"を指定して呼び出す
      // 【処理内容】: ソート処理が昇順で実行される
      const result = await service.getBattleLogsWithDeckNames({
        sortOrder: 'asc',
      });

      // 【結果検証】: 古い順にソートされている
      // 【期待値確認】: 最古（1/23） → 中間（1/24） → 最新（1/25）の順

      expect(result.battleLogs).toHaveLength(3); // 【確認内容】: 3件すべて取得
      expect(result.battleLogs[0]?.id).toBe('log_20250123_001'); // 【確認内容】: 最古（1/23）が先頭
      expect(result.battleLogs[1]?.id).toBe('log_20250124_001'); // 【確認内容】: 中間（1/24）
      expect(result.battleLogs[2]?.id).toBe('log_20250125_001'); // 【確認内容】: 最新（1/25）が最後
    });
  });

  describe('正常系: TC-004 - 空配列の場合（battle-logs.jsonが空）', () => {
    test('battle-logs.jsonが空配列の場合、空の結果が返る（エラーにならない）', async () => {
      // 【テスト目的】: 対戦履歴が1件もない状態での一覧取得が正常に処理される
      // 【テスト内容】: エラーを発生させず、空の配列とtotal=0を返却
      // 【期待される動作】: 例外が発生せず、total=0、空配列が返る
      // 🟡 信頼性レベル: 黄信号（requirements.md L272-279より推測）

      // 【テストデータ準備】: 空配列をモック
      // 【初期条件設定】: 新規ユーザーが初めてアプリを開いた時を想定
      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue([]);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: パラメータなしで呼び出す
      // 【処理内容】: 空配列を処理しても例外が発生しない
      const result = await service.getBattleLogsWithDeckNames({});

      // 【結果検証】: エラーにならず、空の結果が返る
      // 【期待値確認】: total=0、battleLogs=[]

      expect(result.battleLogs).toEqual([]); // 【確認内容】: 空配列が返る
      expect(result.total).toBe(0); // 【確認内容】: 総件数が0件
      expect(result.limit).toBe(100); // 【確認内容】: デフォルトlimit
      expect(result.offset).toBe(0); // 【確認内容】: デフォルトoffset
    });
  });

  // =============================================================================
  // 3. デッキ名付与機能 - 正常系テストケース
  // =============================================================================

  describe('正常系: TC-005 - デッキ名が正しく付与される', () => {
    test('マイデッキとデッキマスターの名前が正しくjoinされる', async () => {
      // 【テスト目的】: 対戦履歴のmyDeckId, opponentDeckIdに対応するデッキ名が追加される
      // 【テスト内容】: myDeckName, opponentDeckName フィールドが追加され、正しい名前が設定される
      // 【期待される動作】: Mapによる高速検索が正しく動作し、デッキ名が正しくマッピングされる
      // 🔵 信頼性レベル: 青信号（requirements.md L589-625より）

      // 【テストデータ準備】: 実際の対戦履歴とデッキマスター情報を模倣
      // 【初期条件設定】: 対戦履歴画面でデッキ名を表示する時を想定
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
      ];

      const mockMyDecks = [
        {
          id: 'deck_001',
          deckId: '1',
          deckCode: '3.1.3.1',
          deckName: '秘術オデンスペル',
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const mockDeckMasters = [
        {
          id: 'deck_master_002',
          className: 'ロイヤル',
          deckName: 'ミッドレンジロイヤル',
          sortOrder: 2,
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue(mockMyDecks);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue(mockDeckMasters);

      // 【実際の処理実行】: getBattleLogsWithDeckNames() を呼び出す
      // 【処理内容】: Promise.allで並列取得 → Mapによるjoin処理
      const result = await service.getBattleLogsWithDeckNames({});

      // 【結果検証】: デッキ名が正しくjoinされている
      // 【期待値確認】: myDeckName, opponentDeckName が追加されている

      expect(result.battleLogs).toHaveLength(1); // 【確認内容】: 1件取得
      expect(result.battleLogs[0]?.myDeckName).toBe('秘術オデンスペル'); // 【確認内容】: マイデッキ名が正しく付与
      expect(result.battleLogs[0]?.opponentDeckName).toBe('ミッドレンジロイヤル'); // 【確認内容】: 相手デッキ名が正しく付与
    });
  });

  describe('正常系: TC-006 - デッキIDに対応する名前がない場合', () => {
    test('デッキIDがマスターに存在しない場合、"不明なデッキ"が設定される', async () => {
      // 【テスト目的】: 存在しないデッキIDの場合、デフォルト値が設定される
      // 【テスト内容】: エラーを発生させず、"不明なデッキ"という文字列を設定
      // 【期待される動作】: Map.get()がundefined時にデフォルト値が使用される
      // 🟡 信頼性レベル: 黄信号（requirements.md L281-288より推測）

      // 【テストデータ準備】: 存在しないデッキIDを持つ対戦履歴
      // 【初期条件設定】: デッキマスターが削除された、または未登録デッキとの対戦
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'nonexistent_deck', // 存在しないID
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'nonexistent_master', // 存在しないID
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]); // 空
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]); // 空

      // 【実際の処理実行】: getBattleLogsWithDeckNames() を呼び出す
      // 【処理内容】: Mapから名前を取得できない場合、デフォルト値を設定
      const result = await service.getBattleLogsWithDeckNames({});

      // 【結果検証】: デフォルト値が設定される
      // 【期待値確認】: "不明なデッキ"が設定される

      expect(result.battleLogs).toHaveLength(1); // 【確認内容】: 1件取得
      expect(result.battleLogs[0]?.myDeckName).toBe('不明なデッキ'); // 【確認内容】: デフォルト値が設定
      expect(result.battleLogs[0]?.opponentDeckName).toBe('不明なデッキ'); // 【確認内容】: デフォルト値が設定
    });
  });

  // =============================================================================
  // 4. 削除API - 正常系テストケース
  // =============================================================================

  describe('正常系: TC-007 - 対戦履歴が正しく削除される', () => {
    test('指定されたIDの対戦履歴が削除され、Blob Storageに保存される', async () => {
      // 【テスト目的】: deleteBattleLog(id)で対象レコードが配列から削除され、保存される
      // 【テスト内容】: findIndex() → splice() → saveBattleLogs() の一連の処理が正常に実行される
      // 【期待される動作】: 指定されたIDの対戦履歴が削除され、削除後の配列が保存される
      // 🔵 信頼性レベル: 青信号（requirements.md L627-654より）

      // 【テストデータ準備】: 3件の対戦履歴から1件目を削除
      // 【初期条件設定】: ユーザーが「削除」ボタンをクリックした時を想定
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
        {
          id: 'log_20250124_002',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_003',
        },
        {
          id: 'log_20250124_003',
          date: '2025/01/24',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck_002',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue([...mockBattleLogs]);
      mockBlobClient.saveBattleLogs = jest.fn().mockResolvedValue(undefined);

      // 【実際の処理実行】: deleteBattleLog('log_20250124_001') を呼び出す
      // 【処理内容】: findIndex() → splice() → saveBattleLogs()
      const result = await service.deleteBattleLog('log_20250124_001');

      // 【結果検証】: 削除されたIDが返却され、保存が呼び出される
      // 【期待値確認】: deletedId='log_20250124_001'、saveBattleLogsが削除後の配列で呼び出される

      expect(result.deletedId).toBe('log_20250124_001'); // 【確認内容】: 削除されたIDが返る
      expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledTimes(1); // 【確認内容】: 1回呼び出される
      expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'log_20250124_002' }),
          expect.objectContaining({ id: 'log_20250124_003' }),
        ])
      ); // 【確認内容】: 削除後の配列（2件）で保存
      expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledWith(
        expect.not.arrayContaining([expect.objectContaining({ id: 'log_20250124_001' })])
      ); // 【確認内容】: 削除されたIDは含まれない
    });
  });

  // =============================================================================
  // 5. 一覧取得API - 異常系テストケース（バリデーションエラー）
  // =============================================================================

  describe('異常系: TC-101 - limit が範囲外（1000超過）', () => {
    test('limit が1000を超える場合、バリデーションエラーが発生する', async () => {
      // 【テスト目的】: limit が1000を超える場合、バリデーションエラーが発生することを確認
      // 【テスト内容】: 不正に大きなlimit値を指定した場合、エラーがスローされる
      // 【期待される動作】: エラーメッセージ「limitは1から1000の間で指定してください」がスローされる
      // 🟡 信頼性レベル: 黄信号（requirements.md L245-252より推測）

      // 【テストデータ準備】: limit=5000（最大値1000を超過）
      // 【初期条件設定】: APIの誤用、悪意あるリクエストを想定
      await expect(
        service.getBattleLogsWithDeckNames({
          limit: 5000,
        })
      ).rejects.toThrow('limitは1から1000の間で指定してください'); // 【確認内容】: バリデーションエラーがスローされる
    });
  });

  describe('異常系: TC-102 - limit が範囲外（0以下）', () => {
    test('limit が0以下の場合、バリデーションエラーが発生する', async () => {
      // 【テスト目的】: limit が0以下の場合、バリデーションエラーが発生することを確認
      // 【テスト内容】: 不正に小さいlimit値を指定した場合、エラーがスローされる
      // 【期待される動作】: エラーメッセージ「limitは1から1000の間で指定してください」がスローされる
      // 🟡 信頼性レベル: 黄信号（requirements.md L245-252より推測）

      // 【テストデータ準備】: limit=0（最小値1を違反）
      // 【初期条件設定】: プログラムのバグ、誤入力を想定
      await expect(
        service.getBattleLogsWithDeckNames({
          limit: 0,
        })
      ).rejects.toThrow('limitは1から1000の間で指定してください'); // 【確認内容】: バリデーションエラーがスローされる
    });
  });

  describe('異常系: TC-103 - offset が負の値', () => {
    test('offset が負の値の場合、バリデーションエラーが発生する', async () => {
      // 【テスト目的】: offset が負の値の場合、バリデーションエラーが発生することを確認
      // 【テスト内容】: 負のoffset値を指定した場合、エラーがスローされる
      // 【期待される動作】: エラーメッセージ「offsetは0以上で指定してください」がスローされる
      // 🟡 信頼性レベル: 黄信号（requirements.md L254-261より推測）

      // 【テストデータ準備】: offset=-10（最小値0を違反）
      // 【初期条件設定】: プログラムのバグ、計算ミスを想定
      await expect(
        service.getBattleLogsWithDeckNames({
          offset: -10,
        })
      ).rejects.toThrow('offsetは0以上で指定してください'); // 【確認内容】: バリデーションエラーがスローされる
    });
  });

  // =============================================================================
  // 6. 削除API - 異常系テストケース（エラーハンドリング）
  // =============================================================================

  describe('異常系: TC-104 - 存在しないIDを削除', () => {
    test('存在しないIDを削除しようとした場合、404エラーがスローされる', async () => {
      // 【テスト目的】: 存在しないIDを削除しようとした場合、エラーがスローされることを確認
      // 【テスト内容】: findIndex()が-1を返す（対象が見つからない）場合、エラーがスローされる
      // 【期待される動作】: エラーメッセージ「対戦履歴が見つかりません: {id}」がスローされる
      // 🟡 信頼性レベル: 黄信号（requirements.md L263-270より推測）

      // 【テストデータ準備】: 存在しないIDを指定
      // 【初期条件設定】: 既に削除済みのIDを再度削除、URLの手動編集を想定
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);

      // 【実際の処理実行】: 存在しないIDで deleteBattleLog() を呼び出す
      // 【処理内容】: findIndex()が-1を返し、エラーがスローされる
      await expect(service.deleteBattleLog('log_99999999_999')).rejects.toThrow(
        '対戦履歴が見つかりません: log_99999999_999'
      ); // 【確認内容】: 404エラーがスローされる
    });
  });

  // =============================================================================
  // 7. 統合処理 - 異常系テストケース（外部依存エラー）
  // =============================================================================

  describe('異常系: TC-105 - Blob Storage読み込みエラー（一覧取得）', () => {
    test('getBattleLogs()でBlob Storage接続エラーが発生した場合、エラーがスローされる', async () => {
      // 【テスト目的】: Blob Storage接続エラー時に適切なエラーハンドリングが行われることを確認
      // 【テスト内容】: ネットワーク切断、Azure障害など、外部依存の障害時の動作を確認
      // 【期待される動作】: BlobStorageClientで3回リトライ後、エラーがスローされる
      // 🔵 信頼性レベル: 青信号（requirements.md L292-300より）

      // 【テストデータ準備】: Blob Storage接続エラーをシミュレート
      // 【初期条件設定】: ネットワーク切断、Azureデータセンター障害を想定
      mockBlobClient.getBattleLogs = jest
        .fn()
        .mockRejectedValue(
          new Error('Failed to read battle-logs.json after 3 attempts: Network error')
        );

      // 【実際の処理実行】: getBattleLogsWithDeckNames() を呼び出し、エラーがスローされることを確認
      // 【期待される結果】: BlobStorageClientで既にリトライ済みのエラーがスローされる
      await expect(service.getBattleLogsWithDeckNames({})).rejects.toThrow(
        'Failed to read battle-logs.json after 3 attempts'
      ); // 【確認内容】: Blob Storage読み込みエラーがスローされる
    });
  });

  describe('異常系: TC-106 - Blob Storage書き込みエラー（削除）', () => {
    test('saveBattleLogs()でBlob Storage書き込みエラーが発生した場合、エラーがスローされる', async () => {
      // 【テスト目的】: Blob Storage書き込みエラー時に適切なエラーハンドリングが行われることを確認
      // 【テスト内容】: 書き込み権限不足、ストレージ容量不足など、書き込み失敗時の動作を確認
      // 【期待される動作】: データの不整合を防止し、エラーがスローされる
      // 🔵 信頼性レベル: 青信号（requirements.md L292-300より）

      // 【テストデータ準備】: Blob Storage書き込みエラーをシミュレート
      // 【初期条件設定】: 書き込み権限の不足、ストレージ容量の不足を想定
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue([...mockBattleLogs]);
      mockBlobClient.saveBattleLogs = jest
        .fn()
        .mockRejectedValue(
          new Error('Failed to write battle-logs.json after 3 attempts: Permission denied')
        );

      // 【実際の処理実行】: deleteBattleLog() を呼び出し、エラーがスローされることを確認
      // 【期待される結果】: 削除処理が完了せず、エラーがスローされる
      await expect(service.deleteBattleLog('log_20250124_001')).rejects.toThrow(
        'Failed to write battle-logs.json after 3 attempts'
      ); // 【確認内容】: Blob Storage書き込みエラーがスローされる
    });
  });

  // =============================================================================
  // 8. 境界値テストケース
  // =============================================================================

  describe('境界値: TC-201 - limit = 1（最小値）', () => {
    test('limit=1を指定した場合、1件のみ取得される', async () => {
      // 【テスト目的】: 最小有効値での動作を確認
      // 【テスト内容】: limit=1を指定した場合、1件のみ取得される
      // 【期待される動作】: slice(0, 1)が正しく動作し、最小値でも安定動作
      // 🟡 信頼性レベル: 黄信号（phase2.md L553-555より推測）

      // 【テストデータ準備】: 3件の対戦履歴を用意
      // 【初期条件設定】: 1件ずつ詳細確認する場合を想定
      const mockBattleLogs: BattleLog[] = [
        {
          id: 'log_20250124_001',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
        {
          id: 'log_20250124_002',
          date: '2025/01/24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_master_003',
        },
        {
          id: 'log_20250124_003',
          date: '2025/01/24',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck_002',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_001',
        },
      ];

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: limit=1を指定して呼び出す
      // 【処理内容】: slice(0, 1)が実行される
      const result = await service.getBattleLogsWithDeckNames({
        limit: 1,
      });

      // 【結果検証】: 1件のみ取得される
      // 【期待値確認】: battleLogsの長さが1

      expect(result.battleLogs).toHaveLength(1); // 【確認内容】: 1件のみ取得
      expect(result.total).toBe(3); // 【確認内容】: 総件数は3件
      expect(result.limit).toBe(1); // 【確認内容】: limit=1
      expect(result.offset).toBe(0); // 【確認内容】: offset=0
    });
  });

  describe('境界値: TC-202 - limit = 1000（最大値）', () => {
    test('limit=1000を指定した場合、最大1000件取得される', async () => {
      // 【テスト目的】: 最大有効値での動作を確認
      // 【テスト内容】: limit=1000を指定した場合、最大1000件取得される
      // 【期待される動作】: 大量データでもメモリエラーが発生しない
      // 🟡 信頼性レベル: 黄信号（phase2.md L553-555より推測）

      // 【テストデータ準備】: 1500件の対戦履歴を用意（limit=1000を超える）
      // 【初期条件設定】: 大量データの一括表示・エクスポートを想定
      const mockBattleLogs: BattleLog[] = Array.from({ length: 1500 }, (_, i) => ({
        id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
        date: '2025/01/01',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck_001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck_master_002',
      }));

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: limit=1000を指定して呼び出す
      // 【処理内容】: slice(0, 1000)が実行される
      const result = await service.getBattleLogsWithDeckNames({
        limit: 1000,
      });

      // 【結果検証】: 最大1000件取得される
      // 【期待値確認】: battleLogsの長さが1000

      expect(result.battleLogs).toHaveLength(1000); // 【確認内容】: 最大1000件取得
      expect(result.total).toBe(1500); // 【確認内容】: 総件数は1500件
      expect(result.limit).toBe(1000); // 【確認内容】: limit=1000
      expect(result.offset).toBe(0); // 【確認内容】: offset=0
    });
  });

  describe('境界値: TC-203 - offset = 0（最小値）', () => {
    test('offset=0を指定した場合、先頭から取得される', async () => {
      // 【テスト目的】: ページネーションの開始点での動作を確認
      // 【テスト内容】: offset=0を指定した場合、先頭から取得される
      // 【期待される動作】: slice(0, limit)が正しく動作
      // 🟡 信頼性レベル: 黄信号（phase2.md L557-559より推測）

      // 【テストデータ準備】: 10件の対戦履歴を用意
      // 【初期条件設定】: 初回アクセス、最初のページを想定
      const mockBattleLogs: BattleLog[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
        date: '2025/01/01',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck_001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck_master_002',
      }));

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: offset=0を指定して呼び出す
      // 【処理内容】: slice(0, limit)が実行される
      const result = await service.getBattleLogsWithDeckNames({
        offset: 0,
      });

      // 【結果検証】: 先頭から取得される
      // 【期待値確認】: 最初の件数が取得される

      expect(result.total).toBe(10); // 【確認内容】: 総件数が10件
      expect(result.offset).toBe(0); // 【確認内容】: offset=0
      expect(result.battleLogs[0]?.id).toBe('log_20250101_001'); // 【確認内容】: 先頭から取得
    });
  });

  describe('境界値: TC-204 - offset が total を超える場合', () => {
    test('offsetが総件数を超える場合、空の配列が返る', async () => {
      // 【テスト目的】: ページネーションの終端を超えた場合の動作を確認
      // 【テスト内容】: offsetが総件数を超える場合、空の配列が返る（エラーにならない）
      // 【期待される動作】: slice(1000, 1100)が空配列を返す
      // 🟡 信頼性レベル: 黄信号（phase2.md L576-578より推測）

      // 【テストデータ準備】: 50件の対戦履歴を用意
      // 【初期条件設定】: URLの手動編集、古いブックマークを想定
      const mockBattleLogs: BattleLog[] = Array.from({ length: 50 }, (_, i) => ({
        id: `log_20250101_${String(i + 1).padStart(3, '0')}`,
        date: '2025/01/01',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck_001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck_master_002',
      }));

      mockBlobClient.getBattleLogs = jest.fn().mockResolvedValue(mockBattleLogs);
      mockBlobClient.getMyDecks = jest.fn().mockResolvedValue([]);
      mockBlobClient.getDeckMasters = jest.fn().mockResolvedValue([]);

      // 【実際の処理実行】: offset=1000を指定して呼び出す（total=50を超える）
      // 【処理内容】: slice(1000, 1100)が実行され、空配列が返る
      const result = await service.getBattleLogsWithDeckNames({
        offset: 1000,
      });

      // 【結果検証】: 空の配列が返る
      // 【期待値確認】: battleLogsが空配列

      expect(result.battleLogs).toEqual([]); // 【確認内容】: 空配列が返る
      expect(result.total).toBe(50); // 【確認内容】: 総件数は50件
      expect(result.offset).toBe(1000); // 【確認内容】: offset=1000
    });
  });
});
