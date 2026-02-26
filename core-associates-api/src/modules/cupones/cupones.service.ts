import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes, createHmac } from 'crypto';

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
    const qrFirma = createHmac('sha256', 'core-associates-secret')
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
}
