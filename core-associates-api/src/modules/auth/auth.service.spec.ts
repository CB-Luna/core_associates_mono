import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { SmsService } from '../../common/sms/sms.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('AuthService', () => {
  let service: AuthService;
  let prisma: Record<string, any>;
  let redis: Record<string, any>;
  let jwtService: Record<string, any>;
  let configService: Record<string, any>;
  let smsService: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      asociado: {
        findUnique: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      usuario: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    redis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('development'),
    };

    smsService = {
      sendOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: SmsService, useValue: smsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('sendOtp', () => {
    it('should store OTP in redis and return success message', async () => {
      const result = await service.sendOtp('5512345678');
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('otp:5512345678'),
        expect.any(String),
        300,
      );
      expect(result).toEqual({ message: 'OTP enviado correctamente' });
    });

    it('should generate a 6-digit OTP', async () => {
      await service.sendOtp('5512345678');
      const otpArg = redis.set.mock.calls[0][1];
      expect(otpArg).toMatch(/^\d{6}$/);
    });
  });

  describe('verifyOtp', () => {
    it('should accept dev bypass code 000000', async () => {
      configService.get.mockReturnValue('development');
      prisma.asociado.findUnique.mockResolvedValue({
        id: 'assoc-1',
        telefono: '5512345678',
      });

      const result = await service.verifyOtp('5512345678', '000000');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(redis.get).not.toHaveBeenCalled();
    });

    it('should verify OTP from redis and return tokens', async () => {
      configService.get.mockReturnValue('production');
      redis.get.mockResolvedValue('123456');
      prisma.asociado.findUnique.mockResolvedValue({
        id: 'assoc-1',
        telefono: '5512345678',
      });

      const result = await service.verifyOtp('5512345678', '123456');
      expect(redis.get).toHaveBeenCalledWith('otp:5512345678');
      expect(redis.del).toHaveBeenCalledWith('otp:5512345678');
      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      configService.get.mockReturnValue('production');
      redis.get.mockResolvedValue('123456');

      await expect(service.verifyOtp('5512345678', '999999'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should auto-register new asociado on first login', async () => {
      configService.get.mockReturnValue('development');
      prisma.asociado.findUnique.mockResolvedValue(null);
      prisma.asociado.count.mockResolvedValue(5);
      prisma.asociado.create.mockResolvedValue({
        id: 'new-assoc',
        telefono: '5512345678',
      });

      await service.verifyOtp('5512345678', '000000');
      expect(prisma.asociado.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          idUnico: 'ASC-0006',
          telefono: '5512345678',
          estado: 'pendiente',
        }),
      });
    });
  });

  describe('loginAdmin', () => {
    it('should return tokens and user on valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 10);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@core.mx',
        nombre: 'Admin',
        rol: 'admin',
        passwordHash: hash,
      });

      const result = await service.loginAdmin('admin@core.mx', 'password123');
      expect(result).toHaveProperty('accessToken');
      expect(result.user).toEqual(
        expect.objectContaining({ email: 'admin@core.mx', rol: 'admin' }),
      );
    });

    it('should throw on non-existent user', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      await expect(service.loginAdmin('bad@core.mx', 'pass'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw on wrong password', async () => {
      const hash = await bcrypt.hash('correct', 10);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@core.mx',
        passwordHash: hash,
      });

      await expect(service.loginAdmin('admin@core.mx', 'wrong'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue({
        id: 'new-user',
        email: 'op@core.mx',
        nombre: 'Operador',
        rol: 'operador',
      });

      await service.createUser({
        email: 'op@core.mx',
        nombre: 'Operador',
        password: 'pass123',
        rol: 'operador',
      });

      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'op@core.mx',
            nombre: 'Operador',
            rol: 'operador',
            passwordHash: expect.any(String),
          }),
        }),
      );
    });

    it('should throw ConflictException if email exists', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createUser({
          email: 'dup@core.mx',
          nombre: 'Dup',
          password: 'pass123',
          rol: 'operador',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
