/**
 * 【機能概要】: 対戦相手クラス分布円グラフコンポーネント
 * 【実装方針】: OpponentDeckPieChartを参考に、クラス別の集計を表示
 */

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatisticsResponse } from '../../types';

/**
 * 【型定義】: OpponentClassPieChartコンポーネントのプロパティ
 */
interface OpponentClassPieChartProps {
  /** 【プロパティ】: 相手クラス統計データ配列 */
  data: StatisticsResponse['byOpponentClass'];
}

/**
 * 【型定義】: 円グラフ用のデータ形式
 */
interface PieChartData {
  /** 【フィールド】: 表示用の名前（クラス名: X回） */
  name: string;
  /** 【フィールド】: 対戦回数（グラフの値） */
  value: number;
  /** 【フィールド】: 元のクラス名 */
  className: string;
  /** 【インデックスシグネチャ】: Rechartsの型定義要件を満たすため */
  [key: string]: string | number;
}

/**
 * 【カラーパレット定義】: Shadowverseのクラスカラーに基づいたパレット
 */
const CLASS_COLORS: Record<string, string> = {
  エルフ: '#22c55e', // 緑
  ロイヤル: '#eab308', // 黄色
  ウィッチ: '#3b82f6', // 青
  ドラゴン: '#f97316', // オレンジ
  ナイトメア: '#8b5cf6', // 紫
  ビショップ: '#f59e0b', // ゴールド
  ネメシス: '#64748b', // グレー
  Unknown: '#9ca3af', // ライトグレー
};

/**
 * 【機能概要】: 対戦相手クラス分布円グラフコンポーネント
 */
export function OpponentClassPieChart({ data }: OpponentClassPieChartProps) {
  // 【入力値検証】: データが空配列、null、undefinedの場合の早期リターン
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">この期間にはデータがありません</p>
      </div>
    );
  }

  // 【データバリデーション】: 不正なデータ形式をフィルタリング
  const validData = data.filter((item) => {
    return (
      item &&
      typeof item.className === 'string' &&
      typeof item.totalGames === 'number' &&
      item.totalGames > 0
    );
  });

  // 【データ整合性チェック】: バリデーション後のデータが空の場合のエラーハンドリング
  if (validData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">データ形式が不正です</p>
      </div>
    );
  }

  // 【データ変換処理】: Rechartsの形式に変換
  const chartData: PieChartData[] = validData.map((item) => ({
    name: `${item.className}: ${item.totalGames}回`,
    value: item.totalGames,
    className: item.className,
  }));

  try {
    return (
      <div role="img" aria-label="対戦相手クラス分布" style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart width={400} height={400}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              label={false}
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.className}-${index}`}
                  fill={CLASS_COLORS[entry.className] || CLASS_COLORS.Unknown}
                />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('円グラフの描画に失敗しました:', error);
    }
    return (
      <div className="text-center py-8">
        <p className="text-red-600">グラフの表示に失敗しました</p>
      </div>
    );
  }
}
