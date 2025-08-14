import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DataService } from '../services/dataService';

const dataService = new DataService();

async function masterHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const method = request.method;
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const endpoint = pathSegments[pathSegments.length - 1];

  try {
    if (method !== 'GET') {
      return { status: 405, jsonBody: { error: 'Method not allowed' } };
    }

    switch (endpoint) {
      case 'decks':
        // GET /api/master/decks
        const decks = await dataService.getDeckMaster();
        const sortedDecks = decks.sort((a, b) => a.sortOrder - b.sortOrder);
        return { status: 200, jsonBody: sortedDecks };

      case 'my-decks':
        // GET /api/master/my-decks
        const myDecks = await dataService.getMyDecks();
        const activeDecks = myDecks.filter(deck => deck.isActive);
        return { status: 200, jsonBody: activeDecks };

      default:
        return { status: 404, jsonBody: { error: 'Endpoint not found' } };
    }
  } catch (error) {
    context.error('Error in master handler:', error);
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
}

app.http('master-decks', {
  methods: ['GET'],
  route: 'master/decks',
  authLevel: 'anonymous',
  handler: masterHandler
});

app.http('master-my-decks', {
  methods: ['GET'],
  route: 'master/my-decks',
  authLevel: 'anonymous',
  handler: masterHandler
});