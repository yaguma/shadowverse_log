import express from 'express';
import cors from 'cors';
import { battleLogRoutes } from './routes/battleLog';
import { masterRoutes } from './routes/master';
import { exportRoutes } from './routes/export';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/battle-logs', battleLogRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});