import { 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsDateString, 
  IsOptional, 
  Min, 
  Max, 
  Length, 
  IsISO8601,
  ValidateIf,
  IsPositive
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/simulation.entity';

export class CreateSimulationDto {
  @ApiProperty({
    description: 'Título descriptivo de la simulación',
    example: 'Inversión para casa propia',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  @Length(3, 100, { message: 'El título debe tener entre 3 y 100 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Monto a invertir en pesos colombianos',
    example: 5000000,
    minimum: 100000,
    maximum: 1000000000
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor a cero' })
  @Min(100000, { message: 'El monto mínimo es $100,000 COP' })
  @Max(1000000000, { message: 'El monto máximo es $1,000,000,000 COP' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Moneda de la inversión',
    example: 'COP',
    default: 'COP',
    minLength: 3,
    maxLength: 3
  })
  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'La moneda debe tener exactamente 3 caracteres' })
  @Transform(({ value }) => value?.toUpperCase())
  currency?: string = 'COP';

  @ApiProperty({
    description: 'Método de pago de intereses',
    example: 'monthly',
    enum: PaymentMethod
  })
  @IsEnum(PaymentMethod, { 
    message: 'El método de pago debe ser "monthly" o "annual"' 
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Fecha de inicio de la inversión (YYYY-MM-DD)',
    example: '2024-01-01'
  })
  @IsDateString({}, { message: 'La fecha de inicio debe ser válida (YYYY-MM-DD)' })
  @IsISO8601({ strict: true })
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin de la inversión (YYYY-MM-DD)',
    example: '2026-01-01'
  })
  @IsDateString({}, { message: 'La fecha de fin debe ser válida (YYYY-MM-DD)' })
  @IsISO8601({ strict: true })
  endDate: string;

  // Validación personalizada para verificar que endDate > startDate
  @ValidateIf((o) => o.startDate && o.endDate)
  get isValidDateRange(): boolean {
    const start = new Date(this.startDate + 'T00:00:00.000Z');
    const end = new Date(this.endDate + 'T00:00:00.000Z');

    
    // La fecha de fin debe ser posterior a la de inicio
    if (end <= start) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    
    // Verificar que el período no sea mayor a 50 años
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (diffMonths > 600) { // 50 años
      throw new Error('El período máximo de inversión es de 50 años');
    }
    
    // Período mínimo de 1 mes
    if (diffMonths < 1) {
      throw new Error('El período mínimo de inversión es de 1 mes');
    }
    
    return true;
  }
}