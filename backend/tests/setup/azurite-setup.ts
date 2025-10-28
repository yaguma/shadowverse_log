/**
 * Azuriteテスト環境のセットアップスクリプト
 *
 * 【目的】: Azuriteコンテナと初期データを準備
 * 【実行タイミング】: Jest beforeAll フック
 * 【処理内容】: コンテナ作成、初期JSONファイルアップロード
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { BattleLog, DeckMaster, MyDeck } from '../../src/types';

// Azurite デフォルト接続文字列
const AZURITE_CONNECTION_STRING =
  'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';
const CONTAINER_NAME = 'shadowverse-data';

/**
 * Azurite コンテナとテストデータをセットアップ
 */
export async function setupAzuriteTestEnvironment(): Promise<void> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURITE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

  // コンテナが存在しない場合は作成
  const exists = await containerClient.exists();
  if (!exists) {
    await containerClient.create();
    console.log(`✅ Container "${CONTAINER_NAME}" created`);
  }

  // 初期テストデータを準備
  const mockBattleLogs: BattleLog[] = [
    {
      id: '1',
      date: '2025/01/15',
      battleType: 'ランクマッチ',
      rank: 'ダイアモンド',
      group: 'A',
      myDeckId: '1',
      turn: '先攻',
      result: '勝ち',
      opponentDeckId: '2',
    },
  ];

  const mockDeckMasters: DeckMaster[] = [
    { id: '1', className: 'ドラゴン', deckName: 'ランプドラゴン', sortOrder: 1 },
  ];

  const mockMyDecks: MyDeck[] = [
    {
      id: '1',
      deckId: '1',
      deckCode: 'deck_code_123',
      deckName: 'マイランプドラゴン',
      isActive: true,
      createdAt: '2025-01-10T12:00:00Z',
    },
  ];

  // 各ファイルをアップロード
  await uploadJsonFile(containerClient, 'battle-logs.json', mockBattleLogs);
  await uploadJsonFile(containerClient, 'deck-master.json', mockDeckMasters);
  await uploadJsonFile(containerClient, 'my-decks.json', mockMyDecks);

  // 空配列のテストデータもアップロード
  await uploadJsonFile(containerClient, 'empty-battle-logs.json', []);

  // 不正なJSONデータ（JSONパースエラー用）
  const blockBlobClient = containerClient.getBlockBlobClient('invalid.json');
  await blockBlobClient.upload('{ invalid json }', 14, {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });

  console.log('✅ Test data uploaded to Azurite');
}

/**
 * JSONファイルをAzuriteにアップロード
 */
async function uploadJsonFile<T>(
  containerClient: any,
  blobName: string,
  data: T
): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const content = JSON.stringify(data, null, 2);
  await blockBlobClient.upload(content, Buffer.byteLength(content), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
  console.log(`  ✅ Uploaded: ${blobName}`);
}

/**
 * Azurite コンテナをクリーンアップ
 */
export async function teardownAzuriteTestEnvironment(): Promise<void> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURITE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

  const exists = await containerClient.exists();
  if (exists) {
    await containerClient.delete();
    console.log(`✅ Container "${CONTAINER_NAME}" deleted`);
  }
}
