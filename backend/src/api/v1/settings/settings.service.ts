import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.systemSetting.findUnique({
      where: { id: 'global' },
    });
    if (!settings) {
      settings = await this.prisma.systemSetting.create({
        data: {
          id: 'global',
          llmProvider: 'openrouter',
        },
      });
    }
    return settings;
  }

  async updateSettings(data: {
    llmProvider?: string;
    apiKey?: string;
    modelName?: string;
  }) {
    return this.prisma.systemSetting.upsert({
      where: { id: 'global' },
      update: data,
      create: {
        id: 'global',
        llmProvider: data.llmProvider || 'openrouter',
        apiKey: data.apiKey,
        modelName: data.modelName,
      },
    });
  }
}
