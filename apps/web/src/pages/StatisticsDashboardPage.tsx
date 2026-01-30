/**
 * 🔵 REQ-201, REQ-202, REQ-203: Statistics Dashboard Page
 *
 * 【機能概要】: 統計ダッシュボードページ - 対戦履歴の集計・分析を表示
 * 【主要機能】:
 *   - 期間選択機能（デフォルト: 過去7日間）
 *   - 全体統計、デッキ別統計、ランク帯別統計、先攻後攻別統計の表示
 *   - ローディング状態、エラー状態、空データ状態の管理
 * 【設計方針】:
 *   - useState による単純な State 管理（将来的に Zustand への移行を検討）
 *   - useEffect による自動データ取得（期間変更時に即座に反映）
 *   - コンポーネント分離による関心の分離とテスト容易性の確保
 * 【パフォーマンス考慮】:
 *   - API 呼び出しは useEffect で管理（必要最小限の呼び出し）
 *   - 条件付きレンダリングによる不要な描画の削減
 */

import { useCallback, useEffect, useState } from 'react';
import { apiClient, extractErrorMessage } from '../api/client';
import { fetchAvailableSeasons } from '../api/statistics';
import { DeckStatsTable } from '../components/statistics/DeckStatsTable';
import { EmptyState } from '../components/statistics/EmptyState';
import { StatisticsError } from '../components/statistics/Error';
import { Loading } from '../components/statistics/Loading';
import { OpponentClassPieChart } from '../components/statistics/OpponentClassPieChart';
import { OpponentDeckPieChart } from '../components/statistics/OpponentDeckPieChart';
import { OverallStats } from '../components/statistics/OverallStats';
import { PeriodSelector } from '../components/statistics/PeriodSelector';
import { RankStatsTable } from '../components/statistics/RankStatsTable';
import { SeasonSelector } from '../components/statistics/SeasonSelector';
import { TurnStats } from '../components/statistics/TurnStats';
import type { StatisticsResponse } from '../types';

/**
 * 🔵 REQ-201: Statistics Dashboard Page Component
 *
 * 統計情報を表示するページコンポーネント
 */
