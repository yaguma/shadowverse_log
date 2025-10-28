/**
 * BlobStorageClient のテストスイート
 *
 * テストフレームワーク: Jest 29.7.0 + ts-jest
 * テスト対象: backend/src/storage/blobStorageClient.ts
 *
 * 🔵 テストケース定義書: docs/implements/shadowverse-battle-log/TASK-0006/blob-storage-client-testcases.md
 * 🔵 要件定義書: docs/implements/shadowverse-battle-log/TASK-0006/blob-storage-client-requirements.md
 */

import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import { BattleLog, MyDeck } from '../../src/types';
import {
  setupAzuriteTestEnvironment,
  teardownAzuriteTestEnvironment,
} from '../setup/azurite-setup';

// モックデータ
const mockBattleLogs: BattleLog[] = [
  {
    id: '1',
    date: '2025/10/27',
    battleType: 'ランクマッチ',
    rank: 'ダイアモンド',
    group: 'A',
    myDeckId: '1',
    turn: '先攻',
    result: '勝ち',
    opponentDeckId: '2',
  },
];

// モックデータ: デッキマスター（将来のテストで使用予定）
// const mockDeckMasters: DeckMaster[] = [
//   {
//     id: '1',
//     className: 'ウィッチ',
//     deckName: '土スペルウィッチ',
//     sortOrder: 1,
//   },
//   {
//     id: '2',
//     className: 'ロイヤル',
//     deckName: 'ミッドレンジロイヤル',
//     sortOrder: 2,
//   },
// ];

