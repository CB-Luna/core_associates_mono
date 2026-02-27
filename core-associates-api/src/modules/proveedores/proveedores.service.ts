import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto & { tipo?: string }) {
    const { page = 1, limit = 10, search, tipo } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tipo) {
      where.tipo = tipo;
    }
    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { idUnico: { contains: search, mode: 'insensitive' } },
        { contactoNombre: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.proveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { promociones: true, cuponesEmitidos: true } },
        },
      }),
      this.prisma.proveedor.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id },
      include: {
        promociones: { orderBy: { createdAt: 'desc' } },
        _count: { select: { cuponesEmitidos: true, cuponesCanjeados: true } },
      },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return proveedor;
  }

  async create(dto: CreateProveedorDto) {
    const count = await this.prisma.proveedor.count();
    const idUnico = `PRV-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.proveedor.create({
      data: {
        idUnico,
        razonSocial: dto.razonSocial,
        tipo: dto.tipo,
        direccion: dto.direccion,
        latitud: dto.latitud,
        longitud: dto.longitud,
        telefono: dto.telefono,
        email: dto.email,
        contactoNombre: dto.contactoNombre,
      },
    });
  }

  async update(id: string, dto: UpdateProveedorDto) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });
  }
}
