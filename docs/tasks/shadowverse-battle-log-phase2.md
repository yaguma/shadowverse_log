# Phase 2: バックエンドコアAPI実装

## フェーズ概要

- **期間**: Day 7-13 (7営業日)
- **総工数**: 56時間
- **目標**: すべてのPhase 1向けバックエンドAPIの実装完了
- **成果物**:
  - Battle Log CRUD API
  - Deck Master API
  - Statistics API (統計計算)
  - Import API
  - 単体テスト・統合テスト完備
  - CI/CD パイプライン構築

## 週次計画

### Week 2 (Day 7-11)

- **目標**: Battle Log, Deck Master, Statistics APIの実装
- **成果物**: 主要APIが完成し、テスト済み

### Week 3 (Day 12-13)

- **目標**: Import API実装と統合テスト
- **成果物**: すべてのAPIが完成し、CI/CDが動作

---

## タスク一覧

### TASK-0007: Battle Log CRUD API実装 - 作成機能 ✅ **完了** (TDD開発完了 - 26テストケース全通過)

- [x] **タスク完了**
- **推定工数**: 8時間
- **実績工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-001 (登録機能), REQ-002 (8項目記録), REQ-004 (ID自動生成), REQ-401 (未来日付禁止) 🔵
- **依存タスク**: TASK-0006 (Blob Storage Client) ✅
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム
- **完了日**: 2025-10-30
- **品質評価**: ⭐⭐⭐⭐⭐ (5/5)

#### 実装詳細

##### 1. APIエンドポイント定義

**ファイル**: `backend/src/functions/battle-logs.ts`

- **メソッド**: POST
- **パス**: `/api/battle-logs`
- **認証レベル**: anonymous (Phase 1)

##### 2. リクエストボディ型定義 🔵 *api-endpoints.mdより*

```typescript
interface CreateBattleLogRequest {
  date: string;           // YYYY-MM-DD形式 (デフォルト: 今日)
  battleType: BattleType; // "ランクマッチ" | "対戦台" | "ロビー大会"
  rank: Rank;             // "サファイア" | "ダイアモンド" | "ルビー" | "トパーズ" | "-"
  group: Group;           // "A" | "AA" | "AAA" | "Master" | "-"
  myDeckId: string;       // 使用デッキID
  turn: Turn;             // "先攻" | "後攻"
  result: BattleResult;   // "勝ち" | "負け"
  opponentDeckId: string; // 相手デッキID
}
```

##### 3. バリデーション実装 (Zod) 🔵 *REQ-401より*

`backend/src/utils/validation.ts` を作成:

```typescript
import { z } from 'zod';

// 未来日付チェック
const isFutureDate = (dateStr: string): boolean => {
  const inputDate = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return inputDate > today;
};

// 対戦履歴作成スキーマ
export const createBattleLogSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "日付はYYYY-MM-DD形式で入力してください" })
    .refine((val) => !isFutureDate(val), { message: "未来の日付は入力できません" })
    .default(() => new Date().toISOString().split('T')[0]),

  battleType: z.enum(["ランクマッチ", "対戦台", "ロビー大会"], {
    errorMap: () => ({ message: "対戦タイプが不正です" })
  }),

  rank: z.enum(["サファイア", "ダイアモンド", "ルビー", "トパーズ", "-"], {
    errorMap: () => ({ message: "ランクが不正です" })
  }),

  group: z.enum(["A", "AA", "AAA", "Master", "-"], {
    errorMap: () => ({ message: "グループが不正です" })
  }),

  myDeckId: z.string().min(1, { message: "マイデッキIDは必須です" }),

  turn: z.enum(["先攻", "後攻"], {
    errorMap: () => ({ message: "ターンが不正です" })
  }),

  result: z.enum(["勝ち", "負け"], {
    errorMap: () => ({ message: "対戦結果が不正です" })
  }),

  opponentDeckId: z.string().min(1, { message: "相手デッキIDは必須です" }),
});

export type CreateBattleLogInput = z.infer<typeof createBattleLogSchema>;
```

##### 4. ID自動生成ロジック 🔵 *REQ-004より*

`backend/src/utils/idGenerator.ts` を作成:

```typescript
import { BattleLog } from '../types';

/**
 * 対戦履歴IDを自動生成
 * 形式: log_YYYYMMDD_NNN (例: log_20250124_001)
 */
export function generateBattleLogId(existingLogs: BattleLog[], date: string): string {
  const dateStr = date.replace(/-/g, ''); // YYYY-MM-DD → YYYYMMDD

  // 同日の最大連番を取得
  const sameeDateLogs = existingLogs.filter((log) =>
    log.id.startsWith(`log_${dateStr}_`)
  );

  const maxSeq = sameeDateLogs.reduce((max, log) => {
    const match = log.id.match(/log_\d{8}_(\d{3})$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      return seq > max ? seq : max;
    }
    return max;
  }, 0);

  const nextSeq = maxSeq + 1;
  return `log_${dateStr}_${String(nextSeq).padStart(3, '0')}`;
}
```

##### 5. Blob Storage保存処理 🔵 *REQ-002より*

`backend/src/services/battleLogService.ts` を作成:

```typescript
import { BlobStorageClient } from '../storage/blobStorageClient';
import { BattleLog } from '../types';
import { createBattleLogSchema, CreateBattleLogInput } from '../utils/validation';
import { generateBattleLogId } from '../utils/idGenerator';
import { ZodError } from 'zod';

export class BattleLogService {
  constructor(private blobClient: BlobStorageClient) {}

  /**
   * 対戦履歴を作成
   */
  async createBattleLog(input: CreateBattleLogInput): Promise<BattleLog> {
    // 1. バリデーション
    const validatedData = createBattleLogSchema.parse(input);

    // 2. 既存データ読み込み
    const existingLogs = await this.blobClient.getBattleLogs();

    // 3. ID生成
    const id = generateBattleLogId(existingLogs, validatedData.date);

    // 4. 新規データ作成
    const newLog: BattleLog = {
      id,
      ...validatedData,
    };

    // 5. データ追加
    existingLogs.push(newLog);

    // 6. Blob Storage保存
    await this.blobClient.saveBattleLogs(existingLogs);

    return newLog;
  }
}
```

##### 6. Azure Functions エンドポイント実装 🔵 *api-endpoints.mdより*

`backend/src/functions/battle-logs.ts` を作成:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobStorageClient } from '../storage/blobStorageClient';
import { BattleLogService } from '../services/battleLogService';
import { ZodError } from 'zod';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = 'shadowverse-data';
const blobClient = new BlobStorageClient(connectionString, containerName);
const battleLogService = new BattleLogService(blobClient);

// POST /api/battle-logs
app.http("createBattleLog", {
  methods: ["POST"],
  route: "battle-logs",
  authLevel: "anonymous",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await request.json() as any;
      const battleLog = await battleLogService.createBattleLog(body);

      return {
        status: 201,
        jsonBody: {
          success: true,
          data: { battleLog },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    } catch (error) {
      context.error("Error in createBattleLog:", error);

      if (error instanceof ZodError) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "入力値が不正です",
              details: error.errors.reduce((acc, err) => {
                acc[err.path.join('.')] = err.message;
                return acc;
              }, {} as Record<string, string>),
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: context.invocationId,
            },
          },
        };
      }

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "サーバーエラーが発生しました",
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    }
  },
});
```

##### 7. エラーハンドリング 🟡 *一般的なAPI設計より*

- **バリデーションエラー**: 400 Bad Request (Zodエラーを詳細に返す)
- **Blob Storage接続エラー**: 500 Internal Server Error (BlobStorageClientで3回リトライ済み)
- **タイムアウト**: 503 Service Unavailable

#### テスト要件

##### 1. 単体テスト (Jest)

`backend/tests/services/battleLogService.test.ts` を作成:

```typescript
import { BattleLogService } from '../../src/services/battleLogService';
import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import { BattleLog } from '../../src/types';

jest.mock('../../src/storage/blobStorageClient');

