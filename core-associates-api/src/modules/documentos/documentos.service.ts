import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

const BUCKET = 'core-associates-documents';

@Injectable()
export class DocumentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async uploadDocument(
    asociadoId: string,
    file: Express.Multer.File,
    tipo: string,
  ) {
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const ext = file.originalname.split('.').pop() || 'jpg';
    const s3Key = `${asociadoId}/${tipo}/${Date.now()}.${ext}`;

    await this.storage.uploadFile(BUCKET, s3Key, file.buffer, file.mimetype);

    // Si ya existe un documento del mismo tipo, reemplazarlo (re-upload)
    const existing = await this.prisma.documento.findFirst({
      where: { asociadoId, tipo: tipo as any },
    });

    if (existing) {
      // Eliminar archivo anterior de S3
      await this.storage.deleteFile(existing.s3Bucket, existing.s3Key).catch(() => {});
      return this.prisma.documento.update({
        where: { id: existing.id },
        data: {
          s3Bucket: BUCKET,
          s3Key,
          contentType: file.mimetype,
          fileSize: file.size,
          checksumSha256: checksum,
          estado: 'pendiente',
          motivoRechazo: null,
          revisadoPorId: null,
          fechaRevision: null,
        },
      });
    }

    return this.prisma.documento.create({
      data: {
        asociadoId,
        tipo: tipo as any,
        s3Bucket: BUCKET,
        s3Key,
        contentType: file.mimetype,
        fileSize: file.size,
        checksumSha256: checksum,
        estado: 'pendiente',
      },
    });
  }

  async getMyDocuments(asociadoId: string) {
    return this.prisma.documento.findMany({
      where: { asociadoId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentUrl(id: string, userId: string, userTipo: string) {
    const doc = await this.prisma.documento.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Check ownership for asociados
    if (userTipo === 'asociado' && doc.asociadoId !== userId) {
      throw new ForbiddenException('No autorizado');
    }

    const url = await this.storage.getPresignedUrl(doc.s3Bucket, doc.s3Key, 900);
    return { url };
  }

  async updateEstado(
    id: string,
    estado: string,
    revisadoPorId: string,
    motivoRechazo?: string,
  ) {
    const doc = await this.prisma.documento.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Documento no encontrado');
    }

    const updated = await this.prisma.documento.update({
      where: { id },
      data: {
        estado: estado as any,
        revisadoPorId,
        motivoRechazo: estado === 'rechazado' ? motivoRechazo : null,
        fechaRevision: new Date(),
      },
    });

    // Notificar al asociado sobre revisión de documento
    const docForNotif = await this.prisma.documento.findUnique({ where: { id }, select: { asociadoId: true, tipo: true } });
    if (docForNotif) {
      const titulo = estado === 'aprobado' ? 'Documento aprobado' : 'Documento rechazado';
      const mensaje = estado === 'aprobado'
        ? `Tu documento (${docForNotif.tipo}) ha sido aprobado.`
        : `Tu documento (${docForNotif.tipo}) fue rechazado. Motivo: ${motivoRechazo || 'No especificado'}`;

      this.notificaciones.sendPush(
        docForNotif.asociadoId,
        titulo,
        mensaje,
        { tipo: 'estado_documento', estado, documentoId: id },
      ).catch(() => {}); // fire-and-forget
    }

    return updated;
  }

  async getPendingDocuments(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { estado: 'pendiente' as const };

    const [data, total] = await Promise.all([
      this.prisma.documento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          asociado: {
            select: { id: true, idUnico: true, nombre: true, apellidoPat: true, telefono: true },
          },
        },
      }),
      this.prisma.documento.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
