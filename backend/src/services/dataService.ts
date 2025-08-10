import fs from 'fs/promises';
import path from 'path';
import { BattleLog, DeckMaster, MyDeck } from '../types';

const DATA_DIR = path.join(__dirname, '../../../data/json');

export class DataService {
  private async readJsonFile<T>(filename: string): Promise<T[]> {
    try {
      const filePath = path.join(DATA_DIR, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [];
    }
  }

  private async writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
    try {
      const filePath = path.join(DATA_DIR, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      throw error;
    }
  }

  async getBattleLogs(): Promise<BattleLog[]> {
    return this.readJsonFile<BattleLog>('battle-logs.json');
  }

  async createBattleLog(battleLog: BattleLog): Promise<BattleLog> {
    const logs = await this.getBattleLogs();
    logs.push(battleLog);
    await this.writeJsonFile('battle-logs.json', logs);
    return battleLog;
  }

  async updateBattleLog(id: string, updates: Partial<BattleLog>): Promise<BattleLog | null> {
    const logs = await this.getBattleLogs();
    const index = logs.findIndex(log => log.id === id);
    
    if (index === -1) {
      return null;
    }

    logs[index] = { ...logs[index], ...updates, updatedAt: new Date().toISOString() };
    await this.writeJsonFile('battle-logs.json', logs);
    return logs[index];
  }

  async deleteBattleLog(id: string): Promise<boolean> {
    const logs = await this.getBattleLogs();
    const index = logs.findIndex(log => log.id === id);
    
    if (index === -1) {
      return false;
    }

    logs.splice(index, 1);
    await this.writeJsonFile('battle-logs.json', logs);
    return true;
  }

  async getDeckMaster(): Promise<DeckMaster[]> {
    return this.readJsonFile<DeckMaster>('deck-master.json');
  }

  async getMyDecks(): Promise<MyDeck[]> {
    return this.readJsonFile<MyDeck>('my-decks.json');
  }

  async createMyDeck(deck: MyDeck): Promise<MyDeck> {
    const decks = await this.getMyDecks();
    decks.push(deck);
    await this.writeJsonFile('my-decks.json', decks);
    return deck;
  }
}