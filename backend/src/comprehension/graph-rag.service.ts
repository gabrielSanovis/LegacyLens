import { Injectable, Logger } from '@nestjs/common';
import { QdrantService } from '../infra/vector/qdrant.service';
import { Neo4jService } from '../infra/graph/neo4j.service';
import { EmbeddingService } from '../infra/llm/embedding.service';

@Injectable()
export class GraphRagService {
  private readonly logger = new Logger(GraphRagService.name);

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly neo4jService: Neo4jService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async retrieveContext(query: string, topK: number = 5): Promise<string> {
    try {
      // 1. Convert query to embedding
      const embeddings = await this.embeddingService.generateEmbeddings([
        query,
      ]);
      const vector = embeddings[0];

      if (!vector) {
        return 'No vector generated for query.';
      }

      // 2. Query Qdrant
      const client = this.qdrantService.getClient();
      const qdrantResult = await client.search('code_chunks', {
        vector: vector,
        limit: topK,
      });

      if (!qdrantResult || qdrantResult.length === 0) {
        return 'No relevant chunks found in vector DB.';
      }

      const { nodeIds, chunksData } = this.extractNodesAndChunks(qdrantResult);

      // 3. Query Neo4j for expansions if we have node IDs
      let graphContext = '';
      if (nodeIds.length > 0) {
        graphContext = await this.expandGraph(nodeIds);
      }

      // 4. Format result
      return `### Vector Results\n\n${chunksData.join('\n\n')}\n\n### Graph Context\n\n${graphContext}`;
    } catch (err) {
      this.logger.error('Error retrieving context', err);
      return 'Error retrieving context.';
    }
  }

  private extractNodesAndChunks(qdrantResult: Record<string, any>[]) {
    const nodeIds: number[] = [];
    const chunksData: string[] = [];
    for (const res of qdrantResult) {
      const payload = res.payload as
        | { node_ids?: number[]; content?: string; file_path?: string }
        | undefined;
      if (payload?.node_ids && Array.isArray(payload.node_ids)) {
        nodeIds.push(...payload.node_ids);
      }
      if (payload?.content) {
        chunksData.push(
          `File: ${payload.file_path}\nCode:\n${payload.content}`,
        );
      }
    }
    return { nodeIds, chunksData };
  }

  private async expandGraph(nodeIds: number[]): Promise<string> {
    const session = this.neo4jService.getDriver().session();
    try {
      // Query up to 2 hops
      const query = `
        MATCH (n)-[r*1..2]-(m)
        WHERE id(n) IN $nodeIds
        RETURN n.name AS Source, type(r[0]) AS Rel1, m.name AS Target
        LIMIT 20
      `;
      const result = await session.run(query, { nodeIds });

      if (result.records.length === 0)
        return 'No extended graph relations found.';

      const lines = result.records.map((rec) => {
        const src = (rec.get('Source') as string) || 'Unknown';
        const rel = (rec.get('Rel1') as string) || 'RELATES_TO';
        const tgt = (rec.get('Target') as string) || 'Unknown';
        return `${src} -[${rel}]-> ${tgt}`;
      });

      return lines.join('\n');
    } catch (err) {
      this.logger.error('Neo4j expansion failed', err);
      return 'Graph expansion failed.';
    } finally {
      await session.close();
    }
  }
}
