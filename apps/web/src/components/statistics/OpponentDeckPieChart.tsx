/**
 * 【機能概要】: 対戦相手デッキ分布円グラフコンポーネント
 * 【実装方針】: TDD Greenフェーズの最小実装、Rechartsを使用してシンプルに実装
 * 【テスト対応】: OpponentDeckPieChart.test.tsxの全テストケースを通すための実装
 * 【パフォーマンス】: React.memoとuseMemoでメモ化
 * 🔵 信頼性レベル: REQ-GRAPH-001〜012に基づいた実装
 */

import { memo, useMemo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatisticsResponse } from '../../types';

/**
 * 【型定義】: OpponentDeckPieChartコンポーネントのプロパティ
 * 【実装方針】: StatisticsResponse['byOpponentDeck']型をそのまま受け取る
 * 🔵 信頼性レベル: 既存のStatisticsResponse型定義に基づく
 */
interface OpponentDeckPieChartProps {
  /** 【プロパティ】: 相手デッキ統計データ配列 */
  data: StatisticsResponse['byOpponentDeck'];
}

/**
 * 【型定義】: 円グラフ用のデータ形式
 * 【実装方針】: Rechartsが要求する形式に変換した後のデータ型
 * 🔵 信頼性レベル: Recharts公式ドキュメントに基づく
 */
interface PieChartData {
  /** 【フィールド】: 表示用の名前（デッキ名: X回） */
  name: string;
  /** 【フィールド】: 対戦回数（グラフの値） */
  value: number;
  /** 【フィールド】: 元のデッキ名 */
  deckName: string;
  /** 【インデックスシグネチャ】: Rechartsの型定義要件を満たすため */
  [key: string]: string | number;
}

/**
 * 【カラーパレット定義】: 色覚多様性に配慮したカラーパレット
 * 【実装方針】: ColorBrewer2のSet2パレットを参考に、20色以上のカラーパレットを定義
 * 【改善内容】: 重複色（19番目のティール）を削除し、ユニークな色のみを使用
 * 【テスト対応】: TC-GRAPH-002の異なる色で表示されることを満たすため
 * 🔵 信頼性レベル: REQ-GRAPH-005、NFR-GRAPH-302に基づく
 */
const DECK_COLORS = [
  '#3b82f6', // 青
  '#ef4444', // 赤
  '#10b981', // 緑
  '#f59e0b', // オレンジ
  '#8b5cf6', // 紫
  '#ec4899', // ピンク
  '#14b8a6', // ティール
  '#f97316', // 濃いオレンジ
  '#6366f1', // インディゴ
  '#84cc16', // ライム
  '#06b6d4', // シアン
  '#d946ef', // マゼンタ
  '#eab308', // 黄色
  '#64748b', // スレート
  '#22c55e', // エメラルド
  '#a855f7', // バイオレット
  '#0ea5e9', // スカイ
  '#f43f5e', // ローズ
  '#fb923c', // オレンジ（明るめ）
  '#4ade80', // グリーン（明るめ）
  '#c084fc', // パープル（明るめ）
  '#38bdf8', // ライトブルー
  '#fb7185', // ライトピンク
  '#fbbf24', // アンバー
  '#14532d', // ダークグリーン（追加）
];

/**
 * 【機能概要】: 対戦相手デッキ分布円グラフコンポーネント
 * 【実装方針】: Rechartsの<PieChart>を使用して最小限の実装
 * 【改善内容】: Refactorフェーズで以下を改善
 *   - カラーパレットの重複削除（品質向上）
 *   - エラーログの環境変数制御（セキュリティ強化）
 *   - 日本語コメントの充実（保守性向上）
 *   - React.memoとuseMemoでメモ化（パフォーマンス向上）
 * 【設計方針】: 単一責任原則（円グラフ表示のみに特化）
 * 【パフォーマンス】: O(n)の時間計算量で効率的（nはデッキ数）、React.memoで不要な再レンダリングを防止
 * 【保守性】: 詳細な日本語コメントで将来の変更を容易化
 * 【テスト対応】: TC-GRAPH-001〜014の全テストケースを通すための実装
 * 🔵 信頼性レベル: REQ-GRAPH-001〜012、EDGE-GRAPH-001〜002に基づく
 *
 * @param props - コンポーネントのプロパティ
 * @param props.data - 相手デッキ統計データ配列（StatisticsResponse['byOpponentDeck']型）
 * @returns 円グラフコンポーネント、または空データ/エラー時のフォールバック表示
 */
