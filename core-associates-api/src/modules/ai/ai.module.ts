import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiAnalysisService } from './ai-analysis.service';
import { AiAnalysisController } from './ai-analysis.controller';
import { AiConfigController } from './ai-config.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AiAnalysisController, AiConfigController],
  providers: [AiService, AiAnalysisService],
  exports: [AiService, AiAnalysisService],
})
export class AiModule {}