describe('BattleLogService - createBattleLog', () => {
  let service: BattleLogService;
  let mockBlobClient: jest.Mocked<BlobStorageClient>;

  beforeEach(() => {
    mockBlobClient = new BlobStorageClient('', '') as jest.Mocked<BlobStorageClient>;
    service = new BattleLogService(mockBlobClient);
  });

  describe('正常系', () => {
    it('対戦履歴が正しく作成される', async () => {
      const existingLogs: BattleLog[] = [];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      const result = await service.createBattleLog(input);

      expect(result.id).toBe('log_20250124_001');
      expect(result.date).toBe('2025-01-24');
      expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledWith([result]);
    });

    it('日付が省略された場合は今日の日付が使用される', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const input = {
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      const result = await service.createBattleLog(input as any);
      const today = new Date().toISOString().split('T')[0];

      expect(result.date).toBe(today);
    });
  });

  describe('異常系', () => {
    it('未来日付の場合エラー', async () => {
      const input = {
        date: '2099-12-31',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      await expect(service.createBattleLog(input)).rejects.toThrow('未来の日付は入力できません');
    });

    it('必須項目が欠けている場合エラー', async () => {
      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        // rank が欠けている
      };

      await expect(service.createBattleLog(input as any)).rejects.toThrow();
    });

    it('不正なenum値の場合エラー', async () => {
      const input = {
        date: '2025-01-24',
        battleType: '不正なタイプ',
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      await expect(service.createBattleLog(input as any)).rejects.toThrow('対戦タイプが不正です');
    });
  });

  describe('ID生成', () => {
    it('連番が正しく生成される', async () => {
      const existingLogs: BattleLog[] = [
        { id: 'log_20250124_001', date: '2025-01-24', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
        { id: 'log_20250124_002', date: '2025-01-24', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
      ];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      const result = await service.createBattleLog(input);

      expect(result.id).toBe('log_20250124_003');
    });

    it('既存の最大IDから+1される', async () => {
      const existingLogs: BattleLog[] = [
        { id: 'log_20250124_005', date: '2025-01-24', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
      ];
      mockBlobClient.getBattleLogs.mockResolvedValue(existingLogs);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      const result = await service.createBattleLog(input);

      expect(result.id).toBe('log_20250124_006');
    });
  });

  describe('Blob Storage', () => {
    it('保存失敗時にエラーがスローされる', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      mockBlobClient.saveBattleLogs.mockRejectedValue(new Error('Storage error'));

      const input = {
        date: '2025-01-24',
        battleType: 'ランクマッチ' as const,
        rank: 'ダイアモンド' as const,
        group: 'AAA' as const,
        myDeckId: 'deck_001',
        turn: '先攻' as const,
        result: '勝ち' as const,
        opponentDeckId: 'deck_master_002',
      };

      await expect(service.createBattleLog(input)).rejects.toThrow('Storage error');
    });
  });
});
```

##### 2. 統合テスト

`backend/tests/integration/battle-logs.test.ts` を作成:

```typescript
import { InvocationContext } from "@azure/functions";
import { createBattleLog } from '../../src/functions/battle-logs';

describe('POST /api/battle-logs - 統合テスト', () => {
  it('APIエンドポイントが正しく動作する', async () => {
    const request = {
      json: async () => ({
        date: '2025-01-24',
        battleType: 'ランクマッチ',
        rank: 'ダイアモンド',
        group: 'AAA',
        myDeckId: 'deck_001',
        turn: '先攻',
        result: '勝ち',
        opponentDeckId: 'deck_master_002',
      }),
    } as any;

    const context = {
      invocationId: 'test-invocation-id',
      error: jest.fn(),
    } as any;

    const response = await createBattleLog.handler(request, context);

    expect(response.status).toBe(201);
    expect(response.jsonBody.success).toBe(true);
    expect(response.jsonBody.data.battleLog.id).toMatch(/^log_\d{8}_\d{3}$/);
  });
});
```

#### 完了条件

- [x] POST /api/battle-logs エンドポイントが実装されている
- [x] Zodバリデーションが正しく動作する
- [x] 未来日付が拒否される
- [x] ID自動生成が正しく動作する (log_YYYYMMDD_NNN形式)
- [x] Blob Storageへの保存が成功する
- [x] 単体テストが100%成功する (26ケース - 7ケース以上達成)
- [x] 統合テストが成功する
- [x] Biome lintエラーが0件
- [x] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete
```

---

### TASK-0008: Battle Log CRUD API実装 - 一覧取得・削除機能 ✅ **完了** (TDD開発完了 - 14テストケース全通過)

- [x] **タスク完了**
- **推定工数**: 8時間
- **実績工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-101 (一覧表示), REQ-103 (ソート), REQ-105 (削除), REQ-106 (デッキ名表示) 🔵
- **依存タスク**: TASK-0007 ✅
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム
- **完了日**: 2025-10-31
- **品質評価**: ⭐⭐⭐⭐⭐ (5/5)
- **信頼性レベル**: 🔵 *REQ-101, REQ-103, REQ-105より*

#### 実装詳細

##### 1. 一覧取得エンドポイント実装

**エンドポイント**: `GET /api/battle-logs`

`backend/src/services/battleLogService.ts` に追加:

```typescript
/**
 * 対戦履歴一覧を取得
 */
async getBattleLogs(params: {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ battleLogs: BattleLog[]; total: number; limit: number; offset: number }> {
  const { limit = 100, offset = 0, sortBy = 'date', sortOrder = 'desc' } = params;

  // バリデーション
  if (limit < 1 || limit > 1000) {
    throw new Error('limitは1から1000の間で指定してください');
  }

  if (offset < 0) {
    throw new Error('offsetは0以上で指定してください');
  }

  // データ取得
  let battleLogs = await this.blobClient.getBattleLogs();

  // ソート
  battleLogs.sort((a, b) => {
    const aVal = a[sortBy as keyof BattleLog];
    const bVal = b[sortBy as keyof BattleLog];

    if (sortOrder === 'desc') {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    } else {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    }
  });

  // ページネーション
  const total = battleLogs.length;
  const paginatedLogs = battleLogs.slice(offset, offset + limit);

  return {
    battleLogs: paginatedLogs,
    total,
    limit,
    offset,
  };
}
```

##### 2. デッキ名のjoin処理 🔵 *REQ-106より*

```typescript
/**
 * 対戦履歴にデッキ名を付与
 */
async getBattleLogsWithDeckNames(params: {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ battleLogs: any[]; total: number; limit: number; offset: number }> {
  const result = await this.getBattleLogs(params);

  // デッキマスターとマイデッキを取得
  const [deckMasters, myDecks] = await Promise.all([
    this.blobClient.getDeckMasters(),
    this.blobClient.getMyDecks(),
  ]);

  // デッキ名をマッピング
  const deckMasterMap = new Map(deckMasters.map((d) => [d.id, d.deckName]));
  const myDeckMap = new Map(myDecks.map((d) => [d.id, d.deckName]));

  // 対戦履歴にデッキ名を付与
  const battleLogsWithNames = result.battleLogs.map((log) => ({
    ...log,
    myDeckName: myDeckMap.get(log.myDeckId) || '不明なデッキ',
    opponentDeckName: deckMasterMap.get(log.opponentDeckId) || '不明なデッキ',
  }));

  return {
    ...result,
    battleLogs: battleLogsWithNames,
  };
}
```

##### 3. 削除エンドポイント実装 🔵 *REQ-105より*

**エンドポイント**: `DELETE /api/battle-logs/:id`

```typescript
/**
 * 対戦履歴を削除
 */
async deleteBattleLog(id: string): Promise<{ deletedId: string }> {
  // データ取得
  const battleLogs = await this.blobClient.getBattleLogs();

  // 削除対象を検索
  const index = battleLogs.findIndex((log) => log.id === id);

  if (index === -1) {
    throw new Error(`対戦履歴が見つかりません: ${id}`);
  }

  // 削除
  battleLogs.splice(index, 1);

  // 保存
  await this.blobClient.saveBattleLogs(battleLogs);

  return { deletedId: id };
}
```

##### 4. Azure Functions エンドポイント追加

`backend/src/functions/battle-logs.ts` に追加:

```typescript
// GET /api/battle-logs
app.http("getBattleLogs", {
  methods: ["GET"],
  route: "battle-logs",
  authLevel: "anonymous",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const limit = parseInt(request.query.get("limit") || "100");
      const offset = parseInt(request.query.get("offset") || "0");
      const sortBy = request.query.get("sortBy") || "date";
      const sortOrder = (request.query.get("sortOrder") || "desc") as 'asc' | 'desc';

      const result = await battleLogService.getBattleLogsWithDeckNames({
        limit,
        offset,
        sortBy,
        sortOrder,
      });

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: result,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    } catch (error) {
      context.error("Error in getBattleLogs:", error);

      if (error instanceof Error && error.message.includes('limitは')) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: {
              code: "INVALID_LIMIT",
              message: error.message,
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: context.invocationId,
            },
          },
        };
      }

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "サーバーエラーが発生しました",
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    }
  },
});
```

`backend/src/functions/battle-log-detail.ts` を作成:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobStorageClient } from '../storage/blobStorageClient';
import { BattleLogService } from '../services/battleLogService';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = 'shadowverse-data';
const blobClient = new BlobStorageClient(connectionString, containerName);
const battleLogService = new BattleLogService(blobClient);

// DELETE /api/battle-logs/{id}
app.http("deleteBattleLog", {
  methods: ["DELETE"],
  route: "battle-logs/{id}",
  authLevel: "anonymous",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const id = request.params.id;

      if (!id) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: {
              code: "INVALID_REQUEST",
              message: "IDが指定されていません",
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: context.invocationId,
            },
          },
        };
      }

      const result = await battleLogService.deleteBattleLog(id);

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: result,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    } catch (error) {
      context.error("Error in deleteBattleLog:", error);

      if (error instanceof Error && error.message.includes('見つかりません')) {
        return {
          status: 404,
          jsonBody: {
            success: false,
            error: {
              code: "BATTLE_LOG_NOT_FOUND",
              message: "指定された対戦履歴が見つかりません",
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: context.invocationId,
            },
          },
        };
      }

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "サーバーエラーが発生しました",
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    }
  },
});
```

#### テスト要件

##### 1. 単体テスト (Jest)

`backend/tests/services/battleLogService.test.ts` に追加:

```typescript
describe('BattleLogService - getBattleLogs', () => {
  it('対戦履歴一覧が取得できる', async () => {
    const mockLogs: BattleLog[] = [
      { id: 'log_20250124_001', date: '2025-01-24', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
      { id: 'log_20250123_001', date: '2025-01-23', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '負け', opponentDeckId: 'deck_master_003' },
    ];
    mockBlobClient.getBattleLogs.mockResolvedValue(mockLogs);

    const result = await service.getBattleLogs({ limit: 100, offset: 0, sortBy: 'date', sortOrder: 'desc' });

    expect(result.battleLogs).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.battleLogs[0].date).toBe('2025-01-24'); // 降順
  });

  it('limit/offsetでページネーションできる', async () => {
    const mockLogs: BattleLog[] = Array.from({ length: 10 }, (_, i) => ({
      id: `log_202501${String(24 - i).padStart(2, '0')}_001`,
      date: `2025-01-${String(24 - i).padStart(2, '0')}`,
      battleType: 'ランクマッチ' as const,
      rank: 'ダイアモンド' as const,
      group: 'AAA' as const,
      myDeckId: 'deck_001',
      turn: '先攻' as const,
      result: '勝ち' as const,
      opponentDeckId: 'deck_master_002',
    }));
    mockBlobClient.getBattleLogs.mockResolvedValue(mockLogs);

    const result = await service.getBattleLogs({ limit: 5, offset: 5, sortBy: 'date', sortOrder: 'desc' });

    expect(result.battleLogs).toHaveLength(5);
    expect(result.offset).toBe(5);
  });

  it('limitが範囲外の場合エラー', async () => {
    await expect(service.getBattleLogs({ limit: 1001 })).rejects.toThrow('limitは1から1000の間で指定してください');
  });
});

