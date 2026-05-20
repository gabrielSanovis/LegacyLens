import { Module } from '@nestjs/common';
import { GraphRagService } from './graph-rag.service';
import { AgentService } from './agent.service';
import { VectorModule } from '../infra/vector/vector.module';
import { GraphModule } from '../infra/graph/graph.module';
import { LlmModule } from '../infra/llm/llm.module';
import { SettingsModule } from '../api/v1/settings/settings.module';

@Module({
  imports: [VectorModule, GraphModule, LlmModule, SettingsModule],
  providers: [GraphRagService, AgentService],
  exports: [AgentService],
})
export class ComprehensionModule {}
