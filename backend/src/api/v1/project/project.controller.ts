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
  constructor(private readonly projectService: ProjectService) {}

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
}
