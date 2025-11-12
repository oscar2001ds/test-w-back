import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleDto } from './dto/role.dto';
import { AuthorizationService } from './services/authorization.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authorizationService: AuthorizationService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo usuario',
    description: 'Crea un nuevo usuario - requiere permisos según jerarquía de roles'
  })
  @ApiCreatedResponse({
    description: 'Usuario creado exitosamente',
  })
  @ApiConflictResponse({
    description: 'Email o username ya están en uso',
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para asignar este rol',
  })
  @ApiBearerAuth('JWT-auth')
  async create(
    @GetUser() currentUser: User,
    @Body() createUserDto: CreateUserDto,
  ) {
    // Validar que el usuario actual puede crear usuarios con el rol especificado
    this.authorizationService.validateUserCreation(currentUser, createUserDto.role);

    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los usuarios',
    description: 'Retorna una lista de todos los usuarios activos'
  })
  @ApiOkResponse({
    description: 'Lista de usuarios obtenida exitosamente',
  })
  @ApiBearerAuth('JWT-auth')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('role-with-stats')
  @ApiOperation({
    summary: 'Obtener todos los usuarios de un rol con sus estadísticas',
    description: 'Retorna una lista de todos los usuarios de un rol específico con sus estadísticas'
  })
  @ApiOkResponse({
    description: 'Lista de usuarios obtenida exitosamente',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({
    name: 'role',
    description: 'Rol de los usuarios',
    type: 'string',
  })
  findAllByRoleWithStats(@Query('role') role: UserRole) {
    return this.usersService.findAllByRoleWithStats(role);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Retorna un usuario específico por su ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: 'number',
    example: 1
  })
  @ApiOkResponse({
    description: 'Usuario encontrado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiBearerAuth('JWT-auth')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Actualiza los datos de un usuario existente según permisos'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: 'number',
    example: 1
  })
  @ApiOkResponse({
    description: 'Usuario actualizado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiConflictResponse({
    description: 'Email o username ya están en uso',
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para modificar este usuario',
  })
  @ApiBearerAuth('JWT-auth')
  async update(
    @GetUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Obtener el usuario objetivo
    const targetUser = await this.usersService.findOne(id);

    // Validar permisos de modificación
    this.authorizationService.validateUserModification(currentUser, targetUser as any);

    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/role')
  @ApiOperation({
    summary: 'Cambiar rol de usuario',
    description: 'Cambia el rol de un usuario según la jerarquía de permisos'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: 'number',
    example: 1
  })
  @ApiOkResponse({
    description: 'Rol del usuario cambiado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para cambiar el rol de este usuario o asignar este rol',
  })
  @ApiBearerAuth('JWT-auth')
  async changeRole(
    @GetUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() changeRoleDto: RoleDto,
  ) {
    // Obtener el usuario objetivo
    const targetUserResponse = await this.usersService.findOne(id);
    const targetUser = { ...targetUserResponse, role: targetUserResponse.role } as User;

    // Validar permisos de cambio de rol
    this.authorizationService.validateRoleChange(currentUser, targetUser, changeRoleDto.role);

    return this.usersService.changeRole(id, changeRoleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('assignable-roles')
  @ApiOperation({
    summary: 'Obtener roles asignables',
    description: 'Retorna los roles que el usuario actual puede asignar'
  })
  @ApiOkResponse({
    description: 'Lista de roles asignables obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        assignableRoles: {
          type: 'array',
          items: { type: 'string' },
          example: ['supervisor', 'client']
        }
      }
    }
  })
  @ApiBearerAuth('JWT-auth')
  getAssignableRoles(@GetUser() currentUser: User) {
    return {
      assignableRoles: this.authorizationService.getUserAssignableRoles(currentUser)
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar usuario',
    description: 'Elimina permanentemente un usuario del sistema'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 204,
    description: 'Usuario eliminado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiBearerAuth('JWT-auth')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Desactivar usuario',
    description: 'Desactiva un usuario (eliminación lógica)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: 'number',
    example: 1
  })
  @ApiOkResponse({
    description: 'Usuario desactivado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiBearerAuth('JWT-auth')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.softDelete(id);
  }
}