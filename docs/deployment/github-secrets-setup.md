# GitHub Secrets 設定ガイド

このドキュメントでは、CI/CDパイプラインを動作させるために必要なGitHub Secretsの設定方法を説明します。

## 必要なSecrets一覧

| Secret名 | 説明 | 取得場所 |
|----------|------|----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン | Cloudflare Dashboard |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID | Cloudflare Dashboard |
| `VITE_API_URL` | バックエンドAPIのURL | Workers URL |

## 1. Cloudflare API Token の取得

### 1.1 Cloudflare Dashboard にアクセス

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 右上のプロフィールアイコン → **My Profile** をクリック
3. 左メニューの **API Tokens** をクリック

### 1.2 API Token の作成

1. **Create Token** ボタンをクリック
2. **Custom token** の **Get started** をクリック
3. 以下の設定で作成:

| 設定項目 | 値 |
|----------|-----|
| Token name | `GitHub Actions - Shadowverse Battle Log` |
| Permissions | Account - Cloudflare Pages - Edit |
| | Account - Cloudflare Workers Scripts - Edit |
| | Account - D1 - Edit |
| | Zone - Zone - Read (カスタムドメイン使用時) |
| Account Resources | Include - Your Account |
| Zone Resources | Include - All zones (カスタムドメイン使用時) |

4. **Continue to summary** → **Create Token**
5. 表示されたトークンをコピー（**一度しか表示されません**）

## 2. Cloudflare Account ID の取得

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左メニューの **Workers & Pages** をクリック
3. 右サイドバーの **Account ID** をコピー

または、任意のドメインの概要ページ右下にも表示されています。

## 3. VITE_API_URL の設定

Cloudflare Workersにデプロイ後、以下の形式でURLが提供されます:

- 開発環境: `https://shadowverse-battle-log-api.your-subdomain.workers.dev`
- 本番環境: `https://api.shadowverse-log.example.com` (カスタムドメイン設定時)

## 4. GitHub Secrets の登録

### 4.1 リポジトリの Settings にアクセス

1. GitHubリポジトリのページを開く
2. **Settings** タブをクリック
3. 左メニューの **Secrets and variables** → **Actions** をクリック

### 4.2 Secrets の追加

1. **New repository secret** ボタンをクリック
2. 以下の3つのSecretを追加:

#### CLOUDFLARE_API_TOKEN
```
Name: CLOUDFLARE_API_TOKEN
Secret: (取得したAPIトークン)
```

#### CLOUDFLARE_ACCOUNT_ID
```
Name: CLOUDFLARE_ACCOUNT_ID
Secret: (取得したアカウントID)
```

#### VITE_API_URL
```
Name: VITE_API_URL
Secret: https://shadowverse-battle-log-api.your-subdomain.workers.dev
```

## 5. Environment の設定（オプション）

### 5.1 Staging Environment

1. **Settings** → **Environments** → **New environment**
2. Name: `staging`
3. **Environment secrets** で以下を設定:
   - `CLOUDFLARE_API_TOKEN` (同じ値でOK)
   - `CLOUDFLARE_ACCOUNT_ID` (同じ値でOK)

### 5.2 Production Environment

1. **Settings** → **Environments** → **New environment**
2. Name: `production`
3. **Deployment protection rules**:
   - ✅ Required reviewers (本番デプロイ前にレビュー必須にする場合)
4. **Environment secrets** で以下を設定:
   - `CLOUDFLARE_API_TOKEN` (同じ値でOK)
   - `CLOUDFLARE_ACCOUNT_ID` (同じ値でOK)

## 6. Cloudflare Workers Secrets の設定

Cloudflare Access認証に必要なSecretをWrangler CLIで設定します:

```bash
# 本番環境
cd backend
pnpm exec wrangler secret put CF_ACCESS_AUD --env production

# ステージング環境
pnpm exec wrangler secret put CF_ACCESS_AUD --env staging
```

プロンプトが表示されたら、Cloudflare AccessのApplication Audience (AUD) Tagを入力してください。

## 7. 確認

設定完了後、以下の方法で確認できます:

### 7.1 手動ワークフロー実行

1. GitHubリポジトリの **Actions** タブを開く
2. **Deploy to Cloudflare** ワークフローを選択
3. **Run workflow** ボタンをクリック
4. 実行結果を確認

### 7.2 プッシュによる自動実行

```bash
git add .
git commit -m "test: CI/CD pipeline verification"
git push origin main
```

## トラブルシューティング

### Error: Authentication error

- APIトークンの権限が不足している可能性があります
- トークンを再作成し、必要な権限を付与してください

### Error: Account not found

- `CLOUDFLARE_ACCOUNT_ID` が正しくない可能性があります
- Dashboardで再確認してください

### Error: Project not found

- Cloudflare Pagesのプロジェクトがまだ作成されていない可能性があります
- 初回は手動でプロジェクトを作成するか、`wrangler pages project create` を実行してください

## 関連ドキュメント

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
