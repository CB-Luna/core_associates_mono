import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: Twilio | null = null;
  private fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn(
        'Twilio credentials not configured — SMS will be logged to console',
      );
    }
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    const body = `Tu código de verificación Core Associates es: ${otp}. Expira en 5 minutos.`;

    if (!this.client) {
      this.logger.log(`[DEV SMS] To: ${to} — Code: ${otp}`);
      return;
    }

    try {
      await this.client.messages.create({
        body,
        from: this.fromNumber,
        to,
      });
      this.logger.log(`SMS sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error}`);
      // Don't throw — OTP was stored in Redis, user can retry
    }
  }
}
