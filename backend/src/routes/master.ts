import { Router } from 'express';
import { DataService } from '../services/dataService';

const router = Router();
const dataService = new DataService();

// デッキマスタ取得
router.get('/decks', async (req, res) => {
  try {
    const decks = await dataService.getDeckMaster();
    const sortedDecks = decks.sort((a, b) => a.sortOrder - b.sortOrder);
    return res.json(sortedDecks);
  } catch (error) {
    console.error('Error getting deck master:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 使用デッキ取得
router.get('/my-decks', async (req, res) => {
  try {
    const myDecks = await dataService.getMyDecks();
    const activeDecks = myDecks.filter(deck => deck.isActive);
    return res.json(activeDecks);
  } catch (error) {
    console.error('Error getting my decks:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as masterRoutes };