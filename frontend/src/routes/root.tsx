import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Navigation } from '../components/layout/Navigation';

export function Root() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
