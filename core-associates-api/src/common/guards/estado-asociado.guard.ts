import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

const MENSAJES_POR_ESTADO: Record<string, string> = {
  pendiente: 'Tu cuenta está pendiente de aprobación. Completa tu documentación para activarla.',
  suspendido: 'Tu cuenta ha sido suspendida. Contacta a soporte para más información.',
  rechazado: 'Tu cuenta ha sido rechazada. Contacta a soporte.',
  baja: 'Tu cuenta no está activa.',
};

@Injectable()
export class EstadoAsociadoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    // CRM users (admin/operador/proveedor) bypass this guard
    if (user.tipo === 'usuario') return true;

    // Asociados with estado activo pass through
    if (user.estado === 'activo') return true;

    const mensaje = MENSAJES_POR_ESTADO[user.estado] || 'Tu cuenta no está activa.';
    throw new ForbiddenException(mensaje);
  }
}
