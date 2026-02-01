import { NavLink } from 'react-router-dom';

export function Navigation() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex space-x-2 py-3">
          <NavLink to="/" className={linkClass} data-testid="nav-battle-log">
            対戦履歴
          </NavLink>
          <NavLink to="/statistics" className={linkClass} data-testid="nav-statistics">
            統計
          </NavLink>
          <NavLink to="/import" className={linkClass}>
            インポート
          </NavLink>
          <NavLink to="/decks" className={linkClass} data-testid="nav-deck-management">
            デッキ管理
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
