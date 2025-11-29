import type { Config } from 'drizzle-kit';

/**
 * Drizzle Studio ローカル設定
 * ローカルD1データベースに直接接続するための設定
 *
 * 使用方法:
 *   pnpm run db:studio:local
 */
export default {
  schema: './src/db/schema/*.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/5d04c0db617f7a1b9fad11e55b3b6b02e6c59aead377993d5a549c48bb6ccec7.sqlite',
  },
} satisfies Config;
