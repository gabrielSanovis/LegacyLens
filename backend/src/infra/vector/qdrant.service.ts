import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;

  constructor() {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    this.client = new QdrantClient({ url });
  }

  async onModuleInit() {
    try {
      await this.initCollection('code_chunks');
    } catch (err) {
      this.logger.error('Failed to init Qdrant collection', err);
    }
  }

  private async initCollection(collectionName: string) {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === collectionName,
    );

    if (!exists) {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: 1536, // Default for text-embedding-3-small/large etc
          distance: 'Cosine',
        },
      });
      this.logger.log(`Created Qdrant collection: ${collectionName}`);
    } else {
      this.logger.log(`Qdrant collection ${collectionName} already exists`);
    }
  }

  getClient(): QdrantClient {
    return this.client;
  }
}
