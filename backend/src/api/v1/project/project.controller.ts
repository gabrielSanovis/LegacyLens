import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ProjectService } from './project.service';
import type { CreateProjectInput } from '../../../domain/entities/project.entity';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    @InjectQueue('ingestion') private readonly ingestionQueue: Queue,
  ) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() input: CreateProjectInput) {
    const userId: string = req.user?.sub ?? 'anonymous';
    return this.projectService.create(userId, input);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    const userId: string = req.user?.sub ?? 'anonymous';
    return this.projectService.findAll(userId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.projectService.findById(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.projectService.delete(id);
  }

  @Post(':id/ingest')
  async startIngestion(
    @Param('id') id: string,
    @Body('directoryPath') directoryPath?: string,
  ) {
    const job = await this.ingestionQueue.add('process-repo', {
      projectId: id,
      directoryPath,
    });
    return { message: 'Ingestion started', jobId: job.id };
  }

  @Get(':id/ingest/status')
  async getIngestionStatus(@Param('id') id: string) {
    // For MVP, we'll return a static status or simple queue lookup
    // Assuming there is 1 active job for the project
    const activeJobs = await this.ingestionQueue.getActive();
    const isRunning = activeJobs.some(
      (job) => (job.data as { projectId: string }).projectId === id,
    );

    if (isRunning) return { status: 'RUNNING' };

    const waitingJobs = await this.ingestionQueue.getWaiting();
    const isWaiting = waitingJobs.some(
      (job) => (job.data as { projectId: string }).projectId === id,
    );

    if (isWaiting) return { status: 'QUEUED' };

    return { status: 'COMPLETED' };
  }
}
