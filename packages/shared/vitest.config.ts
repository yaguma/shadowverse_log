import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts', 'src/**/__tests__/**'],
    },
  },
});
