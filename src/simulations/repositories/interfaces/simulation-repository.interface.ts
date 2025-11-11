import { Simulation, SimulationStatus, PaymentMethod } from '../../entities/simulation.entity';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface FilterOptions {
  status?: SimulationStatus;
  paymentMethod?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateSimulationData {
  userId: number;
  title: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  startDate: Date;
  endDate: Date;
  termMonths: number;
  returnRate: number;
  status: SimulationStatus;
}

export interface ISimulationRepository {
  /**
   * Crear nueva simulación
   */
  create(data: CreateSimulationData): Promise<Simulation>;

  /**
   * Buscar simulación por ID
   */
  findById(id: string): Promise<Simulation | null>;

  /**
   * Buscar simulación por ID y usuario (para verificar propiedad)
   */
  findByIdAndUser(id: string, userId: number): Promise<Simulation | null>;

  /**
   * Obtener todas las simulaciones del usuario con paginación y filtros
   */
  findByUser(
    userId: number, 
    pagination?: PaginationOptions, 
    filters?: FilterOptions
  ): Promise<PaginatedResult<Simulation>>;

  /**
   * Obtener todas las simulaciones (solo para admin)
   */
  findAll(
    pagination?: PaginationOptions, 
    filters?: FilterOptions
  ): Promise<PaginatedResult<Simulation>>;

  /**
   * Actualizar simulación
   */
  update(id: string, data: Partial<CreateSimulationData>): Promise<Simulation>;

  /**
   * Actualizar solo el estado
   */
  updateStatus(id: string, status: SimulationStatus): Promise<Simulation>;

  /**
   * Eliminar simulación (soft delete)
   */
  softDelete(id: string): Promise<void>;

  /**
   * Obtener todas las simulaciones de un usuario sin paginación (para estadísticas)
   */
  findAllByUser(userId: number): Promise<Simulation[]>;

  /**
   * Buscar simulaciones vencidas que siguen activas
   */
  findExpiredActiveSimulations(): Promise<Simulation[]>;

  /**
   * Buscar simulaciones por criterios específicos
   */
  findByCriteria(criteria: any): Promise<Simulation[]>;

  /**
   * Contar simulaciones por usuario
   */
  countByUser(userId: number): Promise<number>;

  /**
   * Obtener estadísticas agregadas por usuario
   */
  getAggregatedStatsByUser(userId: number): Promise<{
    totalSimulations: number;
    totalInvested: number;
    statusCounts: Record<SimulationStatus, number>;
  }>;
}