import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AsociadosService } from './asociados.service';
import { PrismaService } from '../../prisma/prisma.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('AsociadosService', () => {
  let service: AsociadosService;
  let prisma: Record<string, any>;

  const mockAsociado = {
    id: 'uuid-1',
    idUnico: 'ASO-00001',
    nombre: 'Juan',
    apellidoPat: 'Pérez',
    apellidoMat: 'López',
    telefono: '5512345678',
    email: 'juan@example.com',
    estado: 'pendiente',
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      asociado: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      vehiculo: {
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsociadosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AsociadosService>(AsociadosService);
  });

  describe('getMyProfile', () => {
    it('should return asociado with vehiculos and documentos', async () => {
      prisma.asociado.findUnique.mockResolvedValue({
        ...mockAsociado,
        vehiculos: [],
        documentos: [],
      });

      const result = await service.getMyProfile('uuid-1');
      expect(result.id).toBe('uuid-1');
      expect(prisma.asociado.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        include: expect.objectContaining({ vehiculos: true }),
      });
    });

    it('should throw NotFoundException if asociado not found', async () => {
      prisma.asociado.findUnique.mockResolvedValue(null);
      await expect(service.getMyProfile('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      prisma.asociado.findMany.mockResolvedValue([mockAsociado]);
      prisma.asociado.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('should filter by estado', async () => {
      prisma.asociado.findMany.mockResolvedValue([]);
      prisma.asociado.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, estado: 'activo' });
      expect(prisma.asociado.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'activo' }),
        }),
      );
    });

    it('should apply search filter across nombre, apellido, telefono, idUnico', async () => {
      prisma.asociado.findMany.mockResolvedValue([]);
      prisma.asociado.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, search: 'Juan' });
      const call = prisma.asociado.findMany.mock.calls[0][0];
      expect(call.where.OR).toHaveLength(4);
    });
  });

  describe('findOne', () => {
    it('should return asociado with relations', async () => {
      prisma.asociado.findUnique.mockResolvedValue({
        ...mockAsociado,
        vehiculos: [],
        documentos: [],
        cupones: [],
        casosLegales: [],
      });

      const result = await service.findOne('uuid-1');
      expect(result.id).toBe('uuid-1');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.asociado.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEstado', () => {
    it('should update estado to activo with fechaAprobacion', async () => {
      prisma.asociado.findUnique.mockResolvedValue(mockAsociado);
      prisma.asociado.update.mockResolvedValue({ ...mockAsociado, estado: 'activo' });

      const result = await service.updateEstado('uuid-1', 'activo', 'admin-id');
      expect(prisma.asociado.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: expect.objectContaining({
          estado: 'activo',
          fechaAprobacion: expect.any(Date),
          aprobadoPorId: 'admin-id',
        }),
      });
      expect(result.estado).toBe('activo');
    });

    it('should update estado to suspendido without fechaAprobacion', async () => {
      prisma.asociado.findUnique.mockResolvedValue({ ...mockAsociado, estado: 'activo' });
      prisma.asociado.update.mockResolvedValue({ ...mockAsociado, estado: 'suspendido' });

      await service.updateEstado('uuid-1', 'suspendido', 'admin-id');
      expect(prisma.asociado.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { estado: 'suspendido' },
      });
    });

    it('should throw NotFoundException if asociado not found', async () => {
      prisma.asociado.findUnique.mockResolvedValue(null);
      await expect(service.updateEstado('nonexistent', 'activo', 'admin-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addVehiculo', () => {
    it('should create vehiculo and unmark previous principal', async () => {
      prisma.vehiculo.updateMany.mockResolvedValue({ count: 1 });
      prisma.vehiculo.create.mockResolvedValue({
        id: 'v-1',
        asociadoId: 'uuid-1',
        marca: 'Toyota',
        modelo: 'Corolla',
        anio: 2020,
        color: 'Blanco',
        placas: 'ABC-123',
        esPrincipal: true,
      });

      const result = await service.addVehiculo('uuid-1', {
        marca: 'Toyota',
        modelo: 'Corolla',
        anio: 2020,
        color: 'Blanco',
        placas: 'ABC-123',
      });

      expect(prisma.vehiculo.updateMany).toHaveBeenCalled();
      expect(result.marca).toBe('Toyota');
    });
  });
});