export function StatisticsDashboardPage() {
  // 🔵 State管理: 期間選択、シーズン選択、統計データ、ローディング状態、エラー状態
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [season, setSeason] = useState<number | undefined>(undefined); // シーズンフィルタ
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]); // 利用可能なシーズン一覧
  const [isSeasonsLoading, setIsSeasonsLoading] = useState<boolean>(false); // シーズン一覧読み込み中
  const [isSeasonInitialized, setIsSeasonInitialized] = useState<boolean>(false); // シーズン初期化完了フラグ
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 【初期化処理】: シーズン一覧と最新シーズンを取得して設定
   * 🔵 REQ-202: 統計ダッシュボードのデフォルト表示
   * 🔵 TASK-0028: シーズン選択UI実装
   * 【実行タイミング】: コンポーネント初回マウント時（依存配列が空のため1回のみ）
   * 【設計意図】: シーズン一覧を取得してドロップダウン表示、最新シーズンをデフォルト選択
   * 【実装詳細】:
   *   - 日付範囲は空のまま（全期間を対象）
   *   - シーズン一覧をAPIから取得して設定
   *   - 最新シーズン（一覧の先頭）を自動選択
   *   - 初期化完了フラグを設定して、統計取得のタイミングを制御
   */
  useEffect(() => {
    let isMounted = true;

    const initializeSeasons = async () => {
      setIsSeasonsLoading(true);
      try {
        // 【シーズン一覧取得】: ドロップダウン表示用
        const seasons = await fetchAvailableSeasons();
        if (isMounted) {
          setAvailableSeasons(seasons);
          // 【最新シーズン自動選択】: 一覧の先頭が最新シーズン
          if (seasons.length > 0) {
            setSeason(seasons[0]);
          }
          setIsSeasonsLoading(false);
          setIsSeasonInitialized(true);
        }
      } catch (err) {
        // シーズン一覧取得に失敗した場合は、従来のAPIで最新シーズンのみ取得を試みる
        console.warn('Failed to fetch seasons list:', err);
        try {
          const data = await apiClient.get<{ latestSeason: number | null }>(
            '/battle-logs/latest-season'
          );
          if (isMounted) {
            if (data.latestSeason) {
              setSeason(data.latestSeason);
            }
            setIsSeasonsLoading(false);
            setIsSeasonInitialized(true);
          }
        } catch (fallbackErr) {
          console.warn('Failed to fetch latest season:', fallbackErr);
          if (isMounted) {
            setIsSeasonsLoading(false);
            setIsSeasonInitialized(true);
          }
        }
      }
    };
    initializeSeasons();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * 【統計データ取得関数】: Backend API から統計情報を取得
   * 🔵 REQ-203: 統計情報の表示機能
   * 【機能概要】: GET /api/statistics エンドポイントから統計データを取得し、State に反映
   * 【エラーハンドリング】:
   *   - ネットワークエラー: デフォルトメッセージを表示し、再試行を促す
   *   - サーバーエラー: API レスポンスのエラーメッセージを表示
   * 【State管理】:
   *   - ローディング状態の適切な管理（開始→完了/エラー）
   *   - エラー状態のクリア（再試行時に前回のエラーをリセット）
   * 【パフォーマンス】:
   *   - 非同期処理による UI ブロックの回避
   *   - try-catch-finally による確実なローディング状態のクリア
   *   - useCallback によるメモ化で不要な再レンダリングを防止
   */
  const fetchStatistics = useCallback(async () => {
    // 【ローディング開始】: API 呼び出し開始を UI に通知
    // エラー状態をクリアして、前回のエラーメッセージを削除
    setIsLoading(true);
    setError(null);

    try {
      // 【API呼び出し】: Backend 統計 API を呼び出し
      // クエリパラメータ: startDate, endDate（YYYY-MM-DD 形式）, season（シーズン番号）
      // レスポンス: StatisticsResponse 型（overall, byMyDeck, byOpponentDeck, byRank, byTurn）
      const seasonParam = season ? `&season=${season}` : '';
      const data = await apiClient.get<StatisticsResponse>(
        `/statistics?startDate=${startDate}&endDate=${endDate}${seasonParam}`
      );

      // 【成功時処理】: 取得した統計データを State に保存
      // これにより、条件付きレンダリングが発火し、統計情報が画面に表示される
      setStatistics(data);
    } catch (err) {
      // 【エラー時処理】: エラーメッセージを抽出して State に保存
      // extractErrorMessage: API エラーまたはネットワークエラーから適切なメッセージを抽出
      // デフォルトメッセージ: ネットワークエラーの可能性を示唆
      setError(extractErrorMessage(err, 'ネットワークエラーが発生しました'));
    } finally {
      // 【ローディング終了】: 成功・失敗に関わらずローディング状態を解除
      // finally ブロックにより、エラー時も確実にローディングを終了
      setIsLoading(false);
    }
  }, [startDate, endDate, season]);

  /**
   * 【フィルタ変更時の自動データ取得】: 日付またはシーズンが変更されたら統計を再取得
   * 🔵 REQ-202: 期間選択機能
   * 【実行タイミング】: startDate, endDate, season の State が変更された時
   * 【設計意図】:
   *   - フィルタ条件を変更すると即座に統計が更新される
   *   - 日付範囲が空でもシーズンが設定されていれば取得可能
   * 【実装詳細】:
   *   - シーズン初期化完了後にのみ統計を取得（二重呼び出し防止）
   *   - シーズンが設定されているか、日付範囲が設定されている場合に API 呼び出し
   *   - fetchStatistics 関数は useCallback でメモ化されているため、依存配列に含めても問題なし
   * 【パフォーマンス考慮】:
   *   - 🟡 将来的にデバウンス処理の追加を検討
   */
  useEffect(() => {
    // 【初期化待機】: シーズンの初期化が完了するまで統計取得をスキップ
    // これにより、StrictModeでの二重呼び出しや初期化前の無駄なAPI呼び出しを防止
    if (!isSeasonInitialized) return;

    // 【API呼び出し】: シーズン初期化完了後は必ず統計を取得
    // シーズンがnullの場合（データがない場合）でも全期間の統計を表示
    fetchStatistics();
  }, [fetchStatistics, isSeasonInitialized]);

  /**
   * 【検索ボタンクリックハンドラ】: 期間選択フォームの「検索」ボタン処理
   * 🟡 現在は useEffect による自動取得のため、実質的に何もしない
   * 【設計意図】:
   *   - 将来的なバリデーション処理の追加を想定したプレースホルダー
   *   - 検索ボタンの存在により、ユーザーに明示的なアクションを提供
   * 【将来の拡張候補】:
   *   - 日付バリデーション（startDate <= endDate, 未来日付禁止）
   *   - 手動検索モード（useEffect を無効化し、ボタンクリック時のみ取得）
   */
  const handleSearch = () => {
    // 🟡 useEffect で自動的に fetchStatistics が呼ばれるため、ここでは何もしない
    // 🟡 将来的にバリデーションロジックを追加する可能性あり
  };

  /**
   * 【再試行ハンドラ】: エラー時の「再試行」ボタン処理
   * 🔵 エラーハンドリング: ネットワークエラーやサーバーエラーからの復旧機能
   * 【機能概要】: エラー表示コンポーネントの「再試行」ボタンから呼び出される
   * 【実装詳細】:
   *   - fetchStatistics 関数を再実行
   *   - ローディング状態とエラー状態は fetchStatistics 内で管理される
   * 【ユーザビリティ】:
   *   - 一時的なネットワークエラー後に、ページをリロードせずに復旧可能
   *   - エラーメッセージがクリアされ、新たなローディング状態が表示される
   */
  const handleRetry = () => {
    fetchStatistics();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 🔵 ページヘッダー */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">統計ダッシュボード</h2>

      {/* 🔵 REQ-202: 期間選択フォーム */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <PeriodSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          {/* 🔵 TASK-0028: シーズンフィルタ（ドロップダウン表示） */}
          <SeasonSelector
            season={season}
            onSeasonChange={setSeason}
            isLoading={isLoading}
            availableSeasons={availableSeasons}
            isSeasonsLoading={isSeasonsLoading}
          />
        </div>
      </div>

      {/* 🔵 REQ-502: ローディング状態 */}
      {isLoading && <Loading />}

      {/* 🔵 エラー状態 */}
      {!isLoading && error && <StatisticsError message={error} onRetry={handleRetry} />}

      {/* 🔵 REQ-405: データなし状態 */}
      {!isLoading && !error && statistics && statistics.overall.totalGames === 0 && <EmptyState />}

      {/* 🔵 REQ-203: 統計情報表示 */}
      {!isLoading && !error && statistics && statistics.overall.totalGames > 0 && (
        <div className="space-y-6">
          {/* === グラフィカルエリア（優先表示） === */}

          {/* 🔵 全体統計（勝率ゲージ） */}
          <OverallStats stats={statistics.overall} />

          {/* 🔵 先攻後攻別統計（棒グラフ） */}
          <TurnStats turnStats={statistics.byTurn} />

          {/* 🔵 相手クラス分布（円グラフ） */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">相手クラス分布</h3>
            <OpponentClassPieChart data={statistics.byOpponentClass} />
          </div>

          {/* 🔵 相手デッキ分布（円グラフ） */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">相手デッキ分布</h3>
            <OpponentDeckPieChart data={statistics.byOpponentDeck} />
          </div>

          {/* === テーブルエリア（下部に配置、削除しやすく） === */}
          <div className="border-t-2 border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-600">詳細統計（テーブル）</h3>

            {/* 🔵 デッキ別統計（マイデッキ） */}
            <DeckStatsTable title="マイデッキ別統計" deckStats={statistics.byMyDeck} />

            {/* 🔵 デッキ別統計（相手デッキ） */}
            <DeckStatsTable title="相手デッキ別統計" deckStats={statistics.byOpponentDeck} />

            {/* 🔵 ランク帯別統計 */}
            <RankStatsTable rankStats={statistics.byRank} />
          </div>
        </div>
      )}
    </div>
  );
}
