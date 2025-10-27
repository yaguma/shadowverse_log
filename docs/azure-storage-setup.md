# Azure Blob Storage セットアップガイド

このドキュメントでは、Shadowverse Battle Log アプリケーションで使用する Azure Blob Storage のセットアップ手順を説明します。

## 前提条件

- Azure CLI がインストールされていること
- Azure サブスクリプションにアクセスできること
- 適切な権限 (Contributor 以上) があること

## Azure CLI のインストール

Azure CLI がインストールされていない場合は、以下のコマンドでインストールしてください。

### Windows

```bash
# Winget を使用
winget install -e --id Microsoft.AzureCLI

# または MSI インストーラーをダウンロード
# https://aka.ms/installazurecliwindows
```

### macOS

```bash
brew update && brew install azure-cli
```

### Linux (Ubuntu/Debian)

```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### インストール確認

```bash
az --version
```

## セットアップ手順

### 1. Azure にログイン

```bash
az login
```

ブラウザが開き、Azure アカウントでログインします。

### 2. サブスクリプションの確認と設定

```bash
# サブスクリプション一覧を表示
az account list --output table

# 使用するサブスクリプションを設定
az account set --subscription "<Your-Subscription-ID>"
```

### 3. リソースグループの作成

```bash
# 変数設定
RESOURCE_GROUP="shadowverse-rg"
LOCATION="japaneast"

# リソースグループ作成
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### 4. ストレージアカウントの作成

```bash
# 変数設定（ストレージアカウント名は全世界で一意である必要があります）
STORAGE_ACCOUNT="shadowverselogs$(date +%s)"  # タイムスタンプ付きで一意性を確保

# ストレージアカウント作成
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot

# 作成したストレージアカウント名を確認
echo "Storage Account Name: $STORAGE_ACCOUNT"
```

### 5. Blob コンテナの作成

```bash
# コンテナ作成
az storage container create \
  --name shadowverse-data \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login
```

### 6. CORS の設定

フロントエンドからの直接アクセスを許可するために CORS を設定します。

```bash
az storage cors add \
  --account-name $STORAGE_ACCOUNT \
  --services b \
  --methods GET POST PUT DELETE OPTIONS \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600
```

**本番環境での推奨設定:**

```bash
# 本番環境では特定のオリジンのみを許可
az storage cors add \
  --account-name $STORAGE_ACCOUNT \
  --services b \
  --methods GET POST PUT DELETE OPTIONS \
  --origins "https://your-frontend-domain.com" \
  --allowed-headers "Content-Type,Authorization" \
  --exposed-headers "ETag" \
  --max-age 3600
```

### 7. 接続文字列の取得

```bash
# 接続文字列を取得
az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --output tsv
```

この接続文字列を `backend/local.settings.json` の `AZURE_STORAGE_CONNECTION_STRING` に設定してください。

### 8. 初期データファイルのアップロード

```bash
# プロジェクトルートディレクトリに移動
cd /home/syagu/work/shadowverse_log

# 接続文字列を環境変数に設定（前のステップで取得した値を使用）
export AZURE_STORAGE_CONNECTION_STRING="<Your-Connection-String>"

# JSON ファイルをアップロード
az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --container-name shadowverse-data \
  --name battle-logs.json \
  --file data/json/battle-logs.json \
  --content-type "application/json"

az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --container-name shadowverse-data \
  --name deck-master.json \
  --file data/json/deck-master.json \
  --content-type "application/json"

az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --container-name shadowverse-data \
  --name my-decks.json \
  --file data/json/my-decks.json \
  --content-type "application/json"
```

### 9. アップロード確認

```bash
# コンテナ内のファイル一覧を表示
az storage blob list \
  --account-name $STORAGE_ACCOUNT \
  --container-name shadowverse-data \
  --output table
```

## Soft Delete の有効化（推奨）

誤ってデータを削除した場合に備えて、Soft Delete を有効にすることを推奨します。

```bash
# Blob の Soft Delete を有効化（保持期間: 7日）
az storage blob service-properties delete-policy update \
  --account-name $STORAGE_ACCOUNT \
  --enable true \
  --days-retained 7
```

## バージョニングの有効化（オプション）

データの履歴を保持したい場合は、Blob のバージョニングを有効にします。

```bash
# Blob のバージョニングを有効化
az storage account blob-service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --enable-versioning true
```

## ローカル開発環境の設定

### backend/local.settings.json の更新

取得した接続文字列を `backend/local.settings.json` に設定します。

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=shadowverselogs123;AccountKey=YOUR_KEY_HERE;EndpointSuffix=core.windows.net"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

## セキュリティのベストプラクティス

### 1. 接続文字列の管理

- **local.settings.json は Git にコミットしない** (.gitignore に追加済み)
- 本番環境では Azure Functions の Application Settings に設定
- 開発環境ではローカルファイルで管理

### 2. アクセス制御

- コンテナのアクセスレベルは Private に設定（デフォルト）
- SAS トークンや Managed Identity の使用を検討
- 最小権限の原則に従う

### 3. ネットワークセキュリティ

本番環境では、特定の IP アドレスやサブネットからのみアクセスを許可することを推奨します。

```bash
# ファイアウォールルールの追加例
az storage account network-rule add \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --ip-address "YOUR_IP_ADDRESS"
```

## トラブルシューティング

### 接続文字列が正しく設定されているか確認

```bash
# ストレージアカウントの詳細を確認
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP
```

### CORS エラーが発生する場合

```bash
# 現在の CORS 設定を確認
az storage cors list \
  --account-name $STORAGE_ACCOUNT \
  --services b
```

### ファイルが見つからない場合

```bash
# Blob の一覧を確認
az storage blob list \
  --account-name $STORAGE_ACCOUNT \
  --container-name shadowverse-data \
  --output table
```

## コスト見積もり

### Storage Account (Standard_LRS)

- ストレージ容量: 最初の 50TB は約 $0.0184/GB/月
- トランザクション: 書き込み操作 10,000件あたり約 $0.05
- データ転送: 最初の 5GB/月は無料

### 想定コスト（月間）

- データ量: 1GB 未満
- トランザクション: 1,000件程度
- **合計: $1-2/月程度**

## 参考リンク

- [Azure Blob Storage ドキュメント](https://docs.microsoft.com/azure/storage/blobs/)
- [Azure CLI リファレンス](https://docs.microsoft.com/cli/azure/storage)
- [ストレージアカウントの作成](https://docs.microsoft.com/azure/storage/common/storage-account-create)
- [CORS の設定](https://docs.microsoft.com/rest/api/storageservices/cross-origin-resource-sharing--cors--support-for-the-azure-storage-services)

## 次のステップ

1. Azure Functions のデプロイ設定
2. フロントエンドからの API 接続確認
3. 認証機能の実装（Phase 2）

## 更新履歴

- **2025-10-27**: 初版作成
  - Azure CLI を使用した基本セットアップ手順を記載
  - セキュリティのベストプラクティスを追加
  - トラブルシューティングガイドを追加
