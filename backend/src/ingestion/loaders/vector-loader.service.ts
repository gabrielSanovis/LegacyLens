import { Injectable, Logger } from '@nestjs/common';
import { QdrantService } from '../../infra/vector/qdrant.service';
import { EmbeddingService } from '../../infra/llm/embedding.service';
import { SemanticChunk } from '../chunker/chunker.service';

@Injectable()
export class VectorLoaderService {
  private readonly logger = new Logger(VectorLoaderService.name);

  constructor(
    private qdrantService: QdrantService,
    private embeddingService: EmbeddingService,
  ) {}

  private async deleteOldVectors(projectId: string) {
    try {
      await this.qdrantService.getClient().delete('code_chunks', {
        filter: {
          must: [
            {
              key: 'project_id',
              match: { value: projectId },
            },
          ],
        },
      });
      this.logger.log(
        `Successfully deleted old vectors from Qdrant for project ${projectId}`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to delete old vectors from Qdrant for project ${projectId}: ${(err as Error).message}`,
      );
    }
  }

  private async upsertBatches(
    points: {
      id: string;
      vector: number[];
      payload: {
        project_id: string;
        file_path: string;
        language: string;
        chunk_type: string;
        start_line: number;
        end_line: number;
        node_ids: number[];
        content: string;
      };
    }[],
  ) {
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await this.qdrantService.getClient().upsert('code_chunks', {
        wait: true,
        points: batch,
      });
    }
  }

  async loadVectors(projectId: string, chunks: SemanticChunk[]) {
    if (chunks.length === 0) return;
    this.logger.log(
      `Loading ${chunks.length} chunks into Qdrant for project ${projectId}`,
    );

    await this.deleteOldVectors(projectId);

    const texts = chunks.map((c) => c.content);
    const vectors = await this.embeddingService.generateEmbeddings(texts);

    const points = chunks.map((chunk, index) => ({
      id: this.uuidv4(),
      vector: vectors[index],
      payload: {
        project_id: projectId,
        file_path: chunk.file_path,
        language: chunk.language,
        chunk_type: chunk.chunk_type,
        start_line: chunk.start_line,
        end_line: chunk.end_line,
        node_ids: chunk.node_ids,
        content: chunk.content,
      },
    }));

    await this.upsertBatches(points);

    this.logger.log(`Successfully loaded ${chunks.length} vectors into Qdrant`);
  }

  // Simple UUID generator since Qdrant needs UUID or Int id
  private uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }
}
