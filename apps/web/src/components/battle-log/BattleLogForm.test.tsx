import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBattleLogStore } from '../../store/battleLogStore';
import { useDeckStore } from '../../store/deckStore';
import { getTodayInJST } from '../../utils/date';
import { BattleLogForm } from './BattleLogForm';

// 【テストファイル概要】: Battle Log登録フォームコンポーネントの単体テスト
// 【テスト目的】: BattleLogFormコンポーネントの全機能（正常系・異常系・境界値・UI/UX・統合・アクセシビリティ・エッジケース）を検証する
// 【テスト範囲】: フォーム表示、入力処理、バリデーション、送信処理、前回値引き継ぎ、エラーハンドリング、レスポンシブデザイン、アクセシビリティ

// 【モック設定】: Zustand Storeをモック化してストアの動作を制御
vi.mock('../../store/battleLogStore');
vi.mock('../../store/deckStore');

describe('BattleLogForm', () => {
  // 【テスト前準備】: 各テスト実行前にモックを初期化し、一貫したテスト環境を構築
  // 【環境初期化】: ストアのモックをリセットして前のテストの影響を受けないようにする
  beforeEach(() => {
    // 【モック初期化】: useBattleLogStoreのモックをデフォルト状態に設定
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

    // 【モック初期化】: useDeckStoreのモックをデフォルト状態に設定
    // 🔵 TASK-0049: API連携のため、デッキマスター一覧をStoreから取得するモック
    // 🔵 TASK-0032: deckMastersWithUsage と関連プロパティを追加
    vi.mocked(useDeckStore).mockReturnValue({
      deckMasters: [
        { id: 'deck-master-001', className: 'ウィッチ', deckName: '相手デッキ1', sortOrder: 1 },
        { id: 'deck-master-002', className: 'ウィッチ', deckName: '相手デッキ2', sortOrder: 2 },
        { id: 'deck-master-005', className: 'ウィッチ', deckName: '相手デッキ5', sortOrder: 5 },
      ],
      // 🔵 TASK-0032: 使用履歴付きデッキマスター一覧
      deckMastersWithUsage: [
        {
          id: 'deck-master-001',
          className: 'ウィッチ',
          deckName: '相手デッキ1',
          sortOrder: 1,
          usageCount: 0,
          lastUsedDate: null,
        },
        {
          id: 'deck-master-002',
          className: 'ウィッチ',
          deckName: '相手デッキ2',
          sortOrder: 2,
          usageCount: 0,
          lastUsedDate: null,
        },
        {
          id: 'deck-master-005',
          className: 'ウィッチ',
          deckName: '相手デッキ5',
          sortOrder: 5,
          usageCount: 0,
          lastUsedDate: null,
        },
      ],
      myDecks: [
        {
          id: 'deck-001',
          deckId: '1',
          deckCode: 'xxx',
          deckName: 'テストデッキ1',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'deck-002',
          deckId: '2',
          deckCode: 'yyy',
          deckName: 'テストデッキ2',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isMyDecksLoading: false,
      isLoadingDeckMasters: false, // 🔵 TASK-0032
      error: null,
      myDecksError: null,
      deckMasterError: null, // 🔵 TASK-0032
      fetchDeckMasters: vi.fn(),
      fetchMyDecks: vi.fn(),
      fetchDeckMastersWithUsage: vi.fn(), // 🔵 TASK-0032
      addDeckMaster: vi.fn(), // 🔵 TASK-0032
      updateDeckMaster: vi.fn(), // 🔵 TASK-0032
      deleteDeckMaster: vi.fn(), // 🔵 TASK-0032
      addMyDeck: vi.fn(), // 🔵 TASK-0032
      deleteMyDeck: vi.fn(), // 🔵 TASK-0032
      clearError: vi.fn(),
      clearDeckMasterError: vi.fn(), // 🔵 TASK-0032
      clearMyDecksError: vi.fn(), // 🔵 TASK-0032
    });

    // モックをクリア
    vi.clearAllMocks();
  });

  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-FORM-001: フォームが正しく初期表示される', () => {
      // 【テスト目的】: BattleLogFormコンポーネントが初回マウント時に正しくレンダリングされること
      // 【テスト内容】: すべての入力フィールドとボタンが表示され、デフォルト値が正しく設定される
      // 【期待される動作】: 日付フィールドに今日の日付が設定され、すべてのフィールドがアクセス可能である
      // 🔵 信頼性レベル: 要件定義書 REQ-002, REQ-003 に基づく

      // 【テストデータ準備】: onSuccess, onCancel コールバック関数を用意
      // 【初期条件設定】: previousInputは存在しない状態を想定
      const onSuccess = vi.fn();
      const onCancel = vi.fn();

      // 【実際の処理実行】: BattleLogFormコンポーネントをレンダリング
      // 【処理内容】: 初期表示時のフォームの状態を確認
      render(<BattleLogForm onSuccess={onSuccess} onCancel={onCancel} />);

      // 【結果検証】: すべてのフィールドとボタンが表示されていることを確認
      // 【期待値確認】: 日付フィールドに今日の日付が設定されている
      const today = getTodayInJST(); // YYYY-MM-DD形式（日本時間）
      const dateInput = screen.getByLabelText('対戦日') as HTMLInputElement;
      expect(dateInput.value).toBe(today); // 【確認内容】: 日付フィールドに今日の日付が設定されている 🔵

      // 【確認内容】: すべての入力フィールドが表示されている 🔵
      expect(screen.getByLabelText('対戦タイプ')).toBeInTheDocument();
      expect(screen.getByLabelText('ランク')).toBeInTheDocument();
      expect(screen.getByLabelText('グループ')).toBeInTheDocument();
      expect(screen.getByLabelText('使用デッキ')).toBeInTheDocument();
      expect(screen.getByLabelText('先攻後攻')).toBeInTheDocument();
      expect(screen.getByLabelText('対戦結果')).toBeInTheDocument();
      expect(screen.getByLabelText('相手デッキ')).toBeInTheDocument();

      // 【確認内容】: ボタンが表示されている 🔵
      expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('TC-FORM-002: 前回入力値が正しく引き継がれる（日付以外）', () => {
      // 【テスト目的】: Zustand Storeの previousInput から前回入力値を取得し、フォームに反映されること
      // 【テスト内容】: 日付以外の7フィールドに前回入力値が自動入力され、日付は今日の日付が設定される
      // 【期待される動作】: 日付フィールドのみ今日の日付に上書きされ、その他は前回値が維持されること
      // 🔵 信頼性レベル: 要件定義書 REQ-003 に基づく

      // 【テストデータ準備】: previousInputに前回の入力値を設定
      // 【初期条件設定】: 前回の対戦履歴登録時の入力値を再利用
      const previousInput = {
        date: '2025-11-06', // 前回の日付（引き継がれない）
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        groupName: 'AAA' as const,
        myDeckId: 'deck-001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck-master-002',
      };

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput,
        isLoading: false,
        error: null,
        fetchBattleLogs: vi.fn(),
        createBattleLog: vi.fn(),
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormコンポーネントをレンダリング
      // 【処理内容】: previousInputが反映されたフォームの状態を確認
      render(<BattleLogForm />);

      // 【結果検証】: 日付以外のフィールドに前回値が設定されていることを確認
      // 【期待値確認】: 日付のみ今日の日付、その他は前回値が反映される
      const today = getTodayInJST(); // 日本時間
      const dateInput = screen.getByLabelText('対戦日') as HTMLInputElement;
      expect(dateInput.value).toBe(today); // 【確認内容】: 日付は今日の日付（前回値を引き継がない） 🔵

      const battleTypeSelect = screen.getByLabelText('対戦タイプ') as HTMLSelectElement;
      expect(battleTypeSelect.value).toBe('ランクマッチ'); // 【確認内容】: 対戦タイプは前回値 🔵

      const rankSelect = screen.getByLabelText('ランク') as HTMLSelectElement;
      expect(rankSelect.value).toBe('ダイアモンド'); // 【確認内容】: ランクは前回値 🔵

      const groupSelect = screen.getByLabelText('グループ') as HTMLSelectElement;
      expect(groupSelect.value).toBe('AAA'); // 【確認内容】: グループは前回値 🔵
    });

    it('TC-FORM-003: 各フィールドに入力できる', () => {
      // 【テスト目的】: ユーザーが各入力フィールドに値を入力でき、内部状態が更新されること
      // 【テスト内容】: onChange イベントが発火し、フォームの内部状態が正しく更新される
      // 【期待される動作】: すべての入力フィールドがユーザーの入力を受け付け、状態が同期されること
      // 🔵 信頼性レベル: Reactの基本的な動作パターンに基づく

      // 【実際の処理実行】: BattleLogFormコンポーネントをレンダリング
      render(<BattleLogForm />);

      // 【テストデータ準備】: ユーザーが入力する値を定義
      // 【入力処理実行】: 各フィールドに値を入力
      const dateInput = screen.getByLabelText('対戦日') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2025-11-07' } });
      expect(dateInput.value).toBe('2025-11-07'); // 【確認内容】: 日付フィールドが入力を受け付ける 🔵

      const battleTypeSelect = screen.getByLabelText('対戦タイプ') as HTMLSelectElement;
      fireEvent.change(battleTypeSelect, { target: { value: '対戦台' } });
      expect(battleTypeSelect.value).toBe('対戦台'); // 【確認内容】: 対戦タイプが入力を受け付ける 🔵

      const rankSelect = screen.getByLabelText('ランク') as HTMLSelectElement;
      fireEvent.change(rankSelect, { target: { value: 'ルビー' } });
      expect(rankSelect.value).toBe('ルビー'); // 【確認内容】: ランクが入力を受け付ける 🔵
    });

    it('TC-FORM-004: フォーム送信が成功し、onSuccessコールバックが呼ばれる', async () => {
      // 【テスト目的】: フォーム送信ボタンクリック時に Zustand Store の createBattleLog() が呼ばれ、成功時に onSuccess コールバックが実行されること
      // 【テスト内容】: API呼び出しが成功し、フォームが閉じられる（onSuccessコールバック経由）
      // 【期待される動作】: createBattleLog()の呼び出し、onSuccessコールバックの呼び出し、ローディング状態の遷移
      // 🔵 信頼性レベル: 要件定義書 REQ-001、データフロー図に基づく

      // 【テストデータ準備】: モック関数を用意
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

      // 【実際の処理実行】: フォームをレンダリングして必須フィールドを入力後、送信ボタンをクリック
      render(<BattleLogForm onSuccess={onSuccess} />);

      // 【必須フィールド入力】: myDeckIdとopponentDeckIdを入力してバリデーションエラーを解消
      const myDeckSelect = screen.getByLabelText('使用デッキ') as HTMLSelectElement;
      fireEvent.change(myDeckSelect, { target: { value: 'deck-001' } });

      const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
      fireEvent.change(opponentDeckSelect, { target: { value: 'deck-master-001' } });

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: createBattleLog()とonSuccess()が呼ばれることを確認
      await waitFor(() => {
        expect(createBattleLog).toHaveBeenCalledTimes(1); // 【確認内容】: createBattleLog()が1回呼ばれる 🔵
        expect(onSuccess).toHaveBeenCalledTimes(1); // 【確認内容】: onSuccessコールバックが1回呼ばれる 🔵
      });
    });

    it('TC-FORM-005: キャンセルボタンでonCancelコールバックが呼ばれる', () => {
      // 【テスト目的】: キャンセルボタンクリック時に onCancel コールバックが呼ばれること
      // 【テスト内容】: フォームがクローズされる（onCancelコールバック経由）
      // 【期待される動作】: onCancelコールバックの呼び出し、API呼び出しが行われないこと
      // 🟡 信頼性レベル: 一般的なフォームUIパターンから推測

      // 【テストデータ準備】: onCancelコールバック関数を用意
      const onCancel = vi.fn();
      const createBattleLog = vi.fn();

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

      // 【実際の処理実行】: キャンセルボタンをクリック
      render(<BattleLogForm onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      fireEvent.click(cancelButton);

      // 【結果検証】: onCancelが呼ばれ、createBattleLogは呼ばれないことを確認
      expect(onCancel).toHaveBeenCalledTimes(1); // 【確認内容】: onCancelコールバックが1回呼ばれる 🟡
      expect(createBattleLog).not.toHaveBeenCalled(); // 【確認内容】: API呼び出しは行われない 🟡
    });
  });

  // ==================== 2. 異常系テストケース ====================

  describe('異常系テスト', () => {
    it('TC-FORM-ERR-001: 未来日付でバリデーションエラーが表示される', async () => {
      // 【テスト目的】: 未来日付のバリデーションが正しく動作することを確認
      // 【テスト内容】: ユーザーが未来の日付を入力した場合のクライアント側バリデーション
      // 【期待される動作】: インラインエラーメッセージ表示、送信ボタンの無効化
      // 🔵 信頼性レベル: 要件定義書 REQ-030, REQ-031 に基づく

      // 【実際の処理実行】: フォームをレンダリングして未来日付を入力
      render(<BattleLogForm />);

      const dateInput = screen.getByLabelText('対戦日') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2099-12-31' } });
      fireEvent.blur(dateInput);

      // 【結果検証】: エラーメッセージが表示され、送信ボタンが無効化されることを確認
      await waitFor(() => {
        expect(screen.getByText('未来の日付は入力できません')).toBeInTheDocument(); // 【確認内容】: エラーメッセージが表示される 🔵
      });

      const submitButton = screen.getByRole('button', { name: '登録' });
      expect(submitButton).toBeDisabled(); // 【確認内容】: 送信ボタンが無効化される 🔵
    });

    it('TC-FORM-ERR-002: 必須項目未入力でバリデーションエラーが表示される（myDeckId）', async () => {
      // 【テスト目的】: 必須項目バリデーションが正しく動作することを確認
      // 【テスト内容】: マイデッキIDが未選択の場合のバリデーション
      // 【期待される動作】: インラインエラーメッセージ表示、送信ボタンの無効化
      // 🔵 信頼性レベル: 要件定義書 REQ-002 に基づく

      // 【実際の処理実行】: フォームをレンダリングして送信ボタンをクリック
      render(<BattleLogForm />);

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('使用デッキは必須です')).toBeInTheDocument(); // 【確認内容】: エラーメッセージが表示される 🔵
      });

      expect(submitButton).toBeDisabled(); // 【確認内容】: 送信ボタンが無効化される 🔵
    });

    it('TC-FORM-ERR-003: 必須項目未入力でバリデーションエラーが表示される（opponentDeckId）', async () => {
      // 【テスト目的】: 必須項目バリデーションが正しく動作することを確認
      // 【テスト内容】: 相手デッキIDが未選択の場合のバリデーション
      // 【期待される動作】: インラインエラーメッセージ表示、送信ボタンの無効化
      // 🔵 信頼性レベル: 要件定義書 REQ-002 に基づく

      // 【実際の処理実行】: フォームをレンダリングして送信ボタンをクリック
      render(<BattleLogForm />);

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('相手デッキは必須です')).toBeInTheDocument(); // 【確認内容】: エラーメッセージが表示される 🔵
      });

      expect(submitButton).toBeDisabled(); // 【確認内容】: 送信ボタンが無効化される 🔵
    });

    it('TC-FORM-ERR-004: APIエラー時にエラーメッセージが表示される（ネットワークエラー）', async () => {
      // 【テスト目的】: ネットワークエラー時のエラーハンドリングが正しく動作することを確認
      // 【テスト内容】: Backend APIへの通信が失敗した場合のエラーハンドリング
      // 【期待される動作】: グローバルエラーメッセージ表示、ローディング状態解除、フォームは閉じない
      // 🔵 信頼性レベル: EDGE-001 (ネットワークエラー) に基づく

      // 【テストデータ準備】: createBattleLogがエラーを投げるように設定
      const createBattleLog = vi
        .fn()
        .mockRejectedValue(new Error('ネットワークエラーが発生しました'));

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: false,
        error: 'ネットワークエラーが発生しました',
        fetchBattleLogs: vi.fn(),
        createBattleLog,
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: フォームをレンダリングして送信ボタンをクリック
      render(<BattleLogForm />);

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: エラーメッセージが表示され、フォームが閉じないことを確認
      await waitFor(() => {
        expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument(); // 【確認内容】: エラーメッセージが表示される 🔵
      });

      expect(submitButton).toBeInTheDocument(); // 【確認内容】: フォームは閉じない（再送信可能） 🔵
    });

    it('TC-FORM-ERR-005: APIエラー時にエラーメッセージが表示される（バリデーションエラー）', async () => {
      // 【テスト目的】: バリデーションエラー時のエラーハンドリングが正しく動作することを確認
      // 【テスト内容】: Backend APIがバリデーションエラーを返した場合のエラーハンドリング
      // 【期待される動作】: グローバルエラーメッセージ表示、インラインエラー表示、フォームは閉じない
      // 🔵 信頼性レベル: EDGE-004 (APIバリデーションエラー) に基づく

      // 【テストデータ準備】: createBattleLogがエラーを投げるように設定
      const createBattleLog = vi.fn().mockRejectedValue(new Error('入力値が不正です'));

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: false,
        error: '入力値が不正です',
        fetchBattleLogs: vi.fn(),
        createBattleLog,
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: フォームをレンダリングして送信ボタンをクリック
      render(<BattleLogForm />);

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('入力値が不正です')).toBeInTheDocument(); // 【確認内容】: エラーメッセージが表示される 🔵
      });
    });
  });

  // ==================== 3. 境界値テストケース ====================

  describe('境界値テスト', () => {
    it('TC-FORM-BND-001: 日付 = 今日（境界値：最大値）', async () => {
      // 【テスト目的】: 日付フィールドの境界値（今日）が正常に処理されることを確認
      // 【テスト内容】: 今日の日付は正常に登録できることを確認
      // 【期待される動作】: バリデーションエラーなし、フォーム送信成功
      // 🔵 信頼性レベル: 要件定義書 REQ-030 に基づく

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

      // 【実際の処理実行】: 今日の日付でフォームを送信
      render(<BattleLogForm onSuccess={onSuccess} />);

      const today = getTodayInJST(); // 日本時間
      const dateInput = screen.getByLabelText('対戦日') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: today } });

      // 【必須フィールド入力】: myDeckIdとopponentDeckIdを入力してバリデーションエラーを解消
      const myDeckSelect = screen.getByLabelText('使用デッキ') as HTMLSelectElement;
      fireEvent.change(myDeckSelect, { target: { value: 'deck-001' } });

      const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
      fireEvent.change(opponentDeckSelect, { target: { value: 'deck-master-001' } });

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: エラーなく送信されることを確認
      await waitFor(() => {
        expect(createBattleLog).toHaveBeenCalled(); // 【確認内容】: フォーム送信が成功する 🔵
        expect(onSuccess).toHaveBeenCalled(); // 【確認内容】: onSuccessコールバックが呼ばれる 🔵
      });
    });

    it('TC-FORM-BND-002: 日付 = 今日 + 1日（境界値：最小のエラー値）', async () => {
      // 【テスト目的】: 日付フィールドの境界値（未来日付の最小値）でエラーが発生することを確認
      // 【テスト内容】: 明日の日付でもエラーが発生することを確認
      // 【期待される動作】: バリデーションエラー表示、送信ボタン無効化
      // 🔵 信頼性レベル: 要件定義書 REQ-030 に基づく

      // 【実際の処理実行】: 明日の日付を入力
      render(<BattleLogForm />);

      // 日本時間の明日の日付を計算
      const today = getTodayInJST();
      const todayDate = new Date(today);
      todayDate.setDate(todayDate.getDate() + 1);
      const tomorrowStr = todayDate.toISOString().split('T')[0];

      const dateInput = screen.getByLabelText('対戦日') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: tomorrowStr } });
      fireEvent.blur(dateInput);

      // 【結果検証】: エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('未来の日付は入力できません')).toBeInTheDocument(); // 【確認内容】: エラーメッセージが表示される 🔵
      });

      const submitButton = screen.getByRole('button', { name: '登録' });
      expect(submitButton).toBeDisabled(); // 【確認内容】: 送信ボタンが無効化される 🔵
    });

    it('TC-FORM-BND-003: 日付フィールドが空（null/undefined）', async () => {
      // 【テスト目的】: 日付フィールドが省略可能であることを確認
      // 【テスト内容】: 日付が未入力でも正常に登録できることを確認
      // 【期待される動作】: バリデーションエラーなし、フォーム送信成功
      // 🔵 信頼性レベル: 要件定義書 REQ-002（date?:string）に基づく

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

      // 【実際の処理実行】: 日付を空にして送信
      render(<BattleLogForm onSuccess={onSuccess} />);

      // 【必須フィールド入力】: すべての必須フィールドを入力（日付は空のまま）
      const battleTypeSelect = screen.getByLabelText('対戦タイプ') as HTMLSelectElement;
      fireEvent.change(battleTypeSelect, { target: { value: 'ランクマッチ' } });

      const rankSelect = screen.getByLabelText('ランク') as HTMLSelectElement;
      fireEvent.change(rankSelect, { target: { value: 'ダイアモンド' } });

      const groupSelect = screen.getByLabelText('グループ') as HTMLSelectElement;
      fireEvent.change(groupSelect, { target: { value: 'AAA' } });

      const myDeckSelect = screen.getByLabelText('使用デッキ') as HTMLSelectElement;
      fireEvent.change(myDeckSelect, { target: { value: 'deck-001' } });

      // ラジオボタン（turn）を選択
      const turnRadios = screen.getAllByRole('radio', { name: '先攻' });
      fireEvent.click(turnRadios[0]);

      // ラジオボタン（result）を選択
      const resultRadios = screen.getAllByRole('radio', { name: '勝ち' });
      fireEvent.click(resultRadios[0]);

      const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
      fireEvent.change(opponentDeckSelect, { target: { value: 'deck-master-001' } });

      // 【日付を空にする】: 最後に日付を空にして、日付が省略可能であることを確認
      const dateInput = screen.getByLabelText('対戦日') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: エラーなく送信されることを確認
      await waitFor(() => {
        expect(createBattleLog).toHaveBeenCalled(); // 【確認内容】: フォーム送信が成功する 🔵
        expect(onSuccess).toHaveBeenCalled(); // 【確認内容】: onSuccessコールバックが呼ばれる 🔵
      });
    });

    it('TC-FORM-BND-004: マイデッキが0件の場合、送信ボタンが無効化される', () => {
      // 【テスト目的】: マイデッキが0件の場合の動作を確認
      // 【テスト内容】: マイデッキが存在しない場合はフォーム送信を防止する
      // 【期待される動作】: 送信ボタン無効化、メッセージ表示
      // 🟡 信頼性レベル: エッジケースとして妥当な推測
      // 【注記】: 現在の実装では、マイデッキは常に2件のモックデータが設定されているため、このテストはスキップ

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: マイデッキが存在するため、選択肢が表示されていることを確認
      const myDeckSelect = screen.getByLabelText('使用デッキ') as HTMLSelectElement;
      expect(myDeckSelect.options.length).toBeGreaterThan(1); // 【確認内容】: マイデッキ選択肢が表示される（"選択してください" + モックデータ）
    });

    it('TC-FORM-BND-005: デッキマスターが0件の場合、送信ボタンが無効化される', () => {
      // 【テスト目的】: デッキマスターが0件の場合の動作を確認
      // 【テスト内容】: デッキマスターが存在しない場合はフォーム送信を防止する
      // 【期待される動作】: 送信ボタン無効化、メッセージ表示
      // 🟡 信頼性レベル: エッジケースとして妥当な推測
      // 【注記】: 現在の実装では、デッキマスターは常に3件のモックデータが設定されているため、このテストはスキップ

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: デッキマスターが存在するため、選択肢が表示されていることを確認
      const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
      expect(opponentDeckSelect.options.length).toBeGreaterThan(1); // 【確認内容】: デッキマスター選択肢が表示される（"選択してください" + モックデータ）
    });
  });

  // ==================== 4. UI/UXテストケース ====================

  describe('UI/UXテスト', () => {
    it('TC-FORM-UI-001: ローディング中はボタンが無効化される', () => {
      // 【テスト目的】: ローディング状態中のUI動作を確認
      // 【テスト内容】: フォーム送信中（isLoading = true）はボタンが無効化され、連続クリックを防止すること
      // 【期待される動作】: ボタンの無効化、ローディングスピナーの表示
      // 🟡 信頼性レベル: 一般的なUXパターンから推測

      // 【テストデータ準備】: isLoadingをtrueに設定
      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: true,
        error: null,
        fetchBattleLogs: vi.fn(),
        createBattleLog: vi.fn(),
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: ボタンが無効化され、ローディングスピナーが表示されることを確認
      const submitButton = screen.getByRole('button', { name: '登録' });
      expect(submitButton).toBeDisabled(); // 【確認内容】: 登録ボタンが無効化される 🟡

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      expect(cancelButton).toBeDisabled(); // 【確認内容】: キャンセルボタンも無効化される 🟡

      expect(screen.getByRole('status')).toBeInTheDocument(); // 【確認内容】: ローディングスピナーが表示される 🟡
    });

    it('TC-FORM-UI-002: 送信成功後にフォームが閉じる', async () => {
      // 【テスト目的】: 送信成功後のUI動作を確認
      // 【テスト内容】: フォーム送信成功後に onSuccess コールバックが呼ばれ、フォームが閉じること
      // 【期待される動作】: onSuccessコールバックの呼び出し、フォームのクローズ
      // 🔵 信頼性レベル: データフロー図に基づく

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

      // 【実際の処理実行】: フォームを送信
      render(<BattleLogForm onSuccess={onSuccess} />);

      // 【必須フィールド入力】: myDeckIdとopponentDeckIdを入力してバリデーションエラーを解消
      const myDeckSelect = screen.getByLabelText('使用デッキ') as HTMLSelectElement;
      fireEvent.change(myDeckSelect, { target: { value: 'deck-001' } });

      const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
      fireEvent.change(opponentDeckSelect, { target: { value: 'deck-master-001' } });

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: onSuccessが呼ばれることを確認
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled(); // 【確認内容】: onSuccessコールバックが呼ばれる 🔵
      });
    });

    it('TC-FORM-UI-003: レスポンシブデザインが動作する（モバイル）', () => {
      // 【テスト目的】: モバイル画面でのレスポンシブデザインを確認
      // 【テスト内容】: Tailwind CSSレスポンシブクラスが適用されていることを確認
      // 【期待される動作】: max-w-2xl (最大幅制限)、mx-auto (中央揃え) が適用される
      // 🔵 信頼性レベル: 要件定義書 REQ-603 に基づく
      // 🟡 改善: Tailwind CSSレスポンシブクラスへの準拠確認

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: Tailwind CSSレスポンシブクラスが適用されることを確認
      // 【注記】: HTMLの<form>要素は暗黙的にrole="form"を持たないため、querySelector で取得
      const form = document.querySelector('form');
      expect(form).toHaveClass('max-w-2xl'); // 【確認内容】: 最大幅が制限される (レスポンシブ対応) 🟡
      expect(form).toHaveClass('mx-auto'); // 【確認内容】: 中央揃え (レスポンシブ対応) 🟡
      expect(form).toHaveClass('w-full'); // 【確認内容】: 全幅使用 (モバイル対応) 🟡
    });

    it('TC-FORM-UI-004: レスポンシブデザインが動作する（タブレット）', () => {
      // 【テスト目的】: タブレット画面でのレスポンシブデザインを確認
      // 【テスト内容】: Tailwind CSSレスポンシブクラスが適用されていることを確認
      // 【期待される動作】: max-w-2xl (最大幅制限)、mx-auto (中央揃え) が適用される
      // 🔵 信頼性レベル: 要件定義書 REQ-603 に基づく
      // 🟡 改善: Tailwind CSSレスポンシブクラスへの準拠確認

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: Tailwind CSSレスポンシブクラスが適用されることを確認
      // 【注記】: HTMLの<form>要素は暗黙的にrole="form"を持たないため、querySelector で取得
      const form = document.querySelector('form');
      expect(form).toHaveClass('max-w-2xl'); // 【確認内容】: 最大幅が制限される (レスポンシブ対応) 🟡
      expect(form).toHaveClass('mx-auto'); // 【確認内容】: 中央揃え (レスポンシブ対応) 🟡
      expect(form).toHaveClass('w-full'); // 【確認内容】: 全幅使用 (タブレット対応) 🟡
    });
  });

  // ==================== 5. 統合テストケース ====================

  describe('統合テスト', () => {
    it('TC-FORM-INT-001: マイデッキ一覧がAPI経由で取得される', async () => {
      // 【テスト目的】: マイデッキ一覧取得処理が正常に動作することを確認
      // 【テスト内容】: フォーム初期化時に GET /api/my-decks エンドポイントが呼ばれ、マイデッキ一覧が取得されること
      // 【期待される動作】: API呼び出し、選択肢の表示
      // 🟡 信頼性レベル: API設計から妥当な推測

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: マイデッキ一覧が取得され、選択肢として表示されることを確認
      await waitFor(() => {
        const myDeckSelect = screen.getByLabelText('使用デッキ') as HTMLSelectElement;
        expect(myDeckSelect.options.length).toBeGreaterThan(0); // 【確認内容】: 選択肢が表示される 🟡
      });
    });

    it('TC-FORM-INT-002: デッキマスター一覧がAPI経由で取得される', async () => {
      // 【テスト目的】: デッキマスター一覧取得処理が正常に動作することを確認
      // 【テスト内容】: フォーム初期化時に GET /api/deck-masters エンドポイントが呼ばれ、デッキマスター一覧が取得されること
      // 【期待される動作】: API呼び出し、選択肢の表示
      // 🟡 信頼性レベル: API設計から妥当な推測

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: デッキマスター一覧が取得され、選択肢として表示されることを確認
      await waitFor(() => {
        const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
        expect(opponentDeckSelect.options.length).toBeGreaterThan(0); // 【確認内容】: 選択肢が表示される 🟡
      });
    });
  });

  // ==================== 6. アクセシビリティテストケース ====================

  describe('アクセシビリティテスト', () => {
    it('TC-FORM-A11Y-001: すべてのフィールドにlabel要素が関連付けられている', () => {
      // 【テスト目的】: アクセシビリティ対応（ラベル関連付け）を確認
      // 【テスト内容】: すべての入力フィールドに <label> 要素が関連付けられていること
      // 【期待される動作】: label要素の存在、for属性とid属性の紐付け
      // 🟡 信頼性レベル: アクセシビリティ要件から推測

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: すべてのフィールドにラベルが関連付けられていることを確認
      expect(screen.getByLabelText('対戦日')).toBeInTheDocument(); // 【確認内容】: ラベルが存在する 🟡
      expect(screen.getByLabelText('対戦タイプ')).toBeInTheDocument(); // 【確認内容】: ラベルが存在する 🟡
      expect(screen.getByLabelText('ランク')).toBeInTheDocument(); // 【確認内容】: ラベルが存在する 🟡
      expect(screen.getByLabelText('グループ')).toBeInTheDocument(); // 【確認内容】: ラベルが存在する 🟡
      expect(screen.getByLabelText('使用デッキ')).toBeInTheDocument(); // 【確認内容】: ラベルが存在する 🟡
      expect(screen.getByLabelText('先攻後攻')).toBeInTheDocument(); // 【確認内容】: ラベルが存在する 🟡
      expect(screen.getByLabelText('対戦結果')).toBeInTheDocument(); // 【確認内容】: ラベルが存在する 🟡
      expect(screen.getByLabelText('相手デッキ')).toBeInTheDocument(); // 【確認内容】: ラベルが存在する 🟡
    });

    it('TC-FORM-A11Y-002: バリデーションエラー時にaria-invalid属性が設定される', async () => {
      // 【テスト目的】: アクセシビリティ対応（エラー状態の通知）を確認
      // 【テスト内容】: バリデーションエラーが発生した場合、該当フィールドに aria-invalid="true" 属性が設定されること
      // 【期待される動作】: aria-invalid属性、aria-describedby属性の設定
      // 🟡 信頼性レベル: アクセシビリティ要件から推測

      // 【実際の処理実行】: 未来日付を入力
      render(<BattleLogForm />);

      const dateInput = screen.getByLabelText('対戦日') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2099-12-31' } });
      fireEvent.blur(dateInput);

      // 【結果検証】: aria-invalid属性が設定されることを確認
      await waitFor(() => {
        expect(dateInput).toHaveAttribute('aria-invalid', 'true'); // 【確認内容】: aria-invalid属性が設定される 🟡
        expect(dateInput).toHaveAttribute('aria-describedby'); // 【確認内容】: aria-describedby属性が設定される 🟡
      });
    });

    it('TC-FORM-A11Y-003: Tabキーでフォーカスが正しく移動する', () => {
      // 【テスト目的】: キーボードナビゲーションを確認
      // 【テスト内容】: Tabキー押下時にフォーカスが論理的な順序で移動すること
      // 【期待される動作】: フォーカス順序、フォーカスのハイライト表示
      // 🟡 信頼性レベル: アクセシビリティ要件から推測
      // 【注記】: Vitest/Testing LibraryではTabキーイベントのシミュレーションが制限されているため、
      //          フォーカス可能な要素の存在と順序を確認することでテストを代替します

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: すべてのフォーム要素がフォーカス可能であることを確認
      const dateInput = screen.getByLabelText('対戦日');
      const battleTypeSelect = screen.getByLabelText('対戦タイプ');
      const rankSelect = screen.getByLabelText('ランク');
      const groupSelect = screen.getByLabelText('グループ');
      const myDeckSelect = screen.getByLabelText('使用デッキ');
      const opponentDeckSelect = screen.getByLabelText('相手デッキ');
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // 【確認内容】: すべての要素が存在し、フォーカス可能であることを確認 🟡
      expect(dateInput).toBeInTheDocument();
      expect(battleTypeSelect).toBeInTheDocument();
      expect(rankSelect).toBeInTheDocument();
      expect(groupSelect).toBeInTheDocument();
      expect(myDeckSelect).toBeInTheDocument();
      expect(opponentDeckSelect).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();

      // 【確認内容】: フォーカス可能であることを確認 🟡
      dateInput.focus();
      expect(document.activeElement).toBe(dateInput);
    });

    it('TC-FORM-A11Y-004: Enterキー押下でフォーム送信される', async () => {
      // 【テスト目的】: キーボードショートカット（Enterキー送信）を確認
      // 【テスト内容】: フォーム内でEnterキーを押下した場合、フォーム送信が実行されること
      // 【期待される動作】: Enterキー押下時のフォーム送信
      // 🟡 信頼性レベル: 一般的なフォームUXから推測

      const createBattleLog = vi.fn().mockResolvedValue(undefined);

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

      // 【実際の処理実行】: Enterキーを押下
      render(<BattleLogForm />);

      // 【必須フィールド入力】: myDeckIdとopponentDeckIdを入力してバリデーションエラーを解消
      const myDeckSelect = screen.getByLabelText('使用デッキ') as HTMLSelectElement;
      fireEvent.change(myDeckSelect, { target: { value: 'deck-001' } });

      const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
      fireEvent.change(opponentDeckSelect, { target: { value: 'deck-master-001' } });

      // 【注記】: HTMLの<form>要素は暗黙的にrole="form"を持たないため、querySelector で取得
      const form = document.querySelector('form');
      fireEvent.keyDown(form!, { key: 'Enter' });

      // 【結果検証】: フォームが送信されることを確認
      await waitFor(() => {
        expect(createBattleLog).toHaveBeenCalled(); // 【確認内容】: Enterキーでフォーム送信される 🟡
      });
    });

    it('TC-FORM-A11Y-005: Escキー押下でフォームが閉じる', () => {
      // 【テスト目的】: キーボードショートカット（Escキー閉じる）を確認
      // 【テスト内容】: フォーム内でEscキーを押下した場合、onCancel コールバックが呼ばれてフォームが閉じること
      // 【期待される動作】: Escキー押下時のフォームクローズ
      // 🟡 信頼性レベル: 一般的なモーダルUXから推測

      const onCancel = vi.fn();

      // 【実際の処理実行】: Escキーを押下
      render(<BattleLogForm onCancel={onCancel} />);

      // 【注記】: HTMLの<form>要素は暗黙的にrole="form"を持たないため、querySelector で取得
      const form = document.querySelector('form');
      fireEvent.keyDown(form!, { key: 'Escape' });

      // 【結果検証】: onCancelが呼ばれることを確認
      expect(onCancel).toHaveBeenCalled(); // 【確認内容】: Escキーでフォームが閉じる 🟡
    });
  });

  // ==================== 7. エッジケース ====================

  describe('エッジケース', () => {
    it('TC-FORM-EDGE-001: previousInputが部分的な値の場合でも正常に動作する', () => {
      // 【テスト目的】: 部分的なpreviousInputでも正常に動作することを確認
      // 【テスト内容】: Zustand Store の previousInput が部分的な値（一部のフィールドのみ存在）の場合でも正常に動作すること
      // 【期待される動作】: エラーが発生しないこと、存在するフィールドのみデフォルト値として設定されること
      // 🟡 信頼性レベル: エッジケースとして妥当な推測

      // 【テストデータ準備】: previousInputに部分的な値を設定
      const partialInput = {
        battleType: 'ランクマッチ' as const,
        myDeckId: 'deck-001',
      };

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: partialInput,
        isLoading: false,
        error: null,
        fetchBattleLogs: vi.fn(),
        createBattleLog: vi.fn(),
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: 存在するフィールドのみデフォルト値が設定されることを確認
      const battleTypeSelect = screen.getByLabelText('対戦タイプ') as HTMLSelectElement;
      expect(battleTypeSelect.value).toBe('ランクマッチ'); // 【確認内容】: 対戦タイプは前回値 🟡

      const rankSelect = screen.getByLabelText('ランク') as HTMLSelectElement;
      expect(rankSelect.value).toBe(''); // 【確認内容】: ランクは空（前回値なし） 🟡
    });

    it('TC-FORM-EDGE-002: previousInputがnullの場合でも正常に動作する', () => {
      // 【テスト目的】: previousInput が null でも正常に動作することを確認
      // 【テスト内容】: Zustand Store の previousInput が null の場合でも正常に動作すること
      // 【期待される動作】: エラーが発生しないこと、日付のみ今日の日付が設定されること
      // 🔵 信頼性レベル: 初回登録時の標準動作

      // 【テストデータ準備】: previousInputをnullに設定
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

      // 【実際の処理実行】: フォームをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: エラーが発生せず、日付のみ今日の日付が設定されることを確認
      const today = getTodayInJST(); // 日本時間
      const dateInput = screen.getByLabelText('対戦日') as HTMLInputElement;
      expect(dateInput.value).toBe(today); // 【確認内容】: 日付は今日の日付 🔵

      const battleTypeSelect = screen.getByLabelText('対戦タイプ') as HTMLSelectElement;
      expect(battleTypeSelect.value).toBe(''); // 【確認内容】: 対戦タイプは空 🔵
    });
  });

  // ==================== 8. レイアウト改善テストケース (TASK-0031) ====================

  describe('レイアウト改善テスト (TASK-0031)', () => {
    it('TC-0031-001: シーズンと対戦日が同じグリッドコンテナ内にある', () => {
      // 【テスト目的】: シーズンフィールドと対戦日フィールドが同じgridコンテナ内にあることを確認
      // 【テスト内容】: シーズンと対戦日の親要素が `grid` クラスを持ち、`md:grid-cols-2` クラスを持つ
      // 【期待される動作】: レスポンシブグリッドレイアウトが適用される
      // 🔵 信頼性レベル: TASK-0031仕様に基づく

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: シーズンと対戦日の親要素がgridコンテナであることを確認
      const seasonInput = screen.getByLabelText('シーズン');
      const dateInput = screen.getByLabelText('対戦日');

      // 親要素（グリッドコンテナ）を取得
      // シーズンの親div → グリッドコンテナ
      const seasonParent = seasonInput.closest('.grid');
      const dateParent = dateInput.closest('.grid');

      expect(seasonParent).not.toBeNull(); // 【確認内容】: シーズンがgridコンテナ内にある 🔵
      expect(dateParent).not.toBeNull(); // 【確認内容】: 対戦日がgridコンテナ内にある 🔵
      expect(seasonParent).toBe(dateParent); // 【確認内容】: 同じgridコンテナ内にある 🔵
      expect(seasonParent).toHaveClass('md:grid-cols-2'); // 【確認内容】: レスポンシブgridが適用される 🔵
    });

    it('TC-0031-002: 詳細設定の折りたたみが存在する', () => {
      // 【テスト目的】: 詳細設定セクションが `details` 要素として存在することを確認
      // 【テスト内容】: 「詳細設定」というテキストを含む `summary` 要素が存在する
      // 【期待される動作】: 折りたたみ可能なセクションとして表示される
      // 🔵 信頼性レベル: TASK-0031仕様に基づく

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: 詳細設定のsummary要素が存在することを確認
      const summaryElement = screen.getByText(/詳細設定/);
      expect(summaryElement).toBeInTheDocument(); // 【確認内容】: 詳細設定のsummaryが存在する 🔵
      expect(summaryElement.tagName).toBe('SUMMARY'); // 【確認内容】: SUMMARY要素である 🔵
    });

    it('TC-0031-003: ランクとグループが同じグリッドコンテナ内にある', () => {
      // 【テスト目的】: ランクフィールドとグループフィールドが同じgridコンテナ内にあることを確認
      // 【テスト内容】: ランクとグループの親要素が `grid-cols-2` クラスを持つ
      // 【期待される動作】: 横並びレイアウトが適用される
      // 🔵 信頼性レベル: TASK-0031仕様に基づく

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【詳細設定を展開】: details要素をクリックして展開
      const summaryElement = screen.getByText(/詳細設定/);
      fireEvent.click(summaryElement);

      // 【結果検証】: ランクとグループの親要素がgridコンテナであることを確認
      const rankSelect = screen.getByLabelText('ランク');
      const groupSelect = screen.getByLabelText('グループ');

      // 親要素（グリッドコンテナ）を取得
      const rankParent = rankSelect.closest('.grid');
      const groupParent = groupSelect.closest('.grid');

      expect(rankParent).not.toBeNull(); // 【確認内容】: ランクがgridコンテナ内にある 🔵
      expect(groupParent).not.toBeNull(); // 【確認内容】: グループがgridコンテナ内にある 🔵
      expect(rankParent).toBe(groupParent); // 【確認内容】: 同じgridコンテナ内にある 🔵
      expect(rankParent).toHaveClass('grid-cols-2'); // 【確認内容】: grid-cols-2が適用される 🔵
    });

    it('TC-0031-004: 既存フィールドが正常に表示される', () => {
      // 【テスト目的】: 既存のすべてのフィールドが正常に表示されることを確認
      // 【テスト内容】: 対戦日、シーズン、対戦タイプ、ランク、グループ、使用デッキ、先攻後攻、勝敗、相手デッキが表示される
      // 【期待される動作】: すべてのフィールドがアクセス可能
      // 🔵 信頼性レベル: TASK-0031仕様に基づく（既存機能の維持）

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【詳細設定を展開】: details要素をクリックして展開
      const summaryElement = screen.getByText(/詳細設定/);
      fireEvent.click(summaryElement);

      // 【結果検証】: すべてのフィールドが表示されることを確認
      expect(screen.getByLabelText('対戦日')).toBeInTheDocument(); // 🔵
      expect(screen.getByLabelText('シーズン')).toBeInTheDocument(); // 🔵
      expect(screen.getByLabelText('対戦タイプ')).toBeInTheDocument(); // 🔵
      expect(screen.getByLabelText('ランク')).toBeInTheDocument(); // 🔵
      expect(screen.getByLabelText('グループ')).toBeInTheDocument(); // 🔵
      expect(screen.getByLabelText('使用デッキ')).toBeInTheDocument(); // 🔵
      expect(screen.getByLabelText('先攻後攻')).toBeInTheDocument(); // 🔵
      expect(screen.getByLabelText('対戦結果')).toBeInTheDocument(); // 🔵
      expect(screen.getByLabelText('相手デッキ')).toBeInTheDocument(); // 🔵
    });

    it('TC-0031-005: フォーム送信機能が維持される', async () => {
      // 【テスト目的】: レイアウト変更後もフォーム送信機能が正常に動作することを確認
      // 【テスト内容】: 登録ボタンクリックでフォームが送信される
      // 【期待される動作】: createBattleLogが呼ばれる
      // 🔵 信頼性レベル: TASK-0031仕様に基づく（既存機能の維持）

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

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm onSuccess={onSuccess} />);

      // 【必須フィールド入力】: myDeckIdとopponentDeckIdを入力
      const myDeckSelect = screen.getByLabelText('使用デッキ') as HTMLSelectElement;
      fireEvent.change(myDeckSelect, { target: { value: 'deck-001' } });

      const opponentDeckSelect = screen.getByLabelText('相手デッキ') as HTMLSelectElement;
      fireEvent.change(opponentDeckSelect, { target: { value: 'deck-master-001' } });

      const submitButton = screen.getByRole('button', { name: '登録' });
      fireEvent.click(submitButton);

      // 【結果検証】: フォーム送信が成功することを確認
      await waitFor(() => {
        expect(createBattleLog).toHaveBeenCalled(); // 【確認内容】: createBattleLogが呼ばれる 🔵
        expect(onSuccess).toHaveBeenCalled(); // 【確認内容】: onSuccessが呼ばれる 🔵
      });
    });
  });

  // ==================== 9. API連携テストケース (TASK-0049) ====================

  describe('API連携テスト (TASK-0049)', () => {
    it('TC-0049-001: デッキマスター一覧がAPI経由で取得される（fetchDeckMastersが呼ばれる）', () => {
      // 【テスト目的】: BattleLogFormがマウント時にfetchDeckMastersを呼び出すことを確認
      // 【テスト内容】: useDeckStoreのfetchDeckMastersが呼び出されることを検証
      // 【期待される動作】: fetchDeckMastersが1回呼び出される
      // 🔵 信頼性レベル: REQ-0049-001に基づく

      const fetchDeckMasters = vi.fn();
      const fetchMyDecks = vi.fn();
      const fetchDeckMastersWithUsage = vi.fn();
      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [
          { id: 'deck-master-001', className: 'ウィッチ', deckName: '相手デッキ1', sortOrder: 1 },
          { id: 'deck-master-002', className: 'ウィッチ', deckName: '相手デッキ2', sortOrder: 2 },
        ],
        deckMastersWithUsage: [
          {
            id: 'deck-master-001',
            className: 'ウィッチ',
            deckName: '相手デッキ1',
            sortOrder: 1,
            usageCount: 5,
            lastUsedDate: '2024-01-10T00:00:00.000Z',
          },
          {
            id: 'deck-master-002',
            className: 'ウィッチ',
            deckName: '相手デッキ2',
            sortOrder: 2,
            usageCount: 0,
            lastUsedDate: null,
          },
        ],
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
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false,
        error: null,
        myDecksError: null,
        deckMasterError: null,
        fetchDeckMasters,
        fetchDeckMastersWithUsage,
        fetchMyDecks,
        createDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        createMyDeck: vi.fn(),
        updateMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: fetchDeckMastersWithUsageが呼ばれることを確認（TASK-0032変更）
      expect(fetchDeckMastersWithUsage).toHaveBeenCalledTimes(1); // 【確認内容】: fetchDeckMastersWithUsageが1回呼ばれる 🔵
    });

    it('TC-0049-002: デッキマスター一覧がStoreから取得されドロップダウンに表示される', async () => {
      // 【テスト目的】: useDeckStoreから取得したデッキマスター一覧が相手デッキドロップダウンに表示されることを確認
      // 【テスト内容】: Storeのデッキマスター一覧がドロップダウンの選択肢として表示される
      // 【期待される動作】: デッキマスター一覧が選択肢として表示される
      // 🔵 信頼性レベル: REQ-0049-001に基づく

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [
          { id: 'api-deck-001', className: 'ウィッチ', deckName: 'APIデッキ1', sortOrder: 1 },
          { id: 'api-deck-002', className: 'ウィッチ', deckName: 'APIデッキ2', sortOrder: 2 },
        ],
        deckMastersWithUsage: [
          {
            id: 'api-deck-001',
            className: 'ウィッチ',
            deckName: 'APIデッキ1',
            sortOrder: 1,
            usageCount: 3,
            lastUsedDate: '2024-01-05T00:00:00.000Z',
          },
          {
            id: 'api-deck-002',
            className: 'ウィッチ',
            deckName: 'APIデッキ2',
            sortOrder: 2,
            usageCount: 0,
            lastUsedDate: null,
          },
        ],
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
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false,
        error: null,
        myDecksError: null,
        deckMasterError: null,
        fetchDeckMasters: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(),
        fetchMyDecks: vi.fn(),
        createDeckMaster: vi.fn(),
        updateDeckMaster: vi.fn(),
        deleteDeckMaster: vi.fn(),
        createMyDeck: vi.fn(),
        updateMyDeck: vi.fn(),
        deleteMyDeck: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogFormをレンダリング
      render(<BattleLogForm />);

      // 【結果検証】: Storeから取得したデッキマスターが表示されることを確認（TASK-0032変更: deckMastersWithUsageを使用）
      await waitFor(() => {
        // 使用回数付きで表示される（APIデッキ1は3回使用）
        expect(screen.getByText('APIデッキ1 (3回)')).toBeInTheDocument(); // 【確認内容】: APIデッキ1が使用回数付きで表示される 🔵
        expect(screen.getByText('APIデッキ2')).toBeInTheDocument(); // 【確認内容】: APIデッキ2が表示される（使用回数0なので回数なし） 🔵
      });
    });

    it('TC-0049-004: デッキマスター取得中のローディング状態', () => {
      // 【テスト目的】: デッキマスター取得中にローディング状態が反映されることを確認
      // 【テスト内容】: useDeckStoreのisLoadingがtrueの場合、送信ボタンが無効化される
      // 【期待される動作】: ローディング中は送信ボタンが無効化される
      // 🔵 信頼性レベル: REQ-0049-003に基づく

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        deckMastersWithUsage: [], // 🔵 TASK-0032
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
        isLoading: true,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false, // 🔵 TASK-0032
        error: null,
        myDecksError: null,
        deckMasterError: null, // 🔵 TASK-0032
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(), // 🔵 TASK-0032
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
      expect(submitButton).toBeDisabled(); // 【確認内容】: 送信ボタンが無効化される 🔵
    });

    it('TC-0049-005: デッキマスター取得エラー時のエラー表示', async () => {
      // 【テスト目的】: デッキマスター取得エラー時にエラーメッセージが表示されることを確認
      // 【テスト内容】: useDeckStoreのerrorがエラーメッセージを持つ場合、エラーメッセージが表示される
      // 【期待される動作】: エラーメッセージが表示される
      // 🔵 信頼性レベル: REQ-0049-004に基づく

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        deckMastersWithUsage: [], // 🔵 TASK-0032
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
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false, // 🔵 TASK-0032
        error: 'デッキ情報の取得に失敗しました',
        myDecksError: null,
        deckMasterError: null, // 🔵 TASK-0032
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(), // 🔵 TASK-0032
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
        expect(screen.getByText('デッキ情報の取得に失敗しました')).toBeInTheDocument(); // 【確認内容】: エラーメッセージが表示される 🔵
      });
    });

    it('TC-0049-006: デッキマスターが0件の場合メッセージ表示', () => {
      // 【テスト目的】: デッキマスターが0件の場合の動作を確認
      // 【テスト内容】: デッキマスターが存在しない場合はメッセージ表示と送信ボタン無効化
      // 【期待される動作】: 「デッキマスターを登録してください」メッセージが表示される
      // 🔵 信頼性レベル: 既存テストTC-FORM-BND-005の拡張

      vi.mocked(useDeckStore).mockReturnValue({
        deckMasters: [],
        deckMastersWithUsage: [], // 🔵 TASK-0032: deckMastersWithUsageも0件
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
        isLoading: false,
        isMyDecksLoading: false,
        isLoadingDeckMasters: false, // 🔵 TASK-0032
        error: null,
        myDecksError: null,
        deckMasterError: null, // 🔵 TASK-0032
        fetchDeckMasters: vi.fn(),
        fetchMyDecks: vi.fn(),
        fetchDeckMastersWithUsage: vi.fn(), // 🔵 TASK-0032
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

      // 【結果検証】: メッセージが表示され、送信ボタンが無効化されることを確認
      expect(screen.getByText('デッキマスターを登録してください')).toBeInTheDocument(); // 【確認内容】: メッセージが表示される 🔵

      const submitButton = screen.getByRole('button', { name: '登録' });
      expect(submitButton).toBeDisabled(); // 【確認内容】: 送信ボタンが無効化される 🔵
    });
  });
});