describe('BattleLogService - getBattleLogsWithDeckNames', () => {
  it('デッキ名が正しく付与される', async () => {
    const mockLogs: BattleLog[] = [
      { id: 'log_20250124_001', date: '2025-01-24', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
    ];
    const mockDeckMasters = [
      { id: 'deck_master_002', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
    ];
    const mockMyDecks = [
      { id: 'deck_001', deckId: '1', deckCode: '3.1.3.1...', deckName: '秘術オデンスペル', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' },
    ];

    mockBlobClient.getBattleLogs.mockResolvedValue(mockLogs);
    mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);
    mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

    const result = await service.getBattleLogsWithDeckNames({});

    expect(result.battleLogs[0].myDeckName).toBe('秘術オデンスペル');
    expect(result.battleLogs[0].opponentDeckName).toBe('進化ネクロ');
  });

  it('存在しないデッキIDの場合「不明なデッキ」と表示される', async () => {
    const mockLogs: BattleLog[] = [
      { id: 'log_20250124_001', date: '2025-01-24', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_999', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_999' },
    ];

    mockBlobClient.getBattleLogs.mockResolvedValue(mockLogs);
    mockBlobClient.getDeckMasters.mockResolvedValue([]);
    mockBlobClient.getMyDecks.mockResolvedValue([]);

    const result = await service.getBattleLogsWithDeckNames({});

    expect(result.battleLogs[0].myDeckName).toBe('不明なデッキ');
    expect(result.battleLogs[0].opponentDeckName).toBe('不明なデッキ');
  });
});

describe('BattleLogService - deleteBattleLog', () => {
  it('対戦履歴が削除できる', async () => {
    const mockLogs: BattleLog[] = [
      { id: 'log_20250124_001', date: '2025-01-24', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
    ];
    mockBlobClient.getBattleLogs.mockResolvedValue(mockLogs);
    mockBlobClient.saveBattleLogs.mockResolvedValue();

    const result = await service.deleteBattleLog('log_20250124_001');

    expect(result.deletedId).toBe('log_20250124_001');
    expect(mockBlobClient.saveBattleLogs).toHaveBeenCalledWith([]);
  });

  it('存在しないIDの場合エラー', async () => {
    mockBlobClient.getBattleLogs.mockResolvedValue([]);

    await expect(service.deleteBattleLog('log_99999999_999')).rejects.toThrow('対戦履歴が見つかりません');
  });
});
```

#### 完了条件

- [ ] GET /api/battle-logs エンドポイントが実装されている
- [ ] クエリパラメータ (limit, offset, sortBy, sortOrder) が正しく処理される
- [ ] デッキ名のjoin処理が正しく動作する
- [ ] DELETE /api/battle-logs/:id エンドポイントが実装されている
- [ ] 削除確認ロジックが動作する
- [ ] 単体テストが100%成功する (8ケース以上)
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete
```

---

### TASK-0009: Deck Master API実装 ✅ **完了** (TDD開発完了 - 6テストケース全通過)

- [x] **タスク完了**
- **推定工数**: 8時間
- **実績工数**: 6時間
- **タスクタイプ**: TDD
- **要件**: REQ-002 (デッキ選択肢)
- **依存タスク**: TASK-0006
- **信頼性レベル**: 🔵 *REQ-002より*
- **完了日**: 2025-11-01
- **品質評価**: ⭐⭐⭐⭐⭐ (5/5)

#### 実装詳細

##### 1. Deck Master Service実装

`backend/src/services/deckMasterService.ts` を作成:

```typescript
import { BlobStorageClient } from '../storage/blobStorageClient';
import { DeckMaster } from '../types';

export class DeckMasterService {
  private cache: { data: DeckMaster[]; timestamp: number } | null = null;
  private cacheTTL = 5 * 60 * 1000; // 5分

  constructor(private blobClient: BlobStorageClient) {}

  /**
   * デッキマスター一覧を取得（キャッシュ付き）
   */
  async getDeckMasters(sortOrder: 'asc' | 'desc' = 'asc'): Promise<DeckMaster[]> {
    const now = Date.now();

    // キャッシュチェック
    if (this.cache && now - this.cache.timestamp < this.cacheTTL) {
      return this.sortDeckMasters(this.cache.data, sortOrder);
    }

    // データ取得
    const deckMasters = await this.blobClient.getDeckMasters();

    // キャッシュ更新
    this.cache = {
      data: deckMasters,
      timestamp: now,
    };

    return this.sortDeckMasters(deckMasters, sortOrder);
  }

  /**
   * デッキマスターをソート
   */
  private sortDeckMasters(deckMasters: DeckMaster[], sortOrder: 'asc' | 'desc'): DeckMaster[] {
    const sorted = [...deckMasters].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.sortOrder - b.sortOrder;
      } else {
        return b.sortOrder - a.sortOrder;
      }
    });

    return sorted;
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache = null;
  }
}
```

##### 2. Azure Functions エンドポイント実装

`backend/src/functions/deck-master.ts` を作成:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobStorageClient } from '../storage/blobStorageClient';
import { DeckMasterService } from '../services/deckMasterService';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = 'shadowverse-data';
const blobClient = new BlobStorageClient(connectionString, containerName);
const deckMasterService = new DeckMasterService(blobClient);

// GET /api/deck-master
app.http("getDeckMaster", {
  methods: ["GET"],
  route: "deck-master",
  authLevel: "anonymous",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const sortOrder = (request.query.get("sortOrder") || "asc") as 'asc' | 'desc';
      const deckMasters = await deckMasterService.getDeckMasters(sortOrder);

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: { deckMaster: deckMasters },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    } catch (error) {
      context.error("Error in getDeckMaster:", error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "サーバーエラーが発生しました",
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    }
  },
});
```

#### テスト要件

##### 1. 単体テスト (Jest)

`backend/tests/services/deckMasterService.test.ts` を作成:

```typescript
import { DeckMasterService } from '../../src/services/deckMasterService';
import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import { DeckMaster } from '../../src/types';

jest.mock('../../src/storage/blobStorageClient');

describe('DeckMasterService', () => {
  let service: DeckMasterService;
  let mockBlobClient: jest.Mocked<BlobStorageClient>;

  beforeEach(() => {
    mockBlobClient = new BlobStorageClient('', '') as jest.Mocked<BlobStorageClient>;
    service = new DeckMasterService(mockBlobClient);
  });

  describe('getDeckMasters', () => {
    const mockDeckMasters: DeckMaster[] = [
      { id: '1', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 3 },
      { id: '2', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 1 },
      { id: '3', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
    ];

    it('デッキマスター一覧が取得できる', async () => {
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      const result = await service.getDeckMasters();

      expect(result).toHaveLength(3);
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1);
    });

    it('sortOrder=ascでソートされる', async () => {
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      const result = await service.getDeckMasters('asc');

      expect(result[0].sortOrder).toBe(1);
      expect(result[1].sortOrder).toBe(2);
      expect(result[2].sortOrder).toBe(3);
    });

    it('sortOrder=descでソートされる', async () => {
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      const result = await service.getDeckMasters('desc');

      expect(result[0].sortOrder).toBe(3);
      expect(result[1].sortOrder).toBe(2);
      expect(result[2].sortOrder).toBe(1);
    });

    it('キャッシュが5分間有効', async () => {
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      // 1回目
      await service.getDeckMasters();
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1);

      // 2回目（キャッシュから取得）
      await service.getDeckMasters();
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1); // 呼ばれない
    });

    it('キャッシュクリア後は再取得される', async () => {
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);

      // 1回目
      await service.getDeckMasters();
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(1);

      // キャッシュクリア
      service.clearCache();

      // 2回目（再取得）
      await service.getDeckMasters();
      expect(mockBlobClient.getDeckMasters).toHaveBeenCalledTimes(2);
    });
  });
});
```

#### 完了条件

- [ ] GET /api/deck-master エンドポイントが実装されている
- [ ] Blob Storage からdeck-master.jsonが取得できる
- [ ] ソート処理 (sortOrder) が正しく動作する
- [ ] キャッシュ機構 (5分TTL) が実装されている
- [ ] 単体テストが100%成功する (5ケース以上)
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete
```

