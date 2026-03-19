import { Module } from '@nestjs/common';
import { CasosLegalesService } from './casos-legales.service';
import { CasosLegalesController } from './casos-legales.controller';
import { NotificacionesCrmModule } from '../notificaciones-crm/notificaciones-crm.module';

@Module({
  imports: [NotificacionesCrmModule],
  controllers: [CasosLegalesController],
  providers: [CasosLegalesService],
  exports: [CasosLegalesService],
})
export class CasosLegalesModule {}
