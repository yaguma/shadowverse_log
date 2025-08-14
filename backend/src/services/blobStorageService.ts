import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs/promises';
import path from 'path';

export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is required');
    }
    
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'shadowverse-logs';
  }

  async uploadFile(filePath: string, blobName: string): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      
      await containerClient.createIfNotExists({
        access: 'blob'
      });

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      const data = await fs.readFile(filePath);
      await blockBlobClient.uploadData(data, {
        overwrite: true
      });
      
      console.log(`File uploaded successfully: ${blobName}`);
    } catch (error) {
      console.error(`Error uploading file to blob storage:`, error);
      throw error;
    }
  }

  async uploadBattleLogsJson(filePath: string): Promise<void> {
    const fileName = `battle-logs-${new Date().toISOString()}.json`;
    await this.uploadFile(filePath, fileName);
  }
}