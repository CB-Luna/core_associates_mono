import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../../common/sms/sms.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificacionesService implements OnModuleInit {
  private readonly logger = new Logger(NotificacionesService.name);
  private fcmAvailable = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (admin.apps.length > 0) {
      this.fcmAvailable = true;
      return;
    }

    // Option 1: GOOGLE_APPLICATION_CREDENTIALS env var (file path — standard Firebase approach)
    const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    if (credentialsPath) {
      try {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        this.fcmAvailable = true;
        this.logger.log('Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS');
        return;
      } catch (error) {
        this.logger.error(`Firebase init via credentials file failed: ${error}`);
      }
    }

    // Option 2: FIREBASE_SERVICE_ACCOUNT_BASE64 (base64-encoded JSON — for Docker/CI)
    const base64 = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64');
    if (base64) {
      try {
        const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        this.fcmAvailable = true;
        this.logger.log('Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_BASE64');
        return;
      } catch (error) {
        this.logger.error(`Firebase init from base64 failed: ${error}`);
      }
    }

    this.logger.warn('Firebase not configured — push notifications will be logged only');
  }

  async registerToken(asociadoId: string, dto: RegisterTokenDto) {
    const existing = await this.prisma.dispositivoToken.findFirst({
      where: { asociadoId, token: dto.token },
    });

    if (existing) {
      await this.prisma.dispositivoToken.update({
        where: { id: existing.id },
        data: { plataforma: dto.platform, activo: true, updatedAt: new Date() },
      });
    } else {
      await this.prisma.dispositivoToken.create({
        data: { asociadoId, token: dto.token, plataforma: dto.platform },
      });
    }

    this.logger.log(`Token registered for asociado ${asociadoId}`);
    return { message: 'Token registrado exitosamente' };
  }

  async registerTokenUsuario(usuarioId: string, dto: RegisterTokenDto) {
    const existing = await this.prisma.dispositivoToken.findFirst({
      where: { usuarioId, token: dto.token },
    });

    if (existing) {
      await this.prisma.dispositivoToken.update({
        where: { id: existing.id },
        data: { plataforma: dto.platform, activo: true, updatedAt: new Date() },
      });
    } else {
      await this.prisma.dispositivoToken.create({
        data: { usuarioId, token: dto.token, plataforma: dto.platform },
      });
    }

    this.logger.log(`Token registered for usuario ${usuarioId}`);
    return { message: 'Token registrado exitosamente' };
  }

  async removeToken(asociadoId: string, token: string) {
    await this.prisma.dispositivoToken.updateMany({
      where: { asociadoId, token },
      data: { activo: false },
    });
    return { message: 'Token removido' };
  }

  async send(dto: SendNotificationDto) {
    const asociado = await this.prisma.asociado.findUnique({
      where: { id: dto.asociadoId },
    });
    if (!asociado) {
      throw new NotFoundException('Asociado no encontrado');
    }

    const canal = dto.canal || 'push';

    if (canal === 'sms') {
      await this.smsService.sendOtp(asociado.telefono, dto.mensaje);
      this.logger.log(`SMS sent to asociado ${dto.asociadoId}`);
      return { enviado: true, canal: 'sms' };
    }

    // Push notification via FCM HTTP v1
    return this.sendPush(dto.asociadoId, dto.titulo, dto.mensaje, dto.data);
  }

  async sendPush(
    asociadoId: string,
    titulo: string,
    mensaje: string,
    data?: Record<string, string>,
  ) {
    const tokens = await this.prisma.dispositivoToken.findMany({
      where: { asociadoId, activo: true },
      select: { token: true },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No active tokens for asociado ${asociadoId}`);
      return { enviado: false, motivo: 'Sin tokens registrados' };
    }

    const tokenList = tokens.map((t) => t.token);

    if (!this.fcmAvailable) {
      this.logger.log(
        `[DEV PUSH] To: ${asociadoId} | Title: ${titulo} | Body: ${mensaje} | Tokens: ${tokenList.length}`,
      );
      return { enviado: true, canal: 'push', modo: 'dev' };
    }

    // FCM HTTP v1 via firebase-admin SDK
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokenList,
        notification: { title: titulo, body: mensaje },
        data: data || {},
      });

      this.logger.log(
        `FCM response for ${asociadoId}: success=${response.successCount}, failure=${response.failureCount}`,
      );

      // Deactivate invalid tokens based on error codes
      for (let i = 0; i < response.responses.length; i++) {
        const resp = response.responses[i];
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            await this.prisma.dispositivoToken.updateMany({
              where: { token: tokenList[i] },
              data: { activo: false },
            });
            this.logger.log(`Deactivated invalid token for asociado ${asociadoId}`);
          }
        }
      }

      return { enviado: true, canal: 'push', exitosos: response.successCount, fallidos: response.failureCount };
    } catch (error) {
      this.logger.error(`FCM send failed for ${asociadoId}: ${error}`);
      return { enviado: false, canal: 'push', error: 'FCM send failed' };
    }
  }

  async sendPushUsuario(
    usuarioId: string,
    titulo: string,
    mensaje: string,
    data?: Record<string, string>,
  ) {
    const tokens = await this.prisma.dispositivoToken.findMany({
      where: { usuarioId, activo: true },
      select: { token: true },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No active tokens for usuario ${usuarioId}`);
      return { enviado: false, motivo: 'Sin tokens registrados' };
    }

    const tokenList = tokens.map((t) => t.token);

    if (!this.fcmAvailable) {
      this.logger.log(
        `[DEV PUSH] To usuario: ${usuarioId} | Title: ${titulo} | Body: ${mensaje} | Tokens: ${tokenList.length}`,
      );
      return { enviado: true, canal: 'push', modo: 'dev' };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokenList,
        notification: { title: titulo, body: mensaje },
        data: data || {},
      });

      this.logger.log(
        `FCM response for usuario ${usuarioId}: success=${response.successCount}, failure=${response.failureCount}`,
      );

      for (let i = 0; i < response.responses.length; i++) {
        const resp = response.responses[i];
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            await this.prisma.dispositivoToken.updateMany({
              where: { token: tokenList[i] },
              data: { activo: false },
            });
            this.logger.log(`Deactivated invalid token for usuario ${usuarioId}`);
          }
        }
      }

      return { enviado: true, canal: 'push', exitosos: response.successCount, fallidos: response.failureCount };
    } catch (error) {
      this.logger.error(`FCM send failed for usuario ${usuarioId}: ${error}`);
      return { enviado: false, canal: 'push', error: 'FCM send failed' };
    }
  }

  /**
   * Limpieza periódica de tokens obsoletos.
   * - Elimina tokens inactivos con 30+ días sin actualización.
   * - Desactiva tokens activos con 60+ días sin actualización (probablemente expirados).
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupStaleTokens() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await this.prisma.dispositivoToken.deleteMany({
      where: {
        activo: false,
        updatedAt: { lt: thirtyDaysAgo },
      },
    });

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const deactivated = await this.prisma.dispositivoToken.updateMany({
      where: {
        activo: true,
        updatedAt: { lt: sixtyDaysAgo },
      },
      data: { activo: false },
    });

    if (deleted.count > 0 || deactivated.count > 0) {
      this.logger.log(
        `Token cleanup: ${deleted.count} deleted, ${deactivated.count} deactivated`,
      );
    }
  }
}
