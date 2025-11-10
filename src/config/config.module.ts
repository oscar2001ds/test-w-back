import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import corsConfig from './cors.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import mailConfig from './mail.config';
import { default as validate } from './utils/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: '.env',
      validate,
      load: [
        corsConfig,
        databaseConfig,
        jwtConfig,
        mailConfig,
      ],
    }),
  ],
})
export class ServerConfigModule {}
