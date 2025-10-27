#!/bin/bash

##############################################################################
# Azure Blob Storage セットアップスクリプト
#
# このスクリプトは Shadowverse Battle Log アプリケーション用の
# Azure Blob Storage を自動的にセットアップします。
#
# 前提条件:
#   - Azure CLI がインストールされていること
#   - Azure にログイン済みであること (az login)
#   - 適切な権限があること
#
# 使用方法:
#   chmod +x scripts/setup-azure-storage.sh
#   ./scripts/setup-azure-storage.sh
##############################################################################

set -e  # エラーが発生したら即座に終了

# カラー出力用の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ出力関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Azure CLI の確認
check_azure_cli() {
    log_info "Azure CLI のインストール確認中..."
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI がインストールされていません"
        echo ""
        echo "インストール方法:"
        echo "  Windows: winget install -e --id Microsoft.AzureCLI"
        echo "  macOS:   brew install azure-cli"
        echo "  Linux:   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
        exit 1
    fi
    log_success "Azure CLI が見つかりました ($(az version --query '\"azure-cli\"' -o tsv))"
}

# Azure ログイン確認
check_azure_login() {
    log_info "Azure ログイン状態を確認中..."
    if ! az account show &> /dev/null; then
        log_error "Azure にログインしていません"
        echo ""
        echo "以下のコマンドでログインしてください:"
        echo "  az login"
        exit 1
    fi

    ACCOUNT_NAME=$(az account show --query 'user.name' -o tsv)
    SUBSCRIPTION_NAME=$(az account show --query 'name' -o tsv)
    log_success "ログイン済み: $ACCOUNT_NAME (サブスクリプション: $SUBSCRIPTION_NAME)"
}

# 設定値の入力
configure_settings() {
    echo ""
    log_info "===== Azure リソースの設定 ====="
    echo ""

    # リソースグループ名
    read -p "リソースグループ名 (デフォルト: shadowverse-log-rg): " RESOURCE_GROUP
    RESOURCE_GROUP=${RESOURCE_GROUP:-shadowverse-log-rg}

    # リージョン
    echo ""
    echo "利用可能なリージョン例:"
    echo "  japaneast      - 東日本"
    echo "  japanwest      - 西日本"
    echo "  eastus         - 米国東部"
    echo "  westeurope     - 西ヨーロッパ"
    read -p "リージョン (デフォルト: japaneast): " LOCATION
    LOCATION=${LOCATION:-japaneast}

    # ストレージアカウント名
    echo ""
    log_warning "ストレージアカウント名は全世界で一意である必要があります"
    log_warning "英数字のみ、3-24文字で指定してください"
    STORAGE_ACCOUNT_DEFAULT="shadowverselogsa01"
    read -p "ストレージアカウント名 (デフォルト: $STORAGE_ACCOUNT_DEFAULT): " STORAGE_ACCOUNT
    STORAGE_ACCOUNT=${STORAGE_ACCOUNT:-$STORAGE_ACCOUNT_DEFAULT}

    # コンテナ名
    read -p "コンテナ名 (デフォルト: shadowverse-data): " CONTAINER_NAME
    CONTAINER_NAME=${CONTAINER_NAME:-shadowverse-data}

    echo ""
    log_info "===== 設定確認 ====="
    echo "  リソースグループ: $RESOURCE_GROUP"
    echo "  リージョン:       $LOCATION"
    echo "  ストレージアカウント: $STORAGE_ACCOUNT"
    echo "  コンテナ名:       $CONTAINER_NAME"
    echo ""

    read -p "この設定で続行しますか? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        log_warning "セットアップをキャンセルしました"
        exit 0
    fi
}

# リソースグループの作成
create_resource_group() {
    log_info "リソースグループを作成中..."

    if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        log_warning "リソースグループ '$RESOURCE_GROUP' は既に存在します"
    else
        az group create \
            --name "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --output none
        log_success "リソースグループ '$RESOURCE_GROUP' を作成しました"
    fi
}

# ストレージアカウントの作成
create_storage_account() {
    log_info "ストレージアカウントを作成中... (数分かかる場合があります)"

    if az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log_warning "ストレージアカウント '$STORAGE_ACCOUNT' は既に存在します"
    else
        az storage account create \
            --name "$STORAGE_ACCOUNT" \
            --resource-group "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --sku Standard_LRS \
            --kind StorageV2 \
            --access-tier Hot \
            --output none
        log_success "ストレージアカウント '$STORAGE_ACCOUNT' を作成しました"
    fi
}

# コンテナの作成
create_container() {
    log_info "Blob コンテナを作成中..."

    if az storage container exists \
        --name "$CONTAINER_NAME" \
        --account-name "$STORAGE_ACCOUNT" \
        --auth-mode login \
        --query exists -o tsv | grep -q "true"; then
        log_warning "コンテナ '$CONTAINER_NAME' は既に存在します"
    else
        az storage container create \
            --name "$CONTAINER_NAME" \
            --account-name "$STORAGE_ACCOUNT" \
            --auth-mode login \
            --output none
        log_success "コンテナ '$CONTAINER_NAME' を作成しました"
    fi
}

