/**
 * 勝率ゲージコンポーネント
 * 半円型のプログレスバーで勝率を視覚的に表示
 * 【パフォーマンス】: React.memoとuseMemoでメモ化
 */

import { memo, useMemo } from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

interface WinRateGaugeProps {
  /** 勝率（0-100） */
  winRate: number;
  /** 総試合数 */
  totalGames: number;
  /** 勝数 */
  wins: number;
  /** 敗数 */
  losses: number;
}

/**
 * 勝率に応じた色を返す
 */
function getColorByWinRate(rate: number): string {
  if (rate >= 60) return '#10b981'; // 緑（エメラルド）
  if (rate >= 50) return '#3b82f6'; // 青（プライマリ）
  if (rate >= 40) return '#f59e0b'; // オレンジ（アンバー）
  return '#ef4444'; // 赤
}

/**
 * 勝率ゲージコンポーネント
 * 【パフォーマンス】: React.memoでメモ化し、親コンポーネントの再レンダリング時に不要な再描画を防止
 */
export const WinRateGauge = memo(function WinRateGauge({
  winRate,
  totalGames,
  wins,
  losses,
}: WinRateGaugeProps) {
  // 【パフォーマンス】: useMemoでデータ変換をメモ化
  const data = useMemo(
    () => [
      {
        name: '勝率',
        value: winRate,
        fill: getColorByWinRate(winRate),
      },
    ],
    [winRate]
  );

  // 背景用のデータ（常に100%） - 定数なのでメモ化不要
  const backgroundData = useMemo(
    () => [
      {
        name: 'background',
        value: 100,
        fill: '#e5e7eb', // グレー
      },
    ],
    []
  );

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={16}
            data={backgroundData}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar dataKey="value" cornerRadius={10} isAnimationActive={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="100%"
              innerRadius="60%"
              outerRadius="90%"
              barSize={16}
              data={data}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
              <RadialBar dataKey="value" cornerRadius={10} isAnimationActive={false} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        {/* 中央のテキスト */}
        <div className="absolute bottom-0 left-0 right-0 text-center pb-2">
          <p className="text-4xl font-bold" style={{ color: getColorByWinRate(winRate) }}>
            {winRate.toFixed(1)}%
          </p>
        </div>
      </div>
      {/* 詳細情報 */}
      <div className="text-center mt-2">
        <p className="text-lg text-gray-700">
          {totalGames}試合 ({wins}勝 {losses}敗)
        </p>
      </div>
    </div>
  );
});
