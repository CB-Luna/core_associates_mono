import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, EstadoPromocion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePromocionDto } from './dto/create-promocion.dto';

const BUCKET_PROMOTIONS = 'core-associates-promotions';

/** Computes effective estado: if fechaFin < now and estado is 'activa', returns 'expirada' */
function computeEstadoEfectivo<T extends { estado: string; fechaFin: Date | string }>(promo: T): T & { estado: string } {
  const fechaFin = typeof promo.fechaFin === 'string' ? new Date(promo.fechaFin) : promo.fechaFin;
  if (promo.estado === 'activa' && fechaFin < new Date()) {
    return { ...promo, estado: 'expirada' };
  }
  return promo;
}

@Injectable()
export class PromocionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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

    return computeEstadoEfectivo(promocion);
  }

  // Admin endpoints
  async findAll(query: { page?: number; limit?: number; search?: string; estado?: string }) {
    const { page = 1, limit = 10, search, estado } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PromocionWhereInput = {};
    if (estado === 'expirada') {
      where.estado = 'activa';
      where.fechaFin = { lt: new Date() };
    } else if (estado === 'activa') {
      where.estado = 'activa';
      where.fechaFin = { gte: new Date() };
    } else if (estado) {
      where.estado = estado as EstadoPromocion;
    }
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { proveedor: { razonSocial: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [rawData, total] = await Promise.all([
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

    const data = rawData.map(computeEstadoEfectivo);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreatePromocionDto) {
    return this.prisma.promocion.create({
      data: {
        proveedorId: dto.proveedorId!,
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

    const data: Prisma.PromocionUpdateInput = { ...dto };
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
      data: { estado: estado as EstadoPromocion },
    });
  }

  // ── Endpoints para proveedores ──

  async findByProveedor(proveedorId: string, query: { page?: number; limit?: number; search?: string; estado?: string }) {
    const { page = 1, limit = 10, search, estado } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PromocionWhereInput = { proveedorId };
    if (estado === 'expirada') {
      where.estado = 'activa';
      where.fechaFin = { lt: new Date() };
    } else if (estado === 'activa') {
      where.estado = 'activa';
      where.fechaFin = { gte: new Date() };
    } else if (estado) {
      where.estado = estado as EstadoPromocion;
    }
    if (search) {
      where.titulo = { contains: search, mode: 'insensitive' };
    }

    const [rawData, total] = await Promise.all([
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

    const data = rawData.map(computeEstadoEfectivo);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createForProveedor(proveedorId: string, dto: CreatePromocionDto) {
    return this.prisma.promocion.create({
      data: {
        proveedorId,
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

  async updateForProveedor(id: string, proveedorId: string, dto: Partial<CreatePromocionDto>) {
    const promo = await this.prisma.promocion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    if (promo.proveedorId !== proveedorId) {
      throw new ForbiddenException('No tienes permiso para editar esta promoción');
    }

    const data: Prisma.PromocionUpdateInput = { ...dto };
    if (dto.fechaInicio) data.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) data.fechaFin = new Date(dto.fechaFin);
    // No permitir cambiar proveedorId
    delete (data as Record<string, unknown>).proveedorId;

    return this.prisma.promocion.update({
      where: { id },
      data,
    });
  }

  async updateEstadoForProveedor(id: string, proveedorId: string, estado: string) {
    const promo = await this.prisma.promocion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    if (promo.proveedorId !== proveedorId) {
      throw new ForbiddenException('No tienes permiso para modificar esta promoción');
    }

    return this.prisma.promocion.update({
      where: { id },
      data: { estado: estado as EstadoPromocion },
    });
  }

  async uploadImagen(id: string, file: Express.Multer.File, proveedorId?: string) {
    const promo = await this.prisma.promocion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    if (proveedorId && promo.proveedorId !== proveedorId) {
      throw new ForbiddenException('No tienes permiso para modificar esta promoción');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const objectName = `${promo.proveedorId}/${id}/${Date.now()}.${ext}`;

    // Delete previous image if exists
    if (promo.imagenUrl) {
      try {
        await this.storage.deleteFile(BUCKET_PROMOTIONS, promo.imagenUrl);
      } catch {
        // Ignore if old file doesn't exist
      }
    }

    await this.storage.uploadFile(BUCKET_PROMOTIONS, objectName, file.buffer, file.mimetype);

    return this.prisma.promocion.update({
      where: { id },
      data: { imagenUrl: objectName },
    });
  }

  async getImagenBuffer(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const promo = await this.prisma.promocion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    if (!promo.imagenUrl) throw new NotFoundException('Promoción sin imagen');

    const buffer = await this.storage.getFile(BUCKET_PROMOTIONS, promo.imagenUrl);
    const ext = promo.imagenUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
    return { buffer, contentType: mimeMap[ext] || 'image/jpeg' };
  }
}
