import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomBytes, createHmac } from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class CuponesService {
  private readonly logger = new Logger(CuponesService.name);
  private readonly hmacSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.hmacSecret = this.configService.get<string>('HMAC_SECRET', 'core-associates-secret');
  }

  async generateCupon(asociadoId: string, promocionId: string) {
    const promocion = await this.prisma.promocion.findUnique({
      where: { id: promocionId },
      include: { proveedor: true },
    });

    if (!promocion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    // fechaFin es tipo Date (midnight UTC) — la promo es válida todo el día de fechaFin
    const fechaFinCompleta = new Date(promocion.fechaFin);
    fechaFinCompleta.setUTCDate(fechaFinCompleta.getUTCDate() + 1);

    if (promocion.estado !== 'activa' || new Date() >= fechaFinCompleta) {
      throw new BadRequestException('Promoción no disponible');
    }

    // Verificar que el asociado no tenga ya un cupón activo para esta promoción
    const cuponActivo = await this.prisma.cupon.findFirst({
      where: { asociadoId, promocionId, estado: 'activo' },
    });
    if (cuponActivo) {
      throw new BadRequestException('Ya tienes un cupón activo para esta promoción');
    }

    // Verificar límite global de cupones (solo cuenta activos y canjeados)
    if (promocion.maxCupones) {
      const count = await this.prisma.cupon.count({
        where: {
          promocionId,
          estado: { in: ['activo', 'canjeado'] },
        },
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
    const qrFirma = createHmac('sha256', this.hmacSecret)
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
    const expectedFirma = createHmac('sha256', this.hmacSecret)
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
  async findAll(query: { page?: number; limit?: number; estado?: string; search?: string }) {
    const { page = 1, limit = 10, estado, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (estado) where.estado = estado;
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { asociado: { nombre: { contains: search, mode: 'insensitive' } } },
        { asociado: { apellidoPat: { contains: search, mode: 'insensitive' } } },
        { promocion: { titulo: { contains: search, mode: 'insensitive' } } },
        { proveedor: { razonSocial: { contains: search, mode: 'insensitive' } } },
      ];
    }

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

  @Cron(CronExpression.EVERY_HOUR)
  async vencerCuponesExpirados() {
    const result = await this.prisma.cupon.updateMany({
      where: {
        estado: 'activo',
        fechaVencimiento: { lt: new Date() },
      },
      data: { estado: 'vencido' },
    });

    if (result.count > 0) {
      this.logger.log(`Cupones vencidos automáticamente: ${result.count}`);
    }
  }

  async getEstadisticas() {
    const [activos, canjeados, vencidos, total] = await Promise.all([
      this.prisma.cupon.count({ where: { estado: 'activo' } }),
      this.prisma.cupon.count({ where: { estado: 'canjeado' } }),
      this.prisma.cupon.count({ where: { estado: 'vencido' } }),
      this.prisma.cupon.count(),
    ]);

    return { activos, canjeados, vencidos, total };
  }

  // Proveedor: list own coupons with pagination
  async findByProveedor(proveedorId: string, query: { page?: number; limit?: number; estado?: string; search?: string }) {
    const { page = 1, limit = 10, estado, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { proveedorId };
    if (estado) where.estado = estado;
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { asociado: { nombre: { contains: search, mode: 'insensitive' } } },
        { asociado: { apellidoPat: { contains: search, mode: 'insensitive' } } },
        { promocion: { titulo: { contains: search, mode: 'insensitive' } } },
      ];
    }

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

  async getEstadisticasProveedor(proveedorId: string) {
    const [activos, canjeados, vencidos, total] = await Promise.all([
      this.prisma.cupon.count({ where: { proveedorId, estado: 'activo' } }),
      this.prisma.cupon.count({ where: { proveedorId, estado: 'canjeado' } }),
      this.prisma.cupon.count({ where: { proveedorId, estado: 'vencido' } }),
      this.prisma.cupon.count({ where: { proveedorId } }),
    ]);

    return { activos, canjeados, vencidos, total };
  }
}
