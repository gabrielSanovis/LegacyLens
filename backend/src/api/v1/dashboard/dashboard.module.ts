import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { GraphModule } from '../../../infra/graph/graph.module';

@Module({
  imports: [GraphModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
