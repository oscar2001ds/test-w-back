import {
  Table,
  Column,
  Model,
  DataType,
  BeforeCreate,
  BeforeUpdate,
  Unique,
  AllowNull,
  IsEmail,
  Length,
} from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/user-role.enum';

@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true,
})
export class User extends Model<User> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Unique
  @AllowNull(false)
  @Length({ min: 3, max: 50 })
  @Column({
    type: DataType.STRING(50),
  })
  declare username: string;

  @Unique
  @AllowNull(false)
  @IsEmail
  @Column({
    type: DataType.STRING(100),
  })
  declare email: string;

  @AllowNull(false)
  @Length({ min: 6 })
  @Column({
    type: DataType.STRING(255),
  })
  declare password: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare firstName?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare lastName?: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    defaultValue: UserRole.CLIENT,
  })
  declare role: UserRole;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastLoginAt?: Date;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare refreshToken?: string;

  // Timestamps automáticos
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;

  // Hooks para hash de contraseña
  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    // Solo hashear si la contraseña ha cambiado
    if (instance.changed('password')) {
      const saltRounds = 12;
      instance.password = await bcrypt.hash(instance.password, saltRounds);
    }
  }

  // Método para validar contraseña
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Método para obtener nombre completo
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.username;
  }

  // Método para obtener usuario sin información sensible
  toJSON(): Partial<User> {
    const values = { ...this.get() } as any;
    delete values.password;
    delete values.refreshToken;
    return values;
  }

  // Método para actualizar último login
  async updateLastLogin(): Promise<void> {
    this.lastLoginAt = new Date();
    await this.save();
  }
}