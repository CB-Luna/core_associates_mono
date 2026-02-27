import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromocionDto } from './dto/create-promocion.dto';

@Injectable()
export class PromocionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(categoria?: string) {
    const where: Record<string, unknown> = {
      estado: 'activa',
      fechaFin: { gte: new Date() },
    };

    if (categoria) {
      where.proveedor = { tipo: categoria };
    }

    return this.prisma.promocion.findMany({
      where,
      include: {
        proveedor: {
          select: {
            id: true,
            razonSocial: true,
            tipo: true,
            logotipoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const promocion = await this.prisma.promocion.findUnique({
      where: { id },
      include: {
        proveedor: {
          select: {
            id: true,
            razonSocial: true,
            tipo: true,
            direccion: true,
            telefono: true,
            logotipoUrl: true,
          },
        },
      },
    });

    if (!promocion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    return promocion;
  }

  // Admin endpoints
  async findAll(query: { page?: number; limit?: number; search?: string; estado?: string }) {
    const { page = 1, limit = 10, search, estado } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (estado) where.estado = estado;
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { proveedor: { razonSocial: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.promocion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          proveedor: { select: { razonSocial: true, tipo: true } },
          _count: { select: { cupones: true } },
        },
      }),
      this.prisma.promocion.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreatePromocionDto) {
    return this.prisma.promocion.create({
      data: {
        proveedorId: dto.proveedorId,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        tipoDescuento: dto.tipoDescuento,
        valorDescuento: dto.valorDescuento,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        vigenciaCupon: dto.vigenciaCupon,
        terminos: dto.terminos,
        maxCupones: dto.maxCupones,
        estado: 'activa',
      },
      include: { proveedor: { select: { razonSocial: true } } },
    });
  }

  async update(id: string, dto: Partial<CreatePromocionDto>) {
    const promo = await this.prisma.promocion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');

    const data: any = { ...dto };
    if (dto.fechaInicio) data.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) data.fechaFin = new Date(dto.fechaFin);

    return this.prisma.promocion.update({
      where: { id },
      data,
    });
  }

  async updateEstado(id: string, estado: string) {
    return this.prisma.promocion.update({
      where: { id },
      data: { estado: estado as any },
    });
  }
}
