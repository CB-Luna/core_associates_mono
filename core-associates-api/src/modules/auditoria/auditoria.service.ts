import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page: number;
    limit: number;
    entidad?: string;
    accion?: string;
    desde?: string;
    hasta?: string;
    search?: string;
  }) {
    const { page = 1, limit = 10, entidad, accion, desde, hasta, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditoriaWhereInput = {};

    if (entidad) where.entidad = entidad;
    if (accion) where.accion = accion;

    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta + 'T23:59:59.999Z');
    }

    if (search) {
      where.OR = [
        { entidad: { contains: search, mode: 'insensitive' } },
        { accion: { contains: search, mode: 'insensitive' } },
        { usuario: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true, rol: true },
          },
        },
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
