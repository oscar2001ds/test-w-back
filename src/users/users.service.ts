import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleDto } from './dto/role.dto';
import { User } from './entities/user.entity';
import { UserResponse, UserStatsResponse } from './interfaces/user.interface';
import { SimulationService } from '../simulations/services/simulation.service';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(forwardRef(() => SimulationService))
    private readonly simulationService: SimulationService
  ) { }

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    // Verificar que el usuario no exista
    await this.validateUniqueUser(createUserDto.email, createUserDto.username);

    try {
      const user = await this.usersRepository.create(createUserDto);
      return this.mapToResponse(user);
    } catch (error) {
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.usersRepository.findAll({
      order: [['createdAt', 'DESC']]
    });
    return users.map(user => this.mapToResponse(user));
  }

  async findAllByRoleWithStats(role: UserRole): Promise<UserStatsResponse[]> {
    const users = await this.usersRepository.findAll({
      where: { role: role } as any,
      order: [['createdAt', 'DESC']]
    });

    const usersWithStats = users.map(async (user) => {
      const userStats = await this.simulationService.getStatsByUser(user.id);
      userStats.averageReturnRate = Math.round(userStats.averageReturnRate * 10000) / 100;
      return {
        user: this.mapToResponse(user),
        stats: userStats
      };
    });
    return Promise.all(usersWithStats);
  }

  async findOne(id: number): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return this.mapToResponse(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.usersRepository.findByEmailOrUsername(identifier);
  }

  async findEntityById(id: number): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Verificar unicidad si se actualiza email o username
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.usersRepository.findByEmail(updateUserDto.email);
      if (existingEmail) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.usersRepository.findByUsername(updateUserDto.username);
      if (existingUsername) {
        throw new ConflictException('El username ya está en uso');
      }
    }

    await this.usersRepository.update(id, updateUserDto);
    const updatedUser = await this.usersRepository.findById(id);
    return this.mapToResponse(updatedUser!);
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    await this.usersRepository.remove(id);
  }

  async softDelete(id: number): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    await this.usersRepository.softDelete(id);
    const updatedUser = await this.usersRepository.findById(id);
    return this.mapToResponse(updatedUser!);
  }

  async updateRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
    await this.usersRepository.updateRefreshToken(userId, refreshToken);
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.usersRepository.findByRefreshToken(refreshToken);
  }

  async updateLastLogin(userId: number): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (user) {
      await user.updateLastLogin();
    }
  }

  // Método para validación en autenticación
  async validateUser(identifier: string, password: string): Promise<User | null> {
    const user = await this.findByEmailOrUsername(identifier);

    if (user && await user.validatePassword(password)) {
      return user;
    }
    return null;
  }

  // Método para validación por email únicamente
  async validateUserByEmail(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);

    if (user && await user.validatePassword(password)) {
      return user;
    }
    return null;
  }

  // Métodos privados
  private async validateUniqueUser(email: string, username: string): Promise<void> {
    const existingEmail = await this.usersRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('El email ya está en uso');
    }

    const existingUsername = await this.usersRepository.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('El username ya está en uso');
    }
  }

  // Método para cambiar rol de usuario
  async changeRole(id: number, changeRoleDto: RoleDto): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    try {
      user.role = changeRoleDto.role;
      await user.save();
      return this.mapToResponse(user);
    } catch (error) {
      throw new BadRequestException('Error al cambiar el rol del usuario');
    }
  }

  private mapToResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}