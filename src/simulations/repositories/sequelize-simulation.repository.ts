import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Simulation, SimulationStatus } from '../entities/simulation.entity';
import { User } from '../../users/entities/user.entity';
import {
  ISimulationRepository,
  PaginationOptions,
  FilterOptions,
  PaginatedResult,
  CreateSimulationData,
} from './interfaces/simulation-repository.interface';

@Injectable()
export class SequelizeSimulationRepository implements ISimulationRepository {
  private readonly logger = new Logger(SequelizeSimulationRepository.name);

  constructor(
    @InjectModel(Simulation)
    private readonly simulationModel: typeof Simulation,
  ) {}

  async create(data: CreateSimulationData): Promise<Simulation> {
    try {
      const simulation = await this.simulationModel.create(data as any);
      this.logger.log(`Simulación creada con ID: ${simulation.id}`);
      return simulation;
    } catch (error) {
      this.logger.error(`Error en repository creando simulación: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<Simulation | null> {
    return this.simulationModel.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email'],
        },
      ],
    });
  }

  async findByIdAndUser(id: string, userId: number): Promise<Simulation | null> {
    return this.simulationModel.findOne({
      where: {
        id,
        userId,
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email'],
        },
      ],
    });
  }

  async findByUser(
    userId: number,
    pagination: PaginationOptions = {},
    filters: FilterOptions = {}
  ): Promise<PaginatedResult<Simulation>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const where = this.buildWhereClause({ ...filters, userId });

    try {
      const { rows: items, count: total } = await this.simulationModel.findAndCountAll({
        where,
        offset,
        limit: Number(limit),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email'],
          },
        ],
      });

      return {
        items,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error en repository obteniendo simulaciones por usuario: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    pagination: PaginationOptions = {},
    filters: FilterOptions = {}
  ): Promise<PaginatedResult<Simulation>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const where = this.buildWhereClause(filters);

    try {
      const { rows: items, count: total } = await this.simulationModel.findAndCountAll({
        where,
        offset,
        limit: Number(limit),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email'],
          },
        ],
      });

      return {
        items,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error en repository obteniendo todas las simulaciones: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateSimulationData>): Promise<Simulation> {
    try {
      const simulation = await this.findById(id);
      if (!simulation) {
        throw new Error('Simulación no encontrada');
      }

      await simulation.update(data);
      this.logger.log(`Simulación ${id} actualizada en repository`);
      return simulation.reload();
    } catch (error) {
      this.logger.error(`Error en repository actualizando simulación: ${error.message}`);
      throw error;
    }
  }

  async updateStatus(id: string, status: SimulationStatus): Promise<Simulation> {
    try {
      const simulation = await this.findById(id);
      if (!simulation) {
        throw new Error('Simulación no encontrada');
      }

      await simulation.update({ status });
      this.logger.log(`Estado de simulación ${id} actualizado a ${status} en repository`);
      return simulation;
    } catch (error) {
      this.logger.error(`Error en repository actualizando estado: ${error.message}`);
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      const simulation = await this.findById(id);
      if (!simulation) {
        throw new Error('Simulación no encontrada');
      }

      await simulation.destroy();
      this.logger.log(`Simulación ${id} eliminada (soft delete) en repository`);
    } catch (error) {
      this.logger.error(`Error en repository eliminando simulación: ${error.message}`);
      throw error;
    }
  }

  async findAllByUser(userId: number): Promise<Simulation[]> {
    try {
      return this.simulationModel.findAll({
        where: { userId },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email'],
          },
        ],
      });
    } catch (error) {
      this.logger.error(`Error en repository obteniendo simulaciones del usuario: ${error.message}`);
      throw error;
    }
  }

  async findExpiredActiveSimulations(): Promise<Simulation[]> {
    try {
      return this.simulationModel.findAll({
        where: {
          status: SimulationStatus.ACTIVE,
          endDate: {
            [Op.lt]: new Date(),
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error en repository obteniendo simulaciones vencidas: ${error.message}`);
      throw error;
    }
  }

  async findByCriteria(criteria: any): Promise<Simulation[]> {
    try {
      return this.simulationModel.findAll({
        where: criteria,
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email'],
          },
        ],
      });
    } catch (error) {
      this.logger.error(`Error en repository buscando por criterios: ${error.message}`);
      throw error;
    }
  }

  async countByUser(userId: number): Promise<number> {
    try {
      return this.simulationModel.count({
        where: { userId },
      });
    } catch (error) {
      this.logger.error(`Error en repository contando simulaciones del usuario: ${error.message}`);
      throw error;
    }
  }

  async getAggregatedStatsByUser(userId: number): Promise<{
    totalSimulations: number;
    totalInvested: number;
    statusCounts: Record<SimulationStatus, number>;
  }> {
    try {
      const simulations = await this.findAllByUser(userId);
      
      const stats = {
        totalSimulations: simulations.length,
        totalInvested: simulations.reduce((sum, s) => sum + Number(s.amount), 0),
        statusCounts: {
          [SimulationStatus.ACTIVE]: 0,
          [SimulationStatus.COMPLETED]: 0,
          [SimulationStatus.PAUSED]: 0,
        } as Record<SimulationStatus, number>,
      };

      // Contar por estado
      simulations.forEach(simulation => {
        stats.statusCounts[simulation.status]++;
      });

      return stats;
    } catch (error) {
      this.logger.error(`Error en repository obteniendo estadísticas agregadas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Construir cláusula WHERE basada en filtros
   */
  private buildWhereClause(filters: FilterOptions & { userId?: number }): any {
    const where: any = {};

    // Filtro por usuario si se proporciona
    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Filtro por estado
    if (filters.status) {
      where.status = filters.status;
    }

    // Filtro por método de pago
    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    // Filtro por rango de monto
    if (filters.minAmount || filters.maxAmount) {
      where.amount = {};
      if (filters.minAmount) where.amount[Op.gte] = filters.minAmount;
      if (filters.maxAmount) where.amount[Op.lte] = filters.maxAmount;
    }

    // Filtro por rango de fechas
    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) where.startDate[Op.gte] = filters.startDate;
      if (filters.endDate) where.startDate[Op.lte] = filters.endDate;
    }

    return where;
  }
}