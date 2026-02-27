import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── OTP para App Móvil ──

  async sendOtp(telefono: string): Promise<{ message: string }> {
    // Generar OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // TODO: Almacenar OTP en Redis con expiración de 5 minutos
    // TODO: Enviar OTP vía Twilio SMS
    console.log(`[DEV] OTP for ${telefono}: ${otp} (use 000000 to bypass)`);

    return { message: 'OTP enviado correctamente' };
  }

  async verifyOtp(
    telefono: string,
    otp: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // DEV bypass: accept '000000' in non-production
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    if (!isDev || otp !== '000000') {
      // TODO: Verificar OTP desde Redis
      // In production, validate against stored OTP
    }

    // Buscar asociado, crear si no existe (first login auto-registers)
    let asociado = await this.prisma.asociado.findUnique({
      where: { telefono },
    });

    if (!asociado) {
      const count = await this.prisma.asociado.count();
      const idUnico = `ASC-${String(count + 1).padStart(4, '0')}`;

      asociado = await this.prisma.asociado.create({
        data: {
          idUnico,
          nombre: '',
          apellidoPat: '',
          telefono,
          fechaNacimiento: new Date('2000-01-01'),
          estado: 'pendiente',
        },
      });
    }

    const payload = {
      sub: asociado.id,
      telefono: asociado.telefono,
      tipo: 'asociado' as const,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  // ── Login para Web CRM ──

  async loginAdmin(
    email: string,
    password: string,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      usuario.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar último acceso
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() },
    });

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      tipo: 'usuario',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    };
  }

  async refreshToken(
    token: string,
  ): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(token);
      const newPayload = { sub: payload.sub, email: payload.email, telefono: payload.telefono, rol: payload.rol, tipo: payload.tipo };
      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }
}
