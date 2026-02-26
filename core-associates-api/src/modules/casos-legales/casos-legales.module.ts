import { Module } from '@nestjs/common';
import { CasosLegalesService } from './casos-legales.service';
import { CasosLegalesController } from './casos-legales.controller';

@Module({
  controllers: [CasosLegalesController],
  providers: [CasosLegalesService],
  exports: [CasosLegalesService],
})
export class CasosLegalesModule {}
