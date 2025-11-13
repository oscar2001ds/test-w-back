import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSimulationDto } from './create-simulation.dto';
import { SimulationStatus } from '../entities/simulation.entity';

export class UpdateSimulationDto extends PartialType(CreateSimulationDto) {
  @ApiPropertyOptional({
    description: 'Estado de la simulación',
    example: 'active',
    enum: SimulationStatus
  })
  @IsOptional()
  @IsEnum(SimulationStatus, { 
    message: 'El estado debe ser "active", "completed" o "paused"' 
  })
  status?: SimulationStatus;
}

export class UpdateSimulationStatusDto {
  @ApiPropertyOptional({
    description: 'Nuevo estado de la simulación',
    example: 'paused',
    enum: SimulationStatus
  })
  @IsEnum(SimulationStatus, { 
    message: 'El estado debe ser "active", "completed" o "paused"' 
  })
  status: SimulationStatus;
}