---

### TASK-0010: Statistics API実装 - 基本統計

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-203 (統計情報表示), REQ-202 (期間フィルタ)
- **依存タスク**: TASK-0007
- **信頼性レベル**: 🔵 *REQ-203, REQ-202より*

#### 実装詳細

##### 1. Statistics Service実装

`backend/src/services/statisticsService.ts` を作成:

```typescript
import { BlobStorageClient } from '../storage/blobStorageClient';
import { BattleLog, Rank, Group } from '../types';

export interface StatisticsParams {
  startDate?: string;
  endDate?: string;
  battleType?: string;
}

export interface OverallStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface DeckStats {
  deckId: string;
  deckName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface RankStats {
  rank: Rank;
  group: Group;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface TurnStats {
  先攻: OverallStats;
  後攻: OverallStats;
}

export interface StatisticsResponse {
  overall: OverallStats;
  byMyDeck: DeckStats[];
  byOpponentDeck: DeckStats[];
  byRank: RankStats[];
  byTurn: TurnStats;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export class StatisticsService {
  constructor(private blobClient: BlobStorageClient) {}

  /**
   * 統計データを計算
   */
  async calculateStatistics(params: StatisticsParams): Promise<StatisticsResponse> {
    // デフォルト期間: 直近7日間
    const endDate = params.endDate || new Date().toISOString().split('T')[0];
    const startDate = params.startDate || this.getDateBeforeDays(endDate, 7);

    // データ取得
    const [battleLogs, deckMasters, myDecks] = await Promise.all([
      this.blobClient.getBattleLogs(),
      this.blobClient.getDeckMasters(),
      this.blobClient.getMyDecks(),
    ]);

    // フィルタリング
    const filteredLogs = this.filterBattleLogs(battleLogs, { startDate, endDate, battleType: params.battleType });

    // 統計計算
    const overall = this.calculateOverall(filteredLogs);
    const byMyDeck = this.calculateByMyDeck(filteredLogs, myDecks);
    const byOpponentDeck = this.calculateByOpponentDeck(filteredLogs, deckMasters);
    const byRank = this.calculateByRank(filteredLogs);
    const byTurn = this.calculateByTurn(filteredLogs);

    return {
      overall,
      byMyDeck,
      byOpponentDeck,
      byRank,
      byTurn,
      dateRange: { startDate, endDate },
    };
  }

  /**
   * 対戦履歴をフィルタリング
   */
  private filterBattleLogs(logs: BattleLog[], params: StatisticsParams): BattleLog[] {
    return logs.filter((log) => {
      // 期間フィルタ
      if (params.startDate && log.date < params.startDate) return false;
      if (params.endDate && log.date > params.endDate) return false;

      // 対戦タイプフィルタ
      if (params.battleType && log.battleType !== params.battleType) return false;

      return true;
    });
  }

  /**
   * 全体統計を計算
   */
  private calculateOverall(logs: BattleLog[]): OverallStats {
    const totalGames = logs.length;
    const wins = logs.filter((log) => log.result === '勝ち').length;
    const losses = totalGames - wins;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0;

    return { totalGames, wins, losses, winRate };
  }

  /**
   * マイデッキ別統計を計算
   */
  private calculateByMyDeck(logs: BattleLog[], myDecks: any[]): DeckStats[] {
    const deckMap = new Map<string, DeckStats>();

    logs.forEach((log) => {
      if (!deckMap.has(log.myDeckId)) {
        const deckName = myDecks.find((d) => d.id === log.myDeckId)?.deckName || '不明なデッキ';
        deckMap.set(log.myDeckId, {
          deckId: log.myDeckId,
          deckName,
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        });
      }

      const stats = deckMap.get(log.myDeckId)!;
      stats.totalGames++;
      if (log.result === '勝ち') {
        stats.wins++;
      } else {
        stats.losses++;
      }
    });

    // 勝率計算
    deckMap.forEach((stats) => {
      stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 1000) / 10 : 0;
    });

    return Array.from(deckMap.values()).sort((a, b) => b.totalGames - a.totalGames);
  }

  /**
   * 相手デッキ別統計を計算
   */
  private calculateByOpponentDeck(logs: BattleLog[], deckMasters: any[]): DeckStats[] {
    const deckMap = new Map<string, DeckStats>();

    logs.forEach((log) => {
      if (!deckMap.has(log.opponentDeckId)) {
        const deckName = deckMasters.find((d) => d.id === log.opponentDeckId)?.deckName || '不明なデッキ';
        deckMap.set(log.opponentDeckId, {
          deckId: log.opponentDeckId,
          deckName,
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        });
      }

      const stats = deckMap.get(log.opponentDeckId)!;
      stats.totalGames++;
      if (log.result === '勝ち') {
        stats.wins++;
      } else {
        stats.losses++;
      }
    });

    // 勝率計算
    deckMap.forEach((stats) => {
      stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 1000) / 10 : 0;
    });

    return Array.from(deckMap.values()).sort((a, b) => b.totalGames - a.totalGames);
  }

  /**
   * ランク帯別統計を計算
   */
  private calculateByRank(logs: BattleLog[]): RankStats[] {
    const rankMap = new Map<string, RankStats>();

    logs.forEach((log) => {
      const key = `${log.rank}_${log.group}`;

      if (!rankMap.has(key)) {
        rankMap.set(key, {
          rank: log.rank,
          group: log.group,
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        });
      }

      const stats = rankMap.get(key)!;
      stats.totalGames++;
      if (log.result === '勝ち') {
        stats.wins++;
      } else {
        stats.losses++;
      }
    });

    // 勝率計算
    rankMap.forEach((stats) => {
      stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 1000) / 10 : 0;
    });

    return Array.from(rankMap.values()).sort((a, b) => b.totalGames - a.totalGames);
  }

  /**
   * 先行後攻別統計を計算
   */
  private calculateByTurn(logs: BattleLog[]): TurnStats {
    const turnStats: TurnStats = {
      先攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
      後攻: { totalGames: 0, wins: 0, losses: 0, winRate: 0 },
    };

    logs.forEach((log) => {
      const stats = turnStats[log.turn];
      stats.totalGames++;
      if (log.result === '勝ち') {
        stats.wins++;
      } else {
        stats.losses++;
      }
    });

    // 勝率計算
    turnStats.先攻.winRate = turnStats.先攻.totalGames > 0
      ? Math.round((turnStats.先攻.wins / turnStats.先攻.totalGames) * 1000) / 10
      : 0;
    turnStats.後攻.winRate = turnStats.後攻.totalGames > 0
      ? Math.round((turnStats.後攻.wins / turnStats.後攻.totalGames) * 1000) / 10
      : 0;

    return turnStats;
  }

  /**
   * N日前の日付を取得
   */
  private getDateBeforeDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}
```

