import { Router } from 'express';
import { DataService } from '../services/dataService';
import { BattleLog, CreateBattleLogRequest, UpdateBattleLogRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { subWeeks } from 'date-fns';

const router = Router();
const dataService = new DataService();

// 対戦履歴一覧取得 (直近1週間の100件)
router.get('/', async (req, res) => {
  try {
    const logs = await dataService.getBattleLogs();
    const oneWeekAgo = subWeeks(new Date(), 1);
    
    const filteredLogs = logs
      .filter(log => new Date(log.date) >= oneWeekAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 100);

    return res.json(filteredLogs);
  } catch (error) {
    console.error('Error getting battle logs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 対戦履歴詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await dataService.getBattleLogs();
    const log = logs.find(l => l.id === id);
    
    if (!log) {
      return res.status(404).json({ error: 'Battle log not found' });
    }

    return res.json(log);
  } catch (error) {
    console.error('Error getting battle log:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 対戦履歴作成
router.post('/', async (req, res) => {
  try {
    const createRequest: CreateBattleLogRequest = req.body;
    
    // バリデーション
    if (!createRequest.date || !createRequest.battleType || !createRequest.myDeckId || 
        !createRequest.opponentDeckId || !createRequest.result) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const now = new Date().toISOString();
    const battleLog: BattleLog = {
      id: uuidv4(),
      ...createRequest,
      createdAt: now,
      updatedAt: now
    };

    const created = await dataService.createBattleLog(battleLog);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating battle log:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 対戦履歴更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateRequest: Partial<UpdateBattleLogRequest> = req.body;
    
    const updated = await dataService.updateBattleLog(id, updateRequest);
    
    if (!updated) {
      return res.status(404).json({ error: 'Battle log not found' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error updating battle log:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 対戦履歴削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dataService.deleteBattleLog(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Battle log not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting battle log:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as battleLogRoutes };