import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}
