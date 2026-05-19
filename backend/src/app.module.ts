import { Module } from '@nestjs/common';
import { DatabaseModule } from './infra/database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './api/v1/project/project.module';

@Module({
  imports: [DatabaseModule, AuthModule, ProjectModule],
})
export class AppModule {}
