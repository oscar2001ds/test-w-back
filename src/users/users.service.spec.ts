import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    validatePassword: jest.fn(),
    updateLastLogin: jest.fn(),
    get fullName() { return `${this.firstName} ${this.lastName}`; }
  };

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findByEmailOrUsername: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findOne(1);
      
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        fullName: mockUser.fullName,
        isActive: mockUser.isActive,
        lastLoginAt: undefined,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      mockUser.validatePassword.mockResolvedValue(true);
      mockRepository.findByEmailOrUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser('testuser', 'password');
      
      expect(result).toBe(mockUser);
    });

    it('should return null if credentials are invalid', async () => {
      mockUser.validatePassword.mockResolvedValue(false);
      mockRepository.findByEmailOrUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser('testuser', 'wrongpassword');
      
      expect(result).toBeNull();
    });
  });
});