import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DataService } from '../services/dataService';
import { BattleLog, CreateBattleLogRequest, UpdateBattleLogRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { subWeeks } from 'date-fns';

const dataService = new DataService();

async function battleLogsHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const method = request.method;
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const id = pathSegments[pathSegments.length - 1];

  try {
    switch (method) {
      case 'GET':
        if (id && id !== 'battle-logs') {
          // GET /api/battle-logs/{id}
          const logs = await dataService.getBattleLogs();
          const log = logs.find(l => l.id === id);
          
          if (!log) {
            return { status: 404, jsonBody: { error: 'Battle log not found' } };
          }
          
          return { status: 200, jsonBody: log };
        } else {
          // GET /api/battle-logs
          const logs = await dataService.getBattleLogs();
          const oneWeekAgo = subWeeks(new Date(), 1);
          
          const filteredLogs = logs
            .filter(log => new Date(log.date) >= oneWeekAgo)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 100);

          return { status: 200, jsonBody: filteredLogs };
        }

      case 'POST':
        // POST /api/battle-logs
        const createRequest: CreateBattleLogRequest = await request.json() as CreateBattleLogRequest;
        
        if (!createRequest.date || !createRequest.battleType || !createRequest.myDeckId || 
            !createRequest.opponentDeckId || !createRequest.result) {
          return { status: 400, jsonBody: { error: 'Required fields are missing' } };
        }

        const now = new Date().toISOString();
        const battleLog: BattleLog = {
          id: uuidv4(),
          ...createRequest,
          createdAt: now,
          updatedAt: now
        };

        const created = await dataService.createBattleLog(battleLog);
        return { status: 201, jsonBody: created };

      case 'PUT':
        // PUT /api/battle-logs/{id}
        if (!id || id === 'battle-logs') {
          return { status: 400, jsonBody: { error: 'ID is required for update' } };
        }
        
        const updateRequest: Partial<UpdateBattleLogRequest> = await request.json() as Partial<UpdateBattleLogRequest>;
        const updated = await dataService.updateBattleLog(id, updateRequest);
        
        if (!updated) {
          return { status: 404, jsonBody: { error: 'Battle log not found' } };
        }

        return { status: 200, jsonBody: updated };

      case 'DELETE':
        // DELETE /api/battle-logs/{id}
        if (!id || id === 'battle-logs') {
          return { status: 400, jsonBody: { error: 'ID is required for delete' } };
        }
        
        const deleted = await dataService.deleteBattleLog(id);
        
        if (!deleted) {
          return { status: 404, jsonBody: { error: 'Battle log not found' } };
        }

        return { status: 204 };

      default:
        return { status: 405, jsonBody: { error: 'Method not allowed' } };
    }
  } catch (error) {
    context.error('Error in battle logs handler:', error);
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
}

app.http('battle-logs', {
  methods: ['GET', 'POST'],
  route: 'battle-logs',
  authLevel: 'anonymous',
  handler: battleLogsHandler
});

app.http('battle-logs-by-id', {
  methods: ['GET', 'PUT', 'DELETE'],
  route: 'battle-logs/{id}',
  authLevel: 'anonymous',
  handler: battleLogsHandler
});