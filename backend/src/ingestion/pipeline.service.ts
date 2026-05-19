import { Injectable, Logger } from '@nestjs/common';
import { ParserService } from './parser/parser.service';
import { EdgeExtractorService } from './extractors/edge-extractor.service';
import { GraphLoaderService } from './loaders/graph-loader.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly parserService: ParserService,
    private readonly edgeExtractorService: EdgeExtractorService,
    private readonly graphLoaderService: GraphLoaderService,
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

  async runPipeline(projectId: string, directoryPath: string) {
    this.logger.log(
      `Starting ingestion pipeline for project ${projectId} at ${directoryPath}`,
    );

    const filesToParse: string[] = [];
    this.walkDirectory(directoryPath, filesToParse);

    for (const filePath of filesToParse) {
      try {
        const code = fs.readFileSync(filePath, 'utf-8');
        const language = filePath.endsWith('.ts') ? 'typescript' : 'javascript';

        const tree: unknown = this.parserService.parse(code, language);
        const relativePath = path
          .relative(directoryPath, filePath)
          .replace(/\\/g, '/');
        const graph = this.edgeExtractorService.extract(tree, relativePath);

        await this.graphLoaderService.loadGraph(projectId, graph);
      } catch (err) {
        this.logger.error(
          `Failed to process file ${filePath}`,
          (err as Error).stack,
        );
      }
    }

    this.logger.log(`Pipeline completed for project ${projectId}`);
  }
}
