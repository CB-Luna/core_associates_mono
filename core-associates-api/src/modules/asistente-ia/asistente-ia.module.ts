import { Module } from '@nestjs/common';
import { ReportesModule } from '../reportes/reportes.module';
import { AsistenteIaController } from './asistente-ia.controller';
import { AsistenteIaService } from './asistente-ia.service';

@Module({
  imports: [ReportesModule],
  controllers: [AsistenteIaController],
  providers: [AsistenteIaService],
})
export class AsistenteIaModule {}
