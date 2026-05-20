import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { SettingsModule } from '../../api/v1/settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [EmbeddingService],
  exports: [EmbeddingService],
})
export class LlmModule {}
