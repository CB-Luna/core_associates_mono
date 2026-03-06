import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../../common/sms/sms.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private readonly fcmServerKey: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {
    this.fcmServerKey = this.configService.get<string>('FCM_SERVER_KEY');
    if (!this.fcmServerKey) {
      this.logger.warn('FCM_SERVER_KEY not configured — push notifications will be logged only');
    }
  }

  async registerToken(asociadoId: string, dto: RegisterTokenDto) {
    await this.prisma.dispositivoToken.upsert({
      where: {
        asociadoId_token: { asociadoId, token: dto.token },
      },
      update: { plataforma: dto.platform, activo: true, updatedAt: new Date() },
      create: {
        asociadoId,
        token: dto.token,
        plataforma: dto.platform,
      },
    });
    this.logger.log(`Token registered for asociado ${asociadoId}`);
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

    // Push notification via FCM
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

    if (!this.fcmServerKey) {
      this.logger.log(
        `[DEV PUSH] To: ${asociadoId} | Title: ${titulo} | Body: ${mensaje} | Tokens: ${tokenList.length}`,
      );
      return { enviado: true, canal: 'push', modo: 'dev' };
    }

    // FCM HTTP v1 send
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${this.fcmServerKey}`,
        },
        body: JSON.stringify({
          registration_ids: tokenList,
          notification: { title: titulo, body: mensaje },
          data: data || {},
        }),
      });

      const result = await response.json();
      this.logger.log(`FCM response for ${asociadoId}: success=${result.success}, failure=${result.failure}`);

      // Deactivate invalid tokens
      if (result.results) {
        for (let i = 0; i < result.results.length; i++) {
          if (result.results[i].error === 'NotRegistered' || result.results[i].error === 'InvalidRegistration') {
            await this.prisma.dispositivoToken.updateMany({
              where: { token: tokenList[i] },
              data: { activo: false },
            });
          }
        }
      }

      return { enviado: true, canal: 'push', exitosos: result.success, fallidos: result.failure };
    } catch (error) {
      this.logger.error(`FCM send failed for ${asociadoId}: ${error}`);
      return { enviado: false, canal: 'push', error: 'FCM send failed' };
    }
  }
}
