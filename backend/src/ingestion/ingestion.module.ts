import { Module } from '@nestjs/common';
import { ParserService } from './parser/parser.service';
import { EdgeExtractorService } from './extractors/edge-extractor.service';
import { GraphLoaderService } from './loaders/graph-loader.service';
import { IngestionProcessor } from './ingestion.processor';
import { TypeResolverService } from './extractors/type-resolver.service';
import { ChunkerService } from './chunker/chunker.service';
import { PipelineService } from './pipeline.service';
import { VectorLoaderService } from './loaders/vector-loader.service';
import { VectorModule } from '../infra/vector/vector.module';
import { LlmModule } from '../infra/llm/llm.module';

@Module({
  imports: [VectorModule, LlmModule],
  providers: [
    ParserService,
    EdgeExtractorService,
    TypeResolverService,
    ChunkerService,
    GraphLoaderService,
    VectorLoaderService,
    PipelineService,
    IngestionProcessor,
  ],
  exports: [PipelineService],
})
export class IngestionModule {}
