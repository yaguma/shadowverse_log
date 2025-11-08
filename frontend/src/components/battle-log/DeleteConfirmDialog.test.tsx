import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BattleLog } from '../../types';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

// 【テストファイル概要】: 削除確認ダイアログコンポーネントの単体テスト
// 【テスト目的】: DeleteConfirmDialogコンポーネントの表示、キャンセル、削除実行、ローディング状態の機能を検証する
// 【テスト範囲】: 正常系、UI/UX、エッジケース

describe('DeleteConfirmDialog', () => {
  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-DELETE-DIALOG-001: 削除確認ダイアログが正しく表示される', () => {
      // 【テスト目的】: isOpen=trueの場合、削除確認ダイアログが正しく表示されること 🟡
      // 【テスト内容】: ダイアログタイトル、確認メッセージ、対象の対戦日・対戦結果、キャンセルボタン、削除するボタンが表示されることを確認 🟡
      // 【期待される動作】: ダイアログタイトル: "削除確認"、確認メッセージ: "本当に削除しますか？"、対象情報: "2025/11/08 | 勝ち" 🟡
      // 🟡 信頼性レベル: 一般的なUXパターンから推測

      // 【テストデータ準備】: 削除対象の対戦履歴を作成 🟡
      // 【初期条件設定】: 削除対象の対戦履歴が選択された状態
      const targetLog: BattleLog = {
        id: 'log_20251108_001',
        date: '2025/11/08',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck-master-001',
      };

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // 【実際の処理実行】: DeleteConfirmDialogコンポーネントをレンダリング 🟡
      // 【処理内容】: isOpen=trueでダイアログを表示
      render(
        <DeleteConfirmDialog
          isOpen={true}
          targetLog={targetLog}
          isLoading={false}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // 【結果検証】: ダイアログの基本構造が表示されることを確認 🟡
      // 【期待値確認】: ダイアログタイトル、メッセージ、ボタンが表示される
      expect(screen.getByText('削除確認')).toBeInTheDocument(); // 【確認内容】: ダイアログタイトルが表示される 🟡
      expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument(); // 【確認内容】: 確認メッセージが表示される 🟡
      expect(screen.getByText(/2025\/11\/08/)).toBeInTheDocument(); // 【確認内容】: 対象の対戦日が表示される 🟡
      expect(screen.getByText(/勝ち/)).toBeInTheDocument(); // 【確認内容】: 対象の対戦結果が表示される 🟡

      // 【確認内容】: ボタンが表示される 🟡
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除する' })).toBeInTheDocument();
    });

    it('TC-DELETE-DIALOG-002: キャンセルボタンでダイアログが閉じる', () => {
      // 【テスト目的】: キャンセルボタンクリック時にonCancelコールバックが呼ばれること 🟡
      // 【テスト内容】: キャンセルボタンをクリックした場合、onCancel()が呼ばれることを確認 🟡
      // 【期待される動作】: onCancel()が呼ばれ、onConfirm()は呼ばれない 🟡
      // 🟡 信頼性レベル: 一般的なダイアログUXから推測

      // 【テストデータ準備】: 削除対象の対戦履歴を作成 🟡
      const targetLog: BattleLog = {
        id: 'log_20251108_001',
        date: '2025/11/08',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck-master-001',
      };

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // 【実際の処理実行】: キャンセルボタンをクリック 🟡
      render(
        <DeleteConfirmDialog
          isOpen={true}
          targetLog={targetLog}
          isLoading={false}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      fireEvent.click(cancelButton);

      // 【結果検証】: onCancelが呼ばれ、onConfirmは呼ばれないことを確認 🟡
      expect(onCancel).toHaveBeenCalledTimes(1); // 【確認内容】: onCancelが1回呼ばれる 🟡
      expect(onConfirm).not.toHaveBeenCalled(); // 【確認内容】: onConfirmは呼ばれない 🟡
    });

    it('TC-DELETE-DIALOG-003: 削除するボタンで削除が実行される', () => {
      // 【テスト目的】: 削除するボタンクリック時にonConfirmコールバックが呼ばれること 🟡
      // 【テスト内容】: 削除するボタンをクリックした場合、onConfirm()が呼ばれることを確認 🟡
      // 【期待される動作】: onConfirm()が呼ばれる 🟡
      // 🟡 信頼性レベル: 一般的なダイアログUXから推測

      // 【テストデータ準備】: 削除対象の対戦履歴を作成 🟡
      const targetLog: BattleLog = {
        id: 'log_20251108_001',
        date: '2025/11/08',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck-master-001',
      };

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // 【実際の処理実行】: 削除するボタンをクリック 🟡
      render(
        <DeleteConfirmDialog
          isOpen={true}
          targetLog={targetLog}
          isLoading={false}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: '削除する' });
      fireEvent.click(confirmButton);

      // 【結果検証】: onConfirmが呼ばれることを確認 🟡
      expect(onConfirm).toHaveBeenCalledTimes(1); // 【確認内容】: onConfirmが1回呼ばれる 🟡
    });

    it('TC-DELETE-DIALOG-004: ローディング中はボタンが無効化される', () => {
      // 【テスト目的】: isLoading=trueの場合、キャンセル・削除するボタンが無効化されること 🟡
      // 【テスト内容】: ローディング中にボタンがdisabled状態になることを確認 🟡
      // 【期待される動作】: ボタンがdisabled状態になり、連続クリックを防止する 🟡
      // 🟡 信頼性レベル: 一般的なUXパターンから推測

      // 【テストデータ準備】: 削除対象の対戦履歴を作成 🟡
      // 【初期条件設定】: ローディング中の状態を用意
      const targetLog: BattleLog = {
        id: 'log_20251108_001',
        date: '2025/11/08',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck-master-001',
      };

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // 【実際の処理実行】: isLoading=trueでレンダリング 🟡
      render(
        <DeleteConfirmDialog
          isOpen={true}
          targetLog={targetLog}
          isLoading={true}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // 【結果検証】: ボタンが無効化され、ローディングスピナーが表示されることを確認 🟡
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      expect(cancelButton).toBeDisabled(); // 【確認内容】: キャンセルボタンが無効化される 🟡

      const confirmButton = screen.getByRole('button', { name: '削除する' });
      expect(confirmButton).toBeDisabled(); // 【確認内容】: 削除するボタンが無効化される 🟡

      // 【確認内容】: ローディングスピナーが表示される 🟡
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  // ==================== 2. エッジケース ====================

  describe('エッジケース', () => {
    it('TC-EDGE-001: isOpen=falseの場合、ダイアログが表示されない', () => {
      // 【テスト目的】: isOpen=falseの場合、ダイアログが非表示になることを確認 🟡
      // 【テスト内容】: ダイアログが閉じられた状態での動作を確認 🟡
      // 【期待される動作】: ダイアログコンテンツが表示されない 🟡
      // 🟡 信頼性レベル: エッジケースとして妥当な推測

      // 【テストデータ準備】: 削除対象の対戦履歴を作成 🟡
      const targetLog: BattleLog = {
        id: 'log_20251108_001',
        date: '2025/11/08',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck-001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck-master-001',
      };

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // 【実際の処理実行】: isOpen=falseでレンダリング 🟡
      render(
        <DeleteConfirmDialog
          isOpen={false}
          targetLog={targetLog}
          isLoading={false}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // 【結果検証】: ダイアログが表示されないことを確認 🟡
      expect(screen.queryByText('削除確認')).not.toBeInTheDocument(); // 【確認内容】: ダイアログタイトルが表示されない 🟡
      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument(); // 【確認内容】: ボタンが表示されない 🟡
    });

    it('TC-EDGE-002: targetLog=nullの場合、ダイアログが表示されない', () => {
      // 【テスト目的】: targetLog=nullの場合、ダイアログが表示されないことを確認 🟡
      // 【テスト内容】: 削除対象が選択されていない状態での動作を確認 🟡
      // 【期待される動作】: ダイアログコンテンツが表示されない 🟡
      // 🟡 信頼性レベル: エッジケースとして妥当な推測

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // 【実際の処理実行】: targetLog=nullでレンダリング 🟡
      render(
        <DeleteConfirmDialog
          isOpen={true}
          targetLog={null}
          isLoading={false}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // 【結果検証】: ダイアログが表示されないことを確認 🟡
      expect(screen.queryByText('削除確認')).not.toBeInTheDocument(); // 【確認内容】: ダイアログタイトルが表示されない 🟡
      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument(); // 【確認内容】: ボタンが表示されない 🟡
    });
  });
});
