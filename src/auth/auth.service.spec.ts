import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    validatePassword: jest.fn(),
    get fullName() { return `${this.firstName} ${this.lastName}`; }
  };

  const mockUsersService = {
    validateUser: jest.fn(),
    updateLastLogin: jest.fn(),
    updateRefreshToken: jest.fn(),
    findByRefreshToken: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'jwt.expiresIn': '1h',
        'jwt.refreshExpiresIn': '7d',
        'jwt.secret': 'test-secret',
        'jwt.refreshSecret': 'test-refresh-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      mockUsersService.validateUser.mockResolvedValue(mockUser);

      const result = await authService.validateUser('testuser', 'password');

      expect(result).toBe(mockUser);
      expect(mockUsersService.validateUser).toHaveBeenCalledWith('testuser', 'password');
    });

    it('should return null if credentials are invalid', async () => {
      mockUsersService.validateUser.mockResolvedValue(null);

      const result = await authService.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return auth response with user and tokens', async () => {
      const mockTokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token'
      };

      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await authService.login(mockUser as any);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          fullName: mockUser.fullName,
        },
        tokens: mockTokens,
      });

      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'refresh-token'
      );
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens if refresh token is valid', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = { sub: 1, username: 'testuser', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockUsersService.findByRefreshToken.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValueOnce('new-access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('new-refresh-token');

      const result = await authService.refreshTokens(refreshToken);

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = { sub: 1, username: 'testuser', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockUsersService.findByRefreshToken.mockResolvedValue(null);

      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('should invalidate refresh token', async () => {
      await authService.logout(1);

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(1, null);
    });
  });
});