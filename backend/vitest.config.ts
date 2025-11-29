import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/_legacy/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/db/**/*.ts',
        'src/migration/**/*.ts',
        'src/routes/**/*.ts',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/index.ts',
        // Azure Functions legacy code
        'src/createBattleLog/**',
        'src/deleteBattleLog/**',
        'src/getBattleLogs/**',
        'src/getStatistics/**',
        'src/health/**',
        'src/importData/**',
        'src/services/**',
        'src/storage/**',
        'src/types/**',
        'src/utils/**',
        'src/libs/**',
      ],
    },
  },
});
