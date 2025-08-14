import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CSVService } from '../services/csvService';
import fs from 'fs/promises';

const csvService = new CSVService();

async function exportHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const method = request.method;
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const format = pathSegments[pathSegments.length - 1];

  try {
    if (method !== 'GET') {
      return { status: 405, jsonBody: { error: 'Method not allowed' } };
    }

    switch (format) {
      case 'csv':
        // GET /api/export/csv
        const filename = await csvService.exportBattleLogsToCSV();
        const filePath = await csvService.getCSVFilePath(filename);
        
        try {
          const fileContent = await fs.readFile(filePath);
          
          return {
            status: 200,
            body: fileContent,
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${filename}"`
            }
          };
        } catch (fileError) {
          context.error('Error reading CSV file:', fileError);
          return { status: 500, jsonBody: { error: 'Failed to read CSV file' } };
        }

      default:
        return { status: 404, jsonBody: { error: 'Export format not supported' } };
    }
  } catch (error) {
    context.error('Error in export handler:', error);
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
}

app.http('export-csv', {
  methods: ['GET'],
  route: 'export/csv',
  authLevel: 'anonymous',
  handler: exportHandler
});