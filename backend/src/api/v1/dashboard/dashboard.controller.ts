import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Param('projectId') projectId: string) {
    return this.dashboardService.getStats(projectId);
  }

  @Get('graph/actions')
  getActionGraph(@Param('projectId') projectId: string) {
    return this.dashboardService.getActionGraph(projectId);
  }

  @Get('graph/sagas')
  getSagaGraph(@Param('projectId') projectId: string) {
    return this.dashboardService.getSagaGraph(projectId);
  }

  @Get('dead-code')
  getDeadCode(@Param('projectId') projectId: string) {
    return this.dashboardService.getDeadCode(projectId);
  }
}