# CORS の設定
configure_cors() {
    log_info "CORS を設定中..."

    # 既存の CORS 設定をクリア
    az storage cors clear \
        --account-name "$STORAGE_ACCOUNT" \
        --services b \
        --output none 2>/dev/null || true

    # 新しい CORS 設定を追加
    az storage cors add \
        --account-name "$STORAGE_ACCOUNT" \
        --services b \
        --methods GET POST PUT DELETE OPTIONS \
        --origins "*" \
        --allowed-headers "*" \
        --exposed-headers "*" \
        --max-age 3600 \
        --output none

    log_success "CORS を設定しました"
    log_warning "本番環境では --origins を特定のドメインに制限することを推奨します"
}

# Soft Delete の有効化
enable_soft_delete() {
    log_info "Soft Delete を有効化中..."

    az storage blob service-properties delete-policy update \
        --account-name "$STORAGE_ACCOUNT" \
        --enable true \
        --days-retained 7 \
        --output none

    log_success "Soft Delete を有効化しました (保持期間: 7日)"
}

# 接続文字列の取得と表示
get_connection_string() {
    log_info "接続文字列を取得中..."

    CONNECTION_STRING=$(az storage account show-connection-string \
        --name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --output tsv)

    echo ""
    log_success "===== セットアップ完了 ====="
    echo ""
    echo "以下の接続文字列を backend/local.settings.json の"
    echo "AZURE_STORAGE_CONNECTION_STRING に設定してください:"
    echo ""
    echo -e "${GREEN}$CONNECTION_STRING${NC}"
    echo ""
}

# 初期データのアップロード
upload_initial_data() {
    echo ""
    read -p "初期データファイルをアップロードしますか? (y/N): " UPLOAD_CONFIRM

    if [[ ! "$UPLOAD_CONFIRM" =~ ^[Yy]$ ]]; then
        log_info "初期データのアップロードをスキップしました"
        return
    fi

    # プロジェクトルートディレクトリを取得
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    DATA_DIR="$PROJECT_ROOT/data/json"

    if [ ! -d "$DATA_DIR" ]; then
        log_error "データディレクトリが見つかりません: $DATA_DIR"
        return
    fi

    log_info "初期データをアップロード中..."

    # JSON ファイルをアップロード
    for FILE in battle-logs.json deck-master.json my-decks.json; do
        if [ -f "$DATA_DIR/$FILE" ]; then
            log_info "  $FILE をアップロード中..."
            az storage blob upload \
                --account-name "$STORAGE_ACCOUNT" \
                --container-name "$CONTAINER_NAME" \
                --name "$FILE" \
                --file "$DATA_DIR/$FILE" \
                --content-type "application/json" \
                --overwrite \
                --output none
            log_success "  $FILE をアップロードしました"
        else
            log_warning "  $FILE が見つかりません。スキップします。"
        fi
    done

    # アップロードされたファイルを確認
    echo ""
    log_info "アップロードされたファイル一覧:"
    az storage blob list \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$CONTAINER_NAME" \
        --output table
}

# local.settings.json の更新補助
update_local_settings() {
    echo ""
    read -p "backend/local.settings.json を自動更新しますか? (y/N): " UPDATE_CONFIRM

    if [[ ! "$UPDATE_CONFIRM" =~ ^[Yy]$ ]]; then
        log_info "local.settings.json の更新をスキップしました"
        return
    fi

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    LOCAL_SETTINGS_FILE="$PROJECT_ROOT/backend/local.settings.json"

    if [ ! -f "$LOCAL_SETTINGS_FILE" ]; then
        log_error "local.settings.json が見つかりません: $LOCAL_SETTINGS_FILE"
        return
    fi

    # バックアップを作成
    cp "$LOCAL_SETTINGS_FILE" "$LOCAL_SETTINGS_FILE.backup"
    log_info "バックアップを作成しました: $LOCAL_SETTINGS_FILE.backup"

    # jq が利用可能かチェック
    if command -v jq &> /dev/null; then
        # jq を使用して JSON を更新
        jq --arg conn "$CONNECTION_STRING" \
            '.Values.AZURE_STORAGE_CONNECTION_STRING = $conn' \
            "$LOCAL_SETTINGS_FILE" > "$LOCAL_SETTINGS_FILE.tmp"
        mv "$LOCAL_SETTINGS_FILE.tmp" "$LOCAL_SETTINGS_FILE"
        log_success "local.settings.json を更新しました"
    else
        log_warning "jq がインストールされていないため、手動で更新してください"
        log_info "接続文字列を以下のファイルに設定してください:"
        echo "  $LOCAL_SETTINGS_FILE"
    fi
}

# メイン処理
main() {
    echo ""
    echo "=========================================="
    echo "  Azure Blob Storage セットアップ"
    echo "  Shadowverse Battle Log"
    echo "=========================================="
    echo ""

    # 事前チェック
    check_azure_cli
    check_azure_login

    # 設定入力
    configure_settings

    echo ""
    log_info "===== セットアップ開始 ====="
    echo ""

    # リソース作成
    create_resource_group
    create_storage_account
    create_container
    configure_cors
    enable_soft_delete

    # 接続文字列取得
    get_connection_string

    # 初期データアップロード
    upload_initial_data

    # local.settings.json 更新
    update_local_settings

    echo ""
    log_success "===== すべてのセットアップが完了しました ====="
    echo ""
    echo "次のステップ:"
    echo "  1. backend/local.settings.json に接続文字列が設定されていることを確認"
    echo "  2. Azure Functions をローカルで起動: cd backend && npm start"
    echo "  3. フロントエンドを起動: cd frontend && npm run dev"
    echo ""
    echo "詳細なドキュメント: docs/azure-storage-setup.md"
    echo ""
}

# スクリプト実行
main