##### 2. Azure Functions エンドポイント実装

`backend/src/functions/statistics.ts` を作成:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobStorageClient } from '../storage/blobStorageClient';
import { StatisticsService } from '../services/statisticsService';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = 'shadowverse-data';
const blobClient = new BlobStorageClient(connectionString, containerName);
const statisticsService = new StatisticsService(blobClient);

// GET /api/statistics
app.http("getStatistics", {
  methods: ["GET"],
  route: "statistics",
  authLevel: "anonymous",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const startDate = request.query.get("startDate") || undefined;
      const endDate = request.query.get("endDate") || undefined;
      const battleType = request.query.get("battleType") || undefined;

      const statistics = await statisticsService.calculateStatistics({
        startDate,
        endDate,
        battleType,
      });

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: statistics,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    } catch (error) {
      context.error("Error in getStatistics:", error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "サーバーエラーが発生しました",
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    }
  },
});
```

#### テスト要件

##### 1. 単体テスト (Jest)

`backend/tests/services/statisticsService.test.ts` を作成:

```typescript
import { StatisticsService } from '../../src/services/statisticsService';
import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import { BattleLog } from '../../src/types';

jest.mock('../../src/storage/blobStorageClient');

describe('StatisticsService', () => {
  let service: StatisticsService;
  let mockBlobClient: jest.Mocked<BlobStorageClient>;

  beforeEach(() => {
    mockBlobClient = new BlobStorageClient('', '') as jest.Mocked<BlobStorageClient>;
    service = new StatisticsService(mockBlobClient);
  });

  const mockBattleLogs: BattleLog[] = [
    { id: '1', date: '2025-01-20', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
    { id: '2', date: '2025-01-21', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '負け', opponentDeckId: 'deck_master_003' },
    { id: '3', date: '2025-01-22', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
  ];

  const mockDeckMasters = [
    { id: 'deck_master_002', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
    { id: 'deck_master_003', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 3 },
  ];

  const mockMyDecks = [
    { id: 'deck_001', deckId: '1', deckCode: '3.1.3.1...', deckName: '秘術オデンスペル', isActive: true, createdAt: '2024-01-01T00:00:00.000Z' },
  ];

  describe('calculateStatistics', () => {
    it('全体統計が正しく計算される', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);
      mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

      const result = await service.calculateStatistics({});

      expect(result.overall.totalGames).toBe(3);
      expect(result.overall.wins).toBe(2);
      expect(result.overall.losses).toBe(1);
      expect(result.overall.winRate).toBe(66.7);
    });

    it('デッキ別統計が正しく計算される', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);
      mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

      const result = await service.calculateStatistics({});

      expect(result.byMyDeck).toHaveLength(1);
      expect(result.byMyDeck[0].deckName).toBe('秘術オデンスペル');
      expect(result.byMyDeck[0].totalGames).toBe(3);
      expect(result.byMyDeck[0].winRate).toBe(66.7);
    });

    it('相手デッキ別統計が正しく計算される', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);
      mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

      const result = await service.calculateStatistics({});

      expect(result.byOpponentDeck).toHaveLength(2);
      expect(result.byOpponentDeck[0].totalGames).toBeGreaterThanOrEqual(result.byOpponentDeck[1].totalGames);
    });

    it('ランク帯別統計が正しく計算される', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);
      mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

      const result = await service.calculateStatistics({});

      expect(result.byRank).toHaveLength(1);
      expect(result.byRank[0].rank).toBe('ダイアモンド');
      expect(result.byRank[0].group).toBe('AAA');
    });

    it('先行後攻別統計が正しく計算される', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);
      mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

      const result = await service.calculateStatistics({});

      expect(result.byTurn.先攻.totalGames).toBe(2);
      expect(result.byTurn.先攻.wins).toBe(2);
      expect(result.byTurn.先攻.winRate).toBe(100);
      expect(result.byTurn.後攻.totalGames).toBe(1);
      expect(result.byTurn.後攻.losses).toBe(1);
    });

    it('期間フィルタが正しく動作する', async () => {
      mockBlobClient.getBattleLogs.mockResolvedValue(mockBattleLogs);
      mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);
      mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

      const result = await service.calculateStatistics({
        startDate: '2025-01-21',
        endDate: '2025-01-21',
      });

      expect(result.overall.totalGames).toBe(1);
      expect(result.dateRange.startDate).toBe('2025-01-21');
      expect(result.dateRange.endDate).toBe('2025-01-21');
    });
  });
});
```

#### 完了条件

- [ ] GET /api/statistics エンドポイントが実装されている
- [ ] 期間フィルタリング (startDate, endDate) が正しく動作する
- [ ] 全体勝率計算 (total, wins, losses, winRate) が正しく動作する
- [ ] デッキ別勝率計算 (自分のデッキ、相手デッキ) が正しく動作する
- [ ] ランク帯別成績計算が正しく動作する
- [ ] 単体テストが100%成功する (6ケース以上)
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete
```

---

### TASK-0011: Statistics API実装 - 分布データ

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-204 (円グラフ), NFR-001 (3秒以内)
- **依存タスク**: TASK-0010
- **信頼性レベル**: 🔵 *REQ-204より*

