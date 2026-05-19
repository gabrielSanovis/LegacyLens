import { Module } from '@nestjs/common';
import { DatabaseModule } from './infra/database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './api/v1/project/project.module';
import { GraphModule } from './infra/graph/graph.module';
import { QueueModule } from './infra/queue/queue.module';
import { IngestionModule } from './ingestion/ingestion.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ProjectModule,
    GraphModule,
    QueueModule,
    IngestionModule,
  ],
})
export class AppModule {}
