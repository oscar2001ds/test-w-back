import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, IsEnum } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Username solo puede contener letras, números, guiones y puntos'
  })
  username: string;

  @ApiProperty({
    description: 'Correo electrónico único',
    example: 'john@example.com'
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MiContraseña123!',
    minLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'John'
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Doe'
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @ApiProperty({
    description: 'Rol del usuario - debe ser permitido según su nivel jerárquico',
    example: UserRole.CLIENT,
    enum: UserRole,
    enumName: 'UserRole'
  })
  @IsEnum(UserRole, { 
    message: 'El rol debe ser uno de: super-admin, admin, supervisor, client' 
  })
  @IsNotEmpty()
  role: UserRole;
}