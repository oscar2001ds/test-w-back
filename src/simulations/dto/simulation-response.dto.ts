import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, SimulationStatus } from '../entities/simulation.entity';

export class SimulationResponseDto {
  @ApiProperty({
    description: 'ID único de la simulación',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  id: string;

  @ApiProperty({
    description: 'Título de la simulación',
    example: 'Inversión para casa propia'
  })
  title: string;

  @ApiProperty({
    description: 'Monto invertido',
    example: 5000000
  })
  amount: number;

  @ApiProperty({
    description: 'Moneda de la inversión',
    example: 'COP'
  })
  currency: string;

  @ApiProperty({
    description: 'Tasa de retorno anual',
    example: 0.125
  })
  returnRate: number;

  @ApiProperty({
    description: 'Método de pago',
    example: 'monthly',
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: string;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-01T00:00:00.000Z'
  })
  lastUpdated: string;

  @ApiProperty({
    description: 'Estado de la simulación',
    example: 'active',
    enum: SimulationStatus
  })
  status: SimulationStatus;

  @ApiProperty({
    description: 'Fecha de inicio de la inversión',
    example: '2024-01-01'
  })
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin de la inversión',
    example: '2026-01-01'
  })
  endDate: string;

  @ApiProperty({
    description: 'Duración en meses',
    example: 24
  })
  termMonths: number;

  @ApiProperty({
    description: 'Monto final calculado',
    example: 6250000
  })
  finalAmount: number;

  @ApiProperty({
    description: 'Ganancias totales',
    example: 1250000
  })
  totalReturn: number;

  @ApiProperty({
    description: 'Progreso de la inversión (0-100%)',
    example: 25
  })
  progress: number;

  @ApiProperty({
    description: 'Indica si la inversión ha vencido',
    example: false
  })
  isExpired: boolean;
}

export class SimulationListResponseDto {
  @ApiProperty({
    description: 'Lista de simulaciones',
    type: [SimulationResponseDto]
  })
  simulations: SimulationResponseDto[];

  @ApiProperty({
    description: 'Información de paginación'
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class SimulationStatsResponseDto {
  @ApiProperty({
    description: 'Total de simulaciones del usuario',
    example: 15
  })
  totalSimulations: number;

  @ApiProperty({
    description: 'Simulaciones activas',
    example: 8
  })
  activeSimulations: number;

  @ApiProperty({
    description: 'Simulaciones completadas',
    example: 5
  })
  completedSimulations: number;

  @ApiProperty({
    description: 'Simulaciones pausadas',
    example: 2
  })
  pausedSimulations: number;

  @ApiProperty({
    description: 'Monto total invertido',
    example: 50000000
  })
  totalInvested: number;

  @ApiProperty({
    description: 'Ganancias proyectadas totales',
    example: 12500000
  })
  totalProjectedReturns: number;
}