import { Module } from '@nestjs/common';
import { ParserService } from './parser/parser.service';
import { EdgeExtractorService } from './extractors/edge-extractor.service';
import { GraphLoaderService } from './loaders/graph-loader.service';
import { PipelineService } from './pipeline.service';
import { IngestionProcessor } from './ingestion.processor';

@Module({
  providers: [
    ParserService,
    EdgeExtractorService,
    GraphLoaderService,
    PipelineService,
    IngestionProcessor,
  ],
  exports: [PipelineService],
})
export class IngestionModule {}
