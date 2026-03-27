import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificacionesCrmService {
  private readonly logger = new Logger(NotificacionesCrmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(usuarioId: string, query: { page?: number; limit?: number; leida?: boolean }) {
    const { page = 1, limit = 10, leida } = query;
    const skip = (page - 1) * limit;

    const where: any = { usuarioId };
    if (leida !== undefined) where.leida = leida;

    const [data, total] = await Promise.all([
      this.prisma.notificacionCRM.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificacionCRM.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async countNoLeidas(usuarioId: string) {
    const count = await this.prisma.notificacionCRM.count({
      where: { usuarioId, leida: false },
    });
    return { count };
  }

  async marcarLeida(id: string, usuarioId: string) {
    const noti = await this.prisma.notificacionCRM.findFirst({
      where: { id, usuarioId },
    });
    if (!noti) throw new NotFoundException('Notificación no encontrada');

    return this.prisma.notificacionCRM.update({
      where: { id },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(usuarioId: string) {
    const result = await this.prisma.notificacionCRM.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true },
    });
    return { marcadas: result.count };
  }

  /**
   * Crear notificación CRM para un usuario.
   * Usado internamente por otros servicios (casos-legales, etc.)
   */
  async crear(data: {
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: string;
    referenciaId?: string;
    referenciaTipo?: string;
  }) {
    const noti = await this.prisma.notificacionCRM.create({ data });
    this.logger.log(`Notificación CRM creada: tipo=${data.tipo} para usuario=${data.usuarioId}`);
    this.eventEmitter.emit(`notif.${data.usuarioId}`, noti);
    return noti;
  }

  /**
   * Observable SSE stream para un usuario específico.
   * Emite cada vez que se crea una notificación para ese usuario.
   */
  getStream(userId: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, `notif.${userId}`).pipe(
      map((noti) => ({ data: noti }) as MessageEvent),
    );
  }
}
