import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { BattleLogListPage } from './pages/BattleLogListPage';
import { ImportDataPage } from './pages/ImportDataPage';
import { StatisticsDashboardPage } from './pages/StatisticsDashboardPage';
import { Root } from './routes/root';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <BattleLogListPage />,
      },
      {
        path: 'statistics',
        element: <StatisticsDashboardPage />,
      },
      {
        path: 'import',
        element: <ImportDataPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
