import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma.service';
import { CreateProjectInput } from '../../../domain/entities/project.entity';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateProjectInput) {
    return this.prisma.project.create({
      data: { ...input, userId },
    });
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { ingestionJobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async delete(id: string) {
    await this.prisma.project.delete({ where: { id } });
    return { deleted: true };
  }
}
