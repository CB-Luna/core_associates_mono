import { Module } from '@nestjs/common';
import { AsociadosService } from './asociados.service';
import { AsociadosController } from './asociados.controller';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [NotificacionesModule, StorageModule],
  controllers: [AsociadosController],
  providers: [AsociadosService],
  exports: [AsociadosService],
})
export class AsociadosModule {}
