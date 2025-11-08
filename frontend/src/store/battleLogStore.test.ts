import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../api/client';
import { useBattleLogStore } from './battleLogStore';

// 【テストファイル概要】: Battle Log Storeの単体テスト
// 【テスト目的】: Zustandを使用した対戦履歴の状態管理機能を検証する
// 【テスト範囲】: fetchBattleLogs, createBattleLog, deleteBattleLog アクションの正常系とエラー系

// 【モック設定】: API Clientをモック化してBackend APIへの実際の通信を回避
// 【改善内容】: extractErrorMessageは本物の実装を使用し、apiClientのメソッドのみをモック化
vi.mock('../api/client', () => {
  // 【ヘルパー関数の再実装】: extractErrorMessageの本物の実装をコピー
  const extractErrorMessage = (error: unknown, defaultMessage = 'Unknown error'): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return defaultMessage;
  };

  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      del: vi.fn(),
    },
    extractErrorMessage,
  };
});

describe('Battle Log Store', () => {
  // 【テスト前準備】: 各テスト実行前にストアの状態を初期化し、一貫したテスト環境を構築
  // 【環境初期化】: ストアの状態をクリアして前のテストの影響を受けないようにする
  beforeEach(() => {
    // ストアの状態をリセット
    useBattleLogStore.setState({
      battleLogs: [],
      isLoading: false,
      error: null,
      previousInput: null,
    });

    // モックをクリア
    vi.clearAllMocks();
  });

  // ==================== fetchBattleLogs() テスト ====================

  describe('fetchBattleLogs()', () => {
    it('TC-STORE-BL-001: 対戦履歴一覧の取得が成功し、状態が更新される', async () => {
      // 【テスト目的】: BattleLogStoreの fetchBattleLogs() アクションが正常にデータを取得し、ストアの状態を更新すること 🔵
      // 【テスト内容】: Backend APIから対戦履歴一覧を取得し、ストアに保存する処理をシミュレート 🔵
      // 【期待される動作】: isLoading が true → false に遷移し、battleLogs が更新される 🔵
      // 🔵 信頼性レベル: 要件定義書とBackend API仕様に準拠

      // 【テストデータ準備】: Backend APIから返される対戦履歴一覧データを作成 🔵
      // 【初期条件設定】: 3件の対戦履歴を含むレスポンスデータを用意
      const mockBattleLogs = [
        {
          id: 'log_20251104_001',
          date: '2025/11/04',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AA' as const,
          myDeckId: 'deck-001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck-101',
        },
        {
          id: 'log_20251103_001',
          date: '2025/11/03',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'A' as const,
          myDeckId: 'deck-002',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck-102',
        },
        {
          id: 'log_20251102_001',
          date: '2025/11/02',
          battleType: '対戦台' as const,
          rank: '-' as const,
          group: '-' as const,
          myDeckId: 'deck-001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck-103',
        },
      ];

      // 【モック設定】: API Client の get() メソッドが成功レスポンスを返すように設定 🔵
      // 【API動作シミュレーション】: Backend APIから対戦履歴一覧を取得する処理を模倣
      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce({
        battleLogs: mockBattleLogs,
        total: 3,
        limit: 100,
        offset: 0,
      });

      // 【実際の処理実行】: fetchBattleLogs() アクションを呼び出す 🔵
      // 【処理内容】: ストアのfetchBattleLogs()メソッドを実行し、データ取得処理を開始
      await useBattleLogStore.getState().fetchBattleLogs();

      // 【結果検証】: ストアの状態が正しく更新されていることを確認 🔵
      // 【期待値確認】: データ取得後の状態が想定通りであること
      const state = useBattleLogStore.getState();

      expect(state.battleLogs).toEqual(mockBattleLogs); // 【確認内容】: battleLogsが取得したデータで更新されている 🔵
      expect(state.battleLogs).toHaveLength(3); // 【確認内容】: 3件の対戦履歴が保存されている 🔵
      expect(state.isLoading).toBe(false); // 【確認内容】: ローディング状態が false に戻っている 🔵
      expect(state.error).toBeNull(); // 【確認内容】: エラー状態がクリアされている 🔵

      // 【API呼び出し確認】: API Clientの get() メソッドが正しく呼ばれていることを確認 🔵
      expect(apiClient.apiClient.get).toHaveBeenCalledTimes(1); // 【確認内容】: get()が1回だけ呼ばれている 🔵
      expect(apiClient.apiClient.get).toHaveBeenCalledWith('/battle-logs'); // 【確認内容】: 正しいエンドポイントが指定されている 🔵
    });

    it('TC-STORE-BL-002: 対戦履歴一覧の取得が失敗し、エラー状態が設定される', async () => {
      // 【テスト目的】: エラーハンドリングの確認 - API呼び出しが失敗した場合の処理 🔵
      // 【テスト内容】: Backend APIがエラーを返した場合の状態管理をシミュレート 🔵
      // 【期待される動作】: errorにエラーメッセージが設定され、battleLogsは変更されない 🔵
      // 🔵 信頼性レベル: エラー時でもアプリケーションが安全に動作すること

      // 【テストデータ準備】: エラー発生前の初期データを設定 🔵
      // 【初期条件設定】: 既存の対戦履歴データが存在する状態を用意
      const existingData = [
        {
          id: 'log_existing_001',
          date: '2025/11/01',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AA' as const,
          myDeckId: 'deck-001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck-101',
        },
      ];

      useBattleLogStore.setState({ battleLogs: existingData });

      // 【モック設定】: API Client の get() メソッドがエラーを投げるように設定 🔵
      // 【エラーシミュレーション】: ネットワークエラーまたはAPIエラーを再現
      const mockError = new Error('ネットワークエラーが発生しました');
      vi.mocked(apiClient.apiClient.get).mockRejectedValueOnce(mockError);

      // 【実際の処理実行】: fetchBattleLogs() アクションを呼び出す 🔵
      // 【処理内容】: エラーが発生する状況でデータ取得処理を実行
      await useBattleLogStore.getState().fetchBattleLogs();

      // 【結果検証】: エラー時のストアの状態が正しく更新されていることを確認 🔵
      // 【期待値確認】: エラーメッセージが設定され、既存データが保持されること
      const state = useBattleLogStore.getState();

      expect(state.error).toBe('ネットワークエラーが発生しました'); // 【確認内容】: errorにエラーメッセージが設定されている 🔵
      expect(state.battleLogs).toEqual(existingData); // 【確認内容】: 既存のbattleLogsが保持されている（変更されていない） 🔵
      expect(state.isLoading).toBe(false); // 【確認内容】: ローディング状態が false に戻っている 🔵
    });
  });

  // ==================== createBattleLog() テスト ====================

  describe('createBattleLog()', () => {
    it('TC-STORE-BL-003: 新規対戦履歴の登録が成功し、previousInputが保存される', async () => {
      // 【テスト目的】: BattleLogStoreの createBattleLog() アクションが正常にデータを登録し、previousInput を保存すること 🔵
      // 【テスト内容】: 新規対戦履歴を登録し、前回入力値を保存する処理をシミュレート 🔵
      // 【期待される動作】: データが登録され、previousInput が更新され、一覧が再取得される 🔵
      // 🔵 信頼性レベル: 要件REQ-301（前回入力値の自動表示）に準拠

      // 【テストデータ準備】: ユーザーが入力した新規対戦履歴データを作成 🔵
      // 【初期条件設定】: 8項目の対戦履歴データを用意
      const inputData = {
        date: '2025-11-04',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AA' as const,
        myDeckId: 'deck-001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck-101',
      };

      const mockCreatedLog = {
        id: 'log_20251104_001',
        date: '2025/11/04',
        ...inputData,
      };

      // 【モック設定】: API Client の post() メソッドが成功レスポンスを返すように設定 🔵
      // 【API動作シミュレーション】: Backend APIに新規データを送信し、登録されたデータを受け取る処理を模倣
      vi.mocked(apiClient.apiClient.post).mockResolvedValueOnce(mockCreatedLog);

      // 【モック設定】: fetchBattleLogs()用のget()メソッドもモック化 🔵
      // 【理由】: createBattleLog()内でfetchBattleLogs()が呼ばれるため
      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce({
        battleLogs: [mockCreatedLog],
        total: 1,
        limit: 100,
        offset: 0,
      });

      // 【実際の処理実行】: createBattleLog() アクションを呼び出す 🔵
      // 【処理内容】: ストアのcreateBattleLog()メソッドを実行し、新規登録処理を開始
      await useBattleLogStore.getState().createBattleLog(inputData);

      // 【結果検証】: ストアの状態が正しく更新されていることを確認 🔵
      // 【期待値確認】: previousInputが保存され、一覧が更新されること
      const state = useBattleLogStore.getState();

      expect(state.previousInput).toEqual(inputData); // 【確認内容】: previousInputに入力値が保存されている 🔵
      expect(state.battleLogs).toContainEqual(mockCreatedLog); // 【確認内容】: 新規登録したデータが一覧に含まれている 🔵
      expect(state.isLoading).toBe(false); // 【確認内容】: ローディング状態が false に戻っている 🔵
      expect(state.error).toBeNull(); // 【確認内容】: エラー状態がクリアされている 🔵

      // 【API呼び出し確認】: API Client の post() メソッドが正しく呼ばれていることを確認 🔵
      expect(apiClient.apiClient.post).toHaveBeenCalledTimes(1); // 【確認内容】: post()が1回だけ呼ばれている 🔵
      expect(apiClient.apiClient.post).toHaveBeenCalledWith('/battle-logs', inputData); // 【確認内容】: 正しいエンドポイントとデータで呼ばれている 🔵

      // 【fetchBattleLogs呼び出し確認】: 登録後に一覧が再取得されることを確認 🔵
      expect(apiClient.apiClient.get).toHaveBeenCalledWith('/battle-logs'); // 【確認内容】: fetchBattleLogs()が呼ばれている 🔵
    });

    it('TC-STORE-BL-004: 新規対戦履歴の登録が失敗し、エラー状態が設定される', async () => {
      // 【テスト目的】: エラーハンドリングの確認 - バリデーションエラーまたはAPIエラーが発生した場合 🔵
      // 【テスト内容】: 不正なデータを登録しようとした場合の状態管理をシミュレート 🔵
      // 【期待される動作】: errorにエラーメッセージが設定され、previousInputは更新されない 🔵
      // 🔵 信頼性レベル: ユーザーに入力エラーを明確に伝えるため

      // 【テストデータ準備】: 不正なデータ（未来の日付）を作成 🔵
      // 【初期条件設定】: バリデーションエラーが発生するデータを用意
      const invalidData = {
        date: '2099-12-31',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AA' as const,
        myDeckId: 'deck-001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck-101',
      };

      // 【モック設定】: API Client の post() メソッドがエラーを投げるように設定 🔵
      // 【エラーシミュレーション】: Backend APIからのバリデーションエラーを再現
      const mockError = new Error('未来の日付は入力できません');
      vi.mocked(apiClient.apiClient.post).mockRejectedValueOnce(mockError);

      // 【実際の処理実行】: createBattleLog() アクションを呼び出し、エラーが投げられることを確認 🔵
      // 【処理内容】: エラーが発生する状況でデータ登録処理を実行
      await expect(useBattleLogStore.getState().createBattleLog(invalidData)).rejects.toThrow(
        '未来の日付は入力できません'
      ); // 【確認内容】: エラーが正しく投げられる 🔵

      // 【結果検証】: エラー時のストアの状態が正しく更新されていることを確認 🔵
      // 【期待値確認】: エラーメッセージが設定され、previousInputは更新されないこと
      const state = useBattleLogStore.getState();

      expect(state.error).toBe('未来の日付は入力できません'); // 【確認内容】: errorにエラーメッセージが設定されている 🔵
      expect(state.previousInput).toBeNull(); // 【確認内容】: previousInputは更新されていない（nullのまま） 🔵
      expect(state.isLoading).toBe(false); // 【確認内容】: ローディング状態が false に戻っている 🔵

      // 【fetchBattleLogs呼び出し確認】: エラー時は一覧が再取得されないことを確認 🔵
      expect(apiClient.apiClient.get).not.toHaveBeenCalled(); // 【確認内容】: fetchBattleLogs()が呼ばれていない 🔵
    });
  });

  // ==================== deleteBattleLog() テスト ====================

  describe('deleteBattleLog()', () => {
    it('TC-STORE-BL-005: 対戦履歴の削除が成功し、一覧が更新される', async () => {
      // 【テスト目的】: BattleLogStoreの deleteBattleLog() アクションが正常にデータを削除し、一覧を更新すること 🔵
      // 【テスト内容】: 特定の対戦履歴を削除し、一覧から除外する処理をシミュレート 🔵
      // 【期待される動作】: データが削除され、一覧が再取得される 🔵
      // 🔵 信頼性レベル: 要件REQ-101（各対戦履歴に削除ボタンを表示）に準拠

      // 【テストデータ準備】: 削除前の対戦履歴一覧データを作成 🔵
      // 【初期条件設定】: 3件の対戦履歴が存在する状態を用意
      const existingLogs = [
        {
          id: 'log_20251104_001',
          date: '2025/11/04',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AA' as const,
          myDeckId: 'deck-001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck-101',
        },
        {
          id: 'log_20251103_001',
          date: '2025/11/03',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'A' as const,
          myDeckId: 'deck-002',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck-102',
        },
        {
          id: 'log_20251102_001',
          date: '2025/11/02',
          battleType: '対戦台' as const,
          rank: '-' as const,
          group: '-' as const,
          myDeckId: 'deck-001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck-103',
        },
      ];

      useBattleLogStore.setState({ battleLogs: existingLogs });

      // 【モック設定】: API Client の del() メソッドが成功レスポンスを返すように設定 🔵
      // 【API動作シミュレーション】: Backend APIに削除リクエストを送信し、成功レスポンスを受け取る処理を模倣
      vi.mocked(apiClient.apiClient.del).mockResolvedValueOnce({
        message: '対戦履歴を削除しました',
      });

      // 【モック設定】: fetchBattleLogs()用のget()メソッドもモック化 🔵
      // 【理由】: deleteBattleLog()内でfetchBattleLogs()が呼ばれるため
      const logsAfterDeletion = existingLogs.filter((log) => log.id !== 'log_20251103_001');
      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce({
        battleLogs: logsAfterDeletion,
        total: 2,
        limit: 100,
        offset: 0,
      });

      // 【実際の処理実行】: deleteBattleLog() アクションを呼び出す 🔵
      // 【処理内容】: ストアのdeleteBattleLog()メソッドを実行し、削除処理を開始
      await useBattleLogStore.getState().deleteBattleLog('log_20251103_001');

      // 【結果検証】: ストアの状態が正しく更新されていることを確認 🔵
      // 【期待値確認】: 削除されたデータが一覧から消えていること
      const state = useBattleLogStore.getState();

      expect(state.battleLogs).toHaveLength(2); // 【確認内容】: 対戦履歴が2件に減っている 🔵
      expect(state.battleLogs).not.toContainEqual(
        expect.objectContaining({ id: 'log_20251103_001' })
      ); // 【確認内容】: 削除したデータが一覧に含まれていない 🔵
      expect(state.isLoading).toBe(false); // 【確認内容】: ローディング状態が false に戻っている 🔵
      expect(state.error).toBeNull(); // 【確認内容】: エラー状態がクリアされている 🔵

      // 【API呼び出し確認】: API Client の del() メソッドが正しく呼ばれていることを確認 🔵
      expect(apiClient.apiClient.del).toHaveBeenCalledTimes(1); // 【確認内容】: del()が1回だけ呼ばれている 🔵
      expect(apiClient.apiClient.del).toHaveBeenCalledWith('/battle-logs/log_20251103_001'); // 【確認内容】: 正しいエンドポイント（ID含む）で呼ばれている 🔵

      // 【fetchBattleLogs呼び出し確認】: 削除後に一覧が再取得されることを確認 🔵
      expect(apiClient.apiClient.get).toHaveBeenCalledWith('/battle-logs'); // 【確認内容】: fetchBattleLogs()が呼ばれている 🔵
    });

    it('TC-STORE-BL-006: 存在しないIDの削除が失敗し、エラー状態が設定される', async () => {
      // 【テスト目的】: エラーハンドリングの確認 - 存在しないIDを削除しようとした場合 🔵
      // 【テスト内容】: 不正なIDで削除を試みた場合の状態管理をシミュレート 🔵
      // 【期待される動作】: errorにエラーメッセージが設定され、一覧は変更されない 🔵
      // 🔵 信頼性レベル: Backend APIのエラー時でもアプリケーションが安全に動作すること

      // 【テストデータ準備】: 削除前の対戦履歴一覧データを作成 🔵
      // 【初期条件設定】: 既存の対戦履歴データが存在する状態を用意
      const existingLogs = [
        {
          id: 'log_20251104_001',
          date: '2025/11/04',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AA' as const,
          myDeckId: 'deck-001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck-101',
        },
      ];

      useBattleLogStore.setState({ battleLogs: existingLogs });

      // 【モック設定】: API Client の del() メソッドがエラーを投げるように設定 🔵
      // 【エラーシミュレーション】: Backend APIから「対戦履歴が見つかりません」エラーを再現
      const mockError = new Error('対戦履歴が見つかりません');
      vi.mocked(apiClient.apiClient.del).mockRejectedValueOnce(mockError);

      // 【実際の処理実行】: deleteBattleLog() アクションを呼び出し、エラーが投げられることを確認 🔵
      // 【処理内容】: エラーが発生する状況で削除処理を実行
      await expect(
        useBattleLogStore.getState().deleteBattleLog('log_non_existent_999')
      ).rejects.toThrow('対戦履歴が見つかりません'); // 【確認内容】: エラーが正しく投げられる 🔵

      // 【結果検証】: エラー時のストアの状態が正しく更新されていることを確認 🔵
      // 【期待値確認】: エラーメッセージが設定され、既存データが保持されること
      const state = useBattleLogStore.getState();

      expect(state.error).toBe('対戦履歴が見つかりません'); // 【確認内容】: errorにエラーメッセージが設定されている 🔵
      expect(state.battleLogs).toEqual(existingLogs); // 【確認内容】: 既存のbattleLogsが保持されている（変更されていない） 🔵
      expect(state.isLoading).toBe(false); // 【確認内容】: ローディング状態が false に戻っている 🔵

      // 【fetchBattleLogs呼び出し確認】: エラー時は一覧が再取得されないことを確認 🔵
      expect(apiClient.apiClient.get).not.toHaveBeenCalled(); // 【確認内容】: fetchBattleLogs()が呼ばれていない 🔵
    });
  });

  // ==================== setPreviousInput() テスト ====================

  describe('setPreviousInput()', () => {
    it('TC-STORE-BL-007: 前回入力値の設定が成功する', () => {
      // 【テスト目的】: BattleLogStoreの setPreviousInput() アクションが正常に動作すること 🔵
      // 【テスト内容】: previousInputを手動で設定する処理をシミュレート 🔵
      // 【期待される動作】: previousInputが指定した値で更新される 🔵
      // 🔵 信頼性レベル: 要件REQ-301（前回入力値の自動表示）に準拠

      // 【テストデータ準備】: 設定する前回入力値を作成 🔵
      // 【初期条件設定】: 部分的な入力データ（必須項目のみ）を用意
      const previousInput = {
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AA' as const,
        myDeckId: 'deck-001',
      };

      // 【実際の処理実行】: setPreviousInput() アクションを呼び出す 🔵
      // 【処理内容】: ストアのsetPreviousInput()メソッドを実行し、前回入力値を設定
      useBattleLogStore.getState().setPreviousInput(previousInput);

      // 【結果検証】: ストアの状態が正しく更新されていることを確認 🔵
      // 【期待値確認】: previousInputが指定した値で更新されること
      const state = useBattleLogStore.getState();

      expect(state.previousInput).toEqual(previousInput); // 【確認内容】: previousInputが指定した値で設定されている 🔵
    });
  });

  // ==================== clearError() テスト ====================

  describe('clearError()', () => {
    it('TC-STORE-BL-008: エラー状態のクリアが成功する', () => {
      // 【テスト目的】: BattleLogStoreの clearError() アクションが正常に動作すること 🔵
      // 【テスト内容】: エラー状態をクリアする処理をシミュレート 🔵
      // 【期待される動作】: errorが null に設定される 🔵
      // 🔵 信頼性レベル: ユーザーがエラーメッセージを閉じた後の状態管理

      // 【初期条件設定】: エラー状態が存在する状態を用意 🔵
      useBattleLogStore.setState({ error: 'ネットワークエラーが発生しました' });

      // 【実際の処理実行】: clearError() アクションを呼び出す 🔵
      // 【処理内容】: ストアのclearError()メソッドを実行し、エラー状態をクリア
      useBattleLogStore.getState().clearError();

      // 【結果検証】: ストアの状態が正しく更新されていることを確認 🔵
      // 【期待値確認】: errorが null にクリアされること
      const state = useBattleLogStore.getState();

      expect(state.error).toBeNull(); // 【確認内容】: errorがnullにクリアされている 🔵
    });
  });

  // ==================== エッジケーステスト ====================

  describe('エッジケース', () => {
    it('TC-STORE-BL-009: 複数のAPI呼び出しが連続して実行される', async () => {
      // 【テスト目的】: 複数のAPI呼び出しが連続して実行された場合の動作を確認 🔵
      // 【テスト内容】: fetchBattleLogs()が連続して呼ばれた場合の状態管理をシミュレート 🔵
      // 【期待される動作】: 最後のレスポンスで状態が更新される 🔵
      // 🟡 信頼性レベル: Phase 1では特別な制御なし（Zustandのデフォルト動作に任せる）

      // 【テストデータ準備】: 2回目のAPI呼び出しのレスポンスデータを作成 🔵
      const mockFirstResponse = [
        {
          id: 'log_first_001',
          date: '2025/11/04',
          battleType: 'ランクマッチ' as const,
          rank: 'ダイアモンド' as const,
          group: 'AA' as const,
          myDeckId: 'deck-001',
          turn: '先攻' as const,
          result: '勝ち' as const,
          opponentDeckId: 'deck-101',
        },
      ];

      const mockSecondResponse = [
        {
          id: 'log_second_001',
          date: '2025/11/05',
          battleType: 'ランクマッチ' as const,
          rank: 'ルビー' as const,
          group: 'A' as const,
          myDeckId: 'deck-002',
          turn: '後攻' as const,
          result: '負け' as const,
          opponentDeckId: 'deck-102',
        },
      ];

      // 【モック設定】: API Client の get() メソッドが2回連続で異なるレスポンスを返すように設定 🔵
      vi.mocked(apiClient.apiClient.get)
        .mockResolvedValueOnce({
          battleLogs: mockFirstResponse,
          total: 1,
          limit: 100,
          offset: 0,
        })
        .mockResolvedValueOnce({
          battleLogs: mockSecondResponse,
          total: 1,
          limit: 100,
          offset: 0,
        });

      // 【実際の処理実行】: fetchBattleLogs() を2回連続で呼び出す 🔵
      // 【処理内容】: 複数のAPI呼び出しが同時に実行される状況を再現
      await useBattleLogStore.getState().fetchBattleLogs();
      await useBattleLogStore.getState().fetchBattleLogs();

      // 【結果検証】: 最後のレスポンスで状態が更新されていることを確認 🔵
      const state = useBattleLogStore.getState();

      expect(state.battleLogs).toEqual(mockSecondResponse); // 【確認内容】: 最後のレスポンスでbattleLogsが更新されている 🔵
      expect(apiClient.apiClient.get).toHaveBeenCalledTimes(2); // 【確認内容】: get()が2回呼ばれている 🔵
    });
  });
});
