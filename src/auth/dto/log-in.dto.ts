import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export enum AppType {
  dashboard = 'dashboard',
  consola = 'consola',
  app = 'app',
}

export class LogIn {
  @ApiProperty({
    type: String,
    description: 'Correo electrónico del usuario',
    example: 'usuario@ejemplo.com'
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  email: string;

  @ApiProperty({
    type: String,
    description: 'Contraseña',
    example: 'miContraseña123'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Recordar sesión',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;

  @ApiPropertyOptional({
    enum: AppType,
    enumName: 'AppType',
    description: 'Tipo de aplicación desde el cual se está iniciando sesión',
    example: AppType.dashboard
  })
  @IsOptional()
  @IsEnum(AppType)
  app?: AppType;
}
