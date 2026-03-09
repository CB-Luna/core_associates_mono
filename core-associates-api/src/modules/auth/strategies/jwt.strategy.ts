import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email?: string;
  telefono?: string;
  rol?: string;
  proveedorId?: string;
  tipo: 'usuario' | 'asociado';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.tipo === 'usuario') {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
      });
      if (!usuario || usuario.estado !== 'activo') {
        throw new UnauthorizedException('Usuario no autorizado');
      }
      return {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        tipo: 'usuario',
        ...(usuario.proveedorId && { proveedorId: usuario.proveedorId }),
      };
    }

    if (payload.tipo === 'asociado') {
      const asociado = await this.prisma.asociado.findUnique({
        where: { id: payload.sub },
      });
      if (!asociado) {
        throw new UnauthorizedException('Asociado no encontrado');
      }
      return { id: asociado.id, telefono: asociado.telefono, estado: asociado.estado, tipo: 'asociado' };
    }

    throw new UnauthorizedException('Token inválido');
  }
}
