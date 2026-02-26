import { Module } from '@nestjs/common';
import { AsociadosService } from './asociados.service';
import { AsociadosController } from './asociados.controller';

@Module({
  controllers: [AsociadosController],
  providers: [AsociadosService],
  exports: [AsociadosService],
})
export class AsociadosModule {}
