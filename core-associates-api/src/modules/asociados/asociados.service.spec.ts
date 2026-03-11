import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AsociadosService } from './asociados.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { StorageService } from '../storage/storage.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('AsociadosService', () => {
  let service: AsociadosService;
  let prisma: Record<string, any>;
  let storage: Record<string, jest.Mock>;

  const mockAsociado = {
    id: 'uuid-1',
    idUnico: 'ASO-00001',
    nombre: 'Juan',
    apellidoPat: 'Pérez',
    apellidoMat: 'López',
    telefono: '5512345678',
    email: 'juan@example.com',
    estado: 'pendiente',
    fotoUrl: null as string | null,
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
      notaAsociado: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((args: any[]) => Promise.resolve(args.map(() => ({})))),
    };

    storage = {
      uploadFile: jest.fn().mockResolvedValue(undefined),
      getPresignedUrl: jest.fn().mockResolvedValue('https://minio/presigned-url'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    const notificaciones = {
      sendPush: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsociadosService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificacionesService, useValue: notificaciones },
        { provide: StorageService, useValue: storage },
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
    it('should update estado to activo via $transaction with nota', async () => {
      prisma.asociado.findUnique.mockResolvedValue(mockAsociado);
      prisma.$transaction.mockResolvedValue([
        { ...mockAsociado, estado: 'activo', fechaAprobacion: new Date() },
        { id: 'nota-1' },
      ]);

      const result = await service.updateEstado('uuid-1', 'activo', 'admin-id');
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.estado).toBe('activo');
    });

    it('should include motivoRechazo for rechazado', async () => {
      prisma.asociado.findUnique.mockResolvedValue(mockAsociado);
      prisma.$transaction.mockResolvedValue([
        { ...mockAsociado, estado: 'rechazado', motivoRechazo: 'Docs incompletos' },
        { id: 'nota-1' },
      ]);

      const result = await service.updateEstado('uuid-1', 'rechazado', 'admin-id', 'Docs incompletos');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.estado).toBe('rechazado');
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

  describe('updateMyProfile', () => {
    it('should update only provided fields', async () => {
      prisma.asociado.update.mockResolvedValue({ ...mockAsociado, nombre: 'Carlos' });

      const result = await service.updateMyProfile('uuid-1', { nombre: 'Carlos' } as any);
      expect(prisma.asociado.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { nombre: 'Carlos' },
        include: { vehiculos: true },
      });
      expect(result.nombre).toBe('Carlos');
    });
  });

  describe('uploadFoto', () => {
    const mockFile = {
      originalname: 'foto.jpg',
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    it('should upload photo and update fotoUrl in DB', async () => {
      prisma.asociado.findUnique.mockResolvedValue(mockAsociado);
      prisma.asociado.update.mockResolvedValue({ ...mockAsociado, fotoUrl: 'uuid-1/foto/123.jpg' });

      const result = await service.uploadFoto('uuid-1', mockFile);
      expect(storage.uploadFile).toHaveBeenCalledWith(
        'core-associates-photos',
        expect.stringContaining('uuid-1/foto/'),
        mockFile.buffer,
        'image/jpeg',
      );
      expect(prisma.asociado.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { fotoUrl: expect.stringContaining('uuid-1/foto/') },
      });
      expect(result.fotoUrl).toBeTruthy();
    });

    it('should delete previous photo if one exists', async () => {
      prisma.asociado.findUnique.mockResolvedValue({ ...mockAsociado, fotoUrl: 'old/key.jpg' });
      prisma.asociado.update.mockResolvedValue({ ...mockAsociado, fotoUrl: 'new/key.jpg' });

      await service.uploadFoto('uuid-1', mockFile);
      expect(storage.deleteFile).toHaveBeenCalledWith('core-associates-photos', 'old/key.jpg');
    });

    it('should throw NotFoundException if asociado not found', async () => {
      prisma.asociado.findUnique.mockResolvedValue(null);
      await expect(service.uploadFoto('bad-id', mockFile)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFotoBuffer', () => {
    it('should return buffer and contentType when fotoUrl exists', async () => {
      prisma.asociado.findUnique.mockResolvedValue({ ...mockAsociado, fotoUrl: 'uuid-1/foto/1.jpg' });
      storage.getFile = jest.fn().mockResolvedValue(Buffer.from('fake-image'));

      const result = await service.getFotoBuffer('uuid-1');
      expect(storage.getFile).toHaveBeenCalledWith('core-associates-photos', 'uuid-1/foto/1.jpg');
      expect(result).toEqual({ buffer: expect.any(Buffer), contentType: 'image/jpeg' });
    });

    it('should return null when no photo', async () => {
      prisma.asociado.findUnique.mockResolvedValue({ ...mockAsociado, fotoUrl: null });

      const result = await service.getFotoBuffer('uuid-1');
      expect(result).toBeNull();
    });

    it('should throw NotFoundException if asociado not found', async () => {
      prisma.asociado.findUnique.mockResolvedValue(null);
      await expect(service.getFotoBuffer('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNotas', () => {
    it('should return notas ordered by createdAt desc', async () => {
      prisma.asociado.findUnique.mockResolvedValue(mockAsociado);
      prisma.notaAsociado.findMany.mockResolvedValue([
        { id: 'n1', contenido: 'Nota 1', autor: { nombre: 'Admin', rol: 'admin' } },
      ]);

      const result = await service.getNotas('uuid-1');
      expect(prisma.notaAsociado.findMany).toHaveBeenCalledWith({
        where: { asociadoId: 'uuid-1' },
        orderBy: { createdAt: 'desc' },
        include: { autor: { select: { id: true, nombre: true, rol: true } } },
      });
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if asociado not found', async () => {
      prisma.asociado.findUnique.mockResolvedValue(null);
      await expect(service.getNotas('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createNota', () => {
    it('should create a nota with default tipo "nota"', async () => {
      prisma.asociado.findUnique.mockResolvedValue(mockAsociado);
      prisma.notaAsociado.create.mockResolvedValue({
        id: 'n1',
        contenido: 'Llamada de seguimiento',
        tipo: 'nota',
        autor: { id: 'admin-1', nombre: 'Admin', rol: 'admin' },
      });

      const result = await service.createNota('uuid-1', 'admin-1', { contenido: 'Llamada de seguimiento' } as any);
      expect(prisma.notaAsociado.create).toHaveBeenCalledWith({
        data: {
          asociadoId: 'uuid-1',
          autorId: 'admin-1',
          contenido: 'Llamada de seguimiento',
          tipo: 'nota',
        },
        include: { autor: { select: { id: true, nombre: true, rol: true } } },
      });
      expect(result.contenido).toBe('Llamada de seguimiento');
    });

    it('should throw NotFoundException if asociado not found', async () => {
      prisma.asociado.findUnique.mockResolvedValue(null);
      await expect(
        service.createNota('bad-id', 'admin-1', { contenido: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
