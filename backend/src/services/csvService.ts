import fs from 'fs/promises';
import path from 'path';
import { BattleLog } from '../types';
import { DataService } from './dataService';

const CSV_DIR = path.join(__dirname, '../../../data/csv');

export class CSVService {
  private dataService = new DataService();

  async exportBattleLogsToCSV(): Promise<string> {
    try {
      // Ensure CSV directory exists
      await fs.mkdir(CSV_DIR, { recursive: true });

      const logs = await this.dataService.getBattleLogs();
      const deckMaster = await this.dataService.getDeckMaster();
      const myDecks = await this.dataService.getMyDecks();

      // Helper functions to get names
      const getDeckName = (deckId: string): string => {
        const deck = deckMaster.find(d => d.id === deckId);
        return deck ? `${deck.className} - ${deck.deckName}` : 'Unknown Deck';
      };

      const getMyDeckName = (myDeckId: string): string => {
        const myDeck = myDecks.find(d => d.id === myDeckId);
        if (!myDeck) return 'Unknown Deck';
        
        const masterDeck = deckMaster.find(d => d.id === myDeck.deckId);
        return masterDeck ? `${masterDeck.className} - ${masterDeck.deckName}` : 'Unknown Deck';
      };

      // Create CSV header
      const header = [
        'ID',
        '日付',
        '対戦種別',
        'ランク',
        'グループ',
        '先攻/後攻',
        '自分デッキ',
        '相手デッキ',
        '勝敗',
        '作成日時',
        '更新日時'
      ].join(',');

      // Create CSV rows
      const rows = logs.map(log => [
        log.id,
        log.date,
        log.battleType,
        log.rank || '',
        log.group || '',
        log.turn,
        getMyDeckName(log.myDeckId),
        getDeckName(log.opponentDeckId),
        log.result,
        log.createdAt,
        log.updatedAt
      ].map(field => `"${field}"`).join(','));

      const csvContent = [header, ...rows].join('\n');
      
      // Save to file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `battle-logs-${timestamp}.csv`;
      const filePath = path.join(CSV_DIR, filename);
      
      await fs.writeFile(filePath, csvContent, 'utf-8');
      
      return filename;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }

  async getCSVFilePath(filename: string): Promise<string> {
    return path.join(CSV_DIR, filename);
  }
}