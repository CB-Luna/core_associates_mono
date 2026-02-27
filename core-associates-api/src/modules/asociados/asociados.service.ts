import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAsociadoDto } from './dto/update-asociado.dto';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class AsociadosService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(asociadoId: string) {
    const asociado = await this.prisma.asociado.findUnique({
      where: { id: asociadoId },
      include: {
        vehiculos: true,
        documentos: {
          select: {
            id: true,
            tipo: true,
            estado: true,
            createdAt: true,
          },
        },
      },
    });

    if (!asociado) {
      throw new NotFoundException('Asociado no encontrado');
    }

    return asociado;
  }

  async updateMyProfile(asociadoId: string, dto: UpdateAsociadoDto) {
    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.apellidoPat !== undefined) data.apellidoPat = dto.apellidoPat;
    if (dto.apellidoMat !== undefined) data.apellidoMat = dto.apellidoMat;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.fechaNacimiento !== undefined)
      data.fechaNacimiento = new Date(dto.fechaNacimiento);

    return this.prisma.asociado.update({
      where: { id: asociadoId },
      data,
      include: { vehiculos: true },
    });
  }

  async getMyVehiculos(asociadoId: string) {
    return this.prisma.vehiculo.findMany({
      where: { asociadoId },
      orderBy: { esPrincipal: 'desc' },
    });
  }

  async addVehiculo(asociadoId: string, dto: CreateVehiculoDto) {
    // If this is the first vehicle or marked as principal, unmark others
    if (dto.esPrincipal !== false) {
      await this.prisma.vehiculo.updateMany({
        where: { asociadoId, esPrincipal: true },
        data: { esPrincipal: false },
      });
    }

    return this.prisma.vehiculo.create({
      data: {
        asociadoId,
        marca: dto.marca,
        modelo: dto.modelo,
        anio: dto.anio,
        color: dto.color,
        placas: dto.placas,
        numeroSerie: dto.numeroSerie,
        esPrincipal: dto.esPrincipal ?? true,
      },
    });
  }

  // ── Admin endpoints ──

  async findAll(query: PaginationQueryDto & { estado?: string }) {
    const { page = 1, limit = 10, search, estado } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (estado) {
      where.estado = estado;
    }
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellidoPat: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } },
        { idUnico: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.asociado.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { vehiculos: true, documentos: true, cupones: true } },
        },
      }),
      this.prisma.asociado.count({ where }),
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

  async findOne(id: string) {
    const asociado = await this.prisma.asociado.findUnique({
      where: { id },
      include: {
        vehiculos: true,
        documentos: true,
        cupones: {
          include: { promocion: true, proveedor: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        casosLegales: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!asociado) {
      throw new NotFoundException('Asociado no encontrado');
    }

    return asociado;
  }

  async updateEstado(id: string, estado: string, usuarioId: string) {
    const asociado = await this.prisma.asociado.findUnique({ where: { id } });
    if (!asociado) {
      throw new NotFoundException('Asociado no encontrado');
    }

    const data: any = { estado };
    if (estado === 'activo') {
      data.fechaAprobacion = new Date();
      data.aprobadoPorId = usuarioId;
    }

    return this.prisma.asociado.update({
      where: { id },
      data,
    });
  }
}
