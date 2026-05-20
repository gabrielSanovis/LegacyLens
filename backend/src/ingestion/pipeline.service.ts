import { Injectable, Logger } from '@nestjs/common';
import { ParserService } from './parser/parser.service';
import { EdgeExtractorService } from './extractors/edge-extractor.service';
import { GraphLoaderService } from './loaders/graph-loader.service';
import { TypeResolverService } from './extractors/type-resolver.service';
import { ChunkerService } from './chunker/chunker.service';
import { VectorLoaderService } from './loaders/vector-loader.service';
import { ExtractedGraph } from './extractors/types';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly parserService: ParserService,
    private readonly edgeExtractorService: EdgeExtractorService,
    private readonly graphLoaderService: GraphLoaderService,
    private readonly typeResolverService: TypeResolverService,
    private readonly chunkerService: ChunkerService,
    private readonly vectorLoaderService: VectorLoaderService,
  ) {}

  private walkDirectory(dir: string, filesToParse: string[]) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        this.walkDirectory(fullPath, filesToParse);
      } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
        filesToParse.push(fullPath);
      }
    }
  }

  private appendGraphData(globalGraph: ExtractedGraph, graph: ExtractedGraph) {
    globalGraph.sagas.push(...graph.sagas);
    globalGraph.reducers.push(...graph.reducers);
    globalGraph.actions.push(...graph.actions);
    if (graph.selectors && globalGraph.selectors) {
      globalGraph.selectors.push(...graph.selectors);
    }
    globalGraph.imports.push(...graph.imports);
    globalGraph.edges.watches.push(...graph.edges.watches);
    globalGraph.edges.dispatches.push(...graph.edges.dispatches);
    globalGraph.edges.calls.push(...graph.edges.calls);
    globalGraph.edges.selects.push(...graph.edges.selects);
  }

  private processFile(
    filePath: string,
    directoryPath: string,
    globalGraph: ExtractedGraph,
  ) {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const language = filePath.endsWith('.ts') ? 'typescript' : 'javascript';

      const tree = this.parserService.parse(code, language) as {
        isMock?: boolean;
        code?: string;
        rootNode?: any;
      };
      const relativePath = path
        .relative(directoryPath, filePath)
        .replace(/\\/g, '/');
      const graph = this.edgeExtractorService.extract(tree, relativePath);

      this.appendGraphData(globalGraph, graph);
    } catch (err) {
      this.logger.error(
        `Failed to process file ${filePath}`,
        (err as Error).stack,
      );
    }
  }

  private resolveTypes(filesToParse: string[], globalGraph: ExtractedGraph) {
    const tsFiles = filesToParse.filter(
      (f) => f.endsWith('.ts') || f.endsWith('.tsx'),
    );
    if (tsFiles.length > 0) {
      this.logger.log(`Resolving advanced TypeScript types...`);
      const program = ts.createProgram(tsFiles, {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        allowJs: true,
      });
      this.typeResolverService.resolveTypes(program, tsFiles, globalGraph);
    }
  }

  private async loadGraphAndEmbed(
    projectId: string,
    directoryPath: string,
    globalGraph: ExtractedGraph,
  ) {
    const nodeIds = await this.graphLoaderService.loadGraph(
      projectId,
      globalGraph,
    );

    this.logger.log(`Chunking and embedding code...`);
    const chunks = this.chunkerService.createChunks(
      globalGraph,
      nodeIds,
      directoryPath,
    );
    await this.vectorLoaderService.loadVectors(projectId, chunks);
  }

  async runPipeline(projectId: string, directoryPath: string) {
    this.logger.log(
      `Starting ingestion pipeline for project ${projectId} at ${directoryPath}`,
    );

    const filesToParse: string[] = [];
    this.walkDirectory(directoryPath, filesToParse);

    const globalGraph: ExtractedGraph = {
      sagas: [],
      reducers: [],
      actions: [],
      selectors: [],
      imports: [],
      edges: { watches: [], dispatches: [], calls: [], selects: [] },
    };

    for (const filePath of filesToParse) {
      this.processFile(filePath, directoryPath, globalGraph);
    }

    this.resolveTypes(filesToParse, globalGraph);
    await this.loadGraphAndEmbed(projectId, directoryPath, globalGraph);

    this.logger.log(`Pipeline completed for project ${projectId}`);
  }
}
