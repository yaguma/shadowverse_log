/**
 * TASK-0025-6: マイグレーションの統合テスト（ドライラン検証）
 *
 * 実際のJSONデータを使用したドライランの検証テスト
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import type { DatabaseContext } from '../../src/db';
import {
  type JsonDataSource,
  migrateJsonToD1,
} from '../../src/migration/migrate-json-to-d1';

describe('Migration Integration Test (Dry Run Verification)', () => {
  // 実際のJSONファイルパス（プロジェクトルート/data/json）
  const dataDir = join(__dirname, '../../../../data/json');

  const createMockRepositories = () => ({
    deckMaster: {
      create: vi.fn().mockResolvedValue({ id: 'created-deck' }),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    battleLogs: {
      create: vi.fn().mockResolvedValue({ id: 'created-battle' }),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    myDecks: {
      create: vi.fn().mockResolvedValue({ id: 'created-mydeck' }),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  });

  it('should verify actual JSON data files exist', () => {
    expect(existsSync(join(dataDir, 'deck-master.json'))).toBe(true);
    expect(existsSync(join(dataDir, 'battle-logs.json'))).toBe(true);
    expect(existsSync(join(dataDir, 'my-decks.json'))).toBe(true);
  });

  it('should parse deck-master.json correctly', () => {
    const content = readFileSync(join(dataDir, 'deck-master.json'), 'utf-8');
    const data = JSON.parse(content);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // 最初のレコードの構造を確認
    const firstRecord = data[0];
    expect(firstRecord).toHaveProperty('id');
    expect(firstRecord).toHaveProperty('className');
    expect(firstRecord).toHaveProperty('deckName');
    expect(firstRecord).toHaveProperty('sortOrder');
  });

  it('should parse battle-logs.json correctly', () => {
    const content = readFileSync(join(dataDir, 'battle-logs.json'), 'utf-8');
    const data = JSON.parse(content);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // 最初のレコードの構造を確認
    const firstRecord = data[0];
    expect(firstRecord).toHaveProperty('id');
    expect(firstRecord).toHaveProperty('date');
    expect(firstRecord).toHaveProperty('battleType');
    expect(firstRecord).toHaveProperty('rank');
    expect(firstRecord).toHaveProperty('group');
    expect(firstRecord).toHaveProperty('myDeckId');
    expect(firstRecord).toHaveProperty('turn');
    expect(firstRecord).toHaveProperty('result');
    expect(firstRecord).toHaveProperty('opponentDeckId');
  });

  it('should parse my-decks.json correctly', () => {
    const content = readFileSync(join(dataDir, 'my-decks.json'), 'utf-8');
    const data = JSON.parse(content);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // 最初のレコードの構造を確認
    const firstRecord = data[0];
    expect(firstRecord).toHaveProperty('id');
    expect(firstRecord).toHaveProperty('deckId');
    expect(firstRecord).toHaveProperty('deckCode');
    expect(firstRecord).toHaveProperty('deckName');
    expect(firstRecord).toHaveProperty('isActive');
    expect(firstRecord).toHaveProperty('createdAt');
  });

  it('should perform dry run migration with actual data', async () => {
    // 実際のJSONデータを読み込み
    const deckMaster = JSON.parse(
      readFileSync(join(dataDir, 'deck-master.json'), 'utf-8')
    );
    const battleLogs = JSON.parse(
      readFileSync(join(dataDir, 'battle-logs.json'), 'utf-8')
    );
    const myDecks = JSON.parse(
      readFileSync(join(dataDir, 'my-decks.json'), 'utf-8')
    );

    const mockRepositories = createMockRepositories();
    const mockContext: DatabaseContext = {
      db: {} as DatabaseContext['db'],
      repositories: mockRepositories as unknown as DatabaseContext['repositories'],
    };

    const dataSource: JsonDataSource = {
      localData: {
        deckMaster,
        battleLogs,
        myDecks,
      },
    };

    const progressMessages: string[] = [];
    const result = await migrateJsonToD1(mockContext, dataSource, {
      dryRun: true,
      userId: 'test-user',
      onProgress: (msg) => progressMessages.push(msg),
    });

    // 結果検証
    console.log('=== Migration Dry Run Results ===');
    console.log('Deck Master:', {
      imported: result.deckMaster.imported,
      skipped: result.deckMaster.skipped,
      errors: result.deckMaster.errors.length,
    });
    console.log('Battle Logs:', {
      imported: result.battleLogs.imported,
      skipped: result.battleLogs.skipped,
      errors: result.battleLogs.errors.length,
    });
    console.log('My Decks:', {
      imported: result.myDecks.imported,
      skipped: result.myDecks.skipped,
      errors: result.myDecks.errors.length,
    });
    console.log('Total Time:', result.totalTime, 'ms');
    console.log('Completed At:', result.completedAt);

    // アサーション
    expect(result.deckMaster.imported).toBe(deckMaster.length);
    expect(result.deckMaster.skipped).toBe(0);
    expect(result.deckMaster.errors).toHaveLength(0);

    expect(result.battleLogs.imported).toBe(battleLogs.length);
    expect(result.battleLogs.skipped).toBe(0);
    expect(result.battleLogs.errors).toHaveLength(0);

    expect(result.myDecks.imported).toBe(myDecks.length);
    expect(result.myDecks.skipped).toBe(0);
    expect(result.myDecks.errors).toHaveLength(0);

    // ドライランなのでリポジトリのcreateは呼ばれない
    expect(mockRepositories.deckMaster.create).not.toHaveBeenCalled();
    expect(mockRepositories.battleLogs.create).not.toHaveBeenCalled();
    expect(mockRepositories.myDecks.create).not.toHaveBeenCalled();

    // 進捗メッセージが出力されている
    expect(progressMessages.length).toBeGreaterThan(0);
    expect(progressMessages).toContain('Migrating deck_master...');
    expect(progressMessages).toContain('Migrating battle_logs...');
    expect(progressMessages).toContain('Migrating my_decks...');
  });

  it('should report total record counts from actual data', () => {
    const deckMaster = JSON.parse(
      readFileSync(join(dataDir, 'deck-master.json'), 'utf-8')
    );
    const battleLogs = JSON.parse(
      readFileSync(join(dataDir, 'battle-logs.json'), 'utf-8')
    );
    const myDecks = JSON.parse(
      readFileSync(join(dataDir, 'my-decks.json'), 'utf-8')
    );

    console.log('=== Actual Data Record Counts ===');
    console.log('Deck Master:', deckMaster.length, 'records');
    console.log('Battle Logs:', battleLogs.length, 'records');
    console.log('My Decks:', myDecks.length, 'records');
    console.log('Total:', deckMaster.length + battleLogs.length + myDecks.length, 'records');

    expect(deckMaster.length).toBeGreaterThan(0);
    expect(battleLogs.length).toBeGreaterThan(0);
    expect(myDecks.length).toBeGreaterThan(0);
  });
});
