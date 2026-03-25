import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacionesCrmService } from '../notificaciones-crm/notificaciones-crm.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { StorageService } from '../storage/storage.service';
import { CreateCasoLegalDto } from './dto/create-caso-legal.dto';
import { TipoPercance } from '@prisma/client';

const BUCKET_LEGAL = 'core-associates-legal';
const BUCKET_FOTOS = 'core-associates-fotos';
const BUCKET_VEHICULOS = 'core-associates-vehiculos';

@Injectable()
export class CasosLegalesService {
  private readonly logger = new Logger(CasosLegalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacionesCrm: NotificacionesCrmService,
    private readonly notificaciones: NotificacionesService,
    private readonly storage: StorageService,
  ) {}

  async createCaso(asociadoId: string, dto: CreateCasoLegalDto) {
    const count = await this.prisma.casoLegal.count();
    const codigo = `CAS-${String(count + 1).padStart(5, '0')}`;

    const caso = await this.prisma.casoLegal.create({
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

    // Notificar a todos los abogados activos vía push + notificación CRM
    this.notificarAbogadosNuevoCaso(caso).catch((err) =>
      this.logger.error('Error notificando abogados de nuevo caso', err),
    );

    return caso;
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
          abogadoUsuario: { select: { id: true, nombre: true } },
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
              select: { id: true, marca: true, modelo: true, anio: true, color: true, placas: true, esPrincipal: true, fotoUrl: true },
            },
          },
        },
        abogado: { select: { razonSocial: true, telefono: true } },
        abogadoUsuario: { select: { id: true, nombre: true, email: true } },
        notas: {
          orderBy: { createdAt: 'desc' },
          include: { autor: { select: { nombre: true, rol: true } } },
        },
      },
    });

    if (!caso) throw new NotFoundException('Caso no encontrado');
    return caso;
  }

  // Matriz de transiciones válidas por estado
  private readonly TRANSICIONES_VALIDAS: Record<string, string[]> = {
    abierto: ['en_atencion', 'cancelado'],
    en_atencion: ['escalado', 'resuelto', 'cancelado'],
    escalado: ['en_atencion', 'resuelto', 'cancelado'],
    resuelto: ['cerrado', 'en_atencion'],
    cerrado: [],
    cancelado: ['abierto'],
  };

  async updateEstado(id: string, estado: string) {
    const caso = await this.prisma.casoLegal.findUnique({ where: { id } });
    if (!caso) throw new NotFoundException('Caso no encontrado');

    const permitidos = this.TRANSICIONES_VALIDAS[caso.estado] || [];
    if (!permitidos.includes(estado)) {
      throw new BadRequestException(
        `No se puede cambiar de "${caso.estado}" a "${estado}". Transiciones permitidas: ${permitidos.join(', ') || 'ninguna'}`,
      );
    }

    const data: any = { estado };
    if (['resuelto', 'cerrado'].includes(estado)) {
      data.fechaCierre = new Date();
    }
    if (estado === 'en_atencion' && caso.estado === 'resuelto') {
      data.fechaCierre = null; // Reabrir limpia fecha cierre
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

  async assignAbogado(id: string, abogadoUsuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: abogadoUsuarioId },
      select: { id: true, nombre: true, rol: true, estado: true, proveedorId: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (usuario.rol !== 'abogado') {
      throw new BadRequestException('Solo usuarios con rol abogado pueden ser asignados');
    }
    if (usuario.estado !== 'activo') {
      throw new BadRequestException('El abogado no está activo');
    }

    const caso = await this.prisma.casoLegal.update({
      where: { id },
      data: {
        abogadoUsuarioId,
        abogadoId: usuario.proveedorId || undefined,
        fechaAsignacion: new Date(),
        estado: 'en_atencion',
      },
      include: {
        abogadoUsuario: { select: { nombre: true } },
        abogado: { select: { razonSocial: true, telefono: true } },
      },
    });

    // Notificar al abogado (CRM + push)
    await this.notificacionesCrm.crear({
      usuarioId: abogadoUsuarioId,
      titulo: 'Caso asignado',
      mensaje: `Se te asignó el caso ${caso.codigo} (${caso.tipoPercance})`,
      tipo: 'caso_asignado',
      referenciaId: caso.id,
      referenciaTipo: 'caso_legal',
    });
    this.notificaciones.sendPushUsuario(
      abogadoUsuarioId,
      'Caso asignado',
      `Se te asignó el caso ${caso.codigo} (${caso.tipoPercance})`,
      { casoId: caso.id, tipo: 'caso_asignado' },
    ).catch((err) => this.logger.error('Error enviando push al abogado', err));

    return caso;
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

  // ── Endpoints del Abogado ──

  async getMisCasosAbogado(abogadoUsuarioId: string, query: { page?: number; limit?: number; estado?: string; fechaDesde?: string; fechaHasta?: string }) {
    const { page = 1, limit = 10, estado, fechaDesde, fechaHasta } = query;
    const skip = (page - 1) * limit;

    const where: any = { abogadoUsuarioId };
    if (estado) where.estado = estado;
    if (fechaDesde || fechaHasta) {
      where.fechaApertura = {};
      if (fechaDesde) where.fechaApertura.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.fechaApertura.lte = hasta;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.casoLegal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaApertura: 'desc' },
        include: {
          asociado: {
            select: {
              id: true, idUnico: true, nombre: true, apellidoPat: true, apellidoMat: true,
              telefono: true, email: true, fotoUrl: true,
            },
          },
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

  async getMiCasoAbogadoDetail(abogadoUsuarioId: string, casoId: string) {
    const caso = await this.prisma.casoLegal.findFirst({
      where: { id: casoId, abogadoUsuarioId },
      include: {
        asociado: {
          select: {
            id: true, idUnico: true, nombre: true, apellidoPat: true, apellidoMat: true,
            telefono: true, email: true, fotoUrl: true,
            vehiculos: {
              select: { id: true, marca: true, modelo: true, anio: true, color: true, placas: true, esPrincipal: true },
            },
          },
        },
        notas: {
          orderBy: { createdAt: 'desc' },
          include: { autor: { select: { nombre: true, rol: true } } },
        },
      },
    });
    if (!caso) throw new NotFoundException('Caso no encontrado o no asignado a ti');
    return caso;
  }

  async getCasosDisponibles(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = { estado: 'abierto' as const, abogadoUsuarioId: null };

    const [data, total] = await Promise.all([
      this.prisma.casoLegal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaApertura: 'desc' },
        include: {
          asociado: {
            select: { idUnico: true, nombre: true, apellidoPat: true, fotoUrl: true },
          },
        },
      }),
      this.prisma.casoLegal.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async aceptarCaso(casoId: string, abogadoUsuarioId: string) {
    const caso = await this.prisma.casoLegal.findFirst({
      where: { id: casoId, abogadoUsuarioId },
    });
    if (!caso) throw new NotFoundException('Caso no encontrado o no asignado a ti');
    if (caso.estado !== 'abierto') {
      throw new BadRequestException('Solo se pueden aceptar casos en estado abierto');
    }

    const updated = await this.prisma.casoLegal.update({
      where: { id: casoId },
      data: { estado: 'en_atencion' },
    });

    // Notificar a operadores
    await this.notificarOperadores(
      'Caso aceptado',
      `El abogado aceptó el caso ${caso.codigo}`,
      'estado_cambio',
      caso.id,
    );

    return updated;
  }

  async rechazarCaso(casoId: string, abogadoUsuarioId: string, motivo?: string) {
    const caso = await this.prisma.casoLegal.findFirst({
      where: { id: casoId, abogadoUsuarioId },
    });
    if (!caso) throw new NotFoundException('Caso no encontrado o no asignado a ti');
    if (caso.estado !== 'abierto') {
      throw new BadRequestException('Solo se pueden rechazar casos pendientes de aceptación');
    }

    const updated = await this.prisma.casoLegal.update({
      where: { id: casoId },
      data: { abogadoUsuarioId: null, abogadoId: null, fechaAsignacion: null },
    });

    // Nota automática con motivo de rechazo
    if (motivo) {
      await this.prisma.notaCaso.create({
        data: {
          casoId,
          autorId: abogadoUsuarioId,
          contenido: `Asignación rechazada: ${motivo}`,
          esPrivada: true,
        },
      });
    }

    // Notificar a operadores
    await this.notificarOperadores(
      'Caso rechazado',
      `El abogado rechazó el caso ${caso.codigo}${motivo ? ': ' + motivo : ''}`,
      'estado_cambio',
      caso.id,
    );

    return updated;
  }

  async postularseCaso(casoId: string, abogadoUsuarioId: string) {
    const caso = await this.prisma.casoLegal.findUnique({ where: { id: casoId } });
    if (!caso) throw new NotFoundException('Caso no encontrado');
    if (caso.estado !== 'abierto' || caso.abogadoUsuarioId) {
      throw new BadRequestException('Este caso no está disponible para postulación');
    }

    const abogado = await this.prisma.usuario.findUnique({
      where: { id: abogadoUsuarioId },
      select: { nombre: true },
    });
    const nombreAbogado = abogado?.nombre ?? 'Un abogado';

    // Crear nota de postulación y notificar operadores
    await this.prisma.notaCaso.create({
      data: {
        casoId,
        autorId: abogadoUsuarioId,
        contenido: `${nombreAbogado} se postuló para este caso`,
        esPrivada: true,
      },
    });

    await this.notificarOperadores(
      'Postulación de abogado',
      `${nombreAbogado} se postuló para el caso ${caso.codigo}`,
      'caso_asignado',
      caso.id,
    );

    return { message: 'Postulación registrada exitosamente' };
  }

  async cambiarEstadoAbogado(casoId: string, abogadoUsuarioId: string, estado: 'en_atencion' | 'escalado' | 'resuelto') {
    const caso = await this.prisma.casoLegal.findFirst({
      where: { id: casoId, abogadoUsuarioId },
    });
    if (!caso) throw new NotFoundException('Caso no encontrado o no asignado a ti');
    if (!['abierto', 'en_atencion', 'escalado'].includes(caso.estado)) {
      throw new BadRequestException('No se puede cambiar el estado de este caso');
    }

    const data: any = { estado };
    if (estado === 'resuelto') {
      data.fechaCierre = new Date();
    }

    const updated = await this.prisma.casoLegal.update({
      where: { id: casoId },
      data,
    });

    const abogado = await this.prisma.usuario.findUnique({
      where: { id: abogadoUsuarioId },
      select: { nombre: true },
    });
    const nombreAbogado = abogado?.nombre ?? 'El abogado';

    if (estado === 'escalado') {
      await this.notificarOperadores(
        'Caso escalado',
        `${nombreAbogado} escaló el caso ${caso.codigo}`,
        'estado_cambio',
        caso.id,
      );
    }

    if (estado === 'resuelto') {
      await this.notificarOperadores(
        'Caso resuelto por abogado',
        `${nombreAbogado} marcó el caso ${caso.codigo} como resuelto. Pendiente cierre administrativo.`,
        'estado_cambio',
        caso.id,
      );
    }

    return updated;
  }

  // ── Documentos del caso ──

  async uploadDocumentoCaso(
    casoId: string,
    subidoPorId: string,
    file: Express.Multer.File,
  ) {
    const caso = await this.prisma.casoLegal.findUnique({ where: { id: casoId } });
    if (!caso) throw new NotFoundException('Caso no encontrado');

    const ext = file.originalname.split('.').pop() || 'bin';
    const s3Key = `${casoId}/${Date.now()}.${ext}`;

    await this.storage.uploadFile(BUCKET_LEGAL, s3Key, file.buffer, file.mimetype);

    return this.prisma.documentoCaso.create({
      data: {
        casoId,
        nombre: file.originalname,
        s3Bucket: BUCKET_LEGAL,
        s3Key,
        contentType: file.mimetype,
        fileSize: file.size,
        subidoPorId,
      },
      include: { subidoPor: { select: { nombre: true, rol: true } } },
    });
  }

  async getDocumentosCaso(casoId: string) {
    const caso = await this.prisma.casoLegal.findUnique({ where: { id: casoId } });
    if (!caso) throw new NotFoundException('Caso no encontrado');

    return this.prisma.documentoCaso.findMany({
      where: { casoId },
      orderBy: { createdAt: 'desc' },
      include: { subidoPor: { select: { nombre: true, rol: true } } },
    });
  }

  async getDocumentoCasoPresignedUrl(casoId: string, docId: string) {
    const doc = await this.prisma.documentoCaso.findFirst({
      where: { id: docId, casoId },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    const url = await this.storage.getPresignedUrl(doc.s3Bucket, doc.s3Key, 900);
    return { url };
  }

  async downloadDocumentoCaso(casoId: string, docId: string): Promise<{ buffer: Buffer; contentType: string; nombre: string }> {
    const doc = await this.prisma.documentoCaso.findFirst({
      where: { id: docId, casoId },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    const buffer = await this.storage.getFile(doc.s3Bucket, doc.s3Key);
    return { buffer, contentType: doc.contentType, nombre: doc.nombre };
  }

  async deleteDocumentoCaso(casoId: string, docId: string) {
    const doc = await this.prisma.documentoCaso.findFirst({
      where: { id: docId, casoId },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');

    await this.storage.deleteFile(doc.s3Bucket, doc.s3Key);
    await this.prisma.documentoCaso.delete({ where: { id: docId } });
    return { message: 'Documento eliminado' };
  }

  // ── Proxy foto endpoints para abogados ──

  async getAsociadoFotoForAbogado(
    abogadoUsuarioId: string,
    casoId: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    const caso = await this.prisma.casoLegal.findFirst({
      where: { id: casoId, abogadoUsuarioId },
      select: { asociadoId: true },
    });
    if (!caso) throw new NotFoundException('Caso no encontrado o no asignado a ti');

    const asociado = await this.prisma.asociado.findUnique({ where: { id: caso.asociadoId } });
    if (!asociado) throw new NotFoundException('Asociado no encontrado');

    // Intentar fotoUrl explícita
    if (asociado.fotoUrl) {
      const buffer = await this.storage.getFile(BUCKET_FOTOS, asociado.fotoUrl);
      const ext = asociado.fotoUrl.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      return { buffer, contentType: mimeMap[ext] || 'image/jpeg' };
    }

    // Fallback: selfie del KYC
    const selfie = await this.prisma.documento.findFirst({
      where: { asociadoId: caso.asociadoId, tipo: 'selfie', s3Key: { not: '' } },
      orderBy: { createdAt: 'desc' },
    });
    if (selfie) {
      const buffer = await this.storage.getFile(selfie.s3Bucket, selfie.s3Key);
      return { buffer, contentType: selfie.contentType };
    }

    return null;
  }

  async getVehiculoFotoForAbogado(
    abogadoUsuarioId: string,
    casoId: string,
    vehiculoId: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    const caso = await this.prisma.casoLegal.findFirst({
      where: { id: casoId, abogadoUsuarioId },
      select: { asociadoId: true },
    });
    if (!caso) throw new NotFoundException('Caso no encontrado o no asignado a ti');

    const vehiculo = await this.prisma.vehiculo.findFirst({
      where: { id: vehiculoId, asociadoId: caso.asociadoId },
    });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
    if (!vehiculo.fotoUrl) return null;

    const buffer = await this.storage.getFile(BUCKET_VEHICULOS, vehiculo.fotoUrl);
    const ext = vehiculo.fotoUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    return { buffer, contentType: mimeMap[ext] || 'image/jpeg' };
  }

  private async notificarOperadores(titulo: string, mensaje: string, tipo: string, referenciaId: string) {
    const operadores = await this.prisma.usuario.findMany({
      where: { rol: { in: ['admin', 'operador'] }, estado: 'activo' },
      select: { id: true },
    });
    for (const op of operadores) {
      await this.notificacionesCrm.crear({
        usuarioId: op.id,
        titulo,
        mensaje,
        tipo,
        referenciaId,
        referenciaTipo: 'caso_legal',
      });
    }
  }

  private async notificarAbogadosNuevoCaso(caso: { id: string; codigo: string; tipoPercance: string; prioridad: string }) {
    const abogados = await this.prisma.usuario.findMany({
      where: { rol: 'abogado', estado: 'activo' },
      select: { id: true },
    });

    const titulo = 'Nuevo caso disponible';
    const prioridadLabel = caso.prioridad === 'alta' ? '🔴 Alta' : caso.prioridad === 'media' ? '🟡 Media' : '🟢 Baja';
    const mensaje = `${caso.codigo} — ${caso.tipoPercance} (${prioridadLabel})`;

    for (const ab of abogados) {
      // Notificación CRM (persistente en BD)
      await this.notificacionesCrm.crear({
        usuarioId: ab.id,
        titulo,
        mensaje,
        tipo: 'caso_disponible',
        referenciaId: caso.id,
        referenciaTipo: 'caso_legal',
      });
      // Push FCM (instantáneo al dispositivo)
      await this.notificaciones.sendPushUsuario(ab.id, titulo, mensaje, {
        casoId: caso.id,
        tipo: 'caso_disponible',
      });
    }
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
