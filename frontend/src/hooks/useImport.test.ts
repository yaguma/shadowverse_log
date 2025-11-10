import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useImport } from './useImport';

// 【テストファイル概要】: useImportフックの単体テスト
// 【テスト目的】: データインポート機能のカスタムフックの動作を検証する
// 【テスト範囲】: JSON/CSVファイルのインポート処理の正常系とエラー系

describe('useImport Hook', () => {
  // 【テスト前準備】: 各テスト実行前にfetchをモック化し、一貫したテスト環境を構築
  // 【環境初期化】: グローバルなfetch関数をVitestのモック関数に置き換える
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  // 【テスト後処理】: 各テスト実行後にモックをクリアして次のテストに影響を与えないようにする
  // 【状態復元】: モックの呼び出し履歴をリセットし、テスト間の独立性を保証
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('TC-IMPORT-001: JSON形式ファイルの正常インポート', () => {
    it('JSON形式のファイルから対戦履歴データを正常にインポートできること', async () => {
      // 【テスト目的】: JSON形式のファイルを選択し、データを正常にインポートできることを確認 🔵
      // 【テスト内容】: ファイル選択 → パース → バリデーション → API送信 → 成功メッセージ表示 🔵
      // 【期待される動作】: インポート成功後、正しい件数が返され、エラーが発生しない 🔵
      // 🔵 信頼性レベル: REQ-301、acceptance-criteria.md L236より

      // 【テストデータ準備】: 正しいBattleLog形式の1件のデータを含むJSON文字列を作成 🔵
      // 【初期条件設定】: 必須フィールド9項目をすべて含むデータ
      const jsonContent = JSON.stringify([
        {
          id: 'log_001',
          date: '2025/10/23',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'A',
          myDeckId: 'my_deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_001',
        },
      ]);

      // 【ファイルオブジェクト作成】: Fileオブジェクトを作成してブラウザのファイル選択をシミュレート
      const file = new File([jsonContent], 'battle-logs.json', { type: 'application/json' });

      // 【モック設定】: fetch関数が成功レスポンスを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            imported: 1,
            skipped: 0,
            total: 1,
          },
          meta: {
            timestamp: '2025-11-10T12:00:00Z',
            requestId: 'req-001',
          },
        }),
      } as Response);

      // 【実際の処理実行】: useImportフックを呼び出してインポート処理を実行 🔵
      // 【処理内容】: handleImport関数にFileオブジェクトを渡してインポート処理を開始
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【結果検証】: インポート成功後、正しい件数が返されることを確認 🔵
      // 【期待値確認】: imported=1, skipped=0, total=1の結果が得られる
      await waitFor(() => {
        expect(result.current.importResult).toEqual({
          imported: 1,
          skipped: 0,
          total: 1,
        }); // 【確認内容】: インポート結果が正しく設定されている 🔵
        expect(result.current.error).toBeNull(); // 【確認内容】: エラーが発生していない 🔵
        expect(result.current.isLoading).toBe(false); // 【確認内容】: ローディング状態が解除されている 🔵
      });
    });
  });

  describe('TC-IMPORT-002: CSV形式ファイルの正常インポート', () => {
    it('CSV形式のファイルから対戦履歴データを正常にインポートできること', async () => {
      // 【テスト目的】: CSV形式のファイルを選択し、データを正常にインポートできることを確認 🔵
      // 【テスト内容】: CSVパース → JSON変換 → バリデーション → API送信 → 成功メッセージ表示 🔵
      // 【期待される動作】: CSVヘッダーが正しく認識され、データがJSON形式に変換される 🔵
      // 🔵 信頼性レベル: REQ-302、acceptance-criteria.md L237より

      // 【テストデータ準備】: 正しいヘッダー + 1件のデータを含むCSV文字列を作成 🔵
      // 【初期条件設定】: UTF-8エンコーディングで日本語を含むデータ
      const csvContent = `id,date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
log_001,2025/10/23,ランクマッチ,ダイアモンド,A,my_deck_001,先攻,勝ち,deck_001`;

      // 【ファイルオブジェクト作成】: Fileオブジェクトを作成してCSVファイル選択をシミュレート
      const file = new File([csvContent], 'battle-logs.csv', { type: 'text/csv' });

      // 【モック設定】: fetch関数が成功レスポンスを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            imported: 1,
            skipped: 0,
            total: 1,
          },
          meta: {
            timestamp: '2025-11-10T12:00:00Z',
            requestId: 'req-002',
          },
        }),
      } as Response);

      // 【実際の処理実行】: useImportフックを呼び出してCSVインポート処理を実行 🔵
      // 【処理内容】: handleImport関数にCSVファイルを渡してインポート処理を開始
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【結果検証】: CSVインポート成功後、正しい件数が返されることを確認 🔵
      // 【期待値確認】: CSV → JSON変換が成功し、インポート結果が正しい
      await waitFor(() => {
        expect(result.current.importResult).toEqual({
          imported: 1,
          skipped: 0,
          total: 1,
        }); // 【確認内容】: CSVインポート結果が正しく設定されている 🔵
        expect(result.current.error).toBeNull(); // 【確認内容】: エラーが発生していない 🔵
        expect(result.current.isLoading).toBe(false); // 【確認内容】: ローディング状態が解除されている 🔵
      });
    });
  });

  describe('TC-IMPORT-003: 大量データ（100件）の正常インポート', () => {
    it('100件のデータを一括インポートでき、5秒以内に完了すること', async () => {
      // 【テスト目的】: 大量データ（100件）を一括インポートし、パフォーマンス要件を満たすことを確認 🔵
      // 【テスト内容】: 100件のBattleLogデータを含むJSONファイルをインポート 🔵
      // 【期待される動作】: 5秒以内に処理が完了し、100件すべてがインポートされる 🔵
      // 🔵 信頼性レベル: acceptance-criteria.md L238、NFR-003（5秒以内）より

      // 【テストデータ準備】: 100件のBattleLogデータを含むJSON配列を作成 🔵
      // 【初期条件設定】: 実際の使用シナリオ（初回セットアップ時の一括登録）を想定
      const battleLogs = Array.from({ length: 100 }, (_, i) => ({
        id: `log_${String(i + 1).padStart(3, '0')}`,
        date: '2025/10/23',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'A',
        myDeckId: 'my_deck_001',
        turn: i % 2 === 0 ? '先攻' : '後攻',
        result: i % 3 === 0 ? '勝ち' : '負け',
        opponentDeckId: `deck_${String((i % 10) + 1).padStart(3, '0')}`,
      }));

      const jsonContent = JSON.stringify(battleLogs);
      const file = new File([jsonContent], 'battle-logs-100.json', { type: 'application/json' });

      // 【モック設定】: fetch関数が100件のインポート成功レスポンスを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            imported: 100,
            skipped: 0,
            total: 100,
          },
          meta: {
            timestamp: '2025-11-10T12:00:00Z',
            requestId: 'req-003',
          },
        }),
      } as Response);

      // 【パフォーマンス測定開始】: 処理時間を測定するため、開始時刻を記録
      const startTime = Date.now();

      // 【実際の処理実行】: useImportフックを呼び出して大量データのインポート処理を実行 🔵
      // 【処理内容】: handleImport関数に100件のデータファイルを渡してインポート処理を開始
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【パフォーマンス測定終了】: 処理完了時刻を記録し、経過時間を計算
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      // 【結果検証】: 100件のインポート成功と処理時間を確認 🔵
      // 【期待値確認】: imported=100, 処理時間5秒以内
      await waitFor(() => {
        expect(result.current.importResult).toEqual({
          imported: 100,
          skipped: 0,
          total: 100,
        }); // 【確認内容】: 100件すべてがインポートされている 🔵
        expect(result.current.error).toBeNull(); // 【確認内容】: エラーが発生していない 🔵
        expect(elapsedTime).toBeLessThan(5000); // 【確認内容】: 処理時間が5秒以内である（NFR-003準拠） 🔵
      });
    });
  });

  describe('TC-IMPORT-006: 日付形式YYYY/MM/DDの正常パース', () => {
    it('YYYY/MM/DD形式の日付文字列が正しくパースされること', async () => {
      // 【テスト目的】: YYYY/MM/DD形式の日付文字列が正しくバリデーションを通過することを確認 🔵
      // 【テスト内容】: "2025/10/23" → 日付バリデーション成功 → インポート成功 🔵
      // 【期待される動作】: システム標準の日付形式（スラッシュ区切り）が正常に処理される 🔵
      // 🔵 信頼性レベル: interfaces.ts BattleLog.date型定義より

      // 【テストデータ準備】: YYYY/MM/DD形式の日付を含むデータを作成 🔵
      // 【初期条件設定】: システム標準の日付形式（スラッシュ区切り）を使用
      const jsonContent = JSON.stringify([
        {
          id: 'log_001',
          date: '2025/10/23',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'A',
          myDeckId: 'my_deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_001',
        },
      ]);

      const file = new File([jsonContent], 'battle-logs.json', { type: 'application/json' });

      // 【モック設定】: fetch関数が成功レスポンスを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            imported: 1,
            skipped: 0,
            total: 1,
          },
          meta: {
            timestamp: '2025-11-10T12:00:00Z',
            requestId: 'req-006',
          },
        }),
      } as Response);

      // 【実際の処理実行】: useImportフックを呼び出して日付形式のバリデーションを実行 🔵
      // 【処理内容】: handleImport関数でYYYY/MM/DD形式の日付をバリデーション
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【結果検証】: 日付バリデーション成功とインポート成功を確認 🔵
      // 【期待値確認】: 日付形式が正しく認識され、エラーが発生しない
      await waitFor(() => {
        expect(result.current.importResult).toEqual({
          imported: 1,
          skipped: 0,
          total: 1,
        }); // 【確認内容】: 日付形式が正しくパースされてインポートされている 🔵
        expect(result.current.error).toBeNull(); // 【確認内容】: 日付形式エラーが発生していない 🔵
      });
    });
  });

  describe('TC-IMPORT-007: すべてのBattleType値の正常インポート', () => {
    it('"ランクマッチ", "対戦台", "ロビー大会" の3種類すべてが正常にインポートされること', async () => {
      // 【テスト目的】: BattleType Enumのすべての値が正しくバリデーションを通過することを確認 🔵
      // 【テスト内容】: 3種類のBattleTypeをそれぞれ1件ずつ含むデータをインポート 🔵
      // 【期待される動作】: Enum値のバリデーションが正しく動作し、すべてのケースでエラーが発生しない 🔵
      // 🔵 信頼性レベル: interfaces.ts BattleType型定義より

      // 【テストデータ準備】: 3種類のBattleTypeを含むデータを作成 🔵
      // 【初期条件設定】: すべての対戦タイプをカバーする網羅的テスト
      const jsonContent = JSON.stringify([
        {
          id: 'log_001',
          date: '2025/10/23',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'A',
          myDeckId: 'my_deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_001',
        },
        {
          id: 'log_002',
          date: '2025/10/23',
          battleType: '対戦台',
          rank: 'ダイアモンド',
          group: 'A',
          myDeckId: 'my_deck_001',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck_002',
        },
        {
          id: 'log_003',
          date: '2025/10/23',
          battleType: 'ロビー大会',
          rank: '-',
          group: '-',
          myDeckId: 'my_deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_003',
        },
      ]);

      const file = new File([jsonContent], 'battle-logs.json', { type: 'application/json' });

      // 【モック設定】: fetch関数が3件のインポート成功レスポンスを返すように設定
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            imported: 3,
            skipped: 0,
            total: 3,
          },
          meta: {
            timestamp: '2025-11-10T12:00:00Z',
            requestId: 'req-007',
          },
        }),
      } as Response);

      // 【実際の処理実行】: useImportフックを呼び出してBattleType Enumのバリデーションを実行 🔵
      // 【処理内容】: handleImport関数で3種類のBattleTypeをバリデーション
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【結果検証】: すべてのBattleTypeが正常にインポートされることを確認 🔵
      // 【期待値確認】: Enum値のバリデーションロジックの正確性を保証
      await waitFor(() => {
        expect(result.current.importResult).toEqual({
          imported: 3,
          skipped: 0,
          total: 3,
        }); // 【確認内容】: 3種類のBattleTypeすべてが正しくインポートされている 🔵
        expect(result.current.error).toBeNull(); // 【確認内容】: Enum値エラーが発生していない 🔵
      });
    });
  });

  describe('TC-IMPORT-010: JSON形式エラー（不正なJSON）', () => {
    it('不正なJSON形式のファイルをインポートしようとした場合、エラーメッセージが表示されること', async () => {
      // 【テスト目的】: 不正なJSON形式のファイルを選択した場合、適切なエラーハンドリングが行われることを確認 🔵
      // 【テスト内容】: 閉じ括弧がないJSONファイルをインポート → JSONパースエラー → エラーメッセージ表示 🔵
      // 【期待される動作】: ユーザーに分かりやすいエラーメッセージを表示し、システムの安全性を保つ 🔵
      // 🔵 信頼性レベル: acceptance-criteria.md L239、REQ-404より

      // 【テストデータ準備】: 不正なJSON形式の文字列を作成 🔵
      // 【不正な理由】: JSON.parse()がSyntaxErrorを投げる不正な構文（閉じ括弧なし）
      const invalidJsonContent = '{invalid json';

      // 【ファイルオブジェクト作成】: 不正なJSONファイルを作成
      const file = new File([invalidJsonContent], 'invalid.json', { type: 'application/json' });

      // 【実際の処理実行】: useImportフックを呼び出して不正なJSONファイルをインポート 🔵
      // 【処理内容】: handleImport関数で不正なJSONのパースを試行 → エラー検出
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【結果検証】: 適切なエラーメッセージが表示されることを確認 🔵
      // 【期待値確認】: ユーザーが理解しやすい日本語メッセージが設定される
      await waitFor(() => {
        expect(result.current.error).toBeTruthy(); // 【確認内容】: エラーが発生している 🔵
        expect(result.current.error).toContain('JSON形式が不正です'); // 【確認内容】: 適切なエラーメッセージが設定されている 🔵
        expect(result.current.importResult).toBeNull(); // 【確認内容】: インポート処理が中断されている 🔵
        expect(result.current.isLoading).toBe(false); // 【確認内容】: ローディング状態が解除されている 🔵
      });
    });
  });

  describe('TC-IMPORT-011: CSV形式エラー（ヘッダー不正）', () => {
    it('CSVヘッダー行が不正な場合、エラーメッセージが表示されること', async () => {
      // 【テスト目的】: CSVヘッダーが不正な場合、適切なエラーハンドリングが行われることを確認 🔵
      // 【テスト内容】: 必須ヘッダーが欠けているCSVファイルをインポート → ヘッダーエラー → エラーメッセージ表示 🔵
      // 【期待される動作】: 不足しているヘッダー名を具体的に表示し、ユーザーに修正方法を伝える 🔵
      // 🔵 信頼性レベル: acceptance-criteria.md L240、REQ-404より

      // 【テストデータ準備】: 不正なヘッダーを持つCSVファイルを作成 🔵
      // 【不正な理由】: 必須ヘッダー（id, date, battleType等）が欠けている
      const invalidCsvContent = `invalid,header,names
log_001,2025/10/23,ランクマッチ`;

      // 【ファイルオブジェクト作成】: 不正なCSVファイルを作成
      const file = new File([invalidCsvContent], 'invalid.csv', { type: 'text/csv' });

      // 【実際の処理実行】: useImportフックを呼び出して不正なCSVファイルをインポート 🔵
      // 【処理内容】: handleImport関数でCSVヘッダーの検証 → エラー検出
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【結果検証】: 適切なエラーメッセージが表示されることを確認 🔵
      // 【期待値確認】: 不足しているヘッダー名を具体的に表示するメッセージ
      await waitFor(() => {
        expect(result.current.error).toBeTruthy(); // 【確認内容】: エラーが発生している 🔵
        expect(result.current.error).toContain('CSV形式が不正です'); // 【確認内容】: CSV形式エラーメッセージが表示されている 🔵
        expect(result.current.importResult).toBeNull(); // 【確認内容】: インポート処理が中断されている 🔵
      });
    });
  });

  describe('TC-IMPORT-012: 必須フィールド欠落エラー（dateフィールド）', () => {
    it('必須フィールド（date）が欠けているデータが含まれる場合、エラーメッセージが表示されること', async () => {
      // 【テスト目的】: 必須フィールド（date）が欠落している場合、適切なエラーハンドリングが行われることを確認 🔵
      // 【テスト内容】: dateフィールドが欠けているJSONファイルをインポート → バリデーションエラー → 詳細なエラーメッセージ表示 🔵
      // 【期待される動作】: 行番号とフィールド名を含む詳細なエラー情報を表示 🔵
      // 🔵 信頼性レベル: acceptance-criteria.md L241、REQ-303より

      // 【テストデータ準備】: dateフィールドが欠けているデータを作成 🔵
      // 【不正な理由】: BattleLog型の必須フィールドdateが存在しない
      const jsonContent = JSON.stringify([
        {
          id: 'log_001',
          // "date" フィールドが欠けている
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'A',
          myDeckId: 'my_deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_001',
        },
      ]);

      const file = new File([jsonContent], 'invalid-data.json', { type: 'application/json' });

      // 【実際の処理実行】: useImportフックを呼び出して不完全なデータをインポート 🔵
      // 【処理内容】: handleImport関数で必須フィールドの検証 → エラー検出
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【結果検証】: 適切なエラーメッセージが表示されることを確認 🔵
      // 【期待値確認】: 行番号とフィールド名を含む詳細なエラー情報
      await waitFor(() => {
        expect(result.current.error).toBeTruthy(); // 【確認内容】: エラーが発生している 🔵
        expect(result.current.error).toContain('dateフィールドが必要です'); // 【確認内容】: 必須フィールドエラーメッセージが表示されている 🔵
        expect(result.current.importResult).toBeNull(); // 【確認内容】: インポート処理が中断されている 🔵
      });
    });
  });

  describe('TC-IMPORT-013: 日付形式エラー（YYYY-MM-DD形式）', () => {
    it('システム標準外の日付形式（YYYY-MM-DD）が使用された場合、エラーメッセージが表示されること', async () => {
      // 【テスト目的】: YYYY-MM-DD形式の日付がエラーとして検出されることを確認 🔵
      // 【テスト内容】: ハイフン区切りの日付をインポート → 日付形式バリデーションエラー → エラーメッセージ表示 🔵
      // 【期待される動作】: 正しい形式（YYYY/MM/DD）の例を含むエラーメッセージが表示される 🔵
      // 🔵 信頼性レベル: interfaces.ts date型定義、requirements.mdより

      // 【テストデータ準備】: YYYY-MM-DD形式の日付を含むデータを作成 🔵
      // 【不正な理由】: システム標準はYYYY/MM/DD形式（スラッシュ区切り）
      const jsonContent = JSON.stringify([
        {
          id: 'log_001',
          date: '2025-10-23', // ハイフン区切り（不正）
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'A',
          myDeckId: 'my_deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_001',
        },
      ]);

      const file = new File([jsonContent], 'invalid-date.json', { type: 'application/json' });

      // 【実際の処理実行】: useImportフックを呼び出して不正な日付形式のデータをインポート 🔵
      // 【処理内容】: handleImport関数で日付形式の検証 → エラー検出
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【結果検証】: 適切なエラーメッセージが表示されることを確認 🔵
      // 【期待値確認】: 正しい形式の例を含む分かりやすいメッセージ
      await waitFor(() => {
        expect(result.current.error).toBeTruthy(); // 【確認内容】: エラーが発生している 🔵
        expect(result.current.error).toContain('日付形式が不正です'); // 【確認内容】: 日付形式エラーメッセージが表示されている 🔵
        expect(result.current.error).toContain('YYYY/MM/DD形式'); // 【確認内容】: 正しい形式の例が含まれている 🔵
        expect(result.current.importResult).toBeNull(); // 【確認内容】: インポート処理が中断されている 🔵
      });
    });
  });

  describe('TC-IMPORT-014: Enum値エラー（不正なbattleType）', () => {
    it('BattleType Enumに定義されていない値が使用された場合、エラーメッセージが表示されること', async () => {
      // 【テスト目的】: 不正なBattleType値がエラーとして検出されることを確認 🔵
      // 【テスト内容】: 未定義のBattleType値をインポート → Enum値バリデーションエラー → エラーメッセージ表示 🔵
      // 【期待される動作】: 許可されている値のリストを含むエラーメッセージが表示される 🔵
      // 🔵 信頼性レベル: interfaces.ts BattleType型定義より

      // 【テストデータ準備】: 未定義のBattleType値を含むデータを作成 🔵
      // 【不正な理由】: BattleTypeは "ランクマッチ", "対戦台", "ロビー大会" のみ許可
      const jsonContent = JSON.stringify([
        {
          id: 'log_001',
          date: '2025/10/23',
          battleType: 'カジュアルマッチ', // 未定義の値（不正）
          rank: 'ダイアモンド',
          group: 'A',
          myDeckId: 'my_deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_001',
        },
      ]);

      const file = new File([jsonContent], 'invalid-enum.json', { type: 'application/json' });

      // 【実際の処理実行】: useImportフックを呼び出して不正なEnum値のデータをインポート 🔵
      // 【処理内容】: handleImport関数でEnum値の検証 → エラー検出
      const { result } = renderHook(() => useImport());

      await result.current.handleImport(file);

      // 【結果検証】: 適切なエラーメッセージが表示されることを確認 🔵
      // 【期待値確認】: 許可されている値のリストを含むメッセージ
      await waitFor(() => {
        expect(result.current.error).toBeTruthy(); // 【確認内容】: エラーが発生している 🔵
        expect(result.current.error).toContain('battleType'); // 【確認内容】: battleTypeフィールドに関するエラーメッセージが表示されている 🔵
        expect(result.current.importResult).toBeNull(); // 【確認内容】: インポート処理が中断されている 🔵
      });
    });
  });
});
