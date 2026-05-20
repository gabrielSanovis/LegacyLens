import { Injectable, Logger } from '@nestjs/common';
import {
  ExtractedGraph,
  ExtractedSaga,
  ExtractedReducer,
} from '../extractors/types';
import * as fs from 'fs';
import * as path from 'path';

export interface SemanticChunk {
  id: string;
  file_path: string;
  start_line: number;
  end_line: number;
  language: string;
  content: string;
  chunk_type: string;
  node_ids: number[];
}

@Injectable()
export class ChunkerService {
  private readonly logger = new Logger(ChunkerService.name);

  private createSagaChunks(
    sagas: ExtractedSaga[],
    filePath: string,
    lines: string[],
    language: string,
    nodeIds: Record<string, number>,
  ): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    sagas
      .filter((s) => s.file_path === filePath)
      .forEach((saga) => {
        const content = lines
          .slice(saga.start_line - 1, saga.end_line)
          .join('\n');
        const nodeId = nodeIds[`Saga:${filePath}:${saga.name}`];
        chunks.push({
          id: `chunk-saga-${saga.name}-${Date.now()}`,
          file_path: filePath,
          start_line: saga.start_line,
          end_line: saga.end_line,
          language,
          content,
          chunk_type: 'Saga',
          node_ids: nodeId ? [nodeId] : [],
        });
      });
    return chunks;
  }

  private createReducerChunks(
    reducers: ExtractedReducer[],
    filePath: string,
    lines: string[],
    language: string,
    nodeIds: Record<string, number>,
  ): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    reducers
      .filter((r) => r.file_path === filePath)
      .forEach((reducer) => {
        if (reducer.start_line && reducer.end_line) {
          const content = lines
            .slice(reducer.start_line - 1, reducer.end_line)
            .join('\n');
          const nodeId = nodeIds[`Reducer:${filePath}:${reducer.name}`];
          chunks.push({
            id: `chunk-reducer-${reducer.name}-${Date.now()}`,
            file_path: filePath,
            start_line: reducer.start_line,
            end_line: reducer.end_line,
            language,
            content,
            chunk_type: 'Reducer',
            node_ids: nodeId ? [nodeId] : [],
          });
        }
      });
    return chunks;
  }

  private processFileChunks(
    filePath: string,
    directoryPath: string,
    graph: ExtractedGraph,
    nodeIds: Record<string, number>,
    chunks: SemanticChunk[],
  ) {
    const fullPath = path.join(directoryPath, filePath);
    if (!fs.existsSync(fullPath)) return;

    const code = fs.readFileSync(fullPath, 'utf-8');
    const lines = code.split('\n');
    const language =
      filePath.endsWith('.ts') || filePath.endsWith('.tsx')
        ? 'typescript'
        : 'javascript';

    chunks.push(
      ...this.createSagaChunks(graph.sagas, filePath, lines, language, nodeIds),
    );
    chunks.push(
      ...this.createReducerChunks(
        graph.reducers,
        filePath,
        lines,
        language,
        nodeIds,
      ),
    );
  }

  createChunks(
    graph: ExtractedGraph,
    nodeIds: Record<string, number>,
    directoryPath: string,
  ): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    const filesToRead = new Set([
      ...graph.sagas.map((s) => s.file_path),
      ...graph.reducers.map((r) => r.file_path),
      ...graph.actions.map((a) => a.file_path),
      ...(graph.selectors || []).map((s) => s.file_path),
    ]);

    for (const filePath of filesToRead) {
      this.processFileChunks(filePath, directoryPath, graph, nodeIds, chunks);
    }

    return chunks;
  }
}
