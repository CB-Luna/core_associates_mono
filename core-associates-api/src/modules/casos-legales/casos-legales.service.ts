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
        abogadoUsuario: {
          select: {
            nombre: true,
            avatarUrl: true,
            especialidad: true,
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

  async updateEstado(id: string, estado: string, realizadoPorId?: string) {
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
    const updated = await this.prisma.casoLegal.update({ where: { id }, data });

    // Notificar a otros admin/operadores con atribución de quién realizó el cambio
    if (realizadoPorId) {
      this.notificarCambioEstado(caso, estado, realizadoPorId).catch((err) =>
        this.logger.error('Error notificando cambio de estado', err),
      );
    }

    return updated;
  }

  private async notificarCambioEstado(
    caso: { id: string; codigo: string },
    nuevoEstado: string,
    realizadoPorId: string,
  ) {
    const estadoLabels: Record<string, string> = {
      en_atencion: 'en atención',
      escalado: 'escalado',
      resuelto: 'resuelto',
      cerrado: 'cerrado',
      cancelado: 'cancelado',
      abierto: 'reabierto',
    };

    const realizadoPor = await this.prisma.usuario.findUnique({
      where: { id: realizadoPorId },
      select: { nombre: true },
    });
    const nombreOperador = realizadoPor?.nombre ?? 'un operador';
    const estadoLabel = estadoLabels[nuevoEstado] ?? nuevoEstado;

    const titulo = `Caso ${caso.codigo} — estado actualizado`;
    const mensaje = `El caso fue marcado como "${estadoLabel}" por ${nombreOperador}`;

    // Notificar a todos los admin/operadores activos excepto quien hizo el cambio
    const destinatarios = await this.prisma.usuario.findMany({
      where: { rol: { in: ['admin', 'operador'] }, estado: 'activo', id: { not: realizadoPorId } },
      select: { id: true },
    });
    for (const dest of destinatarios) {
      await this.notificacionesCrm.crear({
        usuarioId: dest.id,
        titulo,
        mensaje,
        tipo: 'estado_cambio',
        referenciaId: caso.id,
        referenciaTipo: 'caso_legal',
      });
    }
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

  async getCasosDisponibles(abogadoUsuarioId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const abogado = await this.prisma.usuario.findUnique({
      where: { id: abogadoUsuarioId },
      select: { zonaLatitud: true, zonaLongitud: true, zonaRadioKm: true },
    });

    if (abogado?.zonaLatitud != null && abogado?.zonaLongitud != null) {
      const lat = abogado.zonaLatitud;
      const lng = abogado.zonaLongitud;
      const radioKm = abogado.zonaRadioKm ?? 80;

      type RawCaso = {
        id: string; codigo: string; tipo_percance: string; descripcion: string | null;
        latitud: string; longitud: string; direccion_aprox: string | null;
        estado: string; prioridad: string; fecha_apertura: Date;
        fecha_asignacion: Date | null; fecha_cierre: Date | null;
        distancia_km: string;
        asociado_id_unico: string; asociado_nombre: string;
        asociado_apellido_pat: string; asociado_foto_url: string | null;
      };

      const [casosRaw, countRaw] = await Promise.all([
        this.prisma.$queryRaw<RawCaso[]>`
          SELECT
            cl.id, cl.codigo, cl.tipo_percance, cl.descripcion,
            cl.latitud, cl.longitud, cl.direccion_aprox,
            cl.estado, cl.prioridad, cl.fecha_apertura, cl.fecha_asignacion, cl.fecha_cierre,
            a.id_unico AS asociado_id_unico, a.nombre AS asociado_nombre,
            a.apellido_pat AS asociado_apellido_pat, a.foto_url AS asociado_foto_url,
            ROUND(CAST(
              (6371 * acos(GREATEST(-1.0, LEAST(1.0,
                cos(radians(${lat})) * cos(radians(CAST(cl.latitud AS float8))) *
                cos(radians(CAST(cl.longitud AS float8)) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(CAST(cl.latitud AS float8)))
              )))) AS numeric
            ), 1) AS distancia_km
          FROM casos_legales cl
          JOIN asociados a ON a.id = cl.asociado_id
          WHERE cl.estado = 'abierto'
            AND cl.abogado_usuario_id IS NULL
            AND (6371 * acos(GREATEST(-1.0, LEAST(1.0,
                cos(radians(${lat})) * cos(radians(CAST(cl.latitud AS float8))) *
                cos(radians(CAST(cl.longitud AS float8)) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(CAST(cl.latitud AS float8)))
              )))) <= ${radioKm}
          ORDER BY distancia_km ASC
          LIMIT ${limit} OFFSET ${skip}
        `,
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM casos_legales cl
          WHERE cl.estado = 'abierto'
            AND cl.abogado_usuario_id IS NULL
            AND (6371 * acos(GREATEST(-1.0, LEAST(1.0,
                cos(radians(${lat})) * cos(radians(CAST(cl.latitud AS float8))) *
                cos(radians(CAST(cl.longitud AS float8)) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(CAST(cl.latitud AS float8)))
              )))) <= ${radioKm}
        `,
      ]);

      const total = Number(countRaw[0].count);
      const data = casosRaw.map((row) => ({
        id: row.id,
        codigo: row.codigo,
        tipoPercance: row.tipo_percance,
        descripcion: row.descripcion,
        latitud: row.latitud,
        longitud: row.longitud,
        direccionAprox: row.direccion_aprox,
        estado: row.estado,
        prioridad: row.prioridad,
        fechaApertura: row.fecha_apertura,
        fechaAsignacion: row.fecha_asignacion,
        fechaCierre: row.fecha_cierre,
        distanciaKm: Number(row.distancia_km),
        asociado: {
          idUnico: row.asociado_id_unico,
          nombre: row.asociado_nombre,
          apellidoPat: row.asociado_apellido_pat,
          fotoUrl: row.asociado_foto_url,
        },
      }));

      return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    // Sin zona configurada: devuelve todos los casos disponibles sin filtro geográfico
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

  /**
   * Mapa SOS para abogados: devuelve TODOS los casos activos (no solo disponibles)
   * pero filtrados por la zona geográfica del abogado.
   */
  async findAllForAbogadoMapa(
    abogadoUsuarioId: string,
    query: { estado?: string; prioridad?: string; limit?: number },
  ) {
    const { estado, prioridad, limit = 100 } = query;

    const abogado = await this.prisma.usuario.findUnique({
      where: { id: abogadoUsuarioId },
      select: { zonaLatitud: true, zonaLongitud: true, zonaRadioKm: true },
    });

    if (abogado?.zonaLatitud != null && abogado?.zonaLongitud != null) {
      const lat = abogado.zonaLatitud;
      const lng = abogado.zonaLongitud;
      const radioKm = abogado.zonaRadioKm ?? 80;

      // Build parameterized query safely
      const params: (number | string)[] = [lat, lng, radioKm]; // $1, $2, $3
      let paramIdx = 4;

      let estadoClause = `AND cl.estado NOT IN ('cerrado', 'cancelado')`;
      if (estado) {
        estadoClause = `AND cl.estado = $${paramIdx}`;
        params.push(estado);
        paramIdx++;
      }

      let prioridadClause = '';
      if (prioridad) {
        prioridadClause = `AND cl.prioridad = $${paramIdx}`;
        params.push(prioridad);
        paramIdx++;
      }

      params.push(limit); // last param
      const limitParam = `$${paramIdx}`;

      type RawCaso = {
        id: string; codigo: string; tipo_percance: string; descripcion: string | null;
        latitud: string; longitud: string; direccion_aprox: string | null;
        estado: string; prioridad: string; fecha_apertura: Date;
        fecha_asignacion: Date | null; fecha_cierre: Date | null;
        distancia_km: string;
        asociado_id: string; asociado_id_unico: string; asociado_nombre: string;
        asociado_apellido_pat: string; asociado_telefono: string | null;
        asociado_foto_url: string | null;
        abogado_razon_social: string | null;
        abogado_usuario_id: string | null;
      };

      const casosRaw = await this.prisma.$queryRawUnsafe<RawCaso[]>(
        `
        SELECT
          cl.id, cl.codigo, cl.tipo_percance, cl.descripcion,
          cl.latitud, cl.longitud, cl.direccion_aprox,
          cl.estado, cl.prioridad, cl.fecha_apertura, cl.fecha_asignacion, cl.fecha_cierre,
          cl.abogado_usuario_id,
          a.id AS asociado_id, a.id_unico AS asociado_id_unico, a.nombre AS asociado_nombre,
          a.apellido_pat AS asociado_apellido_pat, a.telefono AS asociado_telefono,
          a.foto_url AS asociado_foto_url,
          p.razon_social AS abogado_razon_social,
          ROUND(CAST(
            (6371 * acos(GREATEST(-1.0, LEAST(1.0,
              cos(radians($1)) * cos(radians(CAST(cl.latitud AS float8))) *
              cos(radians(CAST(cl.longitud AS float8)) - radians($2)) +
              sin(radians($1)) * sin(radians(CAST(cl.latitud AS float8)))
            )))) AS numeric
          ), 1) AS distancia_km
        FROM casos_legales cl
        JOIN asociados a ON a.id = cl.asociado_id
        LEFT JOIN proveedores p ON p.id = cl.abogado_id
        WHERE cl.latitud IS NOT NULL AND cl.longitud IS NOT NULL
          ${estadoClause}
          ${prioridadClause}
          AND (6371 * acos(GREATEST(-1.0, LEAST(1.0,
              cos(radians($1)) * cos(radians(CAST(cl.latitud AS float8))) *
              cos(radians(CAST(cl.longitud AS float8)) - radians($2)) +
              sin(radians($1)) * sin(radians(CAST(cl.latitud AS float8)))
            )))) <= $3
        ORDER BY cl.fecha_apertura DESC
        LIMIT ${limitParam}
        `,
        ...params,
      );

      const data = casosRaw.map((row) => ({
        id: row.id,
        codigo: row.codigo,
        tipoPercance: row.tipo_percance,
        descripcion: row.descripcion,
        latitud: row.latitud,
        longitud: row.longitud,
        direccionAprox: row.direccion_aprox,
        estado: row.estado,
        prioridad: row.prioridad,
        fechaApertura: row.fecha_apertura,
        fechaAsignacion: row.fecha_asignacion,
        fechaCierre: row.fecha_cierre,
        abogadoUsuarioId: row.abogado_usuario_id,
        asociadoId: row.asociado_id,
        asociado: {
          id: row.asociado_id,
          idUnico: row.asociado_id_unico,
          nombre: row.asociado_nombre,
          apellidoPat: row.asociado_apellido_pat,
          telefono: row.asociado_telefono,
          fotoUrl: row.asociado_foto_url,
        },
        abogado: row.abogado_razon_social ? { razonSocial: row.abogado_razon_social } : null,
      }));

      return { data, meta: { total: data.length } };
    }

    // Sin zona: devuelve todos los casos activos (fallback)
    const where: any = { latitud: { not: null }, longitud: { not: null } };
    if (estado) {
      where.estado = estado;
    } else {
      where.estado = { notIn: ['cerrado', 'cancelado'] };
    }
    if (prioridad) where.prioridad = prioridad;

    const data = await this.prisma.casoLegal.findMany({
      where,
      take: limit,
      orderBy: { fechaApertura: 'desc' },
      include: {
        asociado: {
          select: {
            id: true, idUnico: true, nombre: true, apellidoPat: true, telefono: true,
            fotoUrl: true,
          },
        },
        abogado: { select: { razonSocial: true } },
        abogadoUsuario: { select: { id: true, nombre: true } },
      },
    });

    return { data, meta: { total: data.length } };
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

    // Validar: máximo 3 postulaciones activas (casos abiertos sin asignar donde ya postuló)
    const postulacionesActivas = await this.prisma.notaCaso.count({
      where: {
        autorId: abogadoUsuarioId,
        esPrivada: true,
        caso: { estado: 'abierto', abogadoUsuarioId: null },
      },
    });
    if (postulacionesActivas >= 3) {
      throw new BadRequestException('Ya tienes el máximo de 3 postulaciones activas. Espera a que se procese alguna antes de postularte a nuevos casos.');
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

  private async notificarAbogadosNuevoCaso(caso: { id: string; codigo: string; tipoPercance: string; prioridad: string; latitud?: any; longitud?: any }) {
    const casoLat = caso.latitud != null ? Number(caso.latitud) : null;
    const casoLng = caso.longitud != null ? Number(caso.longitud) : null;

    let abogados: { id: string }[];

    if (casoLat != null && casoLng != null) {
      // Notificar solo abogados sin zona configurada O dentro del radio
      abogados = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT u.id
        FROM usuarios u
        WHERE u.rol = 'abogado' AND u.estado = 'activo'
          AND (
            u.zona_latitud IS NULL OR u.zona_longitud IS NULL
            OR (6371 * acos(GREATEST(-1.0, LEAST(1.0,
                cos(radians(u.zona_latitud)) * cos(radians(${casoLat}::float8)) *
                cos(radians(${casoLng}::float8) - radians(u.zona_longitud)) +
                sin(radians(u.zona_latitud)) * sin(radians(${casoLat}::float8))
              )))) <= COALESCE(u.zona_radio_km, 80)
          )
      `;
    } else {
      abogados = await this.prisma.usuario.findMany({
        where: { rol: 'abogado', estado: 'activo' },
        select: { id: true },
      });
    }

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
