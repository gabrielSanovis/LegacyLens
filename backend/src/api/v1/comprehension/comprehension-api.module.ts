import { Module } from '@nestjs/common';
import { ComprehensionController } from './comprehension.controller';
import { ComprehensionModule } from '../../../comprehension/comprehension.module';

@Module({
  imports: [ComprehensionModule],
  controllers: [ComprehensionController],
})
export class ComprehensionApiModule {}
