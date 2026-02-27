import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes, createHmac } from 'crypto';
import * as QRCode from 'qrcode';

const HMAC_SECRET = 'core-associates-secret';

@Injectable()
export class CuponesService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCupon(asociadoId: string, promocionId: string) {
    const promocion = await this.prisma.promocion.findUnique({
      where: { id: promocionId },
      include: { proveedor: true },
    });

    if (!promocion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    if (promocion.estado !== 'activa' || promocion.fechaFin < new Date()) {
      throw new BadRequestException('Promoción no disponible');
    }

    // Check max coupons limit
    if (promocion.maxCupones) {
      const count = await this.prisma.cupon.count({
        where: { promocionId },
      });
      if (count >= promocion.maxCupones) {
        throw new BadRequestException('Se alcanzó el límite de cupones para esta promoción');
      }
    }

    // Generate unique code and QR payload
    const codigo = `CPN-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const qrPayload = JSON.stringify({
      codigo,
      promocionId,
      asociadoId,
      proveedorId: promocion.proveedorId,
    });
    const qrFirma = createHmac('sha256', HMAC_SECRET)
      .update(qrPayload)
      .digest('hex')
      .substring(0, 128);

    const fechaVencimiento = new Date();
    fechaVencimiento.setHours(fechaVencimiento.getHours() + promocion.vigenciaCupon);

    return this.prisma.cupon.create({
      data: {
        codigo,
        asociadoId,
        promocionId,
        proveedorId: promocion.proveedorId,
        qrPayload,
        qrFirma,
        estado: 'activo',
        fechaGeneracion: new Date(),
        fechaVencimiento,
      },
      include: {
        promocion: {
          select: {
            titulo: true,
            tipoDescuento: true,
            valorDescuento: true,
          },
        },
        proveedor: {
          select: {
            razonSocial: true,
            tipo: true,
          },
        },
      },
    });
  }

  async getMisCupones(asociadoId: string) {
    return this.prisma.cupon.findMany({
      where: { asociadoId },
      include: {
        promocion: {
          select: {
            titulo: true,
            tipoDescuento: true,
            valorDescuento: true,
          },
        },
        proveedor: {
          select: {
            razonSocial: true,
            tipo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQrImage(cuponId: string, asociadoId: string): Promise<Buffer> {
    const cupon = await this.prisma.cupon.findUnique({
      where: { id: cuponId },
    });

    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    if (cupon.asociadoId !== asociadoId) {
      throw new BadRequestException('No autorizado');
    }

    // Generate QR PNG from payload + signature
    const qrData = JSON.stringify({
      payload: cupon.qrPayload,
      firma: cupon.qrFirma,
    });

    return QRCode.toBuffer(qrData, {
      type: 'png',
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
    });
  }

  async validateCoupon(payload: string, firma: string, proveedorId: string) {
    // Verify HMAC
    const expectedFirma = createHmac('sha256', HMAC_SECRET)
      .update(payload)
      .digest('hex')
      .substring(0, 128);

    if (firma !== expectedFirma) {
      throw new BadRequestException('Firma inválida');
    }

    const data = JSON.parse(payload);
    const cupon = await this.prisma.cupon.findUnique({
      where: { codigo: data.codigo },
      include: { promocion: true },
    });

    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    if (cupon.estado !== 'activo') {
      throw new BadRequestException(`Cupón ${cupon.estado}`);
    }

    if (cupon.fechaVencimiento < new Date()) {
      // Mark as expired
      await this.prisma.cupon.update({
        where: { id: cupon.id },
        data: { estado: 'vencido' },
      });
      throw new BadRequestException('Cupón vencido');
    }

    // Redeem
    return this.prisma.cupon.update({
      where: { id: cupon.id },
      data: {
        estado: 'canjeado',
        fechaCanje: new Date(),
        canjeadoPorId: proveedorId,
      },
      include: {
        promocion: {
          select: { titulo: true, tipoDescuento: true, valorDescuento: true },
        },
        asociado: {
          select: { nombre: true, apellidoPat: true, idUnico: true },
        },
      },
    });
  }

  // Admin: list all coupons with pagination
  async findAll(query: { page?: number; limit?: number; estado?: string }) {
    const { page = 1, limit = 10, estado } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (estado) where.estado = estado;

    const [data, total] = await Promise.all([
      this.prisma.cupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          asociado: { select: { idUnico: true, nombre: true, apellidoPat: true } },
          promocion: { select: { titulo: true } },
          proveedor: { select: { razonSocial: true } },
        },
      }),
      this.prisma.cupon.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
