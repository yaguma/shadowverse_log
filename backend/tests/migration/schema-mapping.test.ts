/**
 * TASK-0025-3: スキーママッピングのテスト
 */
import { describe, expect, it } from 'vitest';
import {
  type LegacyBattleLog,
  type LegacyDeckMaster,
  type LegacyMyDeck,
  convertDateFormat,
  mapLegacyBattleLogToNew,
  mapLegacyDeckMasterToNew,
  mapLegacyMyDeckToNew,
  validateLegacyBattleLog,
  validateLegacyDeckMaster,
  validateLegacyMyDeck,
} from '../../src/migration/schema-mapping';

describe('schema-mapping', () => {
  describe('convertDateFormat', () => {
    it('should convert YYYY/MM/DD to YYYY-MM-DD format', () => {
      expect(convertDateFormat('2025/08/07')).toBe('2025-08-07');
    });

    it('should handle already correct format', () => {
      expect(convertDateFormat('2025-08-07')).toBe('2025-08-07');
    });

    it('should handle multiple slashes', () => {
      expect(convertDateFormat('2025/08/07/extra')).toBe('2025-08-07-extra');
    });
  });

  describe('mapLegacyBattleLogToNew', () => {
    const validLegacyBattleLog: LegacyBattleLog = {
      id: '1',
      date: '2025/08/07',
      battleType: 'ランクマッチ',
      rank: 'サファイア',
      group: 'A',
      myDeckId: '1',
      turn: '後攻',
      result: 'WIN',
      opponentDeckId: '3',
    };

    it('should map legacy battle log to new format', () => {
      const result = mapLegacyBattleLogToNew(validLegacyBattleLog);

      expect(result).toEqual({
        id: '1',
        userId: null,
        date: '2025-08-07',
        battleType: 'ランクマッチ',
        rank: 'サファイア',
        groupName: 'A',
        myDeckId: '1',
        turn: '後攻',
        result: 'WIN',
        opponentDeckId: '3',
      });
    });

    it('should include userId when provided', () => {
      const result = mapLegacyBattleLogToNew(validLegacyBattleLog, 'user-123');

      expect(result.userId).toBe('user-123');
    });

    it('should set userId to null when not provided', () => {
      const result = mapLegacyBattleLogToNew(validLegacyBattleLog);

      expect(result.userId).toBeNull();
    });
  });

  describe('mapLegacyDeckMasterToNew', () => {
    const validLegacyDeckMaster: LegacyDeckMaster = {
      id: '1',
      className: 'ウィッチ',
      deckName: '土スペルウィッチ',
      sortOrder: 1,
    };

    it('should map legacy deck master to new format', () => {
      const result = mapLegacyDeckMasterToNew(validLegacyDeckMaster);

      expect(result).toEqual({
        id: '1',
        className: 'ウィッチ',
        deckName: '土スペルウィッチ',
        sortOrder: 1,
      });
    });
  });

  describe('mapLegacyMyDeckToNew', () => {
    const validLegacyMyDeck: LegacyMyDeck = {
      id: '1',
      deckId: '1',
      deckCode: '3.1.3.1.3.1',
      deckName: '秘術オデンスペル',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    it('should map legacy my deck to new format', () => {
      const result = mapLegacyMyDeckToNew(validLegacyMyDeck);

      expect(result).toEqual({
        id: '1',
        userId: null,
        deckCode: '3.1.3.1.3.1',
        deckName: '秘術オデンスペル',
        isActive: true,
      });
    });

    it('should include userId when provided', () => {
      const result = mapLegacyMyDeckToNew(validLegacyMyDeck, 'user-456');

      expect(result.userId).toBe('user-456');
    });
  });

  describe('validateLegacyBattleLog', () => {
    const validData: LegacyBattleLog = {
      id: '1',
      date: '2025/08/07',
      battleType: 'ランクマッチ',
      rank: 'サファイア',
      group: 'A',
      myDeckId: '1',
      turn: '後攻',
      result: 'WIN',
      opponentDeckId: '3',
    };

    it('should return true for valid battle log data', () => {
      expect(validateLegacyBattleLog(validData)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateLegacyBattleLog(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(validateLegacyBattleLog('string')).toBe(false);
      expect(validateLegacyBattleLog(123)).toBe(false);
    });

    it('should return false for missing required fields', () => {
      const missingId = { ...validData };
      // @ts-expect-error testing invalid data
      delete missingId.id;
      expect(validateLegacyBattleLog(missingId)).toBe(false);
    });

    it('should return false for wrong field types', () => {
      const wrongType = { ...validData, id: 123 };
      expect(validateLegacyBattleLog(wrongType)).toBe(false);
    });
  });

  describe('validateLegacyDeckMaster', () => {
    const validData: LegacyDeckMaster = {
      id: '1',
      className: 'ウィッチ',
      deckName: '土スペルウィッチ',
      sortOrder: 1,
    };

    it('should return true for valid deck master data', () => {
      expect(validateLegacyDeckMaster(validData)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateLegacyDeckMaster(null)).toBe(false);
    });

    it('should return false for missing required fields', () => {
      const missingClassName = { ...validData };
      // @ts-expect-error testing invalid data
      delete missingClassName.className;
      expect(validateLegacyDeckMaster(missingClassName)).toBe(false);
    });

    it('should return false for wrong sortOrder type', () => {
      const wrongType = { ...validData, sortOrder: '1' };
      expect(validateLegacyDeckMaster(wrongType)).toBe(false);
    });
  });

  describe('validateLegacyMyDeck', () => {
    const validData: LegacyMyDeck = {
      id: '1',
      deckId: '1',
      deckCode: '3.1.3.1.3.1',
      deckName: '秘術オデンスペル',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    it('should return true for valid my deck data', () => {
      expect(validateLegacyMyDeck(validData)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateLegacyMyDeck(null)).toBe(false);
    });

    it('should return false for wrong isActive type', () => {
      const wrongType = { ...validData, isActive: 'true' };
      expect(validateLegacyMyDeck(wrongType)).toBe(false);
    });
  });
});
