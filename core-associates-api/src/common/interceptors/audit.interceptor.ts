import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!MUTATION_METHODS.includes(method)) {
      return next.handle();
    }

    const user = request.user;
    // Solo auditar acciones de usuarios CRM (no asociados app)
    if (!user || user.tipo !== 'usuario') {
      return next.handle();
    }

    const path = request.route?.path || request.url;
    const entidadId = request.params?.id;
    const accion = this.resolveAccion(method);
    const entidad = this.resolveEntidad(path);

    return next.handle().pipe(
      tap({
        next: (responseData: Record<string, unknown> | undefined) => {
          this.registrarAuditoria({
            usuarioId: user.sub,
            accion,
            entidad,
            entidadId: entidadId || (responseData?.id as string) || null,
            datosNuevos: method !== 'DELETE' ? request.body : undefined,
            ip: request.ip,
          });
        },
      }),
    );
  }

  private resolveAccion(method: string): string {
    const acciones: Record<string, string> = {
      POST: 'crear',
      PUT: 'actualizar',
      PATCH: 'actualizar',
      DELETE: 'eliminar',
    };
    return acciones[method] || method.toLowerCase();
  }

  private resolveEntidad(path: string): string {
    // /api/v1/asociados/123 → "asociados"
    const segments = path.replace(/^\/api\/v1\//, '').split('/');
    return segments[0] || 'desconocido';
  }

  private async registrarAuditoria(data: {
    usuarioId: string;
    accion: string;
    entidad: string;
    entidadId: string | null;
    datosNuevos: Record<string, unknown> | undefined;
    ip: string;
  }) {
    try {
      if (!data.entidadId) return;

      await this.prisma.auditoria.create({
        data: {
          usuarioId: data.usuarioId,
          accion: data.accion,
          entidad: data.entidad,
          entidadId: data.entidadId,
          datosNuevos: data.datosNuevos as Prisma.InputJsonValue | undefined,
          ip: data.ip,
        },
      });
    } catch (error) {
      // No bloquear la respuesta si la auditoría falla
      this.logger.error('Error al registrar auditoría', error);
    }
  }
}
