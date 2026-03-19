import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

const TIPOS_REQUERIDOS = ['ine_frente', 'ine_reverso', 'selfie', 'tarjeta_circulacion'] as const;

@Injectable()
export class DocumentosCronService {
  private readonly logger = new Logger(DocumentosCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  /**
   * Cron diario (9 AM) — Notifica a asociados con documentos incompletos.
   * Escala la urgencia según la antigüedad del registro:
   *   - 3+ días sin completar: recordatorio amable
   *   - 7+ días: recordatorio urgente
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async recordatorioDocumentosIncompletos() {
    this.logger.log('Ejecutando cron: recordatorio documentos incompletos');

    const hace3dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Buscar asociados pendientes o activos registrados hace 3+ días
    const asociados = await this.prisma.asociado.findMany({
      where: {
        estado: { in: ['pendiente', 'activo'] },
        fechaRegistro: { lte: hace3dias },
      },
      select: {
        id: true,
        nombre: true,
        fechaRegistro: true,
        documentos: {
          where: { estado: { in: ['pendiente', 'aprobado'] } },
          select: { tipo: true },
        },
      },
    });

    let enviados = 0;

    for (const asoc of asociados) {
      const tiposSubidos = new Set(asoc.documentos.map((d) => d.tipo));
      const faltantes = TIPOS_REQUERIDOS.filter((t) => !tiposSubidos.has(t));

      if (faltantes.length === 0) continue;

      const esUrgente = asoc.fechaRegistro <= hace7dias;
      const titulo = esUrgente
        ? '⚠️ Documentos pendientes — Urgente'
        : '📋 Completa tus documentos';

      const mensaje = esUrgente
        ? `${asoc.nombre}, aún faltan ${faltantes.length} documento(s) por subir. Completa tu expediente para mantener tu membresía activa.`
        : `${asoc.nombre}, te faltan ${faltantes.length} documento(s). Súbelos desde la app para completar tu registro.`;

      await this.notificaciones
        .sendPush(asoc.id, titulo, mensaje, {
          tipo: 'recordatorio_documentos',
          faltantes: faltantes.join(','),
        })
        .catch(() => {});

      enviados++;
    }

    if (enviados > 0) {
      this.logger.log(`Recordatorios enviados: ${enviados} asociados con documentos incompletos`);
    }
  }
}
