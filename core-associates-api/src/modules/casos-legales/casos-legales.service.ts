import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCasoLegalDto } from './dto/create-caso-legal.dto';
import { TipoPercance } from '@prisma/client';

@Injectable()
export class CasosLegalesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCaso(asociadoId: string, dto: CreateCasoLegalDto) {
    const count = await this.prisma.casoLegal.count();
    const codigo = `CAS-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.casoLegal.create({
      data: {
        codigo,
        asociadoId,
        tipoPercance: dto.tipoPercance as TipoPercance,
        descripcion: dto.descripcion,
        latitud: dto.latitud,
        longitud: dto.longitud,
        direccionAprox: dto.direccionAprox,
        estado: 'abierto',
        prioridad: dto.tipoPercance === 'accidente' || dto.tipoPercance === 'asalto' ? 'alta' : 'media',
      },
      include: {
        notas: true,
      },
    });
  }

  async getMisCasos(asociadoId: string) {
    return this.prisma.casoLegal.findMany({
      where: { asociadoId },
      include: {
        abogado: {
          select: {
            razonSocial: true,
            telefono: true,
          },
        },
        notas: {
          where: { esPrivada: false },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { fechaApertura: 'desc' },
    });
  }

  // Admin endpoints
  async findAll(query: { page?: number; limit?: number; estado?: string; prioridad?: string }) {
    const { page = 1, limit = 10, estado, prioridad } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;

    const [data, total] = await Promise.all([
      this.prisma.casoLegal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaApertura: 'desc' },
        include: {
          asociado: { select: { idUnico: true, nombre: true, apellidoPat: true, telefono: true } },
          abogado: { select: { razonSocial: true } },
          _count: { select: { notas: true } },
        },
      }),
      this.prisma.casoLegal.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const caso = await this.prisma.casoLegal.findUnique({
      where: { id },
      include: {
        asociado: { select: { idUnico: true, nombre: true, apellidoPat: true, telefono: true } },
        abogado: { select: { razonSocial: true, telefono: true } },
        notas: {
          orderBy: { createdAt: 'desc' },
          include: { autor: { select: { nombre: true, rol: true } } },
        },
      },
    });

    if (!caso) throw new NotFoundException('Caso no encontrado');
    return caso;
  }

  async updateEstado(id: string, estado: string) {
    const data: any = { estado };
    if (['resuelto', 'cerrado'].includes(estado)) {
      data.fechaCierre = new Date();
    }
    return this.prisma.casoLegal.update({ where: { id }, data });
  }

  async assignAbogado(id: string, abogadoId: string) {
    return this.prisma.casoLegal.update({
      where: { id },
      data: {
        abogadoId,
        fechaAsignacion: new Date(),
        estado: 'en_atencion',
      },
      include: {
        abogado: { select: { razonSocial: true, telefono: true } },
      },
    });
  }

  async addNote(casoId: string, autorId: string, contenido: string, esPrivada = false) {
    return this.prisma.notaCaso.create({
      data: { casoId, autorId, contenido, esPrivada },
      include: { autor: { select: { nombre: true, rol: true } } },
    });
  }
}
