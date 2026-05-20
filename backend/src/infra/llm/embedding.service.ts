import { Injectable, Logger } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SettingsService } from '../../api/v1/settings/settings.service';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private settingsService: SettingsService) {}

  private getApiKey(
    settings: { apiKey?: string | null } | null | undefined,
  ): string | undefined {
    let apiKey = settings?.apiKey;
    if (!apiKey || apiKey.includes('mock') || apiKey.includes('dummy')) {
      const envKey = process.env.OPENAI_API_KEY;
      if (envKey && !envKey.includes('mock') && !envKey.includes('dummy')) {
        apiKey = envKey;
      }
    }
    return apiKey ?? undefined;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];

    const settings = await this.settingsService.getSettings();
    const apiKey = this.getApiKey(settings);

    if (!apiKey || apiKey.includes('mock') || apiKey.includes('dummy')) {
      this.logger.warn(
        'No valid API key found or mock key used for embeddings. Returning dummy vectors.',
      );
      return texts.map(() => new Array<number>(1536).fill(0.1));
    }

    const isOpenRouter = settings?.llmProvider === 'openrouter';
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: isOpenRouter
        ? 'openai/text-embedding-3-small'
        : 'text-embedding-3-small',
      configuration: {
        baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
      },
    });

    try {
      return await embeddings.embedDocuments(texts);
    } catch (err) {
      this.logger.error('Failed to generate embeddings', err);
      throw err;
    }
  }
}