#### 実装詳細

##### 1. 対戦相手デッキ分布計算

`backend/src/services/statisticsService.ts` に追加:

```typescript
export interface OpponentDeckDistribution {
  deckId: string;
  deckName: string;
  count: number;
  percentage: number;
}

// StatisticsResponse に追加
export interface StatisticsResponse {
  // ... 既存のフィールド
  opponentDeckDistribution: OpponentDeckDistribution[];
}

// StatisticsService クラスに追加
/**
 * 対戦相手デッキ分布を計算
 */
private calculateOpponentDeckDistribution(logs: BattleLog[], deckMasters: any[]): OpponentDeckDistribution[] {
  const totalGames = logs.length;
  const deckCountMap = new Map<string, number>();

  logs.forEach((log) => {
    const count = deckCountMap.get(log.opponentDeckId) || 0;
    deckCountMap.set(log.opponentDeckId, count + 1);
  });

  const distribution: OpponentDeckDistribution[] = [];

  deckCountMap.forEach((count, deckId) => {
    const deckName = deckMasters.find((d) => d.id === deckId)?.deckName || '不明なデッキ';
    const percentage = totalGames > 0 ? Math.round((count / totalGames) * 1000) / 10 : 0;

    distribution.push({
      deckId,
      deckName,
      count,
      percentage,
    });
  });

  return distribution.sort((a, b) => b.count - a.count);
}
```

##### 2. calculateStatistics メソッドを更新

```typescript
async calculateStatistics(params: StatisticsParams): Promise<StatisticsResponse> {
  // ... 既存のコード

  // 統計計算
  const overall = this.calculateOverall(filteredLogs);
  const byMyDeck = this.calculateByMyDeck(filteredLogs, myDecks);
  const byOpponentDeck = this.calculateByOpponentDeck(filteredLogs, deckMasters);
  const byRank = this.calculateByRank(filteredLogs);
  const byTurn = this.calculateByTurn(filteredLogs);
  const opponentDeckDistribution = this.calculateOpponentDeckDistribution(filteredLogs, deckMasters); // 追加

  return {
    overall,
    byMyDeck,
    byOpponentDeck,
    byRank,
    byTurn,
    opponentDeckDistribution, // 追加
    dateRange: { startDate, endDate },
  };
}
```

##### 3. パフォーマンス最適化 🔵 *NFR-001より*

```typescript
/**
 * 統計データを計算（パフォーマンス最適化版）
 */
async calculateStatistics(params: StatisticsParams): Promise<StatisticsResponse> {
  const startTime = Date.now();

  // ... 既存のコード

  const endTime = Date.now();
  const duration = endTime - startTime;

  // パフォーマンスログ
  if (duration > 3000) {
    console.warn(`Statistics calculation took ${duration}ms (> 3000ms)`);
  }

  return result;
}
```

#### テスト要件

##### 1. 単体テスト (Jest)

`backend/tests/services/statisticsService.test.ts` に追加:

```typescript
describe('StatisticsService - opponentDeckDistribution', () => {
  it('対戦相手デッキ分布が正しく計算される', async () => {
    const logs: BattleLog[] = [
      { id: '1', date: '2025-01-20', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
      { id: '2', date: '2025-01-21', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '負け', opponentDeckId: 'deck_master_002' },
      { id: '3', date: '2025-01-22', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_003' },
    ];

    mockBlobClient.getBattleLogs.mockResolvedValue(logs);
    mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);
    mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

    const result = await service.calculateStatistics({});

    expect(result.opponentDeckDistribution).toHaveLength(2);
    expect(result.opponentDeckDistribution[0].count).toBe(2);
    expect(result.opponentDeckDistribution[0].percentage).toBe(66.7);
    expect(result.opponentDeckDistribution[1].count).toBe(1);
    expect(result.opponentDeckDistribution[1].percentage).toBe(33.3);
  });

  it('パーセンテージの合計が100%になる', async () => {
    const logs: BattleLog[] = [
      { id: '1', date: '2025-01-20', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_002' },
      { id: '2', date: '2025-01-21', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '後攻', result: '負け', opponentDeckId: 'deck_master_003' },
      { id: '3', date: '2025-01-22', battleType: 'ランクマッチ', rank: 'ダイアモンド', group: 'AAA', myDeckId: 'deck_001', turn: '先攻', result: '勝ち', opponentDeckId: 'deck_master_004' },
    ];

    mockBlobClient.getBattleLogs.mockResolvedValue(logs);
    mockBlobClient.getDeckMasters.mockResolvedValue([
      { id: 'deck_master_002', className: 'ネクロマンサー', deckName: '進化ネクロ', sortOrder: 2 },
      { id: 'deck_master_003', className: 'ロイヤル', deckName: 'ミッドレンジロイヤル', sortOrder: 3 },
      { id: 'deck_master_004', className: 'ウィッチ', deckName: '土スペルウィッチ', sortOrder: 4 },
    ]);
    mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

    const result = await service.calculateStatistics({});

    const totalPercentage = result.opponentDeckDistribution.reduce((sum, item) => sum + item.percentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 1); // 許容誤差 0.1%
  });
});

describe('StatisticsService - performance', () => {
  it('1000件のデータを3秒以内に処理できる', async () => {
    const largeLogs: BattleLog[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `log_${i}`,
      date: '2025-01-20',
      battleType: 'ランクマッチ' as const,
      rank: 'ダイアモンド' as const,
      group: 'AAA' as const,
      myDeckId: 'deck_001',
      turn: (i % 2 === 0 ? '先攻' : '後攻') as const,
      result: (i % 2 === 0 ? '勝ち' : '負け') as const,
      opponentDeckId: `deck_master_${i % 10}`,
    }));

    mockBlobClient.getBattleLogs.mockResolvedValue(largeLogs);
    mockBlobClient.getDeckMasters.mockResolvedValue(mockDeckMasters);
    mockBlobClient.getMyDecks.mockResolvedValue(mockMyDecks);

    const startTime = Date.now();
    await service.calculateStatistics({});
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(3000);
  }, 10000); // テストタイムアウト: 10秒
});
```

#### 完了条件

- [ ] 対戦相手デッキ分布計算 (円グラフ用) が実装されている
- [ ] パーセンテージの合計が100%になる
- [ ] パフォーマンス最適化 (1000件で3秒以内) が達成されている
- [ ] 単体テストが100%成功する (3ケース以上)
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete
```

---

### TASK-0012: Import API実装

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-301 (JSON), REQ-302 (CSV), REQ-303 (バリデーション)
- **依存タスク**: TASK-0007
- **信頼性レベル**: 🔵 *REQ-301, REQ-302より*

#### 実装詳細

##### 1. Import Service実装

`backend/src/services/importService.ts` を作成:

```typescript
import { BlobStorageClient } from '../storage/blobStorageClient';
import { BattleLog } from '../types';
import { createBattleLogSchema } from '../utils/validation';
import { ZodError } from 'zod';

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  details: {
    skippedIds?: string[];
    errorDetails?: Array<{ line: number; field: string; error: string }>;
  };
}

export class ImportService {
  constructor(private blobClient: BlobStorageClient) {}

