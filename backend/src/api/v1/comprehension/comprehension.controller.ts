import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AgentService } from '../../../comprehension/agent.service';

class ComprehendDto {
  query: string;
}

@Controller('comprehension')
export class ComprehensionController {
  private readonly logger = new Logger(ComprehensionController.name);

  constructor(private readonly agentService: AgentService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyze(@Body() body: ComprehendDto) {
    this.logger.log(`Received comprehension request for query: ${body.query}`);
    const result = await this.agentService.run(body.query);
    return {
      success: true,
      data: result,
    };
  }
}
