# Cloudflare Access 設定ガイド

## TASK-0039: Cloudflare Access 認証設定

このドキュメントでは、Cloudflare Accessの認証設定手順を説明します。

## 前提条件

- Cloudflareアカウント
- ドメインがCloudflareに追加されていること（または workers.dev サブドメインを使用）
- Cloudflare Zero Trust（旧Cloudflare Access）が有効であること

## 設定手順

### 1. Cloudflare Zero Trust ダッシュボードにアクセス

1. [Cloudflare Dashboard](https://dash.cloudflare.com) にログイン
2. 左メニューから「Zero Trust」をクリック
3. 「Access」→「Applications」を選択

### 2. アプリケーションの追加

1. 「Add an application」をクリック
2. 「Self-hosted」を選択
3. 以下の設定を入力:

| 設定項目 | 値 |
|---------|-----|
| Application name | `Shadowverse Battle Log API` |
| Application domain | `api.your-domain.com` または `your-app.workers.dev` |
| Path | `/api/*` |
| Session duration | `24 hours`（推奨） |

### 3. 認証ポリシーの設定

1. 「Add a policy」をクリック
2. ポリシー名: `Allow authenticated users`
3. アクション: `Allow`
4. 条件設定:
   - Include: `Emails ending in` → `@example.com`（または許可するドメイン）
   - または `Login Methods` → `Google`, `GitHub` など

### 4. 認証プロバイダーの設定

#### Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. 「APIとサービス」→「認証情報」
3. 「認証情報を作成」→「OAuth クライアント ID」
4. 設定内容:

| 設定項目 | 値 |
|---------|-----|
| アプリケーションの種類 | Web アプリケーション |
| 名前 | `Shadowverse Battle Log` |
| 承認済みリダイレクトURI | `https://your-team.cloudflareaccess.com/cdn-cgi/access/callback` |

5. クライアントIDとクライアントシークレットを取得
6. Cloudflare Zero Trustに戻り、「Settings」→「Authentication」→「Login methods」
7. 「Add new」→「Google」を選択し、取得した認証情報を入力

#### GitHub OAuth設定

1. [GitHub Developer Settings](https://github.com/settings/developers) にアクセス
2. 「OAuth Apps」→「New OAuth App」
3. 設定内容:

| 設定項目 | 値 |
|---------|-----|
| Application name | `Shadowverse Battle Log` |
| Homepage URL | `https://your-app.pages.dev` |
| Authorization callback URL | `https://your-team.cloudflareaccess.com/cdn-cgi/access/callback` |

4. クライアントIDとクライアントシークレットを取得
5. Cloudflare Zero Trustで「GitHub」プロバイダーを追加

### 5. Application Audience (AUD) Tag の取得

1. Cloudflare Zero Trust ダッシュボードで作成したアプリケーションを選択
2. 「Overview」タブで「Application Audience (AUD) Tag」をコピー
3. この値を `CF_ACCESS_AUD` 環境変数に設定

### 6. チームドメインの確認

1. Cloudflare Zero Trust ダッシュボードで「Settings」→「General」
2. 「Team domain」を確認（例: `your-team.cloudflareaccess.com`）
3. この値を `CF_ACCESS_TEAM_DOMAIN` 環境変数に設定

### 7. 環境変数の設定

#### ローカル開発環境

`backend/wrangler.toml`:

```toml
[vars]
CF_ACCESS_TEAM_DOMAIN = "your-team.cloudflareaccess.com"
CF_ACCESS_AUD = "your-application-aud-tag"
ALLOWED_ORIGINS = "http://localhost:5173"
```

#### 本番環境（シークレット）

```bash
# wrangler secret コマンドで設定
wrangler secret put CF_ACCESS_TEAM_DOMAIN
# プロンプトで値を入力: your-team.cloudflareaccess.com

wrangler secret put CF_ACCESS_AUD
# プロンプトで値を入力: your-application-aud-tag

wrangler secret put ALLOWED_ORIGINS
# プロンプトで値を入力: https://your-app.pages.dev
```

### 8. JWT公開鍵エンドポイント

Cloudflare Accessは以下のエンドポイントで公開鍵を提供します:

```
https://your-team.cloudflareaccess.com/cdn-cgi/access/certs
```

このエンドポイントはJWT検証に使用されます。`auth.ts` ミドルウェアが自動的にキャッシュを行います。

## 認証フローの確認

### テスト手順

1. ブラウザで保護されたAPIにアクセス:
   ```
   https://api.your-domain.com/api/battle-logs
   ```

2. Cloudflare Accessのログイン画面が表示されることを確認

3. 許可されたプロバイダー（Google/GitHub）でログイン

4. 認証成功後、APIレスポンスが返却されることを確認

### cURLでのテスト

```bash
# JWTトークンを取得（ブラウザのDevToolsからCookieをコピー）
TOKEN="your-cf-access-jwt-assertion"

# APIリクエスト
curl -H "CF-Access-JWT-Assertion: $TOKEN" \
     https://api.your-domain.com/api/battle-logs
```

## トラブルシューティング

### 401 Unauthorized エラー

1. トークンが正しく送信されているか確認
2. `CF-Access-JWT-Assertion` ヘッダー名が正確か確認
3. トークンの有効期限を確認

### 500 Internal Server Error (AUTH_CONFIG_ERROR)

1. `CF_ACCESS_TEAM_DOMAIN` が設定されているか確認
2. `CF_ACCESS_AUD` が設定されているか確認
3. 環境変数の値が正しいか確認

### CORS エラー

1. `ALLOWED_ORIGINS` にフロントエンドのオリジンが含まれているか確認
2. 複数オリジンの場合はカンマ区切りで設定

## 関連ファイル

- `backend/wrangler.toml` - 環境変数設定
- `backend/src/middleware/auth.ts` - JWT検証ミドルウェア
- `backend/src/middleware/auth.test.ts` - ミドルウェアテスト
- `backend/src/index.ts` - アプリケーションエントリーポイント

## 参考資料

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/)
- [jose (JavaScript Object Signing and Encryption)](https://github.com/panva/jose)