  /**
   * JSONデータをインポート
   */
  async importFromJson(jsonData: string): Promise<ImportResult> {
    try {
      const data = JSON.parse(jsonData);

      if (!Array.isArray(data)) {
        throw new Error('JSONデータは配列である必要があります');
      }

      return await this.importBattleLogs(data);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('無効なJSON形式です');
      }
      throw error;
    }
  }

  /**
   * CSVデータをインポート
   */
  async importFromCsv(csvData: string): Promise<ImportResult> {
    const lines = csvData.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('CSVデータが空です');
    }

    // ヘッダー行を解析
    const headers = lines[0].split(',').map((h) => h.trim());

    // 必須ヘッダーの確認
    const requiredHeaders = ['date', 'battleType', 'rank', 'group', 'myDeckId', 'turn', 'result', 'opponentDeckId'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`必須ヘッダーが不足しています: ${missingHeaders.join(', ')}`);
    }

    // データ行を解析
    const battleLogs: any[] = [];
    const errorDetails: Array<{ line: number; field: string; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());

      if (values.length !== headers.length) {
        errorDetails.push({
          line: i + 1,
          field: 'all',
          error: 'カラム数が一致しません',
        });
        continue;
      }

      const log: any = {};
      headers.forEach((header, index) => {
        log[header] = values[index];
      });

      battleLogs.push(log);
    }

    if (errorDetails.length > 0) {
      return {
        imported: 0,
        skipped: 0,
        errors: errorDetails.length,
        details: { errorDetails },
      };
    }

    return await this.importBattleLogs(battleLogs);
  }

  /**
   * 対戦履歴をインポート（共通処理）
   */
  private async importBattleLogs(data: any[]): Promise<ImportResult> {
    const existingLogs = await this.blobClient.getBattleLogs();
    const existingIds = new Set(existingLogs.map((log) => log.id));

    const imported: BattleLog[] = [];
    const skippedIds: string[] = [];
    const errorDetails: Array<{ line: number; field: string; error: string }> = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      try {
        // バリデーション
        const validatedData = createBattleLogSchema.parse(item);

        // ID重複チェック
        if (item.id && existingIds.has(item.id)) {
          skippedIds.push(item.id);
          continue;
        }

        // IDがない場合は自動生成（インポート時は必須にしない）
        const log: BattleLog = {
          id: item.id || `log_import_${Date.now()}_${i}`,
          ...validatedData,
        };

        imported.push(log);
        existingIds.add(log.id);
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach((err) => {
            errorDetails.push({
              line: i + 2, // ヘッダー行を考慮
              field: err.path.join('.'),
              error: err.message,
            });
          });
        } else {
          errorDetails.push({
            line: i + 2,
            field: 'unknown',
            error: error instanceof Error ? error.message : '不明なエラー',
          });
        }
      }
    }

    // データ保存
    if (imported.length > 0) {
      const updatedLogs = [...existingLogs, ...imported];
      await this.blobClient.saveBattleLogs(updatedLogs);
    }

    return {
      imported: imported.length,
      skipped: skippedIds.length,
      errors: errorDetails.length,
      details: {
        skippedIds: skippedIds.length > 0 ? skippedIds : undefined,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      },
    };
  }
}
```

##### 2. Azure Functions エンドポイント実装

`backend/src/functions/import.ts` を作成:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobStorageClient } from '../storage/blobStorageClient';
import { ImportService } from '../services/importService';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = 'shadowverse-data';
const blobClient = new BlobStorageClient(connectionString, containerName);
const importService = new ImportService(blobClient);

// POST /api/import
app.http("importData", {
  methods: ["POST"],
  route: "import",
  authLevel: "anonymous",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await request.json() as any;

      if (!body.format || !body.data) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: {
              code: "INVALID_REQUEST",
              message: "format と data は必須です",
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: context.invocationId,
            },
          },
        };
      }

      let result;

      if (body.format === 'json') {
        result = await importService.importFromJson(body.data);
      } else if (body.format === 'csv') {
        result = await importService.importFromCsv(body.data);
      } else {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: {
              code: "INVALID_FORMAT",
              message: "format は 'json' または 'csv' を指定してください",
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: context.invocationId,
            },
          },
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: result,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    } catch (error) {
      context.error("Error in importData:", error);

      if (error instanceof Error) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: {
              code: "INVALID_FORMAT",
              message: error.message,
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: context.invocationId,
            },
          },
        };
      }

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "サーバーエラーが発生しました",
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    }
  },
});
```

#### テスト要件

##### 1. 単体テスト (Jest)

`backend/tests/services/importService.test.ts` を作成:

```typescript
import { ImportService } from '../../src/services/importService';
import { BlobStorageClient } from '../../src/storage/blobStorageClient';

jest.mock('../../src/storage/blobStorageClient');

describe('ImportService', () => {
  let service: ImportService;
  let mockBlobClient: jest.Mocked<BlobStorageClient>;

  beforeEach(() => {
    mockBlobClient = new BlobStorageClient('', '') as jest.Mocked<BlobStorageClient>;
    service = new ImportService(mockBlobClient);
  });

  describe('importFromJson', () => {
    it('正常なJSONデータをインポートできる', async () => {
      const jsonData = JSON.stringify([
        {
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
      ]);

      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('無効なJSON形式の場合エラー', async () => {
      const jsonData = '{invalid json}';

      await expect(service.importFromJson(jsonData)).rejects.toThrow('無効なJSON形式です');
    });

    it('配列でない場合エラー', async () => {
      const jsonData = JSON.stringify({ not: 'array' });

      await expect(service.importFromJson(jsonData)).rejects.toThrow('JSONデータは配列である必要があります');
    });

    it('重複IDはスキップされる', async () => {
      const jsonData = JSON.stringify([
        {
          id: 'log_20250124_001',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
      ]);

      mockBlobClient.getBattleLogs.mockResolvedValue([
        {
          id: 'log_20250124_001',
          date: '2025-01-24',
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
      ]);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.details.skippedIds).toContain('log_20250124_001');
    });

    it('バリデーションエラーの詳細が返される', async () => {
      const jsonData = JSON.stringify([
        {
          date: '2099-12-31', // 未来日付
          battleType: 'ランクマッチ',
          rank: 'ダイアモンド',
          group: 'AAA',
          myDeckId: 'deck_001',
          turn: '先攻',
          result: '勝ち',
          opponentDeckId: 'deck_master_002',
        },
      ]);

      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const result = await service.importFromJson(jsonData);

      expect(result.imported).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.details.errorDetails).toBeDefined();
      expect(result.details.errorDetails![0].field).toBe('date');
    });
  });

  describe('importFromCsv', () => {
    it('正常なCSVデータをインポートできる', async () => {
      const csvData = `date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
2025-01-24,ランクマッチ,ダイアモンド,AAA,deck_001,先攻,勝ち,deck_master_002`;

      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('空のCSVデータの場合エラー', async () => {
      const csvData = '';

      await expect(service.importFromCsv(csvData)).rejects.toThrow('CSVデータが空です');
    });

    it('必須ヘッダーが不足している場合エラー', async () => {
      const csvData = `date,battleType
2025-01-24,ランクマッチ`;

      await expect(service.importFromCsv(csvData)).rejects.toThrow('必須ヘッダーが不足しています');
    });

    it('カラム数が一致しない行はエラーとして記録される', async () => {
      const csvData = `date,battleType,rank,group,myDeckId,turn,result,opponentDeckId
2025-01-24,ランクマッチ,ダイアモンド`;

      mockBlobClient.getBattleLogs.mockResolvedValue([]);
      mockBlobClient.saveBattleLogs.mockResolvedValue();

      const result = await service.importFromCsv(csvData);

      expect(result.imported).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.details.errorDetails![0].error).toBe('カラム数が一致しません');
    });
  });
});
```

#### 完了条件

- [ ] POST /api/import エンドポイントが実装されている
- [ ] JSON形式のインポート処理が実装されている
- [ ] CSV形式のインポート処理が実装されている
- [ ] バリデーション (各フィールド検証) が実装されている
- [ ] 重複チェック (ID重複時の動作) が実装されている
- [ ] エラー詳細レポート (行番号、フィールド名、エラーメッセージ) が実装されている
- [ ] 単体テストが100%成功する (8ケース以上)
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete
```

---

### TASK-0013: Backend統合テストとCI/CD設定

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: NFR-305 (自動テスト), NFR-302 (TDD)
- **依存タスク**: TASK-0007~TASK-0012
- **信頼性レベル**: 🔵 *NFR-305より*

#### 実装詳細

##### 1. 統合テストセットアップ

`backend/tests/integration/api.test.ts` を作成:

```typescript
import { InvocationContext } from "@azure/functions";

