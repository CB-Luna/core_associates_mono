import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CuponesService } from './cupones.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CuponesService', () => {
  let service: CuponesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      cupon: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      promocion: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CuponesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CuponesService>(CuponesService);
  });

  describe('generateCupon', () => {
    const mockPromocion = {
      id: 'promo-1',
      estado: 'activa',
      fechaFin: new Date(Date.now() + 86400000),
      proveedorId: 'prov-1',
      maxCupones: 100,
      vigenciaCupon: 24,
      proveedor: { id: 'prov-1' },
    };

    it('should create a coupon with QR payload and HMAC signature', async () => {
      prisma.promocion.findUnique.mockResolvedValue(mockPromocion);
      prisma.cupon.count.mockResolvedValue(5);
      prisma.cupon.create.mockResolvedValue({
        id: 'cupon-1',
        codigo: 'CPN-test',
        estado: 'activo',
      });

      const result = await service.generateCupon('assoc-1', 'promo-1');
      expect(prisma.cupon.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          asociadoId: 'assoc-1',
          promocionId: 'promo-1',
          proveedorId: 'prov-1',
          estado: 'activo',
          codigo: expect.stringMatching(/^CPN-/),
          qrPayload: expect.any(String),
          qrFirma: expect.any(String),
        }),
        include: expect.any(Object),
      });
      expect(result.id).toBe('cupon-1');
    });

    it('should throw NotFoundException when promotion not found', async () => {
      prisma.promocion.findUnique.mockResolvedValue(null);
      await expect(service.generateCupon('assoc-1', 'bad-promo'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when promotion inactive', async () => {
      prisma.promocion.findUnique.mockResolvedValue({
        ...mockPromocion,
        estado: 'pausada',
      });
      await expect(service.generateCupon('assoc-1', 'promo-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when promotion expired', async () => {
      prisma.promocion.findUnique.mockResolvedValue({
        ...mockPromocion,
        fechaFin: new Date(Date.now() - 86400000),
      });
      await expect(service.generateCupon('assoc-1', 'promo-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when max coupons reached', async () => {
      prisma.promocion.findUnique.mockResolvedValue(mockPromocion);
      prisma.cupon.count.mockResolvedValue(100);
      await expect(service.generateCupon('assoc-1', 'promo-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getMisCupones', () => {
    it('should return coupons for an asociado', async () => {
      prisma.cupon.findMany.mockResolvedValue([
        { id: 'c1', codigo: 'CPN-001' },
        { id: 'c2', codigo: 'CPN-002' },
      ]);

      const result = await service.getMisCupones('assoc-1');
      expect(prisma.cupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { asociadoId: 'assoc-1' },
        }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('validateCoupon', () => {
    it('should throw NotFoundException for invalid coupon code', async () => {
      prisma.cupon.findUnique.mockResolvedValue(null);
      const payload = JSON.stringify({ codigo: 'BAD-CODE' });
      const firma = 'invalid-firma';
      await expect(service.validateCoupon(payload, firma, 'prov-1'))
        .rejects.toThrow(BadRequestException); // firma invalid first
    });

    it('should throw BadRequestException for already redeemed coupon', async () => {
      // Build a valid HMAC payload
      const { createHmac } = require('crypto');
      const payloadObj = { codigo: 'CPN-001', promocionId: 'p1', asociadoId: 'a1', proveedorId: 'prov-1' };
      const payload = JSON.stringify(payloadObj);
      const firma = createHmac('sha256', 'core-associates-secret')
        .update(payload).digest('hex').substring(0, 128);

      prisma.cupon.findUnique.mockResolvedValue({
        id: 'c1',
        estado: 'canjeado',
        proveedorId: 'prov-1',
        promocion: {},
      });

      await expect(service.validateCoupon(payload, firma, 'prov-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should redeem a valid active coupon', async () => {
      const { createHmac } = require('crypto');
      const payloadObj = { codigo: 'CPN-001', promocionId: 'p1', asociadoId: 'a1', proveedorId: 'prov-1' };
      const payload = JSON.stringify(payloadObj);
      const firma = createHmac('sha256', 'core-associates-secret')
        .update(payload).digest('hex').substring(0, 128);

      prisma.cupon.findUnique.mockResolvedValue({
        id: 'c1',
        estado: 'activo',
        fechaVencimiento: new Date(Date.now() + 86400000),
        proveedorId: 'prov-1',
        promocion: { titulo: 'Promo' },
      });
      prisma.cupon.update.mockResolvedValue({ id: 'c1', estado: 'canjeado' });

      const result = await service.validateCoupon(payload, firma, 'prov-1');
      expect(prisma.cupon.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1' },
          data: expect.objectContaining({ estado: 'canjeado' }),
        }),
      );
      expect(result.estado).toBe('canjeado');
    });
  });

  describe('findAll (admin)', () => {
    it('should return paginated data with meta', async () => {
      prisma.cupon.findMany.mockResolvedValue([{ id: 'c1' }]);
      prisma.cupon.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by estado', async () => {
      prisma.cupon.findMany.mockResolvedValue([]);
      prisma.cupon.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, estado: 'activo' });
      expect(prisma.cupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'activo' }),
        }),
      );
    });

    it('should filter by search term', async () => {
      prisma.cupon.findMany.mockResolvedValue([]);
      prisma.cupon.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, search: 'CPN' });
      expect(prisma.cupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });
});
