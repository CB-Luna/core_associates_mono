import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { SmsService } from '../../common/sms/sms.service';
import { StorageService } from '../storage/storage.service';
import { RolUsuario, EstadoUsuario } from '@prisma/client';

const OTP_TTL_SECONDS = 300; // 5 minutos
const OTP_KEY_PREFIX = 'otp:';
const PROTECTED_EMAILS = ['admin@coreassociates.com'];

@Injectable()
export class AuthService {
  private readonly AVATAR_BUCKET = 'core-associates-avatars';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly smsService: SmsService,
    private readonly storageService: StorageService,
  ) {}

  // ── OTP para App Móvil ──

  async sendOtp(telefono: string): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Almacenar OTP en Redis con expiración de 5 minutos
    await this.redis.set(`${OTP_KEY_PREFIX}${telefono}`, otp, OTP_TTL_SECONDS);

    await this.smsService.sendOtp(telefono, otp);

    return { message: 'OTP enviado correctamente' };
  }

  async verifyOtp(
    telefono: string,
    otp: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // DEMO bypass: números de demo aceptan 000000 (para presentaciones y QA)
    const defaultDemoPhones = [
      '+525512345678',
      '+525510000001', '+525510000002', '+525510000003',
      '+525520000001', '+525520000002', '+525520000003', '+525520000004', '+525520000005',
      '+525530000001', '+525530000002', '+525530000003', '+525530000004', '+525530000005',
    ].join(',');
    const demoNumbers = (
      this.configService.get<string>('DEMO_PHONES') || defaultDemoPhones
    ).split(',').map((n) => n.trim());
    const isDemoBypass = demoNumbers.includes(telefono) && otp === '000000';
    // DEV bypass: cualquier teléfono acepta 000000 en entorno no-producción
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    const isDevBypass = isDev && otp === '000000';

    if (!isDemoBypass && !isDevBypass) {
      // Verificar OTP desde Redis
      const storedOtp = await this.redis.get(`${OTP_KEY_PREFIX}${telefono}`);
      if (!storedOtp || storedOtp !== otp) {
        throw new UnauthorizedException('OTP inválido o expirado');
      }
      await this.redis.del(`${OTP_KEY_PREFIX}${telefono}`);
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

    const payload: Record<string, unknown> = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      tipo: 'usuario',
    };

    if (usuario.rol === 'proveedor' && usuario.proveedorId) {
      payload.proveedorId = usuario.proveedorId;
    }

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        ...(usuario.proveedorId && { proveedorId: usuario.proveedorId }),
        ...(usuario.avatarUrl && { avatarUrl: usuario.avatarUrl }),
      },
    };
  }

  async refreshToken(
    token: string,
  ): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(token);
      const newPayload: Record<string, unknown> = { sub: payload.sub, email: payload.email, telefono: payload.telefono, rol: payload.rol, tipo: payload.tipo };
      if (payload.proveedorId) {
        newPayload.proveedorId = payload.proveedorId;
      }
      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  // ── Gestión de Usuarios CRM ──

  async getUsers() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        proveedorId: true,
        avatarUrl: true,
        ultimoAcceso: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data: {
    email: string;
    nombre: string;
    password: string;
    rol: string;
    proveedorId?: string;
  }) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        email: data.email,
        nombre: data.nombre,
        passwordHash,
        rol: data.rol as RolUsuario,
        ...(data.proveedorId && { proveedorId: data.proveedorId }),
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return usuario;
  }

  async updateUser(id: string, data: {
    email?: string;
    nombre?: string;
    rol?: string;
    estado?: string;
  }) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Proteger super-admin: no se puede cambiar email, rol ni desactivar
    if (PROTECTED_EMAILS.includes(usuario.email)) {
      if (data.email && data.email !== usuario.email) {
        throw new BadRequestException('No se puede cambiar el email del super-administrador');
      }
      if (data.rol && data.rol !== usuario.rol) {
        throw new BadRequestException('No se puede cambiar el rol del super-administrador');
      }
      if (data.estado && data.estado !== usuario.estado) {
        throw new BadRequestException('No se puede cambiar el estado del super-administrador');
      }
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.rol && { rol: data.rol as RolUsuario }),
        ...(data.estado && { estado: data.estado as EstadoUsuario }),
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async resetPassword(id: string, newPassword: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.usuario.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  // ── Avatar de Usuario ──

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Delete old avatar if exists
    if (usuario.avatarUrl) {
      try {
        await this.storageService.deleteFile(this.AVATAR_BUCKET, usuario.avatarUrl);
      } catch { /* ignore if old file doesn't exist */ }
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const objectName = `${userId}/${Date.now()}.${ext}`;
    await this.storageService.uploadFile(this.AVATAR_BUCKET, objectName, file.buffer, file.mimetype);

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { avatarUrl: objectName },
    });

    return { avatarUrl: objectName };
  }

  async getAvatar(userId: string): Promise<{ buffer: Buffer; contentType: string }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario || !usuario.avatarUrl) throw new NotFoundException('Avatar no encontrado');

    const buffer = await this.storageService.getFile(this.AVATAR_BUCKET, usuario.avatarUrl);
    const ext = usuario.avatarUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    return { buffer, contentType: mimeMap[ext] || 'image/jpeg' };
  }

  async deleteAvatar(userId: string): Promise<{ message: string }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (usuario.avatarUrl) {
      try {
        await this.storageService.deleteFile(this.AVATAR_BUCKET, usuario.avatarUrl);
      } catch { /* ignore */ }
      await this.prisma.usuario.update({
        where: { id: userId },
        data: { avatarUrl: null },
      });
    }

    return { message: 'Avatar eliminado' };
  }

  // ── OTP Peek (para que la app móvil muestre el código pendiente) ──

  async peekOtp(telefono: string): Promise<{ codigo: string | null; ttlSegundos: number }> {
    const key = `${OTP_KEY_PREFIX}${telefono}`;
    const codigo = await this.redis.get(key);
    if (!codigo) return { codigo: null, ttlSegundos: 0 };
    const ttlSegundos = await this.redis.ttl(key);
    return { codigo, ttlSegundos: ttlSegundos > 0 ? ttlSegundos : 0 };
  }
}
