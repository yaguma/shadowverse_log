import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Root } from './routes/root';
import './index.css';

/**
 * Lazy Loading ページコンポーネント
 *
 * TASK-0041: パフォーマンス最適化
 * ページを遅延読み込みすることで初期バンドルサイズを削減
 */
const BattleLogListPage = lazy(() =>
  import('./pages/BattleLogListPage').then((module) => ({
    default: module.BattleLogListPage,
  }))
);

const StatisticsDashboardPage = lazy(() =>
  import('./pages/StatisticsDashboardPage').then((module) => ({
    default: module.StatisticsDashboardPage,
  }))
);

const ImportDataPage = lazy(() =>
  import('./pages/ImportDataPage').then((module) => ({
    default: module.ImportDataPage,
  }))
);

/**
 * ローディングコンポーネント
 * Suspenseのフォールバックとして使用
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span className="ml-2 text-gray-600">読み込み中...</span>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BattleLogListPage />
          </Suspense>
        ),
      },
      {
        path: 'statistics',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <StatisticsDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'import',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ImportDataPage />
          </Suspense>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
