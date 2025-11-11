import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SimulationService } from './services/simulation.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto, UpdateSimulationStatusDto } from './dto/update-simulation.dto';
import {
  SimulationResponseDto,
  SimulationListResponseDto,
  SimulationStatsResponseDto
} from './dto/simulation-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { SimulationStatus, PaymentMethod } from './entities/simulation.entity';
import { AuthorizationService } from '../users/services/authorization.service';
import { UsersService } from '../users/users.service';

@ApiTags('Financial Simulations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('simulations')
export class SimulationController {
  constructor(
    private readonly simulationService: SimulationService,
    private readonly authorizationService: AuthorizationService,
    private readonly usersService: UsersService,
  ) { }

  @Post()
  @ApiOperation({
    summary: 'Crear nueva simulación financiera',
    description: 'Crea una nueva simulación de inversión con cálculos automáticos de tasas de retorno',
  })
  @ApiCreatedResponse({
    description: 'Simulación creada exitosamente',
    type: SimulationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o fechas incorrectas',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  async create(
    @GetUser() user: User,
    @Body() createSimulationDto: CreateSimulationDto,
  ): Promise<SimulationResponseDto> {
    const simulation = await this.simulationService.create(user.id, createSimulationDto);
    return simulation.toJSON();
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Listar simulaciones de un usuario',
    description: 'Obtiene todas las simulaciones de un usuario específico. Solo accesible por el mismo usuario o roles superiores.',
  })
  @ApiOkResponse({
    description: 'Lista de simulaciones obtenida exitosamente',
    type: SimulationListResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para acceder a las simulaciones de este usuario',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (por defecto: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página (por defecto: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SimulationStatus,
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    enum: PaymentMethod,
    description: 'Filtrar por método de pago',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Monto mínimo',
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    type: Number,
    description: 'Monto máximo',
  })
  async findAll(
    @GetUser() authenticatedUser: User,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: SimulationStatus,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
  ): Promise<SimulationListResponseDto> {
    // Validar autorización: mismo usuario o rol superior
    await this.authorizationService.validateUserResourceAccess(
      authenticatedUser,
      targetUserId,
      this.usersService
    );

    const result = await this.simulationService.findAllByUser(
      targetUserId,
      { page, limit },
      { status, paymentMethod, minAmount, maxAmount }
    );

    return {
      simulations: result.simulations.map(
        simulation => {
          simulation.returnRate = Math.round(simulation.returnRate * 10000) / 100;
          return simulation.toJSON();
        }
      ),
      pagination: result.pagination,
    };
  }

  @Get('stats/:userId')
  @ApiOperation({
    summary: 'Estadísticas de un usuario',
    description: 'Obtiene estadísticas resumidas de todas las simulaciones de un usuario. Solo accesible por el mismo usuario o roles superiores.',
  })
  @ApiOkResponse({
    description: 'Estadísticas obtenidas exitosamente',
    type: SimulationStatsResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para acceder a las estadísticas de este usuario',
  })
  async getStats(
    @GetUser() authenticatedUser: User,
    @Param('userId', ParseIntPipe) targetUserId: number
  ): Promise<SimulationStatsResponseDto> {
    // Validar autorización: mismo usuario o rol superior
    await this.authorizationService.validateUserResourceAccess(
      authenticatedUser,
      targetUserId,
      this.usersService
    );

    const stats = await this.simulationService.getStatsByUser(targetUserId);
    stats.averageReturnRate = Math.round(stats.averageReturnRate * 10000) / 100;
    return stats;
  }

  @Get(':id/user/:userId')
  @ApiOperation({
    summary: 'Obtener simulación específica',
    description: 'Obtiene los detalles de una simulación específica de un usuario. Solo accesible por el mismo usuario o roles superiores.',
  })
  @ApiOkResponse({
    description: 'Simulación obtenida exitosamente',
    type: SimulationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Simulación no encontrada',
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para acceder a esta simulación',
  })
  async findOne(
    @GetUser() authenticatedUser: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseIntPipe) targetUserId: number,
  ): Promise<SimulationResponseDto> {
    // Validar autorización: mismo usuario o rol superior
    await this.authorizationService.validateUserResourceAccess(
      authenticatedUser,
      targetUserId,
      this.usersService
    );

    const simulation = await this.simulationService.findOneByUser(targetUserId, id);
    return simulation.toJSON();
  }

  @Get(':id/schedule/user/:userId')
  @ApiOperation({
    summary: 'Cronograma de pagos',
    description: 'Obtiene el cronograma detallado de pagos e intereses de la simulación de un usuario. Solo accesible por el mismo usuario o roles superiores.',
  })
  @ApiOkResponse({
    description: 'Cronograma obtenido exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          period: { type: 'number', example: 1 },
          date: { type: 'string', example: '2024-02-01' },
          balance: { type: 'number', example: 5125000 },
          interest: { type: 'number', example: 125000 },
          totalValue: { type: 'number', example: 5125000 },
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para acceder al cronograma de este usuario',
  })
  async getPaymentSchedule(
    @GetUser() authenticatedUser: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseIntPipe) targetUserId: number,
  ) {
    // Validar autorización: mismo usuario o rol superior
    await this.authorizationService.validateUserResourceAccess(
      authenticatedUser,
      targetUserId,
      this.usersService
    );

    return this.simulationService.getPaymentSchedule(targetUserId, id);
  }

  @Patch(':id/user/:userId')
  @ApiOperation({
    summary: 'Actualizar simulación',
    description: 'Actualiza los datos de una simulación de un usuario. Solo accesible por el mismo usuario o roles superiores.',
  })
  @ApiOkResponse({
    description: 'Simulación actualizada exitosamente',
    type: SimulationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para editar simulaciones de este usuario',
  })
  @ApiNotFoundResponse({
    description: 'Simulación no encontrada',
  })
  async update(
    @GetUser() authenticatedUser: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Body() updateSimulationDto: UpdateSimulationDto,
  ): Promise<SimulationResponseDto> {
    // Validar autorización: mismo usuario o rol superior
    await this.authorizationService.validateUserResourceAccess(
      authenticatedUser,
      targetUserId,
      this.usersService
    );

    const simulation = await this.simulationService.update(targetUserId, id, updateSimulationDto);
    return simulation.toJSON();
  }

  @Patch(':id/status/user/:userId')
  @ApiOperation({
    summary: 'Cambiar estado de simulación',
    description: 'Actualiza únicamente el estado de una simulación de un usuario. Solo accesible por el mismo usuario o roles superiores.',
  })
  @ApiOkResponse({
    description: 'Estado actualizado exitosamente',
    type: SimulationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Estado inválido',
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para editar simulaciones de este usuario',
  })
  async updateStatus(
    @GetUser() authenticatedUser: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Body() updateStatusDto: UpdateSimulationStatusDto,
  ): Promise<SimulationResponseDto> {
    // Validar autorización: mismo usuario o rol superior
    await this.authorizationService.validateUserResourceAccess(
      authenticatedUser,
      targetUserId,
      this.usersService
    );

    const simulation = await this.simulationService.updateStatus(targetUserId, id, updateStatusDto);
    return simulation.toJSON();
  }

  @Delete(':id/user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar simulación',
    description: 'Elimina una simulación de un usuario. Solo accesible por el mismo usuario o roles superiores.',
  })
  @ApiNoContentResponse({
    description: 'Simulación eliminada exitosamente',
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para eliminar simulaciones de este usuario',
  })
  @ApiNotFoundResponse({
    description: 'Simulación no encontrada',
  })
  async remove(
    @GetUser() authenticatedUser: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseIntPipe) targetUserId: number,
  ): Promise<void> {
    // Validar autorización: mismo usuario o rol superior
    await this.authorizationService.validateUserResourceAccess(
      authenticatedUser,
      targetUserId,
      this.usersService
    );

    await this.simulationService.remove(targetUserId, id);
  }
}