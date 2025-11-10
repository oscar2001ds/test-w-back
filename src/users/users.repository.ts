import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WhereOptions, FindOptions } from 'sequelize';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.userModel.create(createUserDto as any);
  }

  async findAll(options?: FindOptions<User>): Promise<User[]> {
    return this.userModel.findAll({
      where: { isActive: true },
      ...options,
    });
  }

  async findOne(options: FindOptions<User>): Promise<User | null> {
    return this.userModel.findOne(options);
  }

  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email, isActive: true } as WhereOptions<User>,
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { username, isActive: true } as WhereOptions<User>,
    });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.userModel.findOne({
      where: {
        $or: [
          { email: identifier },
          { username: identifier }
        ],
        isActive: true
      } as any,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<[number]> {
    return this.userModel.update(updateUserDto, {
      where: { id } as WhereOptions<User>,
    });
  }

  async remove(id: number): Promise<number> {
    return this.userModel.destroy({
      where: { id } as WhereOptions<User>,
    });
  }

  async softDelete(id: number): Promise<[number]> {
    return this.userModel.update(
      { isActive: false },
      { where: { id } as WhereOptions<User> }
    );
  }

  async count(where?: WhereOptions<User>): Promise<number> {
    return this.userModel.count({ where });
  }

  async exists(where: WhereOptions<User>): Promise<boolean> {
    const count = await this.userModel.count({ where });
    return count > 0;
  }

  async updateRefreshToken(id: number, refreshToken: string | null): Promise<void> {
    await this.userModel.update(
      { refreshToken } as any,
      { where: { id } as WhereOptions<User> }
    );
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { refreshToken, isActive: true } as WhereOptions<User>,
    });
  }
}