export const OpponentDeckPieChart = memo(function OpponentDeckPieChart({
  data,
}: OpponentDeckPieChartProps) {
  // 【入力値検証】: データが空配列、null、undefinedの場合の早期リターン
  // 【テスト対応】: TC-GRAPH-009（空データ時のフォールバック表示）を満たすため
  // 🟡 信頼性レベル: REQ-GRAPH-101から妥当な推測
  if (!data || data.length === 0) {
    // 【エラー処理】: 空データ時にユーザーフレンドリーなメッセージを表示
    // 【テスト要件対応】: TC-GRAPH-009で期待される「この期間にはデータがありません」を返却
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">この期間にはデータがありません</p>
      </div>
    );
  }

  // 【データバリデーション】: 不正なデータ形式をフィルタリング
  // 【テスト対応】: TC-GRAPH-011（不正データ形式のエラーハンドリング）を満たすため
  // 🟡 信頼性レベル: EDGE-GRAPH-002から妥当な推測
  const validData = data.filter((item) => {
    // 【バリデーション条件】: 必須フィールドが存在し、型が正しいことを確認
    return (
      item &&
      typeof item.deckId === 'string' &&
      typeof item.deckName === 'string' &&
      typeof item.totalGames === 'number' &&
      item.totalGames > 0
    );
  });

  // 【データ整合性チェック】: バリデーション後のデータが空の場合のエラーハンドリング
  // 【テスト対応】: TC-GRAPH-011で期待される動作
  // 🟡 信頼性レベル: EDGE-GRAPH-002から妥当な推測
  if (validData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">データ形式が不正です</p>
      </div>
    );
  }

  // 【データ変換処理】: StatisticsResponse['byOpponentDeck']をRechartsのPieChartData形式に変換
  // 【実装内容】: deckName + totalGamesを組み合わせた表示用の名前を作成
  // 【テスト対応】: TC-GRAPH-001、TC-GRAPH-003（凡例に「デッキ名: X回」形式で表示）を満たすため
  // 🔵 信頼性レベル: REQ-GRAPH-004に基づく
  const chartData: PieChartData[] = validData.map((item) => ({
    // 【結果構造】: Rechartsが要求する形式に変換
    name: `${item.deckName}: ${item.totalGames}回`, // 【凡例表示】: 「デッキ名: X回」形式
    value: item.totalGames, // 【グラフの値】: 対戦回数をそのまま使用
    deckName: item.deckName, // 【元データ保持】: ツールチップ等で使用する可能性があるため保持
  }));

  // 【カスタム凡例レンダリング】: 凡例の表示形式をカスタマイズ
  // 【実装方針】: デフォルトのLegendコンポーネントをそのまま使用（最小限実装）
  // 【テスト対応】: TC-GRAPH-003（凡例にデッキ名と対戦回数が表示される）を満たすため
  // 🔵 信頼性レベル: REQ-GRAPH-004に基づく

  try {
    // 【実装内容】: Rechartsの<PieChart>コンポーネントを使用して円グラフを描画
    // 【テスト対応】: TC-GRAPH-001〜007の全正常系テストケースを満たすため
    // 🔵 信頼性レベル: REQ-GRAPH-001〜012に基づく
    return (
      <div role="img" aria-label="対戦相手デッキ分布" style={{ width: '100%', height: 400 }}>
        {/* 【アクセシビリティ】: role="img"でスクリーンリーダー対応 */}
        {/* 【テスト対応】: TC-GRAPH-001でgetByRole('img')でアクセスするため */}
        {/* 【スタイル設定】: テスト環境でResponsiveContainerが正しくレンダリングされるよう親要素にサイズを設定 */}
        <ResponsiveContainer width="100%" height="100%">
          {/* 【レスポンシブ対応】: ResponsiveContainerで親要素のサイズに追従 */}
          {/* 【100%サイズ】: 親divのサイズ（width: 100%, height: 400px）に合わせてレンダリング */}
          {/* 🔵 信頼性レベル: REQ-GRAPH-006〜008に基づく */}
          <PieChart width={400} height={400}>
            {/* 【円グラフ本体】: Rechartsの<Pie>コンポーネントで円グラフを描画 */}
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              label={false}
              isAnimationActive={false} // 【アニメーション無効化】: TC-GRAPH-007を満たすため
            >
              {/* 【セグメントの色設定】: 各セグメントに固定カラーパレットを適用 */}
              {/* 【テスト対応】: TC-GRAPH-002（各セグメントが異なる色で表示される）を満たすため */}
              {/* 🔵 信頼性レベル: REQ-GRAPH-005、NFR-GRAPH-302に基づく */}
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.deckName}-${index}`}
                  fill={DECK_COLORS[index % DECK_COLORS.length]}
                />
              ))}
            </Pie>
            {/* 【凡例】: デッキ名と対戦回数を表示 */}
            {/* 【テスト対応】: TC-GRAPH-003（凡例にデッキ名と対戦回数が表示される）を満たすため */}
            {/* 🔵 信頼性レベル: REQ-GRAPH-004に基づく */}
            <Legend />
            {/* 【ツールチップ】: セグメントホバー時に詳細情報を表示 */}
            {/* 【テスト対応】: TC-GRAPH-004（ツールチップのインタラクション）は今回のスコープ外 */}
            {/* 🔵 信頼性レベル: REQ-GRAPH-009〜010に基づく */}
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    // 【エラーハンドリング】: Recharts描画エラー時のエラーバウンダリ
    // 【改善内容】: 本番環境ではエラーログを抑制し、開発環境のみ出力
    // 【セキュリティ】: 本番環境でのエラー詳細の漏洩を防止
    // 【テスト対応】: TC-GRAPH-010（Recharts描画エラー時にエラーメッセージが表示される）を満たすため
    // 🟡 信頼性レベル: EDGE-GRAPH-001から妥当な推測
    if (import.meta.env.DEV) {
      // 【開発環境限定ログ】: デバッグ情報を開発者に提供
      // 【Vite環境変数】: import.meta.env.DEVで開発環境を判定
      console.error('円グラフの描画に失敗しました:', error);
    }
    return (
      <div className="text-center py-8">
        {/* 【ユーザーフレンドリー】: 技術的詳細を隠し、簡潔なメッセージを表示 */}
        <p className="text-red-600">グラフの表示に失敗しました</p>
      </div>
    );
  }
});
