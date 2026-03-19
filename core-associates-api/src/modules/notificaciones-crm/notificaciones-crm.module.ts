import { Module } from '@nestjs/common';
import { NotificacionesCrmController } from './notificaciones-crm.controller';
import { NotificacionesCrmService } from './notificaciones-crm.service';

@Module({
  controllers: [NotificacionesCrmController],
  providers: [NotificacionesCrmService],
  exports: [NotificacionesCrmService],
})
export class NotificacionesCrmModule {}
