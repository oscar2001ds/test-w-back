import { 
  Body, 
  Controller, 
  Get, 
  Post, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  Patch,
  Res,
  Req,
  UnauthorizedException 
} from '@nestjs/common';
import type { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { LogIn } from './dto/log-in.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { 
  UserResponseDto,
  HybridLoginResponseDto 
} from './dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario con email y contraseña',
  })
  @ApiOkResponse({
    description: 'Login exitoso - Access token en respuesta, Refresh token en HttpOnly cookie',
    type: HybridLoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas o usuario desactivado',
  })
  async login(
    @GetUser() user: User,
    @Body() loginDto: LogIn,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HybridLoginResponseDto> {
    const authResponse = await this.authService.login(user, loginDto.remember, loginDto.app);
    
    // Configurar cookie con refresh token
    const cookieOptions = this.authService.getRefreshTokenCookieOptions();
    response.cookie('refresh_token', authResponse.tokens.refresh_token, cookieOptions);
    
    // Retornar solo access token en JSON
    return {
      user: authResponse.user,
      access_token: authResponse.tokens.access_token,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea una nueva cuenta de usuario y realiza login automático',
  })
  @ApiCreatedResponse({
    description: 'Usuario creado exitosamente - Access token en respuesta, Refresh token en HttpOnly cookie',
    type: HybridLoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o email/username ya en uso',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HybridLoginResponseDto> {
    const authResponse = await this.authService.register(registerDto);
    
    // Configurar cookie con refresh token
    const cookieOptions = this.authService.getRefreshTokenCookieOptions();
    response.cookie('refresh_token', authResponse.tokens.refresh_token, cookieOptions);
    
    // Retornar solo access token en JSON
    return {
      user: authResponse.user,
      access_token: authResponse.tokens.access_token,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar tokens',
    description: 'Genera nuevos access y refresh tokens usando un refresh token válido',
  })
  @ApiOkResponse({
    description: 'Access token renovado, nuevo refresh token en HttpOnly cookie',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Nuevo access token'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token inválido o expirado',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Obtener refresh token de la cookie
    const refreshToken = request.cookies?.refresh_token;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no encontrado');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    
    // Configurar nueva cookie con el nuevo refresh token
    const cookieOptions = this.authService.getRefreshTokenCookieOptions();
    response.cookie('refresh_token', tokens.refresh_token, cookieOptions);
    
    // Retornar solo access token
    return { 
      success: true,
      access_token: tokens.access_token 
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida el refresh token del usuario actual',
  })
  @ApiOkResponse({
    description: 'Sesión cerrada exitosamente',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiBearerAuth()
  async logout(
    @GetUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(user.id);
    
    // Limpiar cookie del refresh token
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({
    summary: 'Obtener perfil',
    description: 'Retorna la información del usuario autenticado',
  })
  @ApiOkResponse({
    description: 'Perfil del usuario obtenido exitosamente',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiBearerAuth()
  async getProfile(@GetUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cambiar contraseña',
    description: 'Actualiza la contraseña del usuario e invalida todos sus tokens',
  })
  @ApiOkResponse({
    description: 'Contraseña actualizada exitosamente',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido, usuario no encontrado o contraseña actual incorrecta',
  })
  @ApiBadRequestResponse({
    description: 'Nueva contraseña no cumple los requisitos',
  })
  @ApiBearerAuth()
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(
      user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  @ApiOperation({
    summary: 'Verificar sesión',
    description: 'Verifica que el token JWT es válido y retorna información básica del usuario',
  })
  @ApiOkResponse({
    description: 'Sesión válida',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', example: 'john@example.com' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiBearerAuth()
  async validateSession(@GetUser() user: User) {
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        role: user.role,
      },
    };
  }
}
