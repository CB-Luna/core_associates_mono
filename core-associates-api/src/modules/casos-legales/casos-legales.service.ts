import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCasoLegalDto } from './dto/create-caso-legal.dto';
import { TipoPercance } from '@prisma/client';

@Injectable()
export class CasosLegalesService {
  private readonly logger = new Logger(CasosLegalesService.name);

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

  async getMiCasoDetail(asociadoId: string, casoId: string) {
    const caso = await this.prisma.casoLegal.findFirst({
      where: { id: casoId, asociadoId },
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
          include: { autor: { select: { nombre: true, rol: true } } },
        },
      },
    });

    if (!caso) throw new NotFoundException('Caso no encontrado');
    return caso;
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
          asociado: {
            select: {
              id: true, idUnico: true, nombre: true, apellidoPat: true, telefono: true,
              fotoUrl: true, _count: { select: { documentos: true } },
              vehiculos: {
                select: { id: true, marca: true, modelo: true, anio: true, placas: true, esPrincipal: true, fotoUrl: true },
                take: 3,
              },
            },
          },
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
        asociado: {
          select: {
            idUnico: true, nombre: true, apellidoPat: true, telefono: true,
            fotoUrl: true, _count: { select: { documentos: true } },
            vehiculos: {
              select: { id: true, marca: true, modelo: true, anio: true, color: true, placas: true, esPrincipal: true },
            },
          },
        },
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

  async updatePrioridad(id: string, prioridad: string) {
    const caso = await this.prisma.casoLegal.findUnique({ where: { id } });
    if (!caso) throw new NotFoundException('Caso no encontrado');
    return this.prisma.casoLegal.update({
      where: { id },
      data: { prioridad: prioridad as any },
    });
  }

  async assignAbogado(id: string, abogadoId: string) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id: abogadoId } });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');
    if (proveedor.tipo !== 'abogado') {
      throw new BadRequestException('Solo proveedores de tipo abogado pueden ser asignados');
    }

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

  async getNotas(casoId: string) {
    const caso = await this.prisma.casoLegal.findUnique({ where: { id: casoId } });
    if (!caso) throw new NotFoundException('Caso no encontrado');

    return this.prisma.notaCaso.findMany({
      where: { casoId },
      orderBy: { createdAt: 'desc' },
      include: { autor: { select: { nombre: true, rol: true } } },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async resumenDiarioCasos() {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    ayer.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [
      casosNuevos,
      casosEnAtencion,
      casosResueltos,
      casosTotalAbiertos,
      asociadosRegistrados,
      cuponesGenerados,
      cuponesCanjeados,
      docsPendientes,
    ] = await Promise.all([
      this.prisma.casoLegal.count({
        where: { createdAt: { gte: ayer, lt: hoy } },
      }),
      this.prisma.casoLegal.count({
        where: { estado: 'en_atencion' },
      }),
      this.prisma.casoLegal.count({
        where: { estado: 'resuelto', fechaCierre: { gte: ayer, lt: hoy } },
      }),
      this.prisma.casoLegal.count({
        where: { estado: { in: ['abierto', 'en_atencion', 'escalado'] } },
      }),
      this.prisma.asociado.count({
        where: { fechaRegistro: { gte: ayer, lt: hoy } },
      }),
      this.prisma.cupon.count({
        where: { createdAt: { gte: ayer, lt: hoy } },
      }),
      this.prisma.cupon.count({
        where: { estado: 'canjeado', fechaCanje: { gte: ayer, lt: hoy } },
      }),
      this.prisma.documento.count({
        where: { estado: 'pendiente' },
      }),
    ]);

    await this.prisma.resumenDiario.upsert({
      where: { fecha: ayer },
      update: {
        casosNuevos,
        casosEnAtencion,
        casosResueltos,
        casosTotalAbiertos,
        asociadosRegistrados,
        cuponesGenerados,
        cuponesCanjeados,
        docsPendientes,
      },
      create: {
        fecha: ayer,
        casosNuevos,
        casosEnAtencion,
        casosResueltos,
        casosTotalAbiertos,
        asociadosRegistrados,
        cuponesGenerados,
        cuponesCanjeados,
        docsPendientes,
      },
    });

    this.logger.log(
      `[Resumen diario ${ayer.toISOString().slice(0, 10)}] Casos nuevos: ${casosNuevos} | En atención: ${casosEnAtencion} | Resueltos: ${casosResueltos} | Abiertos: ${casosTotalAbiertos} | Asociados reg: ${asociadosRegistrados} | Cupones gen: ${cuponesGenerados} | Cupones canj: ${cuponesCanjeados} | Docs pend: ${docsPendientes}`,
    );
  }
}
