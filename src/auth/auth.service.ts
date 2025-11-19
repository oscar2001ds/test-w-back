import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { JwtPayload, AuthTokens, AuthResponse } from './interfaces/jwt-payload.interface';
import { AppType } from './dto/log-in.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(identifier: string, password: string): Promise<User | null> {
    const user = await this.usersService.validateUser(identifier, password);
    return user;
  }

  async login(user: User, remember?: boolean, app?: AppType): Promise<AuthResponse> {
    // Actualizar último login
    await this.usersService.updateLastLogin(user.id);

    // Generar tokens
    const tokens = await this.generateTokens(user, remember);

    // Guardar refresh token en BD
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
      },
      tokens,
    };
  }

  async generateTokens(user: User, remember = false): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    // Configurar duración basada en "remember me"
    const accessTokenExpiry = remember ? '24h' : this.configService.get('jwt.expiresIn');
    const refreshTokenExpiry = remember ? '30d' : this.configService.get('jwt.refreshExpiresIn');

    const [access_token, refresh_token] = await Promise.all([
      // Access Token
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: accessTokenExpiry,
      }),
      // Refresh Token
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: refreshTokenExpiry,
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verificar refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
      const userId = payload.sub;

      if (!userId) {
        throw new UnauthorizedException('Payload inválido en refresh token');
      }
      
      const user = await this.usersService.findEntityById(userId);
      
      if (!user) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (!user.isActive) {
        throw new ForbiddenException('Usuario desactivado');
      }

      // Generar nuevos tokens
      const tokens = await this.generateTokens(user);

      // Actualizar refresh token en BD
      await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async logout(userId: number): Promise<void> {
    // Invalidar refresh token
    await this.usersService.updateRefreshToken(userId, null);
  }

  async register(registerData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponse> {
    // Crear usuario con rol CLIENT por defecto
    const newUser = await this.usersService.create({
      ...registerData,
      role: UserRole.CLIENT,
    });

    // Buscar el usuario completo para el login
    const user = await this.usersService.findByEmail(registerData.email);
    
    if (!user) {
      throw new Error('Error al crear usuario');
    }

    // Hacer login automático
    return this.login(user);
  }

  async validateTokenPayload(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findByUsername(payload.username);
    
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Usuario desactivado');
    }

    return user;
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findOne(userId);
    
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const userEntity = await this.usersService.findByUsername(user.username);
    const isValidPassword = await userEntity?.validatePassword(oldPassword);
    
    if (!isValidPassword) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    // Actualizar contraseña
    await this.usersService.update(userId, { password: newPassword });

    // Invalidar todos los refresh tokens
    await this.logout(userId);
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findOne(userId);
    return user;
  }

  async verifyRefreshToken(refreshToken: string): Promise<void> {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  // Métodos para manejo híbrido de tokens
  getCookieOptions() {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProduction, // Solo HTTPS en producción
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  getRefreshTokenCookieOptions() {
    const refreshExpiry = this.configService.get('jwt.refreshExpiresIn') || '7d';
    const maxAge = this.parseExpiryToMs(refreshExpiry);
    
    return {
      ...this.getCookieOptions(),
      maxAge,
    };
  }

  private parseExpiryToMs(expiry: string): number {
    // Convertir formato como '7d', '24h', '30m' a milisegundos
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      case 's': return value * 1000;
      default: return 7 * 24 * 60 * 60 * 1000; // 7 días por defecto
    }
  }
}
