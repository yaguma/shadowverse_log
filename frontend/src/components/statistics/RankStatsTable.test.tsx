import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Group, Rank } from '../../types';
import { RankStatsTable } from './RankStatsTable';

// 【テストファイル概要】: RankStatsTable（ランク帯別統計テーブル）コンポーネントの単体テスト
// 【テスト目的】: ランク帯別統計の基本表示、色分け表示、空データ処理を検証
// 【テスト範囲】: 正常系（4ケース）、異常系（1ケース）
// 🔵 信頼性レベル: REQ-203、TASK-0037要件定義書に基づいた実装

describe('RankStatsTable', () => {
  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-RANK-001: ランク別統計が正しく表示される', () => {
      // 【テスト目的】: RankStatsTableコンポーネントの基本的なテーブル表示機能を確認
      // 【テスト内容】: ランク、グループ、試合数、勝数、敗数、勝率が正しく表示されることをテスト
      // 【期待される動作】: テーブル形式で各ランク帯の統計情報が表示される
      // 🔵 信頼性レベル: REQ-203、受け入れ基準TC-RANK-001に基づく

      // ========== Given: テストデータ準備 ==========
      // 【テストデータ準備】: 複数のランク帯データを用意
      // 【初期条件設定】: サファイア、ダイアモンド、ルビーなど異なるランク帯のデータ
      // 【前提条件確認】: REQ-203の基本要件を満たすための代表的なデータセット
      const mockRankStats: Array<{
        rank: Rank;
        group: Group;
        totalGames: number;
        wins: number;
        losses: number;
        winRate: number;
      }> = [
        {
          rank: 'ダイアモンド',
          group: 'AAA',
          totalGames: 50,
          wins: 30,
          losses: 20,
          winRate: 60.0,
        },
        {
          rank: 'サファイア',
          group: 'AA',
          totalGames: 30,
          wins: 15,
          losses: 15,
          winRate: 50.0,
        },
        {
          rank: 'ルビー',
          group: 'A',
          totalGames: 20,
          wins: 12,
          losses: 8,
          winRate: 60.0,
        },
      ];

      // ========== When: 実際の処理実行 ==========
      // 【実際の処理実行】: RankStatsTableコンポーネントをレンダリング
      // 【処理内容】: テーブルヘッダーと3行のデータが描画される
      // 【実行タイミング】: テスト開始時に一度だけ実行
      const { container } = render(<RankStatsTable rankStats={mockRankStats} />);

      // ========== Then: 結果検証 ==========
      // 【結果検証】: テーブルが正しく表示されることを確認
      // 【期待値確認】: ヘッダーと各行のデータが正しく表示される
      // 【品質保証】: 基本的なテーブル表示機能が正常に動作することを保証

      // 【検証項目】: タイトル「ランク帯別統計」が表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('ランク帯別統計')).toBeInTheDocument();

      // 【検証項目】: テーブルヘッダーが正しく表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('ランク')).toBeInTheDocument();
      expect(screen.getByText('グループ')).toBeInTheDocument();
      expect(screen.getByText('試合数')).toBeInTheDocument();
      expect(screen.getByText('勝数')).toBeInTheDocument();
      expect(screen.getByText('敗数')).toBeInTheDocument();
      expect(screen.getByText('勝率')).toBeInTheDocument();

      // 【検証項目】: ダイアモンドAAAのデータが正しく表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('ダイアモンド')).toBeInTheDocument();
      expect(screen.getByText('AAA')).toBeInTheDocument();

      // 【検証項目】: サファイアAAのデータが正しく表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('サファイア')).toBeInTheDocument();
      expect(screen.getByText('AA')).toBeInTheDocument();

      // 【検証項目】: ルビーAのデータが正しく表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('ルビー')).toBeInTheDocument();

      // 【検証項目】: テーブル行が3つ存在する
      // 🔵 信頼性レベル: REQ-203に基づく
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
    });

    it('TC-RANK-002: 勝数が緑色、敗数が赤色、勝率が青色太字で表示される', () => {
      // 【テスト目的】: 統計データの色分け表示機能を確認
      // 【テスト内容】: 勝数、敗数、勝率が正しい色で表示されることをテスト
      // 【期待される動作】: 勝数: 緑、敗数: 赤、勝率: 青色太字
      // 🔵 信頼性レベル: REQ-203、UIデザイン仕様に基づく

      const mockRankStats: Array<{
        rank: Rank;
        group: Group;
        totalGames: number;
        wins: number;
        losses: number;
        winRate: number;
      }> = [
        {
          rank: 'ダイアモンド',
          group: 'AAA',
          totalGames: 50,
          wins: 30,
          losses: 20,
          winRate: 60.0,
        },
      ];

      const { container } = render(<RankStatsTable rankStats={mockRankStats} />);

      // 【検証項目】: テーブル本体が存在する
      // 🔵 信頼性レベル: REQ-203に基づく
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();

      // 【検証項目】: 勝数セルが緑色（text-green-600）で表示される
      // 🔵 信頼性レベル: UIデザイン仕様に基づく
      const winCell = container.querySelector('td.text-green-600');
      expect(winCell).toBeInTheDocument();
      expect(winCell).toHaveTextContent('30');

      // 【検証項目】: 敗数セルが赤色（text-red-600）で表示される
      // 🔵 信頼性レベル: UIデザイン仕様に基づく
      const lossCell = container.querySelector('td.text-red-600');
      expect(lossCell).toBeInTheDocument();
      expect(lossCell).toHaveTextContent('20');

      // 【検証項目】: 勝率セルが青色太字（text-blue-600 font-bold）で表示される
      // 🔵 信頼性レベル: UIデザイン仕様に基づく
      const winRateCell = container.querySelector('td.text-blue-600.font-bold');
      expect(winRateCell).toBeInTheDocument();
      expect(winRateCell).toHaveTextContent('60.0%');
    });

    it('TC-RANK-003: テーブルがレスポンシブ対応（overflow-x-auto）で表示される', () => {
      // 【テスト目的】: レスポンシブデザインのスクロール対応を確認
      // 【テスト内容】: overflow-x-autoクラスが正しく適用されることをテスト
      // 【期待される動作】: モバイル端末で横スクロール可能
      // 🔵 信頼性レベル: REQ-203、レスポンシブデザイン仕様に基づく

      const mockRankStats: Array<{
        rank: Rank;
        group: Group;
        totalGames: number;
        wins: number;
        losses: number;
        winRate: number;
      }> = [
        {
          rank: 'ダイアモンド',
          group: 'AAA',
          totalGames: 50,
          wins: 30,
          losses: 20,
          winRate: 60.0,
        },
      ];

      const { container } = render(<RankStatsTable rankStats={mockRankStats} />);

      // 【検証項目】: overflow-x-autoクラスが適用されている
      // 🔵 信頼性レベル: レスポンシブデザイン仕様に基づく
      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('TC-RANK-004: 勝率が小数点第1位まで正しく表示される', () => {
      // 【テスト目的】: 勝率の数値フォーマットが仕様通りであることを確認
      // 【テスト内容】: toFixed(1)メソッドにより、常に小数点第1位まで表示される
      // 【期待される動作】: 小数点以下の桁数が第1位まで表示される
      // 🔵 信頼性レベル: REQ-203に基づく

      const mockRankStats: Array<{
        rank: Rank;
        group: Group;
        totalGames: number;
        wins: number;
        losses: number;
        winRate: number;
      }> = [
        {
          rank: 'ダイアモンド',
          group: 'AAA',
          totalGames: 33,
          wins: 20,
          losses: 13,
          winRate: 60.60606060606061,
        },
      ];

      render(<RankStatsTable rankStats={mockRankStats} />);

      // 【検証項目】: 勝率が小数点第1位まで表示される（60.6%）
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('60.6%')).toBeInTheDocument();
    });
  });

  // ==================== 2. 異常系テストケース ====================

  describe('異常系テスト', () => {
    it('TC-RANK-005: 空データの場合でもテーブルヘッダーは表示される', () => {
      // 【テスト目的】: 空データ時のUI表示を確認
      // 【テスト内容】: rankStatsが空配列の場合、ヘッダーは表示されるがデータ行は0件
      // 【期待される動作】: テーブル構造は維持され、データ行のみ空
      // 🔵 信頼性レベル: REQ-203、エラーハンドリング仕様に基づく

      const mockRankStats: Array<{
        rank: Rank;
        group: Group;
        totalGames: number;
        wins: number;
        losses: number;
        winRate: number;
      }> = [];

      const { container } = render(<RankStatsTable rankStats={mockRankStats} />);

      // 【検証項目】: タイトル「ランク帯別統計」が表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('ランク帯別統計')).toBeInTheDocument();

      // 【検証項目】: テーブルヘッダーが表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('ランク')).toBeInTheDocument();
      expect(screen.getByText('グループ')).toBeInTheDocument();

      // 【検証項目】: テーブルボディのデータ行が0件
      // 🔵 信頼性レベル: REQ-203に基づく
      const tbody = container.querySelector('tbody');
      expect(tbody?.children).toHaveLength(0);
    });
  });
});