describe('API統合テスト', () => {
  describe('対戦履歴フロー', () => {
    it('登録→一覧取得→削除が正常に動作する', async () => {
      // TODO: 実際のAzure Functions呼び出しまたはモックを使用
    });
  });

  describe('統計APIフロー', () => {
    it('対戦履歴登録後、統計が正しく計算される', async () => {
      // TODO: 統計計算の統合テスト
    });
  });

  describe('インポートフロー', () => {
    it('JSONインポート→一覧取得が正常に動作する', async () => {
      // TODO: インポートの統合テスト
    });
  });
});
```

##### 2. Jest設定の最終調整

`backend/jest.config.js` を更新:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

##### 3. GitHub Actions CI/CD設定

`.github/workflows/backend-ci.yml` を作成:

```yaml
name: Backend CI

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
  pull_request:
    branches:
      - main
      - develop
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Lint check (Biome)
        working-directory: backend
        run: npm run lint

      - name: Type check (TypeScript)
        working-directory: backend
        run: npm run build

      - name: Run tests
        working-directory: backend
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./backend/coverage/coverage-final.json
          flags: backend
          name: backend-coverage

      - name: Check coverage threshold
        working-directory: backend
        run: |
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "Coverage is below 70%"
            exit 1
          fi

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.x

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Build
        working-directory: backend
        run: npm run build

      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: ${{ secrets.AZURE_FUNCTIONAPP_NAME }}
          package: ./backend
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

##### 4. Azure Functions ローカル実行テスト

`backend/package.json` に追加:

```json
{
  "scripts": {
    "start:local": "func start --port 7071",
    "test:integration": "jest --testMatch='**/integration/**/*.test.ts'",
    "test:unit": "jest --testMatch='**/services/**/*.test.ts' --testMatch='**/storage/**/*.test.ts'",
    "test:all": "npm run test:unit && npm run test:integration",
    "prestart": "npm run build",
    "predeploy": "npm run test:all && npm run lint"
  }
}
```

##### 5. ローカル実行確認スクリプト

`backend/scripts/test-local.sh` を作成:

```bash
#!/bin/bash

echo "=== Backend ローカル実行テスト ==="

# 1. ビルド
echo "1. TypeScriptビルド..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ ビルドエラー"
  exit 1
fi
echo "✅ ビルド成功"

# 2. Lint
echo "2. Biome lintチェック..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Lintエラー"
  exit 1
fi
echo "✅ Lint成功"

# 3. 単体テスト
echo "3. 単体テスト実行..."
npm run test:unit
if [ $? -ne 0 ]; then
  echo "❌ 単体テストエラー"
  exit 1
fi
echo "✅ 単体テスト成功"

# 4. 統合テスト
echo "4. 統合テスト実行..."
npm run test:integration
if [ $? -ne 0 ]; then
  echo "❌ 統合テストエラー"
  exit 1
fi
echo "✅ 統合テスト成功"

# 5. カバレッジ確認
echo "5. テストカバレッジ確認..."
npm run test:coverage
COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
echo "カバレッジ: $COVERAGE%"
if (( $(echo "$COVERAGE < 70" | bc -l) )); then
  echo "❌ カバレッジが70%未満です"
  exit 1
fi
echo "✅ カバレッジ70%以上"

# 6. ローカル起動確認
echo "6. Azure Functions ローカル起動確認..."
npm run start:local &
FUNC_PID=$!
sleep 5

# ヘルスチェック
curl -f http://localhost:7071/api/health
if [ $? -ne 0 ]; then
  echo "❌ ローカル起動エラー"
  kill $FUNC_PID
  exit 1
fi
echo "✅ ローカル起動成功"

kill $FUNC_PID

echo ""
echo "=== すべてのテストが成功しました ==="
```

##### 6. ヘルスチェックエンドポイント

`backend/src/functions/health.ts` を作成:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// GET /api/health
app.http("health", {
  methods: ["GET"],
  route: "health",
  authLevel: "anonymous",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          status: "healthy",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: context.invocationId,
        },
      },
    };
  },
});
```

#### テスト要件

##### 1. 統合テスト (Jest)

すべてのAPIエンドポイントが連携して動作することを確認:

- 対戦履歴の登録→取得→削除フロー
- 統計計算の正確性
- インポート機能の動作

##### 2. CI/CD テスト

GitHub Actionsが正常に動作することを確認:

- Lintチェックが成功する
- TypeScript型チェックが成功する
- すべてのテストが成功する
- カバレッジが70%以上

#### 完了条件

- [ ] すべてのAPIエンドポイントの統合テストが実装されている
- [ ] Azure Functions ローカル実行テストが成功する
- [ ] GitHub Actions CI/CD設定が完了している
- [ ] Biome lint チェックが成功する
- [ ] TypeScript型チェックが成功する
- [ ] テストカバレッジが70%以上
- [ ] `npm start` でローカル起動できる
- [ ] すべてのAPIが3秒以内に応答する

#### 実行コマンド

```bash
/tsumiki:tdd-requirements
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete
```

---

## フェーズ完了条件

- [ ] すべてのタスクが完了している
- [ ] すべてのAPIエンドポイントが実装されている
- [ ] すべての単体テストが成功している (カバレッジ70%以上)
- [ ] 統合テストが成功している
- [ ] GitHub Actions CI/CDが動作している
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件
- [ ] ローカル環境でAzure Functionsが起動する
- [ ] すべてのAPIが3秒以内に応答する (統計APIは除く)

### 検証コマンド

```bash
# バックエンド
cd backend

# 1. 依存関係インストール
npm install

# 2. Lintチェック
npm run lint

# 3. 型チェック
npm run build

# 4. 単体テスト
npm run test:unit

# 5. 統合テスト
npm run test:integration

# 6. カバレッジ確認
npm run test:coverage

# 7. ローカル起動
npm start  # http://localhost:7071 でアクセス可能

# 8. ヘルスチェック
curl http://localhost:7071/api/health

# 9. すべてのテスト実行
./scripts/test-local.sh
```

---

## 次フェーズへの準備

Phase 3では、Phase 2で実装したバックエンドAPIを使用して、フロントエンドのReactアプリケーションを実装します。

### Phase 3 で実装する主要機能

1. **React アプリケーションセットアップ** (Vite + Zustand)
2. **対戦履歴登録フォーム** (ダイアログ、前回値引き継ぎ)
3. **対戦履歴一覧・詳細表示**
4. **統計ダッシュボード** (Recharts グラフ)
5. **データインポート機能** (ファイルアップロード)
6. **レスポンシブデザイン** (PC・スマホ対応)
7. **E2Eテスト** (Playwright)

---

## トラブルシューティング

### Azure Functions 起動エラー

**エラー**: `Cannot find module '@azure/functions'`

**原因**:
- 依存関係がインストールされていない
- `node_modules` が削除されている

**解決策**:
1. `cd backend && npm install`
2. `npm run build`
3. `npm start`

### テストエラー

**エラー**: `Cannot find module 'zod'`

**原因**:
- テスト環境で依存関係がインストールされていない

**解決策**:
1. `cd backend && npm install`
2. `npm test`

### Blob Storage 接続エラー

**エラー**: `Failed to connect to Azure Storage`

**原因**:
- `local.settings.json` の接続文字列が正しくない
- Storage Account が存在しない

**解決策**:
1. `local.settings.json` の `AZURE_STORAGE_CONNECTION_STRING` を確認
2. Azure Portal で Storage Account の存在を確認
3. 接続文字列を再取得: `az storage account show-connection-string`

### TypeScript コンパイルエラー

**エラー**: `Cannot find name 'BattleLog'`

**原因**:
- 型定義ファイルが正しくインポートされていない

**解決策**:
1. `import { BattleLog } from '../types'` を追加
2. `tsconfig.json` の `paths` 設定を確認

---

## 参考資料

- [Azure Functions TypeScript Developer Guide](https://learn.microsoft.com/azure/azure-functions/functions-reference-node)
- [Azure Blob Storage Node.js SDK](https://learn.microsoft.com/azure/storage/blobs/storage-quickstart-blobs-nodejs)
- [Zod Documentation](https://zod.dev/)
- [Jest Documentation](https://jestjs.io/)
- [GitHub Actions Documentation](https://docs.github.com/actions)

---

**ドキュメント終了**
