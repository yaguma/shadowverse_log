import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OverallStats } from './OverallStats';

// 【テストファイル概要】: OverallStats（全体統計表示）コンポーネントの単体テスト
// 【テスト目的】: 全体統計の基本表示、数値フォーマット、レスポンシブ対応を検証
// 【テスト範囲】: 正常系（3ケース）
// 🔵 信頼性レベル: REQ-203、TASK-0037要件定義書に基づいた実装

describe('OverallStats', () => {
  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-OVERALL-001: 全体統計が正しく表示される', () => {
      // 【テスト目的】: OverallStatsコンポーネントの基本的な統計表示機能を確認
      // 【テスト内容】: 総対戦数、勝利数、敗北数、勝率が正しく表示されることをテスト
      // 【期待される動作】: カード形式で4つの統計情報が表示される
      // 🔵 信頼性レベル: REQ-203、受け入れ基準TC-OVERALL-001に基づく

      // ========== Given: テストデータ準備 ==========
      // 【テストデータ準備】: 標準的な対戦成績データを用意
      // 【初期条件設定】: 総試合数100、勝率60%のバランスの取れたデータセット
      // 【前提条件確認】: REQ-203の基本要件を満たすための代表的なデータ
      const mockStats = {
        totalGames: 100,
        wins: 60,
        losses: 40,
        winRate: 60.0,
      };

      // ========== When: 実際の処理実行 ==========
      // 【実際の処理実行】: OverallStatsコンポーネントをレンダリング
      // 【処理内容】: 4つのカードが2列×2列（PC: 4列）で描画される
      // 【実行タイミング】: テスト開始時に一度だけ実行
      render(<OverallStats stats={mockStats} />);

      // ========== Then: 結果検証 ==========
      // 【結果検証】: 統計情報が正しく表示されることを確認
      // 【期待値確認】: 各カードに正しいラベルと数値が表示される
      // 【品質保証】: 基本的な統計表示機能が正常に動作することを保証

      // 【検証項目】: タイトル「全体統計」が表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('全体統計')).toBeInTheDocument();

      // 【検証項目】: 総試合数が正しく表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('総試合数: 100試合')).toBeInTheDocument();

      // 【検証項目】: 勝数が正しく表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('勝数: 60勝')).toBeInTheDocument();

      // 【検証項目】: 敗数が正しく表示される
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('敗数: 40敗')).toBeInTheDocument();

      // 【検証項目】: 勝率が正しく表示される（小数点第1位まで）
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('勝率: 60.0%')).toBeInTheDocument();
    });

    it('TC-OVERALL-002: 勝率が小数点第1位まで正しく表示される', () => {
      // 【テスト目的】: 勝率の数値フォーマットが仕様通りであることを確認
      // 【テスト内容】: 小数点以下の桁数が第1位まで表示されることをテスト
      // 【期待される動作】: toFixed(1)メソッドにより、常に小数点第1位まで表示される
      // 🔵 信頼性レベル: REQ-203に基づく

      // 【テストデータ準備】: 小数点以下の桁数が多い勝率データを用意
      const mockStats = {
        totalGames: 33,
        wins: 20,
        losses: 13,
        winRate: 60.60606060606061,
      };

      render(<OverallStats stats={mockStats} />);

      // 【検証項目】: 勝率が小数点第1位まで表示される（60.6%）
      // 🔵 信頼性レベル: REQ-203に基づく
      expect(screen.getByText('勝率: 60.6%')).toBeInTheDocument();
    });

    it('TC-OVERALL-003: カード形式のレイアウトが正しく適用される', () => {
      // 【テスト目的】: レスポンシブデザインのクラス適用を確認
      // 【テスト内容】: grid grid-cols-2 md:grid-cols-4 gap-4クラスが正しく適用される
      // 【期待される動作】: モバイル: 2列、PC: 4列のグリッドレイアウト
      // 🔵 信頼性レベル: REQ-203、UIデザイン仕様に基づく

      const mockStats = {
        totalGames: 100,
        wins: 60,
        losses: 40,
        winRate: 60.0,
      };

      const { container } = render(<OverallStats stats={mockStats} />);

      // 【検証項目】: グリッドコンテナが存在する
      // 🔵 信頼性レベル: UIデザイン仕様に基づく
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();

      // 【検証項目】: グリッドコンテナに正しいクラスが適用されている
      // 🔵 信頼性レベル: UIデザイン仕様に基づく
      expect(gridContainer).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4', 'gap-4');

      // 【検証項目】: カードが4つ存在する
      // 🔵 信頼性レベル: REQ-203に基づく
      const cards = container.querySelectorAll('.border.rounded');
      expect(cards).toHaveLength(4);
    });
  });
});
