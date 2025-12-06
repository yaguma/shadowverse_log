/**
 * TASK-0025-5: マイグレーションAPIエンドポイントのテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import migration from '../../src/routes/migration';
import type { LegacyDeckMaster, LegacyBattleLog, LegacyMyDeck } from '../../src/migration/schema-mapping';

// createDatabaseContextのモック
vi.mock('../../src/db', () => ({
  createDatabaseContext: vi.fn(() => ({
    db: {},
    repositories: {
      deckMaster: {
        create: vi.fn().mockResolvedValue({ id: 'created-deck' }),
      },
      battleLogs: {
        create: vi.fn().mockResolvedValue({ id: 'created-battle' }),
      },
      myDecks: {
        create: vi.fn().mockResolvedValue({ id: 'created-mydeck' }),
      },
    },
  })),
}));

describe('Migration API Routes', () => {
  const mockEnv = {
    DB: {} as unknown,
  };

  describe('GET /status', () => {
    it('should return ready status', async () => {
      const res = await migration.request('/status', {
        method: 'GET',
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('ready');
      expect(body.data.message).toBe('Migration endpoint is ready');
      expect(body.data.timestamp).toBeTruthy();
    });
  });

  describe('POST /dry-run', () => {
    const sampleDeckMaster: LegacyDeckMaster[] = [
      { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 1 },
    ];

    const sampleBattleLogs: LegacyBattleLog[] = [
      {
        id: '1',
        date: '2025/08/07',
        battleType: 'ランクマッチ',
        rank: 'サファイア',
        group: 'A',
        myDeckId: '1',
        turn: '後攻',
        result: 'WIN',
        opponentDeckId: '3',
      },
    ];

    const sampleMyDecks: LegacyMyDeck[] = [
      {
        id: '1',
        deckId: '1',
        deckCode: '3.1.3.1.3.1',
        deckName: '秘術オデンスペル',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    it('should execute dry run migration successfully', async () => {
      const res = await migration.request('/dry-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckMaster: sampleDeckMaster,
          battleLogs: sampleBattleLogs,
          myDecks: sampleMyDecks,
        }),
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('Dry run completed');
      expect(body.data.deckMaster.imported).toBe(1);
      expect(body.data.battleLogs.imported).toBe(1);
      expect(body.data.myDecks.imported).toBe(1);
    });

    it('should handle empty data', async () => {
      const res = await migration.request('/dry-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.deckMaster.imported).toBe(0);
      expect(body.data.battleLogs.imported).toBe(0);
      expect(body.data.myDecks.imported).toBe(0);
    });

    it('should include userId in migration when provided', async () => {
      const res = await migration.request('/dry-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckMaster: sampleDeckMaster,
          userId: 'test-user-123',
        }),
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('POST /execute', () => {
    const sampleDeckMaster: LegacyDeckMaster[] = [
      { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 1 },
    ];

    it('should require confirmation flag', async () => {
      const res = await migration.request('/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckMaster: sampleDeckMaster,
        }),
      }, mockEnv);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('CONFIRMATION_REQUIRED');
    });

    it('should execute migration with confirmation', async () => {
      const res = await migration.request('/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckMaster: sampleDeckMaster,
          confirmExecution: true,
        }),
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('Migration completed successfully');
    });
  });
});
