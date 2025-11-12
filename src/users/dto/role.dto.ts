import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class RoleDto {
  @ApiProperty({
    description: 'Nuevo rol para el usuario',
    example: UserRole.SUPERVISOR,
    enum: UserRole,
    enumName: 'UserRole'
  })
  @IsEnum(UserRole, {
    message: 'El rol debe ser uno de: super-admin, admin, supervisor, client'
  })
  @IsNotEmpty()
  role: UserRole;
}