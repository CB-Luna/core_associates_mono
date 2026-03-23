import { Module } from '@nestjs/common';
import { ReportesModule } from '../reportes/reportes.module';
import { AiModule } from '../ai/ai.module';
import { AsistenteIaController } from './asistente-ia.controller';
import { AsistenteIaService } from './asistente-ia.service';

@Module({
  imports: [ReportesModule, AiModule],
  controllers: [AsistenteIaController],
  providers: [AsistenteIaService],
})
export class AsistenteIaModule {}
