import { Module } from '@nestjs/common';
import { ServerConfigModule } from 'src/config/config.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [ServerConfigModule, DatabaseModule],
})
export class DatabaseMutationModule {}
