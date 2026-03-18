import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermisosGuard } from './permisos.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('PermisosGuard', () => {
  let guard: PermisosGuard;
  let reflector: Reflector;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      usuario: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermisosGuard,
        Reflector,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = module.get<PermisosGuard>(PermisosGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  function mockContext(user: any): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('should allow access when no permisos are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(await guard.canActivate(mockContext({ id: '1', rol: 'operador' }))).toBe(true);
  });

  it('should always allow admin role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['asociados:ver']);
    expect(await guard.canActivate(mockContext({ id: '1', rol: 'admin' }))).toBe(true);
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it('should allow when user has required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['asociados:ver']);
    prisma.usuario.findUnique.mockResolvedValue({
      rolRef: {
        permisos: [
          { permiso: { codigo: 'asociados:ver' } },
          { permiso: { codigo: 'asociados:editar' } },
        ],
      },
    });

    expect(await guard.canActivate(mockContext({ id: '1', rol: 'operador' }))).toBe(true);
  });

  it('should deny when user lacks required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['usuarios:crear']);
    prisma.usuario.findUnique.mockResolvedValue({
      rolRef: {
        permisos: [{ permiso: { codigo: 'asociados:ver' } }],
      },
    });

    await expect(guard.canActivate(mockContext({ id: '1', rol: 'operador' })))
      .rejects.toThrow(ForbiddenException);
  });

  it('should allow when user has at least one of multiple permisos (OR)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['reportes:ver', 'reportes:exportar']);
    prisma.usuario.findUnique.mockResolvedValue({
      rolRef: {
        permisos: [{ permiso: { codigo: 'reportes:exportar' } }],
      },
    });

    expect(await guard.canActivate(mockContext({ id: '1', rol: 'operador' }))).toBe(true);
  });

  it('should deny when user has no rolRef', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['asociados:ver']);
    prisma.usuario.findUnique.mockResolvedValue({ rolRef: null });

    await expect(guard.canActivate(mockContext({ id: '1', rol: 'operador' })))
      .rejects.toThrow(ForbiddenException);
  });
});
