import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { StorageService } from '../storage/storage.service';
import { UpdateAsociadoDto } from './dto/update-asociado.dto';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { CreateNotaAsociadoDto } from './dto/create-nota-asociado.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const BUCKET_FOTOS = 'core-associates-photos';

@Injectable()
export class AsociadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificaciones: NotificacionesService,
    private readonly storage: StorageService,
  ) {}

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
    // Limit: máximo 1 vehículo por asociado
    const count = await this.prisma.vehiculo.count({ where: { asociadoId } });
    if (count >= 1) {
      throw new BadRequestException(
        'Solo puedes tener un vehículo registrado. Elimina el actual para agregar otro.',
      );
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
    }).catch((e) => {
      if (e.code === 'P2002') {
        throw new ConflictException('Ya existe un vehículo con esas placas');
      }
      throw e;
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
          documentos: {
            select: { tipo: true, estado: true },
          },
          vehiculos: {
            select: { marca: true, modelo: true, placas: true, esPrincipal: true },
            take: 3,
            orderBy: { esPrincipal: 'desc' },
          },
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
        documentos: {
          include: {
            analisis: {
              select: {
                id: true,
                estado: true,
                confianza: true,
                datosExtraidos: true,
                validaciones: true,
                createdAt: true,
              },
            },
          },
        },
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

  async updateEstado(id: string, estado: string, usuarioId: string, motivo?: string) {
    const asociado = await this.prisma.asociado.findUnique({ where: { id } });
    if (!asociado) {
      throw new NotFoundException('Asociado no encontrado');
    }

    // Validar requisitos KYC antes de aprobar
    if (estado === 'activo') {
      const [vehiculoCount, documentos] = await Promise.all([
        this.prisma.vehiculo.count({ where: { asociadoId: id } }),
        this.prisma.documento.findMany({
          where: { asociadoId: id },
          select: { tipo: true, estado: true },
        }),
      ]);

      const tiposRequeridos = ['ine_frente', 'ine_reverso', 'selfie', 'tarjeta_circulacion'] as const;
      const faltantes: string[] = [];

      if (vehiculoCount === 0) faltantes.push('vehículo registrado');

      for (const tipo of tiposRequeridos) {
        const doc = documentos.find((d) => d.tipo === tipo);
        if (!doc) {
          faltantes.push(tipo.replace(/_/g, ' '));
        } else if (doc.estado !== 'aprobado') {
          faltantes.push(`${tipo.replace(/_/g, ' ')} aprobado/a (actualmente: ${doc.estado})`);
        }
      }

      if (faltantes.length > 0) {
        throw new BadRequestException(
          `No se puede aprobar: falta ${faltantes.join(', ')}`,
        );
      }
    }

    const estadoAnterior = asociado.estado;

    const data: any = { estado };
    if (estado === 'activo') {
      data.fechaAprobacion = new Date();
      data.aprobadoPorId = usuarioId;
      data.motivoRechazo = null; // Limpiar motivo previo
    }
    if ((estado === 'rechazado' || estado === 'suspendido') && motivo) {
      data.motivoRechazo = motivo;
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.asociado.update({ where: { id }, data }),
      this.prisma.notaAsociado.create({
        data: {
          asociadoId: id,
          autorId: usuarioId,
          contenido: `Estado cambiado de "${estadoAnterior}" a "${estado}"${motivo ? `. Motivo: ${motivo}` : ''}`,
          tipo: 'cambio_estado',
          metadatos: { estadoAnterior, estadoNuevo: estado, motivo: motivo || null },
        },
      }),
    ]);

    // Notificación al asociado sobre cambio de estado
    const mensajes: Record<string, string> = {
      activo: 'Tu membresía ha sido aprobada. ¡Bienvenido a Core Associates!',
      rechazado: `Tu solicitud de membresía fue rechazada. Motivo: ${motivo || 'No especificado'}`,
      suspendido: `Tu membresía ha sido suspendida. Motivo: ${motivo || 'No especificado'}`,
      baja: 'Tu membresía ha sido dada de baja.',
    };

    if (mensajes[estado]) {
      this.notificaciones.sendPush(
        id,
        'Actualización de membresía',
        mensajes[estado],
        { tipo: 'estado_asociado', estado },
      ).catch(() => {}); // fire-and-forget
    }

    return updated;
  }

  // ── Foto de perfil ──

  async uploadFoto(asociadoId: string, file: Express.Multer.File) {
    const asociado = await this.prisma.asociado.findUnique({ where: { id: asociadoId } });
    if (!asociado) {
      throw new NotFoundException('Asociado no encontrado');
    }

    // Eliminar foto anterior si existe
    if (asociado.fotoUrl) {
      await this.storage.deleteFile(BUCKET_FOTOS, asociado.fotoUrl).catch(() => {});
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const s3Key = `${asociadoId}/foto/${Date.now()}.${ext}`;
    await this.storage.uploadFile(BUCKET_FOTOS, s3Key, file.buffer, file.mimetype);

    return this.prisma.asociado.update({
      where: { id: asociadoId },
      data: { fotoUrl: s3Key },
    });
  }

  async getFotoBuffer(asociadoId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    const asociado = await this.prisma.asociado.findUnique({ where: { id: asociadoId } });
    if (!asociado) {
      throw new NotFoundException('Asociado no encontrado');
    }
    if (asociado.fotoUrl) {
      const buffer = await this.storage.getFile(BUCKET_FOTOS, asociado.fotoUrl);
      const ext = asociado.fotoUrl.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      return { buffer, contentType: mimeMap[ext] || 'image/jpeg' };
    }
    // Fallback: usar selfie del KYC como avatar
    const selfie = await this.prisma.documento.findFirst({
      where: { asociadoId, tipo: 'selfie', s3Key: { not: '' }, estado: { not: 'rechazado' } },
      orderBy: { createdAt: 'desc' },
    });
    if (selfie) {
      const buffer = await this.storage.getFile(selfie.s3Bucket, selfie.s3Key);
      return { buffer, contentType: selfie.contentType };
    }
    return null;
  }

  // ── Notas del asociado ──

  async getNotas(asociadoId: string) {
    const asociado = await this.prisma.asociado.findUnique({ where: { id: asociadoId } });
    if (!asociado) {
      throw new NotFoundException('Asociado no encontrado');
    }

    return this.prisma.notaAsociado.findMany({
      where: { asociadoId },
      orderBy: { createdAt: 'desc' },
      include: {
        autor: { select: { id: true, nombre: true, rol: true } },
      },
    });
  }

  async createNota(asociadoId: string, autorId: string, dto: CreateNotaAsociadoDto) {
    const asociado = await this.prisma.asociado.findUnique({ where: { id: asociadoId } });
    if (!asociado) {
      throw new NotFoundException('Asociado no encontrado');
    }

    return this.prisma.notaAsociado.create({
      data: {
        asociadoId,
        autorId,
        contenido: dto.contenido,
        tipo: dto.tipo || 'nota',
      },
      include: {
        autor: { select: { id: true, nombre: true, rol: true } },
      },
    });
  }
}
