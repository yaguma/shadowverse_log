# Azure Blob Storage クイックスタートガイド

このドキュメントは、Azure Blob Storage を素早くセットアップするための簡易ガイドです。

## 前提条件チェックリスト

- [ ] Azure アカウントを持っている
- [ ] Azure CLI がインストールされている
- [ ] Azure にログイン済み (`az login`)
- [ ] 適切な権限がある (Contributor 以上)

## 最速セットアップ（自動スクリプト使用）

### ステップ 1: Azure CLI のインストールと認証

```bash
# Azure CLI のインストール確認
az --version

# Azure にログイン
az login
```

### ステップ 2: 自動セットアップスクリプトの実行

```bash
# プロジェクトルートディレクトリに移動
cd /home/syagu/work/shadowverse_log

# セットアップスクリプトを実行
./scripts/setup-azure-storage.sh
```

スクリプトが対話的に以下を実行します:
1. リソースグループの作成
2. ストレージアカウントの作成
3. Blob コンテナの作成
4. CORS の設定
5. Soft Delete の有効化
6. 初期データのアップロード
7. local.settings.json の更新

### ステップ 3: 動作確認

```bash
# バックエンドを起動
cd backend
npm install
npm start

# 別のターミナルでフロントエンドを起動
cd frontend
npm install
npm run dev
```

## 手動セットアップ（スクリプトを使用しない場合）

詳細な手動セットアップ手順は [Azure Storage セットアップガイド](./azure-storage-setup.md) を参照してください。

## トラブルシューティング

### Azure CLI がインストールされていない

**Windows:**
```bash
winget install -e --id Microsoft.AzureCLI
```

**macOS:**
```bash
brew install azure-cli
```

**Linux (Ubuntu/Debian):**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### ログインエラー

```bash
# ログアウトして再ログイン
az logout
az login

# サブスクリプションを確認
az account list --output table
az account set --subscription "<Subscription-ID>"
```

### ストレージアカウント名が既に使用されている

ストレージアカウント名は全世界で一意である必要があります。
スクリプトを再実行すると、タイムスタンプ付きの新しい名前が提案されます。

### 権限エラー

```bash
# 現在の権限を確認
az role assignment list --assignee <your-email> --output table
```

Azure サブスクリプションの所有者または管理者に連絡し、
Contributor 以上の権限を付与してもらってください。

### CORS エラー

```bash
# CORS 設定を確認
az storage cors list \
  --account-name <storage-account-name> \
  --services b
```

開発環境では `--origins "*"` を使用しますが、
本番環境では特定のドメインに制限してください。

## 接続文字列の確認

### 既存のストレージアカウントから接続文字列を取得

```bash
az storage account show-connection-string \
  --name <storage-account-name> \
  --resource-group <resource-group-name> \
  --output tsv
```

### local.settings.json に設定

`backend/local.settings.json` を編集:

```json
{
  "Values": {
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
  }
}
```

## データの確認

### Blob 一覧の表示

```bash
az storage blob list \
  --account-name <storage-account-name> \
  --container-name shadowverse-data \
  --output table
```

### ファイルのダウンロード（確認用）

```bash
az storage blob download \
  --account-name <storage-account-name> \
  --container-name shadowverse-data \
  --name battle-logs.json \
  --file battle-logs-download.json
```

## セキュリティ注意事項

### 重要: 以下のファイルは Git にコミットしないでください

- `backend/local.settings.json` (接続文字列を含む)
- `*.backup` (バックアップファイル)

`.gitignore` に以下が含まれていることを確認:

```
local.settings.json
*.backup
```

### 接続文字列の管理

- **開発環境**: `local.settings.json` で管理
- **本番環境**: Azure Functions の Application Settings で管理
- **共有する場合**: Azure Key Vault を使用

## 次のステップ

1. [Blob Storage 設計文書](./design/shadowverse-battle-log/blob-storage-design.md) を確認
2. [Azure Functions のデプロイ](./azure-functions-deployment.md) を実施（作成予定）
3. [認証機能の実装 (Phase 2)](./authentication-setup.md) を計画（作成予定）

## コスト管理

### 無料枠

- Azure 無料アカウント: 12ヶ月間の一部サービス無料
- Blob Storage: 最初の 5GB の送信データは無料

### 想定コスト

- **開発環境**: $0-1/月
- **本番環境 (小規模)**: $1-5/月

### コスト削減のヒント

- 不要なリソースは削除
- アクセス層を適切に設定 (Hot/Cool/Archive)
- 古いバージョンやバックアップの保持期間を制限

## 参考リンク

- [詳細なセットアップガイド](./azure-storage-setup.md)
- [Azure Blob Storage 公式ドキュメント](https://docs.microsoft.com/azure/storage/blobs/)
- [Azure CLI リファレンス](https://docs.microsoft.com/cli/azure/storage)
- [価格計算ツール](https://azure.microsoft.com/pricing/calculator/)

## サポート

問題が発生した場合は、以下を確認してください:

1. [トラブルシューティングセクション](#トラブルシューティング)
2. [詳細なセットアップガイド](./azure-storage-setup.md)
3. [Azure サポートページ](https://azure.microsoft.com/support/)

## 更新履歴

- **2025-10-27**: 初版作成
  - クイックスタートガイドを作成
  - 自動セットアップスクリプトの使用方法を追加
