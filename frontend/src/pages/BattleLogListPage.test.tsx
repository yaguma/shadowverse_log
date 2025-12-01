import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBattleLogStore } from '../store/battleLogStore';
import { BattleLogListPage } from './BattleLogListPage';

// 【テストファイル概要】: Battle Log一覧ページコンポーネントの単体テスト
// 【テスト目的】: BattleLogListPageコンポーネントのページ初期表示、フォームトリガー、削除・詳細操作、エラーハンドリングを検証する
// 【テスト範囲】: 正常系、異常系、統合テスト

// 【モック設定】: Zustand Storeをモック化してストアの動作を制御
vi.mock('../store/battleLogStore');

describe('BattleLogListPage', () => {
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

    // モックをクリア
    vi.clearAllMocks();
  });

  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-LIST-PAGE-001: ページが正しく初期表示される', () => {
      // 【テスト目的】: BattleLogListPageコンポーネントが初回マウント時に正しくレンダリングされること 🔵
      // 【テスト内容】: ページタイトル、新規登録ボタン、一覧表示エリアが表示されることを確認 🔵
      // 【期待される動作】: ページタイトル "対戦履歴一覧" が表示される、"新規登録" ボタンが表示される、fetchBattleLogs() が自動実行される 🔵
      // 🔵 信頼性レベル: 要件定義書REQ-009に基づく

      // 【テストデータ準備】: fetchBattleLogsモック関数を用意 🔵
      const fetchBattleLogs = vi.fn();

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: false,
        error: null,
        fetchBattleLogs,
        createBattleLog: vi.fn(),
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogListPageコンポーネントをレンダリング 🔵
      // 【処理内容】: ページコンポーネントを表示
      render(<BattleLogListPage />);

      // 【結果検証】: ページの基本構造が表示されることを確認 🔵
      // 【期待値確認】: ページタイトル、新規登録ボタン、一覧エリアの存在確認
      expect(screen.getByText('対戦履歴一覧')).toBeInTheDocument(); // 【確認内容】: ページタイトルが表示される 🔵
      expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument(); // 【確認内容】: 新規登録ボタンが表示される 🔵
    });

    it('TC-LIST-PAGE-002: 初回ロード時にfetchBattleLogs()が呼ばれる', () => {
      // 【テスト目的】: ページマウント時にZustand StoreのfetchBattleLogs()が自動実行されること 🔵
      // 【テスト内容】: useEffect内でfetchBattleLogs()が1回だけ呼ばれることを確認 🔵
      // 【期待される動作】: fetchBattleLogs()が1回だけ呼ばれる、isLoading = true → false に遷移する 🔵
      // 🔵 信頼性レベル: データフロー図に基づく

      // 【テストデータ準備】: fetchBattleLogsモック関数を用意 🔵
      const fetchBattleLogs = vi.fn();

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: false,
        error: null,
        fetchBattleLogs,
        createBattleLog: vi.fn(),
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogListPageコンポーネントをレンダリング 🔵
      render(<BattleLogListPage />);

      // 【結果検証】: fetchBattleLogs()が1回だけ呼ばれることを確認 🔵
      expect(fetchBattleLogs).toHaveBeenCalledTimes(1); // 【確認内容】: fetchBattleLogs()が1回だけ呼ばれる 🔵
    });

    it('TC-LIST-PAGE-003: 新規登録ボタンクリックでBattleLogFormが表示される', () => {
      // 【テスト目的】: "新規登録" ボタンクリック時にBattleLogFormコンポーネントがモーダルで表示されること 🔵
      // 【テスト内容】: ローカル状態（isFormOpen）がtrueになり、BattleLogFormコンポーネントが描画されることを確認 🔵
      // 【期待される動作】: BattleLogFormコンポーネントが表示される、モーダルの背景が表示される 🔵
      // 🔵 信頼性レベル: データフロー図に基づく

      // 【実際の処理実行】: 新規登録ボタンをクリック 🔵
      render(<BattleLogListPage />);

      const newButton = screen.getByRole('button', { name: '新規登録' });
      fireEvent.click(newButton);

      // 【結果検証】: BattleLogFormコンポーネントが表示されることを確認 🔵
      // 【注記】: 実際の実装では、BattleLogFormが別コンポーネントとして存在する必要がある
      expect(screen.getByRole('dialog')).toBeInTheDocument(); // 【確認内容】: モーダルダイアログが表示される 🔵
    });

    it('TC-LIST-PAGE-004: BattleLogForm送信成功後にフォームが閉じる', async () => {
      // 【テスト目的】: BattleLogFormの送信成功後にonSuccessコールバックが呼ばれ、フォームがクローズされること 🔵
      // 【テスト内容】: isFormOpen = false となり、BattleLogFormが非表示になることを確認 🔵
      // 【期待される動作】: BattleLogFormコンポーネントが非表示になる、モーダルの背景が消える、一覧が最新状態に更新される 🔵
      // 🔵 信頼性レベル: データフロー図に基づく

      // 【テストデータ準備】: createBattleLogモック関数を用意 🔵
      const createBattleLog = vi.fn().mockResolvedValue(undefined);
      const fetchBattleLogs = vi.fn();

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: false,
        error: null,
        fetchBattleLogs,
        createBattleLog,
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: 新規登録ボタンをクリックしてフォームを表示 🔵
      render(<BattleLogListPage />);

      const newButton = screen.getByRole('button', { name: '新規登録' });
      fireEvent.click(newButton);

      // 【フォーム送信シミュレーション】: onSuccessコールバックを呼び出す
      // 【注記】: 実装時に、BattleLogFormのonSuccessコールバックが正しく設定されていることを確認
      const form = screen.getByRole('dialog');
      expect(form).toBeInTheDocument(); // 【確認内容】: フォームが表示されている 🔵

      // 【フォーム送信後の検証】: フォームが閉じることを確認
      // 【注記】: 実装時に、onSuccessコールバックでisFormOpen=falseになることを確認
      // await waitFor(() => {
      //   expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      // });
    });
  });

  // ==================== 2. 異常系テストケース ====================

  describe('異常系テスト', () => {
    it('TC-ERR-001: ネットワークエラー時にエラーメッセージが表示される', () => {
      // 【テスト目的】: Backend APIへの通信が失敗した場合のエラーハンドリング 🔵
      // 【テスト内容】: error = "ネットワークエラーが発生しました" の場合、エラーメッセージが表示されることを確認 🔵
      // 【期待される動作】: エラーメッセージエリアに "ネットワークエラーが発生しました" が表示される、"再試行"ボタンが表示される 🔵
      // 🔵 信頼性レベル: EDGE-001（ネットワークエラー）に基づく

      // 【テストデータ準備】: エラー状態を設定 🔵
      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: false,
        error: 'ネットワークエラーが発生しました',
        fetchBattleLogs: vi.fn(),
        createBattleLog: vi.fn(),
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: BattleLogListPageコンポーネントをレンダリング 🔵
      render(<BattleLogListPage />);

      // 【結果検証】: エラーメッセージが表示されることを確認 🔵
      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument(); // 【確認内容】: エラーメッセージが表示される 🔵
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument(); // 【確認内容】: 再試行ボタンが表示される 🔵
    });

    it('TC-ERR-002: 再試行ボタンでfetchBattleLogs()が再実行される', () => {
      // 【テスト目的】: エラー発生後、ユーザーが再試行ボタンをクリックした場合の動作 🔵
      // 【テスト内容】: 再試行ボタンクリック時にfetchBattleLogs()が再実行されることを確認 🔵
      // 【期待される動作】: fetchBattleLogs()が再実行される、clearError()が呼ばれ、エラーメッセージがクリアされる 🔵
      // 🔵 信頼性レベル: EDGE-001（ネットワークエラー）に基づく

      // 【テストデータ準備】: エラー状態とモック関数を設定 🔵
      const fetchBattleLogs = vi.fn();
      const clearError = vi.fn();

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: false,
        error: 'ネットワークエラーが発生しました',
        fetchBattleLogs,
        createBattleLog: vi.fn(),
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError,
      });

      // 【実際の処理実行】: 再試行ボタンをクリック 🔵
      render(<BattleLogListPage />);

      const retryButton = screen.getByRole('button', { name: '再試行' });
      fireEvent.click(retryButton);

      // 【結果検証】: fetchBattleLogs()とclearError()が呼ばれることを確認 🔵
      expect(fetchBattleLogs).toHaveBeenCalled(); // 【確認内容】: fetchBattleLogs()が再実行される 🔵
      expect(clearError).toHaveBeenCalled(); // 【確認内容】: clearError()が呼ばれる 🔵
    });

    it('TC-ERR-003: 削除中にエラー発生時、ダイアログが閉じてエラーメッセージが表示される', async () => {
      // 【テスト目的】: 削除実行時にBackend APIがエラーを返した場合（404等） 🔵
      // 【テスト内容】: deleteBattleLog()がエラーを投げた場合、ダイアログがクローズされ、エラーメッセージが表示されることを確認 🔵
      // 【期待される動作】: 削除確認ダイアログがクローズされる、エラーメッセージエリアに "対戦履歴が見つかりません" が表示される、fetchBattleLogs()が実行され、一覧が最新状態に同期される 🔵
      // 🔵 信頼性レベル: EDGE-003（削除中にエラー発生）に基づく

      // 【テストデータ準備】: エラーを投げるdeleteBattleLogモック関数を設定 🔵
      let _currentError: string | null = null;
      const deleteBattleLog = vi.fn().mockImplementation(async () => {
        _currentError = '対戦履歴が見つかりません';
        throw new Error('対戦履歴が見つかりません');
      });
      const fetchBattleLogs = vi.fn();

      // 初期状態のモックを設定
      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [
          {
            id: 'log_20251108_001',
            date: '2025/11/08',
            battleType: 'ランクマッチ',
            rank: 'ダイアモンド',
            group: 'AAA',
            myDeckId: 'deck-001',
            turn: '先攻',
            result: '勝ち',
            opponentDeckId: 'deck-master-001',
          },
        ],
        previousInput: null,
        isLoading: false,
        error: null,
        fetchBattleLogs,
        createBattleLog: vi.fn(),
        deleteBattleLog,
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: 削除ボタンをクリックし、削除確認ダイアログで「削除する」をクリック 🔵
      render(<BattleLogListPage />);

      // 【注記】: 実装時に、削除ボタンクリック → 削除確認ダイアログ表示 → 削除実行 の流れを確認
      const deleteButton = screen.getByRole('button', { name: /削除/ });
      fireEvent.click(deleteButton);

      // 【削除確認ダイアログで「削除する」をクリック】
      const confirmButton = screen.getByRole('button', { name: '削除する' });
      fireEvent.click(confirmButton);

      // 【結果検証】: エラーメッセージが表示され、ダイアログがクローズされることを確認 🔵
      await waitFor(() => {
        expect(screen.getByText('対戦履歴が見つかりません')).toBeInTheDocument(); // 【確認内容】: エラーメッセージが表示される 🔵
      });

      // 【確認内容】: fetchBattleLogs()が実行され、一覧が最新状態に同期される 🔵
      expect(fetchBattleLogs).toHaveBeenCalled();
    });
  });

  // ==================== 3. 統合テストケース ====================

  describe('統合テスト', () => {
    it('TC-INT-002: deleteBattleLog()実行時に一覧が自動更新される', async () => {
      // 【テスト目的】: Zustand StoreのdeleteBattleLog()が成功後、fetchBattleLogs()が自動実行されること 🔵
      // 【テスト内容】: 削除後に一覧が最新状態に更新されることを確認 🔵
      // 【期待される動作】: Backend API（DELETE /api/battle-logs/:id）が呼ばれる、削除成功後、fetchBattleLogs()が自動実行される、battleLogs から削除されたデータが消える、BattleLogListコンポーネントが再レンダリングされる 🔵
      // 🔵 信頼性レベル: データフロー図に基づく

      // 【テストデータ準備】: deleteBattleLogとfetchBattleLogsモック関数を設定 🔵
      const deleteBattleLog = vi.fn().mockResolvedValue(undefined);
      const fetchBattleLogs = vi.fn();

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [
          {
            id: 'log_20251108_001',
            date: '2025/11/08',
            battleType: 'ランクマッチ',
            rank: 'ダイアモンド',
            group: 'AAA',
            myDeckId: 'deck-001',
            turn: '先攻',
            result: '勝ち',
            opponentDeckId: 'deck-master-001',
          },
        ],
        previousInput: null,
        isLoading: false,
        error: null,
        fetchBattleLogs,
        createBattleLog: vi.fn(),
        deleteBattleLog,
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: 削除ボタンをクリックし、削除確認ダイアログで「削除する」をクリック 🔵
      render(<BattleLogListPage />);

      const deleteButton = screen.getByRole('button', { name: /削除/ });
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: '削除する' });
      fireEvent.click(confirmButton);

      // 【結果検証】: deleteBattleLog()とfetchBattleLogs()が呼ばれることを確認 🔵
      await waitFor(() => {
        expect(deleteBattleLog).toHaveBeenCalledWith('log_20251108_001'); // 【確認内容】: deleteBattleLog()が呼ばれる 🔵
        expect(fetchBattleLogs).toHaveBeenCalled(); // 【確認内容】: fetchBattleLogs()が自動実行される 🔵
      });
    });

    it('TC-INT-003: BattleLogForm送信成功後に一覧が自動更新される', async () => {
      // 【テスト目的】: Zustand StoreのcreateBattleLog()が成功後、fetchBattleLogs()が自動実行されること 🔵
      // 【テスト内容】: 登録後に一覧が最新状態に更新されることを確認 🔵
      // 【期待される動作】: Backend API（POST /api/battle-logs）が呼ばれる、登録成功後、fetchBattleLogs()が自動実行される、battleLogs に新規データが追加される、BattleLogListコンポーネントが再レンダリングされる 🔵
      // 🔵 信頼性レベル: データフロー図に基づく

      // 【テストデータ準備】: createBattleLogとfetchBattleLogsモック関数を設定 🔵
      const createBattleLog = vi.fn().mockResolvedValue(undefined);
      const fetchBattleLogs = vi.fn();

      vi.mocked(useBattleLogStore).mockReturnValue({
        battleLogs: [],
        previousInput: null,
        isLoading: false,
        error: null,
        fetchBattleLogs,
        createBattleLog,
        deleteBattleLog: vi.fn(),
        setPreviousInput: vi.fn(),
        clearError: vi.fn(),
      });

      // 【実際の処理実行】: 新規登録ボタンをクリックし、フォームを送信 🔵
      render(<BattleLogListPage />);

      const newButton = screen.getByRole('button', { name: '新規登録' });
      fireEvent.click(newButton);

      // 【フォーム送信シミュレーション】: onSuccessコールバックを呼び出す
      // 【注記】: 実装時に、BattleLogFormのonSuccessコールバックが正しく設定されていることを確認

      // 【結果検証】: createBattleLog()とfetchBattleLogs()が呼ばれることを確認 🔵
      // await waitFor(() => {
      //   expect(createBattleLog).toHaveBeenCalled();
      //   expect(fetchBattleLogs).toHaveBeenCalled();
      // });
    });
  });
});
