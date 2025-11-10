import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  lastName?: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ 
    example: 'client',
    enum: ['super-admin', 'admin', 'supervisor', 'client'],
    description: 'Rol del usuario en el sistema'
  })
  role: string;
}

export class TokensResponseDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token válido por 1 hora'
  })
  access_token: string;

  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token válido por 7 días'
  })
  refresh_token: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: TokensResponseDto })
  tokens: TokensResponseDto;
}

export class HybridLoginResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token válido por 1 hora (Refresh token enviado en HttpOnly cookie)'
  })
  access_token: string;
}

export class RefreshResponseDto {
  @ApiProperty({ type: TokensResponseDto })
  tokens: TokensResponseDto;
}