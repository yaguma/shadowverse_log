import { Router } from 'express';
import { CSVService } from '../services/csvService';

const router = Router();
const csvService = new CSVService();

// CSV エクスポート
router.get('/csv', async (req, res): Promise<void> => {
  try {
    const filename = await csvService.exportBattleLogsToCSV();
    const filePath = await csvService.getCSVFilePath(filename);
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as exportRoutes };