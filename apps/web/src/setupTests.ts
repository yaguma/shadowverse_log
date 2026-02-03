import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// ResizeObserverのモックを設定（Recharts対応）
// happy-dom環境ではResizeObserverが正しく動作しないため
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Rechartsのコンポーネントをモック化（happy-dom環境での無限レンダリング回避）
vi.mock('recharts', async () => {
  const React = await import('react');
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        'div',
        { className: 'recharts-responsive-container', style: { width: 400, height: 300 } },
        children
      ),
  };
});

// localStorageのモックを設定（Zustand persistミドルウェア対応）
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
};

vi.stubGlobal('localStorage', createLocalStorageMock());
