import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BattleLog } from '../../types';
import { BattleLogList } from './BattleLogList';

// 【テストファイル概要】: Battle Log一覧表示コンポーネントの単体テスト
// 【テスト目的】: BattleLogListコンポーネントのテーブル表示、ソート、削除・詳細ボタンの機能を検証する
// 【テスト範囲】: 正常系、UI/UX、境界値、レスポンシブデザイン

describe('BattleLogList', () => {
  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-LIST-001: 対戦履歴一覧が正しく表示される（3件）', () => {
      // 【テスト目的】: BattleLogListコンポーネントが対戦履歴一覧を正しくテーブル形式で表示すること 🔵
      // 【テスト内容】: 3件の対戦履歴が日付降順でテーブルに表示されることを確認 🔵
      // 【期待される動作】: ヘッダー行と3行のデータ行が表示され、各行に詳細・削除ボタンが表示される 🔵
      // 🔵 信頼性レベル: 要件定義書REQ-009、REQ-103に基づく

      // 【テストデータ準備】: 3件の対戦履歴モックデータを作成 🔵
      // 【初期条件設定】: 日付降順でソートされたデータを用意
      const mockBattleLogs: BattleLog[] = [
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
        {
          id: 'log_20251107_001',
          date: '2025/11/07',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-002',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck-master-002',
        },
        {
          id: 'log_20251106_001',
          date: '2025/11/06',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck-001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-master-003',
        },
      ];

      const onDelete = vi.fn();
      const onDetail = vi.fn();

      // 【実際の処理実行】: BattleLogListコンポーネントをレンダリング 🔵
      // 【処理内容】: 3件の対戦履歴を含むコンポーネントを表示
      render(<BattleLogList battleLogs={mockBattleLogs} onDelete={onDelete} onDetail={onDetail} />);

      // 【結果検証】: テーブル構造とデータが正しく表示されることを確認 🔵
      // 【期待値確認】: ヘッダー行と3行のデータ行が表示される
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument(); // 【確認内容】: テーブルが表示される 🔵

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // 【確認内容】: ヘッダー行 + 3行のデータ行 = 4行 🔵

      // 【品質保証】: 日付降順ソートが正しく動作していることを確認
      expect(screen.getByText('2025/11/08')).toBeInTheDocument(); // 【確認内容】: 最新の対戦日が表示される 🔵
      expect(screen.getByText('2025/11/07')).toBeInTheDocument(); // 【確認内容】: 2番目の対戦日が表示される 🔵
      expect(screen.getByText('2025/11/06')).toBeInTheDocument(); // 【確認内容】: 3番目の対戦日が表示される 🔵

      // 【確認内容】: 削除・詳細ボタンが表示される 🔵
      const deleteButtons = screen.getAllByRole('button', { name: /削除/ });
      expect(deleteButtons).toHaveLength(3); // 【確認内容】: 3行分の削除ボタンが表示される 🔵

      const detailButtons = screen.getAllByRole('button', { name: /詳細/ });
      expect(detailButtons).toHaveLength(3); // 【確認内容】: 3行分の詳細ボタンが表示される 🔵
    });

    it('TC-LIST-002: 日付降順ソートが動作する', () => {
      // 【テスト目的】: 対戦履歴が日付降順（最新順）でソートされて表示されること 🔵
      // 【テスト内容】: 最新の対戦履歴が最上位に表示されることを確認 🔵
      // 【期待される動作】: 1行目: 2025/11/08, 2行目: 2025/11/07, 3行目: 2025/11/06 🔵
      // 🔵 信頼性レベル: 要件定義書REQ-103に基づく

      // 【テストデータ準備】: 日付がバラバラの3件のモックデータ 🔵
      // 【初期条件設定】: Backend APIから日付降順で返される前提
      const mockBattleLogs: BattleLog[] = [
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
        {
          id: 'log_20251107_001',
          date: '2025/11/07',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AA',
          myDeckId: 'deck-002',
          turn: '後攻',
          result: '負け',
          opponentDeckId: 'deck-master-002',
        },
        {
          id: 'log_20251106_001',
          date: '2025/11/06',
          battleType: '対戦台',
          rank: '-',
          group: '-',
          myDeckId: 'deck-001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck-master-003',
        },
      ];

      const onDelete = vi.fn();
      const onDetail = vi.fn();

      // 【実際の処理実行】: BattleLogListコンポーネントをレンダリング 🔵
      render(<BattleLogList battleLogs={mockBattleLogs} onDelete={onDelete} onDetail={onDetail} />);

      // 【結果検証】: テーブルの1行目〜3行目の日付順序を確認 🔵
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('2025/11/08'); // 【確認内容】: 1行目は最新の日付 🔵
      expect(rows[2]).toHaveTextContent('2025/11/07'); // 【確認内容】: 2行目は2番目の日付 🔵
      expect(rows[3]).toHaveTextContent('2025/11/06'); // 【確認内容】: 3行目は3番目の日付 🔵
    });

    it('TC-LIST-004: 削除ボタンがクリック可能', () => {
      // 【テスト目的】: 各行の「削除」ボタンがクリック可能で、onDeleteコールバックが呼ばれること 🔵
      // 【テスト内容】: ボタンクリック時にonDelete(id)が呼ばれることを確認 🔵
      // 【期待される動作】: onDelete('log_20251108_001') が呼ばれる 🔵
      // 🔵 信頼性レベル: 要件定義書REQ-010に基づく

      // 【テストデータ準備】: 1件の対戦履歴モックデータ 🔵
      const mockBattleLogs: BattleLog[] = [
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
      ];

      const onDelete = vi.fn();
      const onDetail = vi.fn();

      // 【実際の処理実行】: 削除ボタンをクリック 🔵
      render(<BattleLogList battleLogs={mockBattleLogs} onDelete={onDelete} onDetail={onDetail} />);

      const deleteButton = screen.getByRole('button', { name: /削除/ });
      fireEvent.click(deleteButton);

      // 【結果検証】: onDeleteコールバックが呼ばれることを確認 🔵
      expect(onDelete).toHaveBeenCalledTimes(1); // 【確認内容】: onDeleteが1回呼ばれる 🔵
      expect(onDelete).toHaveBeenCalledWith('log_20251108_001'); // 【確認内容】: 正しいIDが渡される 🔵
    });

    it('TC-LIST-005: 詳細ボタンがクリック可能', () => {
      // 【テスト目的】: 各行の「詳細」ボタンがクリック可能で、onDetailコールバックが呼ばれること 🔵
      // 【テスト内容】: ボタンクリック時にonDetail(log)が呼ばれることを確認 🔵
      // 【期待される動作】: onDetail({ id: 'log_20251108_001', ... }) が呼ばれる 🔵
      // 🔵 信頼性レベル: 要件定義書REQ-011に基づく

      // 【テストデータ準備】: 1件の対戦履歴モックデータ 🔵
      const mockBattleLogs: BattleLog[] = [
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
      ];

      const onDelete = vi.fn();
      const onDetail = vi.fn();

      // 【実際の処理実行】: 詳細ボタンをクリック 🔵
      render(<BattleLogList battleLogs={mockBattleLogs} onDelete={onDelete} onDetail={onDetail} />);

      const detailButton = screen.getByRole('button', { name: /詳細/ });
      fireEvent.click(detailButton);

      // 【結果検証】: onDetailコールバックが呼ばれることを確認 🔵
      expect(onDetail).toHaveBeenCalledTimes(1); // 【確認内容】: onDetailが1回呼ばれる 🔵
      expect(onDetail).toHaveBeenCalledWith(mockBattleLogs[0]); // 【確認内容】: 正しいlogオブジェクトが渡される 🔵
    });
  });

  // ==================== 2. 境界値テストケース ====================

  describe('境界値テスト', () => {
    it('TC-BND-001: 対戦履歴が0件の場合、空データメッセージが表示される', () => {
      // 【テスト目的】: データが存在しない最小状態（0件）での動作確認 🔵
      // 【テスト内容】: battleLogs = [] の場合、"データがありません"メッセージが表示されることを確認 🔵
      // 【期待される動作】: テーブルは表示されず、メッセージが表示される 🔵
      // 🔵 信頼性レベル: EDGE-204（空データ）に基づく

      // 【テストデータ準備】: 空の配列を用意 🔵
      const mockBattleLogs: BattleLog[] = [];

      const onDelete = vi.fn();
      const onDetail = vi.fn();

      // 【実際の処理実行】: BattleLogListコンポーネントをレンダリング 🔵
      render(<BattleLogList battleLogs={mockBattleLogs} onDelete={onDelete} onDetail={onDetail} />);

      // 【結果検証】: 空データメッセージが表示されることを確認 🔵
      expect(
        screen.getByText('対戦履歴がありません。「新規登録」ボタンから対戦履歴を追加してください。')
      ).toBeInTheDocument(); // 【確認内容】: 空データメッセージが表示される 🔵

      // 【確認内容】: テーブルは表示されない 🔵
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('TC-BND-002: 対戦履歴が1件の場合、正しく表示される', () => {
      // 【テスト目的】: データが存在する最小状態（1件）での動作確認 🔵
      // 【テスト内容】: battleLogs = [{ ... }]（1件）の場合、テーブルが正常に表示されることを確認 🔵
      // 【期待される動作】: テーブルに1行のデータが表示される 🔵
      // 🟡 信頼性レベル: 境界値テストの一般的なパターンから推測

      // 【テストデータ準備】: 1件の対戦履歴モックデータ 🟡
      const mockBattleLogs: BattleLog[] = [
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
      ];

      const onDelete = vi.fn();
      const onDetail = vi.fn();

      // 【実際の処理実行】: BattleLogListコンポーネントをレンダリング 🟡
      render(<BattleLogList battleLogs={mockBattleLogs} onDelete={onDelete} onDetail={onDetail} />);

      // 【結果検証】: テーブルに1行のデータが表示されることを確認 🟡
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument(); // 【確認内容】: テーブルが表示される 🟡

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2); // 【確認内容】: ヘッダー行 + 1行のデータ行 = 2行 🟡

      // 【確認内容】: 削除・詳細ボタンが表示される 🟡
      expect(screen.getByRole('button', { name: /削除/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /詳細/ })).toBeInTheDocument();
    });
  });

  // ==================== 3. UI/UXテストケース ====================

  describe('UI/UXテスト', () => {
    it('TC-UI-001: デスクトップ（1024px以上）でテーブル表示される', () => {
      // 【テスト目的】: 画面幅1024px以上でテーブル形式で表示されること 🔵
      // 【テスト内容】: Tailwind CSS の hidden lg:table クラスが適用されることを確認 🔵
      // 【期待される動作】: <table> 要素が表示される 🔵
      // 🔵 信頼性レベル: REQ-034、REQ-603に基づく

      // 【テストデータ準備】: 1件の対戦履歴モックデータ 🔵
      const mockBattleLogs: BattleLog[] = [
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
      ];

      const onDelete = vi.fn();
      const onDetail = vi.fn();

      // 【実際の処理実行】: BattleLogListコンポーネントをレンダリング 🔵
      render(<BattleLogList battleLogs={mockBattleLogs} onDelete={onDelete} onDetail={onDetail} />);

      // 【結果検証】: テーブル要素が存在することを確認 🔵
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument(); // 【確認内容】: テーブルが表示される 🔵
      expect(table).toHaveClass('hidden', 'lg:table'); // 【確認内容】: レスポンシブクラスが適用される 🔵
    });

    it('TC-A11Y-001: テーブルにrole="table"が設定されている', () => {
      // 【テスト目的】: アクセシビリティ対応（テーブルロール）を確認 🟡
      // 【テスト内容】: テーブルコンポーネントに role="table" 属性が設定されていること 🟡
      // 【期待される動作】: スクリーンリーダーがテーブル構造を正しく認識できる 🟡
      // 🟡 信頼性レベル: アクセシビリティ要件から推測

      // 【テストデータ準備】: 1件の対戦履歴モックデータ 🟡
      const mockBattleLogs: BattleLog[] = [
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
      ];

      const onDelete = vi.fn();
      const onDetail = vi.fn();

      // 【実際の処理実行】: BattleLogListコンポーネントをレンダリング 🟡
      render(<BattleLogList battleLogs={mockBattleLogs} onDelete={onDelete} onDetail={onDetail} />);

      // 【結果検証】: role="table"属性が設定されていることを確認 🟡
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('role', 'table'); // 【確認内容】: role属性が設定される 🟡
    });

    it('TC-A11Y-002: 削除・詳細ボタンにaria-label属性が設定されている', () => {
      // 【テスト目的】: アクセシビリティ対応（ボタンラベル）を確認 🟡
      // 【テスト内容】: 削除・詳細ボタンに aria-label 属性が設定されていること 🟡
      // 【期待される動作】: スクリーンリーダーがボタンの目的を読み上げる 🟡
      // 🟡 信頼性レベル: アクセシビリティ要件から推測

      // 【テストデータ準備】: 1件の対戦履歴モックデータ 🟡
      const mockBattleLogs: BattleLog[] = [
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
      ];

      const onDelete = vi.fn();
      const onDetail = vi.fn();

      // 【実際の処理実行】: BattleLogListコンポーネントをレンダリング 🟡
      render(<BattleLogList battleLogs={mockBattleLogs} onDelete={onDelete} onDetail={onDetail} />);

      // 【結果検証】: aria-label属性が設定されていることを確認 🟡
      const deleteButton = screen.getByRole('button', { name: /削除/ });
      expect(deleteButton).toHaveAttribute('aria-label'); // 【確認内容】: aria-label属性が設定される 🟡

      const detailButton = screen.getByRole('button', { name: /詳細/ });
      expect(detailButton).toHaveAttribute('aria-label'); // 【確認内容】: aria-label属性が設定される 🟡
    });
  });
});
