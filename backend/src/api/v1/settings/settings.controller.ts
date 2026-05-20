import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Post()
  async updateSettings(
    @Body()
    body: {
      llmProvider?: string;
      apiKey?: string;
      modelName?: string;
    },
  ) {
    return this.settingsService.updateSettings(body);
  }
}
