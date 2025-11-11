import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  IsUUID,
  PrimaryKey,
  Default,
  IsIn,
  Min,
  Max,
  Length,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';

export enum PaymentMethod {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export enum SimulationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

@Table({
  tableName: 'simulations',
  timestamps: true,
  paranoid: true, // Soft delete
})
export class Simulation extends Model<Simulation> {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
  })
  declare userId: number;

  @AllowNull(false)
  @Length({ min: 3, max: 100 })
  @Column({
    type: DataType.STRING(100),
  })
  declare title: string;

  @AllowNull(false)
  @Min(100000) // Monto mínimo: $100,000 COP
  @Max(1000000000) // Monto máximo: $1,000,000,000 COP
  @Column({
    type: DataType.DECIMAL(15, 2),
  })
  declare amount: number;

  @AllowNull(false)
  @Default('COP')
  @Length({ min: 3, max: 3 })
  @Column({
    type: DataType.STRING(3),
  })
  declare currency: string;

  @AllowNull(false)
  @Min(0)
  @Max(1) // Máximo 100% (1.0000)
  @Column({
    type: DataType.DECIMAL(6, 4), // Permite hasta 4 decimales: 0.1250 = 12.50%
  })
  declare returnRate: number;

  @AllowNull(false)
  @IsIn([Object.values(PaymentMethod)])
  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
  })
  declare paymentMethod: PaymentMethod;

  @AllowNull(false)
  @Column({
    type: DataType.DATEONLY,
  })
  declare startDate: Date;

  @AllowNull(false)
  @Column({
    type: DataType.DATEONLY,
  })
  declare endDate: Date;

  @AllowNull(false)
  @Min(1)
  @Max(600) // Máximo 50 años
  @Column({
    type: DataType.INTEGER,
  })
  declare termMonths: number;

  @AllowNull(false)
  @Default(SimulationStatus.ACTIVE)
  @IsIn([Object.values(SimulationStatus)])
  @Column({
    type: DataType.ENUM(...Object.values(SimulationStatus)),
  })
  declare status: SimulationStatus;

  // Timestamps automáticos
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;

  // Relación con User
  @BelongsTo(() => User)
  declare user: User;

  // Método para calcular el valor final de la inversión
  calculateFinalAmount(): number {
    const principal = Number(this.amount);
    const rate = Number(this.returnRate);
    const periods = this.paymentMethod === PaymentMethod.MONTHLY ? this.termMonths : Math.floor(this.termMonths / 12);
    
    // Fórmula de interés compuesto
    return principal * Math.pow(1 + rate / (this.paymentMethod === PaymentMethod.MONTHLY ? 12 : 1), periods);
  }

  // Método para calcular las ganancias
  calculateTotalReturn(): number {
    return this.calculateFinalAmount() - Number(this.amount);
  }

  // Método para verificar si la simulación está vencida
  isExpired(): boolean {
    const endDate = this.endDate instanceof Date ? this.endDate : new Date(this.endDate);
    return new Date() > endDate;
  }

  // Método para obtener el progreso de la simulación
  getProgress(): number {
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (now <= start) return 0;
    if (now >= end) return 100;
    
    const totalTime = end.getTime() - start.getTime();
    const elapsedTime = now.getTime() - start.getTime();
    
    return Math.round((elapsedTime / totalTime) * 100);
  }

  // Método para obtener información serializada
  toJSON(): any {
    const values = { ...this.get() } as any;
    
    // Agregar campos calculados
    values.finalAmount = this.calculateFinalAmount();
    values.totalReturn = this.calculateTotalReturn();
    values.progress = this.getProgress();
    values.isExpired = this.isExpired();
    
    // Formatear fechas para el frontend (con validación)
    values.createdAt = this.createdAt instanceof Date ? this.createdAt.toISOString() : new Date(this.createdAt).toISOString();
    values.updatedAt = this.updatedAt instanceof Date ? this.updatedAt.toISOString() : new Date(this.updatedAt).toISOString();
    values.startDate = this.startDate instanceof Date ? this.startDate.toISOString().split('T')[0] : new Date(this.startDate).toISOString().split('T')[0];
    values.endDate = this.endDate instanceof Date ? this.endDate.toISOString().split('T')[0] : new Date(this.endDate).toISOString().split('T')[0];
    
    // Renombrar para compatibilidad con el frontend
    values.lastUpdated = values.updatedAt;
    
    return values;
  }
}