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
        'src/services/d1-*.ts',
        'src/utils/parser.ts',
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
        'src/services/importService.ts',
        'src/services/battleLogService.ts',
        'src/services/deckMasterService.ts',
        'src/services/statisticsService.ts',
        'src/services/index.ts',
        'src/storage/**',
        'src/types/**',
        'src/utils/idGenerator.ts',
        'src/utils/sanitize.ts',
        'src/utils/validation.ts',
        'src/utils/index.ts',
        'src/libs/**',
      ],
    },
  },
});
