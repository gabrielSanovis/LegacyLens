import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PrismaService } from '../infra/database/prisma.service';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface IngestionJobData {
  projectId: string;
  directoryPath?: string;
}

@Processor('ingestion')
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly pipelineService: PipelineService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  private cloneRepository(repoUrl: string, projectId: string): string {
    const tempDir = path.join(process.cwd(), 'temp-clones', projectId);

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    execSync(`git clone --depth 1 ${repoUrl} .`, {
      cwd: tempDir,
      stdio: 'inherit',
    });

    return tempDir;
  }

  private determineDirectoryPath(
    projectId: string,
    directoryPath?: string,
    repoUrl?: string | null,
  ): { path: string; tempDir: string | null } {
    if (!directoryPath && repoUrl) {
      this.logger.log(`Found repoUrl: ${repoUrl}. Cloning repository...`);
      const tempDir = this.cloneRepository(repoUrl, projectId);
      return { path: tempDir, tempDir };
    }
    if (!directoryPath) {
      throw new Error(
        'No repository URL or directory path provided for project',
      );
    }
    return { path: directoryPath, tempDir: null };
  }

  async process(job: Job<IngestionJobData, any, string>): Promise<any> {
    const { projectId } = job.data;
    this.logger.log(
      `Processing job ${job.id ?? 'unknown'} for project ${projectId}`,
    );
    let tempDir: string | null = null;

    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      const result = this.determineDirectoryPath(
        projectId,
        job.data.directoryPath,
        project?.repoUrl,
      );
      tempDir = result.tempDir;
      await this.pipelineService.runPipeline(projectId, result.path);
      this.logger.log(`Job ${job.id ?? 'unknown'} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Job ${job.id ?? 'unknown'} failed: ${(error as Error).message}`,
      );
      throw error;
    } finally {
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }
}
