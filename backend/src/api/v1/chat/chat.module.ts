import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DatabaseModule } from '../../../infra/database/database.module';
import { ComprehensionModule } from '../../../comprehension/comprehension.module';

@Module({
  imports: [DatabaseModule, ComprehensionModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
