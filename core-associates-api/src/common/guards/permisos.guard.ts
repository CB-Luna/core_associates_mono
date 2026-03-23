import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_KEY } from '../decorators/permisos.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermisos = this.reflector.getAllAndOverride<string[]>(PERMISOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermisos || requiredPermisos.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.id) {
      throw new ForbiddenException('No autenticado');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: user.id },
      select: {
        rolRef: {
          select: {
            permisos: { select: { permiso: { select: { codigo: true } } } },
          },
        },
      },
    });

    const userPermisos = usuario?.rolRef?.permisos.map((rp) => rp.permiso.codigo) ?? [];

    // Inyectar permisos en request.user para que controllers puedan accederlos
    const request = context.switchToHttp().getRequest();
    request.user.permisos = userPermisos;

    // Super-admin tiene acceso total (D.3 RBAC dinámico)
    if (userPermisos.includes('sistema:super-admin')) {
      return true;
    }

    // El usuario necesita al menos uno de los permisos requeridos (OR)
    const hasPermission = requiredPermisos.some((p) => userPermisos.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }

    return true;
  }
}
