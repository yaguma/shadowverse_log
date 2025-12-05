/**
 * 先攻後攻比較チャートコンポーネント
 * 横向き棒グラフで先攻・後攻の勝率を比較表示
 */

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TurnStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface TurnComparisonChartProps {
  /** 先攻の統計 */
  first: TurnStats;
  /** 後攻の統計 */
  second: TurnStats;
}

/**
 * 先攻後攻比較チャートコンポーネント
 */
export function TurnComparisonChart({ first, second }: TurnComparisonChartProps) {
  const data = [
    {
      name: '先攻',
      winRate: first.winRate,
      totalGames: first.totalGames,
      wins: first.wins,
      losses: first.losses,
      fill: '#3b82f6', // 青
    },
    {
      name: '後攻',
      winRate: second.winRate,
      totalGames: second.totalGames,
      wins: second.wins,
      losses: second.losses,
      fill: '#ef4444', // 赤
    },
  ];

  // カスタムツールチップ
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: (typeof data)[0] }>;
  }) => {
    if (active && payload && payload.length > 0 && payload[0]) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-bold text-gray-800">{item.name}</p>
          <p className="text-sm text-gray-600">
            勝率: <span className="font-semibold">{item.winRate.toFixed(1)}%</span>
          </p>
          <p className="text-sm text-gray-600">
            {item.totalGames}試合 ({item.wins}勝 {item.losses}敗)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 60, left: 40, bottom: 10 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 14, fontWeight: 500 }}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          <Bar dataKey="winRate" radius={[0, 8, 8, 0]} barSize={30}>
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="winRate"
              position="right"
              formatter={(value) => {
                if (typeof value === 'number') return `${value.toFixed(1)}%`;
                if (typeof value === 'string') return `${value}%`;
                return '';
              }}
              style={{ fontSize: 14, fontWeight: 600, fill: '#374151' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* 詳細情報 */}
      <div className="flex justify-around mt-2 text-sm text-gray-600">
        <div className="text-center">
          <span
            className="inline-block w-3 h-3 rounded-sm mr-1"
            style={{ backgroundColor: '#3b82f6' }}
          />
          先攻: {first.totalGames}試合 ({first.wins}勝 {first.losses}敗)
        </div>
        <div className="text-center">
          <span
            className="inline-block w-3 h-3 rounded-sm mr-1"
            style={{ backgroundColor: '#ef4444' }}
          />
          後攻: {second.totalGames}試合 ({second.wins}勝 {second.losses}敗)
        </div>
      </div>
    </div>
  );
}
