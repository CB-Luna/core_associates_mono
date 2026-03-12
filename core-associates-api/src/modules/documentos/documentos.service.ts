import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AiAnalysisService } from '../ai/ai-analysis.service';

const BUCKET = 'core-associates-documents';

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notificaciones: NotificacionesService,
    private readonly aiAnalysis: AiAnalysisService,
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

    let documento;

    if (existing) {
      // Eliminar archivo anterior de S3
      await this.storage.deleteFile(existing.s3Bucket, existing.s3Key).catch(() => {});
      documento = await this.prisma.documento.update({
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
    } else {
      documento = await this.prisma.documento.create({
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

    // Auto-trigger AI analysis (fire-and-forget)
    this.aiAnalysis.analyzeDocument(documento.id).catch((err) =>
      this.logger.warn(`AI analysis trigger failed for ${documento.id}: ${err.message}`),
    );

    return documento;
  }

  async getMyDocuments(asociadoId: string) {
    return this.prisma.documento.findMany({
      where: { asociadoId },
      orderBy: { createdAt: 'desc' },
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
    });
  }

  async getDocumentBuffer(id: string, userId: string, userTipo: string): Promise<{ buffer: Buffer; contentType: string }> {
    const doc = await this.prisma.documento.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Check ownership for asociados
    if (userTipo === 'asociado' && doc.asociadoId !== userId) {
      throw new ForbiddenException('No autorizado');
    }

    const buffer = await this.storage.getFile(doc.s3Bucket, doc.s3Key);
    const ext = doc.s3Key.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' };
    return { buffer, contentType: mimeMap[ext] || 'application/octet-stream' };
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
      }),
      this.prisma.documento.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
