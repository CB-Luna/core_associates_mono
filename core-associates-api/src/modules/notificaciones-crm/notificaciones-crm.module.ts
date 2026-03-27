import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificacionesCrmController } from './notificaciones-crm.controller';
import { NotificacionesCrmService } from './notificaciones-crm.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificacionesCrmController],
  providers: [NotificacionesCrmService],
  exports: [NotificacionesCrmService],
})
export class NotificacionesCrmModule {}
