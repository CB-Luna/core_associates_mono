import { Module } from '@nestjs/common';
import { CasosLegalesService } from './casos-legales.service';
import { CasosLegalesController } from './casos-legales.controller';
import { NotificacionesCrmModule } from '../notificaciones-crm/notificaciones-crm.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [NotificacionesCrmModule, StorageModule],
  controllers: [CasosLegalesController],
  providers: [CasosLegalesService],
  exports: [CasosLegalesService],
})
export class CasosLegalesModule {}
