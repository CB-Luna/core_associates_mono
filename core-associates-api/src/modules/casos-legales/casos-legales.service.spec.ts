import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CasosLegalesService } from './casos-legales.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CasosLegalesService', () => {
  let service: CasosLegalesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      casoLegal: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      notaCaso: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasosLegalesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CasosLegalesService>(CasosLegalesService);
  });

  describe('createCaso', () => {
    const baseDto = {
      tipoPercance: 'accidente',
      descripcion: 'Choque lateral',
      latitud: 19.4326,
      longitud: -99.1332,
      direccionAprox: 'Av. Insurgentes 123',
    };

    it('should generate CAS-XXXXX code based on count', async () => {
      prisma.casoLegal.count.mockResolvedValue(42);
      prisma.casoLegal.create.mockResolvedValue({
        id: 'caso-1',
        codigo: 'CAS-00043',
        estado: 'abierto',
        prioridad: 'alta',
      });

      const result = await service.createCaso('assoc-1', baseDto as any);
      expect(prisma.casoLegal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          codigo: 'CAS-00043',
          asociadoId: 'assoc-1',
          estado: 'abierto',
        }),
        include: { notas: true },
      });
      expect(result.codigo).toBe('CAS-00043');
    });

    it('should set alta priority for accidente', async () => {
      prisma.casoLegal.count.mockResolvedValue(0);
      prisma.casoLegal.create.mockResolvedValue({ prioridad: 'alta' });

      await service.createCaso('assoc-1', { ...baseDto, tipoPercance: 'accidente' } as any);
      expect(prisma.casoLegal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ prioridad: 'alta' }),
        include: expect.any(Object),
      });
    });

    it('should set alta priority for asalto', async () => {
      prisma.casoLegal.count.mockResolvedValue(0);
      prisma.casoLegal.create.mockResolvedValue({ prioridad: 'alta' });

      await service.createCaso('assoc-1', { ...baseDto, tipoPercance: 'asalto' } as any);
      expect(prisma.casoLegal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ prioridad: 'alta' }),
        include: expect.any(Object),
      });
    });

    it('should set media priority for infraccion', async () => {
      prisma.casoLegal.count.mockResolvedValue(0);
      prisma.casoLegal.create.mockResolvedValue({ prioridad: 'media' });

      await service.createCaso('assoc-1', { ...baseDto, tipoPercance: 'infraccion' } as any);
      expect(prisma.casoLegal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ prioridad: 'media' }),
        include: expect.any(Object),
      });
    });
  });

  describe('getMisCasos', () => {
    it('should return cases for an asociado with abogado and public notas', async () => {
      prisma.casoLegal.findMany.mockResolvedValue([
        { id: 'c1', estado: 'abierto', notas: [] },
      ]);

      const result = await service.getMisCasos('assoc-1');
      expect(prisma.casoLegal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { asociadoId: 'assoc-1' },
          include: expect.objectContaining({
            notas: expect.objectContaining({
              where: { esPrivada: false },
            }),
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findAll (admin)', () => {
    it('should return paginated data with meta', async () => {
      prisma.casoLegal.findMany.mockResolvedValue([{ id: 'c1' }]);
      prisma.casoLegal.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1, page: 1, limit: 10, totalPages: 1,
      });
    });

    it('should filter by estado', async () => {
      prisma.casoLegal.findMany.mockResolvedValue([]);
      prisma.casoLegal.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, estado: 'abierto' });
      expect(prisma.casoLegal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'abierto' }),
        }),
      );
    });

    it('should filter by prioridad', async () => {
      prisma.casoLegal.findMany.mockResolvedValue([]);
      prisma.casoLegal.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, prioridad: 'alta' });
      expect(prisma.casoLegal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ prioridad: 'alta' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a case with all relations', async () => {
      prisma.casoLegal.findUnique.mockResolvedValue({
        id: 'c1',
        codigo: 'CAS-00001',
        notas: [],
      });

      const result = await service.findOne('c1');
      expect(result.codigo).toBe('CAS-00001');
    });

    it('should throw NotFoundException when case not found', async () => {
      prisma.casoLegal.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEstado', () => {
    it('should update estado', async () => {
      prisma.casoLegal.update.mockResolvedValue({ id: 'c1', estado: 'en_atencion' });

      const result = await service.updateEstado('c1', 'en_atencion');
      expect(prisma.casoLegal.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { estado: 'en_atencion' },
      });
      expect(result.estado).toBe('en_atencion');
    });

    it('should set fechaCierre when estado is resuelto', async () => {
      prisma.casoLegal.update.mockResolvedValue({ id: 'c1', estado: 'resuelto' });

      await service.updateEstado('c1', 'resuelto');
      expect(prisma.casoLegal.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: expect.objectContaining({
          estado: 'resuelto',
          fechaCierre: expect.any(Date),
        }),
      });
    });

    it('should set fechaCierre when estado is cerrado', async () => {
      prisma.casoLegal.update.mockResolvedValue({ id: 'c1', estado: 'cerrado' });

      await service.updateEstado('c1', 'cerrado');
      expect(prisma.casoLegal.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: expect.objectContaining({
          estado: 'cerrado',
          fechaCierre: expect.any(Date),
        }),
      });
    });
  });

  describe('assignAbogado', () => {
    it('should assign abogado and set en_atencion', async () => {
      prisma.casoLegal.update.mockResolvedValue({
        id: 'c1',
        abogadoId: 'abg-1',
        estado: 'en_atencion',
      });

      const result = await service.assignAbogado('c1', 'abg-1');
      expect(prisma.casoLegal.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: expect.objectContaining({
          abogadoId: 'abg-1',
          estado: 'en_atencion',
          fechaAsignacion: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(result.estado).toBe('en_atencion');
    });
  });

  describe('addNote', () => {
    it('should create a note linked to the case', async () => {
      prisma.notaCaso.create.mockResolvedValue({
        id: 'nota-1',
        contenido: 'Nota de prueba',
        esPrivada: false,
        autor: { nombre: 'Admin', rol: 'admin' },
      });

      const result = await service.addNote('c1', 'user-1', 'Nota de prueba', false);
      expect(prisma.notaCaso.create).toHaveBeenCalledWith({
        data: {
          casoId: 'c1',
          autorId: 'user-1',
          contenido: 'Nota de prueba',
          esPrivada: false,
        },
        include: { autor: { select: { nombre: true, rol: true } } },
      });
      expect(result.contenido).toBe('Nota de prueba');
    });

    it('should create a private note when esPrivada is true', async () => {
      prisma.notaCaso.create.mockResolvedValue({
        id: 'nota-2',
        contenido: 'Nota privada',
        esPrivada: true,
      });

      await service.addNote('c1', 'user-1', 'Nota privada', true);
      expect(prisma.notaCaso.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ esPrivada: true }),
        include: expect.any(Object),
      });
    });
  });
});
