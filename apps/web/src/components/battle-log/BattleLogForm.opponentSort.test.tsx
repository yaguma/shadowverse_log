import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBattleLogStore } from '../../store/battleLogStore';
import { useDeckStore } from '../../store/deckStore';
import { BattleLogForm } from './BattleLogForm';

/**
 * TASK-0032: 相手デッキ選択肢ソート機能テスト
 *
 * 【テスト目的】: 相手デッキ選択肢が最近使用順でソートされることを検証
 * 【テスト範囲】: ソート順、使用回数表示、API呼び出し、ローディング状態、エラーハンドリング
 * 🔵 信頼性レベル: REQ-EXT-302、dataflow.md 4.1に基づく
 */

// 【モック設定】: Zustand Storeをモック化
vi.mock('../../store/battleLogStore');
vi.mock('../../store/deckStore');

describe('BattleLogForm 相手デッキソート機能 (TASK-0032)', () => {
  // 【テスト前準備】: 各テスト実行前にモックを初期化
  beforeEach(() => {
    // useBattleLogStoreのデフォルトモック
    vi.mocked(useBattleLogStore).mockReturnValue({
      battleLogs: [],
      previousInput: null,
      isLoading: false,
      error: null,
      fetchBattleLogs: vi.fn(),
      createBattleLog: vi.fn(),
      deleteBattleLog: vi.fn(),
      setPreviousInput: vi.fn(),
      clearError: vi.fn(),
    });

    vi.clearAllMocks();
  });

  // ==================== TC-0032-001: 最近使用順ソート ====================

  describe('TC-0032-001: 最近使用したデッキが上位に表示される', () => {
    it('lastUsedDate降順で相手デッキが表示される', async () => {
      // 【テスト目的】: 最終使用日が新しいデッキが先頭に表示されることを確認
      // 【期待される動作】: lastUsedDate降順でソート済みのデータが表示される
      // 🔵 信頼性レベル: REQ-EXT-302に基づく

      const fetchDeckMastersWithUsage = vi.fn();
      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        myDecks: [
          {
            id: 'deck-001',
            deckId: '1',
            deckCode: 'xxx',
            deckName: 'テストデッキ1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        // 【使用履歴付きデッキマスター】: APIから最近使用順でソート済みのデータを想定
        deckMastersWithUsage: [
          {
            id: 'd3',
            className: 'ウィッチ',
            deckName: '最近使用デッキ',
            sortOrder: 3,
            usageCount: 5,
            lastUsedDate: '2025/01/20',
          },
          {
            id: 'd1',
            className: 'ウィッチ',
            deckName: '2番目デッキ',
            sortOrder: 1,
            usageCount: 3,
            lastUsedDate: '2025/01/15',
          },
          {
            id: 'd2',
            className: 'ウィッチ',
            deckName: '未使用デッキ',
            sortOrder: 2,
            usageCount: 0,
            lastUsedDate: null,
          },
        ],
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false,
        error: null,
        myDecksError: null,
        deckMasterError: null,
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage,
        addDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        addMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
        clearDeckMasterError: vi.fn(),
        clearMyDecksError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: 相手デッキ選択肢の順序を確認
      await waitFor(() => {
        const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
        const options = Array.from(opponentDeckSelect.options);

        // 【確認内容】: 選択肢の順序が最近使用順になっている
        expect(options[0].text).toBe('選択してください');
        expect(options[1].text).toContain('最近使用デッキ'); // 最も最近使用
        expect(options[2].text).toContain('2番目デッキ'); // 2番目に最近
        expect(options[3].text).toContain('未使用デッキ'); // 未使用は末尾
      });
    });
  });

  // ==================== TC-0032-002: 使用回数表示 ====================

  describe('TC-0032-002: 使用回数が表示される', () => {
    it('使用回数が0より大きいデッキは「(N回)」形式で表示される', async () => {
      // 【テスト目的】: 使用回数の表示を確認
      // 【期待される動作】: 使用回数が括弧付きで表示される
      // 🔵 信頼性レベル: タスク定義に基づく（オプション仕様）

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        myDecks: [
          {
            id: 'deck-001',
            deckId: '1',
            deckCode: 'xxx',
            deckName: 'テストデッキ1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        deckMastersWithUsage: [
          {
            id: 'd1',
            className: 'ウィッチ',
            deckName: '多回使用デッキ',
            sortOrder: 1,
            usageCount: 10,
            lastUsedDate: '2025/01/20',
          },
          {
            id: 'd2',
            className: 'ウィッチ',
            deckName: '未使用デッキ',
            sortOrder: 2,
            usageCount: 0,
            lastUsedDate: null,
          },
        ],
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false,
        error: null,
        myDecksError: null,
        deckMasterError: null,
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(),
        addDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        addMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
        clearDeckMasterError: vi.fn(),
        clearMyDecksError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: 使用回数の表示を確認
      await waitFor(() => {
        // 使用回数が0より大きい場合は「(N回)」形式で表示
        expect(screen.getByText(/多回使用デッキ \(10回\)/)).toBeInTheDocument();
        // 使用回数が0の場合は回数を表示しない
        const options = screen.getAllByRole('option');
        const unusedOption = options.find((opt) => opt.textContent?.includes('未使用デッキ'));
        expect(unusedOption?.textContent).toBe('未使用デッキ');
      });
    });
  });

  // ==================== TC-0032-003: sortOrder順フォールバック ====================

  describe('TC-0032-003: 対戦履歴0件時はsortOrder順にフォールバック', () => {
    it('すべてのデッキが未使用の場合sortOrder順で表示される', async () => {
      // 【テスト目的】: 使用履歴がない場合のソート順を確認
      // 【期待される動作】: sortOrder昇順でソートされる
      // 🔵 信頼性レベル: dataflow.md 4.1に基づく

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        myDecks: [
          {
            id: 'deck-001',
            deckId: '1',
            deckCode: 'xxx',
            deckName: 'テストデッキ1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        // 【使用履歴なし】: すべてのデッキがlastUsedDate=null、usageCount=0
        // APIはsortOrder順でソートして返す
        deckMastersWithUsage: [
          {
            id: 'd1',
            className: 'ウィッチ',
            deckName: 'sortOrder1デッキ',
            sortOrder: 1,
            usageCount: 0,
            lastUsedDate: null,
          },
          {
            id: 'd2',
            className: 'ウィッチ',
            deckName: 'sortOrder2デッキ',
            sortOrder: 2,
            usageCount: 0,
            lastUsedDate: null,
          },
          {
            id: 'd3',
            className: 'ウィッチ',
            deckName: 'sortOrder3デッキ',
            sortOrder: 3,
            usageCount: 0,
            lastUsedDate: null,
          },
        ],
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false,
        error: null,
        myDecksError: null,
        deckMasterError: null,
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(),
        addDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        addMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
        clearDeckMasterError: vi.fn(),
        clearMyDecksError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: sortOrder順で表示されることを確認
      await waitFor(() => {
        const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
        const options = Array.from(opponentDeckSelect.options);

        expect(options[1].text).toBe('sortOrder1デッキ');
        expect(options[2].text).toBe('sortOrder2デッキ');
        expect(options[3].text).toBe('sortOrder3デッキ');
      });
    });
  });

  // ==================== TC-0032-004: ローディング状態 ====================

  describe('TC-0032-004: ローディング中の表示', () => {
    it('isLoadingDeckMastersがtrueの場合、送信ボタンが無効化される', () => {
      // 【テスト目的】: ローディング状態での送信ボタン無効化を確認
      // 【期待される動作】: ローディング中は送信ボタンが無効化される
      // 🔵 信頼性レベル: REQ-0032-004に基づく

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        myDecks: [
          {
            id: 'deck-001',
            deckId: '1',
            deckCode: 'xxx',
            deckName: 'テストデッキ1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        deckMastersWithUsage: [],
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: true, // ローディング中
        error: null,
        myDecksError: null,
        deckMasterError: null,
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(),
        addDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        addMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
        clearDeckMasterError: vi.fn(),
        clearMyDecksError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: 送信ボタンが無効化されることを確認
      const submitButton = screen.getByRole('button', { name: '登録' });
      expect(submitButton).toBeDisabled();
    });
  });

  // ==================== TC-0032-005: エラーハンドリング ====================

  describe('TC-0032-005: APIエラー時のハンドリング', () => {
    it('deckMasterErrorがある場合エラーメッセージが表示される', async () => {
      // 【テスト目的】: APIエラー時のエラーメッセージ表示を確認
      // 【期待される動作】: エラーメッセージが表示される
      // 🔵 信頼性レベル: REQ-0032-005に基づく

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        myDecks: [
          {
            id: 'deck-001',
            deckId: '1',
            deckCode: 'xxx',
            deckName: 'テストデッキ1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        deckMastersWithUsage: [],
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false,
        error: null,
        myDecksError: null,
        deckMasterError: 'デッキマスターの取得に失敗しました', // エラー状態
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(),
        addDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        addMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
        clearDeckMasterError: vi.fn(),
        clearMyDecksError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('デッキマスターの取得に失敗しました')).toBeInTheDocument();
      });
    });
  });

  // ==================== TC-0032-006: fetchDeckMastersWithUsage呼び出し ====================

  describe('TC-0032-006: fetchDeckMastersWithUsageが呼び出される', () => {
    it('フォーム初期化時にfetchDeckMastersWithUsageが呼ばれる', () => {
      // 【テスト目的】: フォーム初期化時にAPIが正しく呼ばれることを確認
      // 【期待される動作】: fetchDeckMastersWithUsageが1回呼ばれる
      // 🔵 信頼性レベル: REQ-0032-003に基づく

      const fetchDeckMastersWithUsage = vi.fn();
      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        myDecks: [
          {
            id: 'deck-001',
            deckId: '1',
            deckCode: 'xxx',
            deckName: 'テストデッキ1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        deckMastersWithUsage: [],
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false,
        error: null,
        myDecksError: null,
        deckMasterError: null,
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage,
        addDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        addMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
        clearDeckMasterError: vi.fn(),
        clearMyDecksError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: fetchDeckMastersWithUsageが呼ばれることを確認
      expect(fetchDeckMastersWithUsage).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== TC-0032-BND-001: デッキマスター0件 ====================

  describe('TC-0032-BND-001: デッキマスター0件', () => {
    it('デッキマスターが0件の場合メッセージが表示される', () => {
      // 【テスト目的】: デッキマスターが0件の場合の動作を確認
      // 【期待される動作】: 「デッキマスターを登録してください」が表示される
      // 🔵 信頼性レベル: 既存動作の維持

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        myDecks: [
          {
            id: 'deck-001',
            deckId: '1',
            deckCode: 'xxx',
            deckName: 'テストデッキ1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        deckMastersWithUsage: [], // 0件
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false,
        error: null,
        myDecksError: null,
        deckMasterError: null,
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(),
        addDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        addMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
        clearDeckMasterError: vi.fn(),
        clearMyDecksError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: メッセージが表示されることを確認
      expect(screen.getByText('デッキマスターを登録してください')).toBeInTheDocument();
    });
  });

  // ==================== TC-0032-INT-001: フォーム送信機能の維持 ====================

  describe('TC-0032-INT-001: フォーム送信機能の維持', () => {
    it('相手デッキを選択してフォーム送信が成功する', async () => {
      // 【テスト目的】: ソート機能追加後もフォーム送信が正常に動作することを確認
      // 【期待される動作】: createBattleLogが呼ばれる
      // 🔵 信頼性レベル: 既存機能の維持

      const createBattleLog = vi.fn().mockResolvedValue(undefined);
      const onSuccess = vi.fn();

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: false,
        error: null,
        fetchBattleLogs: vi.fn(),
        createBattleLog,
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        myDecks: [
          {
            id: 'deck-001',
            deckId: '1',
            deckCode: 'xxx',
            deckName: 'テストデッキ1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        deckMastersWithUsage: [
          {
            id: 'd1',
            className: 'ウィッチ',
            deckName: 'テスト相手デッキ',
            sortOrder: 1,
            usageCount: 5,
            lastUsedDate: '2025/01/20',
          },
        ],
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false,
        error: null,
        myDecksError: null,
        deckMasterError: null,
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(),
        addDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        addMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
        clearDeckMasterError: vi.fn(),
        clearMyDecksError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm onSuccess={onSuccess} />);

      // 【必須フィールド入力】
      const myDeckSelect = screen.getByLabelText('使用デッキ') as HTMLSelectElement;
      fireEvent.change(myDeckSelect, { target: { value: 'deck-001' } });

      const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
      fireEvent.change(opponentDeckSelect, { target: { value: 'd1' } });

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: フォーム送信が成功することを確認
      await waitFor(() => {
        expect(createBattleLog).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });
});
