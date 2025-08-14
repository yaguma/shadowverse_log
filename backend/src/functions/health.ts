import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

async function healthHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    return {
      status: 200,
      jsonBody: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  } catch (error) {
    context.error('Error in health handler:', error);
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
}

app.http('health', {
  methods: ['GET'],
  route: 'health',
  authLevel: 'anonymous',
  handler: healthHandler
});