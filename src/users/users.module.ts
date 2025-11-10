import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AuthorizationService } from './services/authorization.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, AuthorizationService],
  exports: [UsersService, UsersRepository, AuthorizationService, SequelizeModule],
})
export class UsersModule {}