const mockMyDecks: MyDeck[] = [
  {
    id: '1',
    deckId: '1',
    deckCode: '3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1',
    deckName: '秘術オデンスペル',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

// テストケース用の環境変数（Azuriteのデフォルト接続文字列）
const TEST_CONNECTION_STRING =
  'DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';
const TEST_CONTAINER_NAME = 'shadowverse-data';

describe('BlobStorageClient', () => {
  // =============================================================================
  // テスト環境のセットアップとクリーンアップ
  // =============================================================================

  beforeAll(async () => {
    // Azuriteコンテナと初期データを準備
    await setupAzuriteTestEnvironment();
  });

  afterAll(async () => {
    // テスト終了後にクリーンアップ
    await teardownAzuriteTestEnvironment();
  });

  // =============================================================================
  // 1. 正常系テストケース（基本的な動作）
  // =============================================================================

  describe('正常系: TC-001 - コンストラクタ', () => {
    test('正常な接続文字列とコンテナ名でBlobStorageClientインスタンスを生成できる', () => {
      // 【テスト目的】: コンストラクタが有効なパラメータを受け取り、正常にインスタンスを初期化できることを確認
      // 【テスト内容】: 有効な接続文字列とコンテナ名を渡してインスタンスを生成
      // 【期待される動作】: BlobServiceClient と ContainerClient が正しく初期化され、例外が発生しない
      // 🔵 信頼性レベル: 青信号（REQ-602, architecture.md Lines 205-234 より）

      // 【初期条件設定】: Azure Storage Emulator (Azurite) のデフォルト接続文字列を使用
      // 【テストデータ準備】: 本番環境と同じ構造でテスト可能な接続文字列
      const connectionString = TEST_CONNECTION_STRING;
      const containerName = TEST_CONTAINER_NAME;

      // 【実際の処理実行】: BlobStorageClient インスタンスを生成
      // 【処理内容】: コンストラクタが接続文字列とコンテナ名を受け取り、内部の BlobServiceClient を初期化
      const client = new BlobStorageClient(connectionString, containerName);

      // 【結果検証】: インスタンスが正常に生成されたことを確認
      // 【期待値確認】: client インスタンスが truthy な値であり、エラーが発生していない
      expect(client).toBeDefined(); // 【確認内容】: インスタンスが定義されている 🔵
      expect(client).toBeInstanceOf(BlobStorageClient); // 【確認内容】: BlobStorageClient のインスタンスである 🔵
    });
  });

  describe('正常系: TC-002 - getBattleLogs()', () => {
    test('Blob Storageから対戦履歴データ（BattleLog[]）を正常に取得できる', async () => {
      // 【テスト目的】: getBattleLogs() メソッドが Blob Storage から JSON データをダウンロードし、TypeScript 型に変換して返すことを確認
      // 【テスト内容】: battle-logs.json が読み込まれ、BattleLog[] 型の配列として返却される
      // 【期待される動作】: Promise<BattleLog[]> が返却され、配列の各要素が BattleLog 型に準拠している
      // 🔵 信頼性レベル: 青信号（REQ-602, blob-storage-design.md Lines 66-103 より）

      // 【初期条件設定】: BlobStorageClient インスタンスを準備
      // 【テストデータ準備】: 実装未完のため、このテストは失敗する
      const client = new BlobStorageClient(TEST_CONNECTION_STRING, TEST_CONTAINER_NAME);

      // 【実際の処理実行】: getBattleLogs() メソッドを呼び出す
      // 【処理内容】: Blob Storage SDK の download() を呼び、streamToString() でパース、JSON.parse() で型変換
      const result = await client.getBattleLogs();

      // 【結果検証】: BattleLog[] 型の配列が返却されることを確認
      // 【期待値確認】: 配列が返却され、空配列も許容される
      expect(Array.isArray(result)).toBe(true); // 【確認内容】: 配列が返却される 🔵
      expect(result).toEqual(expect.any(Array)); // 【確認内容】: 空配列を含む有効な配列 🔵

      // 【追加検証】: 配列が空でない場合、各要素が BattleLog 型に準拠しているか確認
      if (result.length > 0) {
        const firstLog = result[0];
        expect(firstLog).toHaveProperty('id'); // 【確認内容】: id プロパティが存在する 🔵
        expect(firstLog).toHaveProperty('date'); // 【確認内容】: date プロパティが存在する 🔵
        expect(firstLog).toHaveProperty('battleType'); // 【確認内容】: battleType プロパティが存在する 🔵
        expect(firstLog).toHaveProperty('result'); // 【確認内容】: result プロパティが存在する 🔵
        expect(firstLog?.date).toMatch(/^\d{4}\/\d{2}\/\d{2}$/); // 【確認内容】: 日付形式が YYYY/MM/DD である 🔵
      }
    });
  });

  describe('正常系: TC-003 - getDeckMasters()', () => {
    test('Blob Storageからデッキマスターデータ（DeckMaster[]）を正常に取得できる', async () => {
      // 【テスト目的】: getDeckMasters() メソッドが deck-master.json を読み込み、DeckMaster[] 型として返すことを確認
      // 【テスト内容】: デッキマスターのマスターデータが正しく取得される
      // 【期待される動作】: Promise<DeckMaster[]> が返却され、各要素が id, className, deckName, sortOrder プロパティを持つ
      // 🔵 信頼性レベル: 青信号（blob-storage-design.md Lines 116-131 より）

      // 【初期条件設定】: BlobStorageClient インスタンスを準備
      const client = new BlobStorageClient(TEST_CONNECTION_STRING, TEST_CONTAINER_NAME);

      // 【実際の処理実行】: getDeckMasters() メソッドを呼び出す
      // 【処理内容】: readJsonFile<DeckMaster[]>('deck-master.json') を実行
      const result = await client.getDeckMasters();

      // 【結果検証】: DeckMaster[] 型の配列が返却されることを確認
      expect(Array.isArray(result)).toBe(true); // 【確認内容】: 配列が返却される 🔵

      // 【追加検証】: 配列が空でない場合、各要素が DeckMaster 型に準拠しているか確認
      if (result.length > 0) {
        const firstDeck = result[0];
        expect(firstDeck).toHaveProperty('id'); // 【確認内容】: id プロパティが存在する 🔵
        expect(firstDeck).toHaveProperty('className'); // 【確認内容】: className プロパティが存在する 🔵
        expect(firstDeck).toHaveProperty('deckName'); // 【確認内容】: deckName プロパティが存在する 🔵
        expect(firstDeck).toHaveProperty('sortOrder'); // 【確認内容】: sortOrder プロパティが存在する 🔵
      }
    });
  });

  describe('正常系: TC-004 - getMyDecks()', () => {
    test('Blob Storageからマイデッキデータ（MyDeck[]）を正常に取得できる', async () => {
      // 【テスト目的】: getMyDecks() メソッドが my-decks.json を読み込み、MyDeck[] 型として返すことを確認
      // 【テスト内容】: ユーザーが登録したマイデッキ情報が取得される
      // 【期待される動作】: Promise<MyDeck[]> が返却され、各要素が id, deckId, deckCode, deckName, isActive, createdAt プロパティを持つ
      // 🔵 信頼性レベル: 青信号（blob-storage-design.md Lines 150-161 より）

      // 【初期条件設定】: BlobStorageClient インスタンスを準備
      const client = new BlobStorageClient(TEST_CONNECTION_STRING, TEST_CONTAINER_NAME);

      // 【実際の処理実行】: getMyDecks() メソッドを呼び出す
      // 【処理内容】: readJsonFile<MyDeck[]>('my-decks.json') を実行
      const result = await client.getMyDecks();

      // 【結果検証】: MyDeck[] 型の配列が返却されることを確認
      expect(Array.isArray(result)).toBe(true); // 【確認内容】: 配列が返却される 🔵

      // 【追加検証】: 配列が空でない場合、各要素が MyDeck 型に準拠しているか確認
      if (result.length > 0) {
        const firstDeck = result[0];
        expect(firstDeck).toHaveProperty('id'); // 【確認内容】: id プロパティが存在する 🔵
        expect(firstDeck).toHaveProperty('deckId'); // 【確認内容】: deckId プロパティが存在する 🔵
        expect(firstDeck).toHaveProperty('deckCode'); // 【確認内容】: deckCode プロパティが存在する 🔵
        expect(firstDeck).toHaveProperty('deckName'); // 【確認内容】: deckName プロパティが存在する 🔵
        expect(firstDeck).toHaveProperty('isActive'); // 【確認内容】: isActive プロパティが存在する 🔵
        expect(firstDeck).toHaveProperty('createdAt'); // 【確認内容】: createdAt プロパティが存在する 🔵
        expect(firstDeck?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // 【確認内容】: ISO 8601 形式の文字列である 🔵
      }
    });
  });

  describe('正常系: TC-005 - saveBattleLogs()', () => {
    test('BattleLog[] 配列を Blob Storage に JSON 形式で正常に保存できる', async () => {
      // 【テスト目的】: saveBattleLogs() メソッドが配列を JSON にシリアライズし、Blob Storage にアップロードできることを確認
      // 【テスト内容】: データが battle-logs.json として保存され、Content-Type ヘッダーが application/json に設定される
      // 【期待される動作】: Promise<void> が正常に resolve され、エラーが発生しない
      // 🔵 信頼性レベル: 青信号（REQ-602, blob-storage-design.md Lines 190-208 より）

      // 【初期条件設定】: BlobStorageClient インスタンスを準備
      const client = new BlobStorageClient(TEST_CONNECTION_STRING, TEST_CONTAINER_NAME);

      // 【テストデータ準備】: 1件の対戦履歴を持つ配列（最小限の有効なデータ）
      const battleLogs = mockBattleLogs;

      // 【実際の処理実行】: saveBattleLogs() メソッドを呼び出す
      // 【処理内容】: JSON.stringify(data, null, 2) でシリアライズし、blockBlobClient.upload() でアップロード
      await expect(client.saveBattleLogs(battleLogs)).resolves.not.toThrow(); // 【確認内容】: エラーなく完了する 🔵
    });
  });

  describe('正常系: TC-006 - saveMyDecks()', () => {
    test('MyDeck[] 配列を Blob Storage に JSON 形式で正常に保存できる', async () => {
      // 【テスト目的】: saveMyDecks() メソッドが MyDeck 配列を保存できることを確認
      // 【テスト内容】: my-decks.json としてデータが保存される
      // 【期待される動作】: Promise<void> が正常に resolve される
      // 🟡 信頼性レベル: 黄信号（blob-storage-design.md からの妥当な推測）

      // 【初期条件設定】: BlobStorageClient インスタンスを準備
      const client = new BlobStorageClient(TEST_CONNECTION_STRING, TEST_CONTAINER_NAME);

      // 【テストデータ準備】: 1件のマイデッキデータ
      const myDecks = mockMyDecks;

      // 【実際の処理実行】: saveMyDecks() メソッドを呼び出す
      // 【処理内容】: writeJsonFile('my-decks.json', myDecks) を実行
      await expect(client.saveMyDecks(myDecks)).resolves.not.toThrow(); // 【確認内容】: エラーなく完了する 🟡
    });
  });

  // =============================================================================
  // 2. 異常系テストケース（エラーハンドリング）
  // =============================================================================

  describe('異常系: TC-101 - 不正な接続文字列', () => {
    test('無効な接続文字列を渡した場合、適切なエラーがスローされる', () => {
      // 【テスト目的】: 設定エラーの早期検出
      // 【エラーケースの概要】: 接続文字列のフォーマットが不正な場合
      // 【エラー処理の重要性】: 設定ミスを早期に検出し、デバッグを容易にする
      // 🔵 信頼性レベル: 青信号（NFR-102, architecture.md Lines 354-366 より）

      // 【テストデータ準備】: 不正な接続文字列
      // 【不正な理由】: Azure Storage の接続文字列フォーマットに準拠していない
      // 【実際の発生シナリオ】: 環境変数の設定ミス、コピー&ペーストの失敗
      const invalidConnectionString = 'invalid_connection_string';

      // 【実際の処理実行】: コンストラクタでエラーが発生する
      // 【期待される結果】: コンストラクタでTypeError がスローされる
      // 【エラーメッセージの内容】: Azure SDK の標準エラーメッセージ "Invalid URL"
      expect(() => new BlobStorageClient(invalidConnectionString, TEST_CONTAINER_NAME)).toThrow('Invalid URL'); // 【確認内容】: エラーがスローされる 🔵
    });
  });

  describe('異常系: TC-102 - ファイルが存在しない', () => {
    test('Blob Storage にファイルが存在しない場合、BlobNotFound エラーがスローされる', async () => {
      // 【テスト目的】: ファイル不存在時の適切なエラーハンドリング
      // 【エラーケースの概要】: 初回アクセス時やファイル削除後のアクセス
      // 【エラー処理の重要性】: ファイルの存在確認と適切なエラーハンドリング
      // 🔵 信頼性レベル: 青信号（EDGE-002, dataflow.md Lines 318-345 より）

      // 【テストデータ準備】: 存在しないファイルへのアクセス
      // 【不正な理由】: ファイルが未作成または削除されている
      // 【実際の発生シナリオ】: システム初回起動時、データ削除後、ストレージ障害
      const client = new BlobStorageClient(TEST_CONNECTION_STRING, 'non-existent-container');

      // 【実際の処理実行】: 存在しないコンテナのファイルを読み込もうとする
      // 【期待される結果】: ContainerNotFound エラーがスローされる
      // 【エラーメッセージの内容】: "Failed to read battle-logs.json after 3 attempts: The specified container does not exist"
      await expect(client.getBattleLogs()).rejects.toThrow('The specified container does not exist'); // 【確認内容】: エラーがスローされる 🔵
    });
  });

  describe('異常系: TC-103 - ネットワークエラー時に3回リトライ', () => {
    test('ネットワークエラー発生時、指数バックオフで3回リトライする', async () => {
      // 【テスト目的】: リトライ機構の動作確認
      // 【エラーケースの概要】: 一時的なネットワーク障害、タイムアウト
      // 【エラー処理の重要性】: 一時的な障害に対する耐障害性の向上
      // 🔵 信頼性レベル: 青信号（EDGE-001, EDGE-002, dataflow.md Lines 318-345 より）

      // 【テストデータ準備】: ネットワークエラーをシミュレート
      // 【不正な理由】: ネットワーク接続の不安定性、Azure Storage の一時的な障害
      // 【実際の発生シナリオ】: Wi-Fi接続の不安定、データセンター障害、タイムアウト
      // 不正なポート番号を使用して接続エラーを発生させる
      const invalidConnectionString = 'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:19999/devstoreaccount1;';
      const client = new BlobStorageClient(invalidConnectionString, TEST_CONTAINER_NAME);

      // 【実際の処理実行】: ネットワークエラーが発生する環境で getBattleLogs() を呼び出す
      // 【期待される結果】:
      // - 1回目失敗 → 1秒待機 → 2回目実行
      // - 2回目失敗 → 2秒待機 → 3回目実行
      // - 3回目失敗 → エラーをスロー
      // 【エラーメッセージの内容】: "Failed to read battle-logs.json after 3 attempts: [元のエラー]"

      // リトライが3回実行されることを確認（エラーメッセージに "after 3 attempts" が含まれる）
      await expect(client.getBattleLogs()).rejects.toThrow(/after 3 attempts/); // 【確認内容】: 3回リトライ後にエラーがスローされる 🔵
    }, 60000); // タイムアウトを60秒に設定（SDK接続タイムアウト + リトライ時間を考慮）
  });

  describe('異常系: TC-104 - JSON パースエラー', () => {
    test('Blob Storage 上のファイルが不正な JSON 形式の場合、SyntaxError がスローされる', async () => {
      // 【テスト目的】: データ整合性チェックの動作確認
      // 【エラーケースの概要】: JSON 形式の破損、手動編集ミス
      // 【エラー処理の重要性】: データ整合性の保証
      // 🟡 信頼性レベル: 黄信号（エラーハンドリング要件からの妥当な推測）

      // 【テストデータ準備】: 不正なJSON形式のファイル
      // 【不正な理由】: JSON 構文エラー、カンマ欠落、クォート欠落
      // 【実際の発生シナリオ】: 手動編集ミス、データ破損、アップロードエラー
      const client = new BlobStorageClient(TEST_CONNECTION_STRING, TEST_CONTAINER_NAME);

      // Setupで作成したinvalid.jsonを battle-logs.json として上書き保存
      // (これによりgetBattleLogs()がパースエラーを起こす)
      const { BlobServiceClient } = await import('@azure/storage-blob');
      const blobServiceClient = BlobServiceClient.fromConnectionString(TEST_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(TEST_CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient('battle-logs.json');
      await blockBlobClient.upload('{ invalid json }', 14, {
        blobHTTPHeaders: { blobContentType: 'application/json' },
      });

      // 【実際の処理実行】: 不正なJSONファイルを読み込もうとする
      // 【期待される結果】: リトライ後に Error (SyntaxError を含む) がスローされる
      // 【エラーメッセージの内容】: "Failed to read ... Expected property name or '}' in JSON"
      await expect(client.getBattleLogs()).rejects.toThrow('Expected property name'); // 【確認内容】: JSON パースエラーがスローされる 🟡
    });
  });

  // =============================================================================
  // 3. 境界値テストケース（最小値、最大値、null等）
  // =============================================================================

  describe('境界値: TC-201 - 空配列の対戦履歴', () => {
    test('battle-logs.json が空配列 [] の場合、正常に空配列を返す', async () => {
      // 【テスト目的】: 最小データ量（ゼロ件）での動作確認
      // 【境界値の意味】: データ件数がゼロの状態（最小値）
      // 【境界値での動作保証】: 空データでもエラーにならないことを保証
      // 🔵 信頼性レベル: 青信号（REQ-501, requirements.md Line 82 より）

      // 【テストデータ準備】: 空配列
      // 【境界値選択の根拠】: データ削除後、初回利用時の状態
      // 【実際の使用場面】: ユーザーがすべてのデータを削除した場合
      const client = new BlobStorageClient(TEST_CONNECTION_STRING, TEST_CONTAINER_NAME);

      // 【実際の処理実行】: 空配列を保存してから取得
      await client.saveBattleLogs([]);
      const result = await client.getBattleLogs();

      // 【結果検証】: 空配列が正常に返却されることを確認
      // 【境界での正確性】: 空配列でも型は BattleLog[] として正しく扱われる
      expect(Array.isArray(result)).toBe(true); // 【確認内容】: 配列が返却される 🔵
      expect(result).toHaveLength(0); // 【確認内容】: 空配列である 🔵
    });
  });
});
