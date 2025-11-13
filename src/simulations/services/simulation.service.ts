import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef
} from '@nestjs/common';
import { Simulation, SimulationStatus, PaymentMethod } from '../entities/simulation.entity';
import { CreateSimulationDto } from '../dto/create-simulation.dto';
import { UpdateSimulationDto, UpdateSimulationStatusDto } from '../dto/update-simulation.dto';
import { SimulationCalculatorService } from './simulation-calculator.service';
import type {
  ISimulationRepository,
  PaginationOptions,
  FilterOptions
} from '../repositories/interfaces/simulation-repository.interface';
import { InjectSimulationRepository } from '../decorators/inject-simulation-repository.decorator';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { SimulationStats } from '../interfaces/simulation.interface';

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(
    @InjectSimulationRepository()
    private readonly simulationRepository: ISimulationRepository,
    private readonly calculatorService: SimulationCalculatorService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) { }

  /**
   * Crear nueva simulación
   */
  async create(userId: number, createSimulationDto: CreateSimulationDto): Promise<Simulation> {
    this.logger.log(`Creando simulación para usuario ${userId}`);

    const dateValidation = this.calculatorService.validateDateRange(
      createSimulationDto.startDate,
      createSimulationDto.endDate
    );

    if (!dateValidation.isValid) {
      throw new BadRequestException(dateValidation.errors.join(', '));
    }

    const termMonths = this.calculatorService.calculateTermMonths(
      createSimulationDto.startDate,
      createSimulationDto.endDate
    );

    const returnRate = this.calculatorService.calculateReturnRate(
      createSimulationDto.startDate,
      createSimulationDto.endDate,
      createSimulationDto.amount,
      createSimulationDto.paymentMethod
    );

    try {
      const simulation = await this.simulationRepository.create({
        userId,
        title: createSimulationDto.title,
        amount: createSimulationDto.amount,
        currency: createSimulationDto.currency || 'COP',
        paymentMethod: createSimulationDto.paymentMethod,
        startDate: new Date(createSimulationDto.startDate.split('T')[0].concat('T00:00:00')),
        endDate: new Date(createSimulationDto.endDate.split('T')[0].concat('T00:00:00')),
        termMonths,
        returnRate,
        status: SimulationStatus.ACTIVE,
      });

      this.logger.log(`Simulación creada con ID: ${simulation.id}`);
      return simulation;
    } catch (error) {
      this.logger.error(`Error creando simulación: ${error.message}`);
      throw new BadRequestException('Error al crear la simulación');
    }
  }

  /**
   * Obtener todas las simulaciones del usuario con paginación y filtros
   */
  async findAllByUser(
    userId: number,
    pagination: PaginationOptions = {},
    filters: FilterOptions = {}
  ): Promise<{
    simulations: Simulation[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const result = await this.simulationRepository.findByUser(userId, pagination, filters);

      return {
        simulations: result.items,
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo simulaciones: ${error.message}`);
      throw new BadRequestException('Error al obtener las simulaciones');
    }
  }

  /**
   * Obtener una simulación específica del usuario
   */
  async findOneByUser(userId: number, simulationId: string): Promise<Simulation> {
    const simulation = await this.simulationRepository.findByIdAndUser(simulationId, userId);

    if (!simulation) {
      throw new NotFoundException('Simulación no encontrada');
    }

    return simulation;
  }

  /**
   * Actualizar simulación
   */
  async update(
    userId: number,
    simulationId: string,
    updateSimulationDto: UpdateSimulationDto
  ): Promise<Simulation> {
    // Verificar que la simulación existe y pertenece al usuario
    const existingSimulation = await this.findOneByUser(userId, simulationId);

    // Si se están actualizando fechas, recalcular datos
    let updates: any = { ...updateSimulationDto };

    if (updateSimulationDto.startDate || updateSimulationDto.endDate) {
      const startDate = updateSimulationDto.startDate || existingSimulation.startDate;
      const endDate = updateSimulationDto.endDate || existingSimulation.endDate;

      // Validar nuevas fechas
      const dateValidation = this.calculatorService.validateDateRange(startDate, endDate);
      if (!dateValidation.isValid) {
        throw new BadRequestException(dateValidation.errors.join(', '));
      }

      // Recalcular datos automáticos
      updates.termMonths = this.calculatorService.calculateTermMonths(startDate, endDate);
      updates.returnRate = this.calculatorService.calculateReturnRate(
        startDate,
        endDate,
        updateSimulationDto.amount || existingSimulation.amount,
        updateSimulationDto.paymentMethod || existingSimulation.paymentMethod
      );

      // Convertir fechas a Date objects
      if (updateSimulationDto.startDate) {
        updates.startDate = new Date(updateSimulationDto.startDate.split('T')[0].concat('T00:00:00'));
      }
      if (updateSimulationDto.endDate) {
        updates.endDate = new Date(updateSimulationDto.endDate.split('T')[0].concat('T00:00:00'));
      }
    }

    try {
      const updatedSimulation = await this.simulationRepository.update(simulationId, updates);
      this.logger.log(`Simulación ${simulationId} actualizada`);
      return updatedSimulation;
    } catch (error) {
      this.logger.error(`Error actualizando simulación: ${error.message}`);
      throw new BadRequestException('Error al actualizar la simulación');
    }
  }

  /**
   * Actualizar solo el estado de una simulación
   */
  async updateStatus(
    userId: number,
    simulationId: string,
    updateStatusDto: UpdateSimulationStatusDto
  ): Promise<Simulation> {
    // Verificar que la simulación existe y pertenece al usuario
    await this.findOneByUser(userId, simulationId);

    try {
      const updatedSimulation = await this.simulationRepository.updateStatus(
        simulationId,
        updateStatusDto.status
      );
      this.logger.log(`Estado de simulación ${simulationId} actualizado a ${updateStatusDto.status}`);
      return updatedSimulation;
    } catch (error) {
      this.logger.error(`Error actualizando estado: ${error.message}`);
      throw new BadRequestException('Error al actualizar el estado de la simulación');
    }
  }

  /**
   * Eliminar simulación (soft delete)
   */
  async remove(userId: number, simulationId: string): Promise<void> {
    // Verificar que la simulación existe y pertenece al usuario
    await this.findOneByUser(userId, simulationId);

    try {
      await this.simulationRepository.softDelete(simulationId);
      this.logger.log(`Simulación ${simulationId} eliminada (soft delete)`);
    } catch (error) {
      this.logger.error(`Error eliminando simulación: ${error.message}`);
      throw new BadRequestException('Error al eliminar la simulación');
    }
  }

  /**
   * Obtener estadísticas del usuario
   */
  async getStatsByUser(userOrId: User | number): Promise<SimulationStats> {
    try {
      // Determinar userId y usuario
      let userId: number;
      let user: User | null = null;

      if (typeof userOrId === 'number') {
        userId = userOrId;
      } else {
        userId = userOrId.id;
        user = userOrId;
      }

      const simulations = await this.simulationRepository.findAllByUser(userId);
      const aggregatedStats = await this.simulationRepository.getAggregatedStatsByUser(userId);

      // Si no tenemos el objeto User completo, obtenerlo para calcular userActiveDays
      if (!user) {
        user = await this.usersService.findEntityById(userId);
      }

      const stats = {
        totalSimulations: aggregatedStats.totalSimulations,
        activeSimulations: aggregatedStats.statusCounts[SimulationStatus.ACTIVE],
        completedSimulations: aggregatedStats.statusCounts[SimulationStatus.COMPLETED],
        pausedSimulations: aggregatedStats.statusCounts[SimulationStatus.PAUSED],
        totalInvested: aggregatedStats.totalInvested,
        totalProjectedReturns: simulations.reduce((sum, s) => sum + s.calculateTotalReturn(), 0),
        averageReturnRate: simulations.length > 0
          ? simulations.reduce((sum, s) => sum + Number(s.returnRate), 0) / simulations.length
          : 0,
        userActiveDays: user?.createdAt ?
          Math.floor((new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        lastSimulationDate: simulations.length > 0
          ? simulations.reduce((latest, s) =>
            s.createdAt > latest ? s.createdAt : latest, simulations[0].createdAt).toISOString()
          : undefined,
      };

      return stats;
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas: ${error.message}`);
      throw new BadRequestException('Error al obtener las estadísticas');
    }
  }

  /**
   * Obtener cronograma de pagos de una simulación
   */
  async getPaymentSchedule(userId: number, simulationId: string): Promise<any[]> {
    const simulation = await this.findOneByUser(userId, simulationId);

    return this.calculatorService.generatePaymentSchedule(
      Number(simulation.amount),
      Number(simulation.returnRate),
      simulation.termMonths,
      simulation.paymentMethod,
      simulation.startDate
    );
  }

  /**
   * Recalcular todas las tasas de retorno (útil si cambian las reglas del banco)
   */
  async recalculateAllRates(userId?: number): Promise<number> {
    const simulations = userId
      ? await this.simulationRepository.findAllByUser(userId)
      : await this.simulationRepository.findByCriteria({});

    let updatedCount = 0;

    for (const simulation of simulations) {
      const newReturnRate = this.calculatorService.calculateReturnRate(
        simulation.startDate,
        simulation.endDate,
        Number(simulation.amount),
        simulation.paymentMethod
      );

      if (Math.abs(Number(simulation.returnRate) - newReturnRate) > 0.0001) {
        await this.simulationRepository.update(simulation.id, { returnRate: newReturnRate });
        updatedCount++;
      }
    }

    this.logger.log(`Recalculadas ${updatedCount} simulaciones`);
    return updatedCount;
  }

  /**
   * Actualizar automáticamente estados basados en fechas
   */
  async updateExpiredSimulations(): Promise<number> {
    const expiredSimulations = await this.simulationRepository.findExpiredActiveSimulations();

    let updatedCount = 0;

    for (const simulation of expiredSimulations) {
      await this.simulationRepository.updateStatus(simulation.id, SimulationStatus.COMPLETED);
      updatedCount++;
    }

    this.logger.log(`Actualizadas ${updatedCount} simulaciones vencidas a completadas`);
    return updatedCount;
  }
}