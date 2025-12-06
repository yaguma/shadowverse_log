import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
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
        'src/types/**',
        'src/libs/**',
      ],
    },
  },
});
