# TASK-0041: パフォーマンス最適化 - テストケース

## テストケース一覧

### 1. フロントエンド: Lazy Loading テスト

#### TC-001: ページコンポーネントのLazy Loading
- **概要**: ページコンポーネントが正しく遅延読み込みされる
- **前提条件**: アプリケーションがビルドされている
- **テストステップ**:
  1. アプリケーションを起動
  2. ルートページにアクセス
  3. ネットワークタブを確認
- **期待結果**:
  - 初期ロード時に必要なチャンクのみ読み込まれる
  - 統計ページに遷移時に追加チャンクが読み込まれる
- **優先度**: 高

#### TC-002: Suspenseフォールバック表示
- **概要**: ページ読み込み中にフォールバックUIが表示される
- **前提条件**: ネットワークが遅延している環境
- **テストステップ**:
  1. DevToolsでネットワークをSlow 3Gに設定
  2. 統計ページに遷移
- **期待結果**: 読み込み中インジケータが表示される
- **優先度**: 中

### 2. フロントエンド: バンドルサイズテスト

#### TC-003: ビルド後のバンドルサイズ確認
- **概要**: gzip圧縮後のバンドルサイズが500KB以下
- **前提条件**: 本番ビルドが完了
- **テストステップ**:
  1. `pnpm build` を実行
  2. distフォルダ内のファイルサイズを確認
- **期待結果**:
  - メインバンドル + チャンクの合計が500KB以下（gzip後）
- **優先度**: 高

#### TC-004: チャンク分割の確認
- **概要**: vendor, store, chartsが分離されている
- **前提条件**: 本番ビルドが完了
- **テストステップ**:
  1. `pnpm build` を実行
  2. 生成されたチャンクファイルを確認
- **期待結果**:
  - `vendor-*.js`: react, react-dom, react-router-domを含む
  - `store-*.js`: zustandを含む（使用時）
  - `charts-*.js`: rechartsを含む（使用時）
- **優先度**: 中

### 3. バックエンド: キャッシュミドルウェアテスト

#### TC-005: CDNキャッシュが正しく機能する
- **概要**: deck-masterエンドポイントがキャッシュされる
- **前提条件**: バックエンドが起動している
- **テストステップ**:
  1. `/api/deck-master`にGETリクエスト送信
  2. レスポンスヘッダーを確認
  3. 同じリクエストを再度送信
- **期待結果**:
  - `Cache-Control: public, max-age=300`ヘッダーが設定
  - 2回目のリクエストはキャッシュから返却
- **優先度**: 高

#### TC-006: キャッシュTTLの確認
- **概要**: キャッシュが指定時間後に無効化される
- **前提条件**: バックエンドが起動している
- **テストステップ**:
  1. `/api/deck-master`にGETリクエスト送信
  2. 5分待機
  3. 同じリクエストを再度送信
- **期待結果**: キャッシュが再生成される
- **優先度**: 低

### 4. バックエンド: D1クエリ最適化テスト

#### TC-007: インデックスの存在確認
- **概要**: 複合インデックスが作成されている
- **前提条件**: マイグレーションが実行済み
- **テストステップ**:
  1. D1データベースに接続
  2. インデックス一覧を取得
- **期待結果**:
  - `idx_battle_logs_user_date`が存在
  - `idx_battle_logs_user_type_result`が存在
  - `idx_my_decks_user_active`が存在
- **優先度**: 高

#### TC-008: クエリ実行計画の確認
- **概要**: インデックスが正しく使用されている
- **前提条件**: インデックスが作成済み
- **テストステップ**:
  1. EXPLAINコマンドでクエリ実行計画を取得
- **期待結果**: インデックススキャンが使用される
- **優先度**: 中

### 5. パフォーマンス計測テスト

#### TC-009: 初期ロード時間の計測
- **概要**: 初期ロード時間が1秒以下
- **前提条件**: 本番ビルドがデプロイ済み
- **テストステップ**:
  1. Lighthouseでパフォーマンス計測
  2. First Contentful Paintを確認
- **期待結果**: FCP < 1秒
- **優先度**: 高

#### TC-010: APIレスポンスタイムの計測
- **概要**: APIレスポンスタイムが100ms以下
- **前提条件**: バックエンドがデプロイ済み
- **テストステップ**:
  1. `/api/deck-master`に100回リクエスト
  2. 平均レスポンスタイムを計算
- **期待結果**: 平均 < 100ms
- **優先度**: 高

## 自動テストファイル

### フロントエンドテスト

```typescript
// frontend/src/performance.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('パフォーマンス最適化テスト', () => {
  describe('バンドルサイズ', () => {
    it('総バンドルサイズが500KB以下であること', () => {
      const distPath = path.join(__dirname, '../../dist/assets');
      const files = fs.readdirSync(distPath);
      let totalSize = 0;

      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.css')) {
          const stat = fs.statSync(path.join(distPath, file));
          totalSize += stat.size;
        }
      }

      // gzip圧縮で約30%になると想定
      const estimatedGzipSize = totalSize * 0.3;
      expect(estimatedGzipSize).toBeLessThan(500 * 1024);
    });
  });
});
```

### バックエンドテスト

```typescript
// backend/src/middleware/cache.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { cacheMiddleware } from './cache';

describe('CDNキャッシュミドルウェア', () => {
  it('Cache-Controlヘッダーが設定されること', async () => {
    const app = new Hono();
    app.get('/test', cacheMiddleware(300), (c) => c.json({ data: 'test' }));

    const res = await app.request('/test');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('指定したTTLが適用されること', async () => {
    const app = new Hono();
    app.get('/test', cacheMiddleware(600), (c) => c.json({ data: 'test' }));

    const res = await app.request('/test');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=600');
  });
});
```

### インデックステスト

```sql
-- テスト用SQLクエリ
-- インデックスの存在確認
SELECT name FROM sqlite_master
WHERE type='index' AND name LIKE 'idx_%';

-- 期待される結果:
-- idx_battle_logs_user_date
-- idx_battle_logs_user_type_result
-- idx_my_decks_user_active
```

## テスト優先度

| 優先度 | テストケース数 |
|--------|----------------|
| 高 | 6 |
| 中 | 3 |
| 低 | 1 |
