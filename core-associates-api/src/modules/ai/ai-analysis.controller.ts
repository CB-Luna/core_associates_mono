import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiAnalysisService } from './ai-analysis.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('AI Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai/analysis')
export class AiAnalysisController {
  constructor(private readonly analysisService: AiAnalysisService) {}

  @Post('document/:documentoId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Analizar documento con IA (admin/operador trigger manual)' })
  @ApiResponse({ status: 201, description: 'Análisis iniciado' })
  async analyzeDocument(@Param('documentoId') documentoId: string) {
    return this.analysisService.analyzeDocument(documentoId);
  }

  @Post('document/:documentoId/reanalyze')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Re-analizar documento con IA' })
  async reanalyzeDocument(@Param('documentoId') documentoId: string) {
    return this.analysisService.reanalyzeDocument(documentoId);
  }

  @Get('document/:documentoId')
  @ApiOperation({ summary: 'Obtener análisis de un documento' })
  async getDocumentAnalysis(@Param('documentoId') documentoId: string) {
    return this.analysisService.getAnalysis(documentoId);
  }

  @Get('asociado/:asociadoId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @ApiOperation({ summary: 'Obtener todos los análisis de un asociado' })
  async getAsociadoAnalyses(@Param('asociadoId') asociadoId: string) {
    return this.analysisService.getAnalysesByAsociado(asociadoId);
  }

  @Get('mis-analisis')
  @ApiOperation({ summary: 'Obtener mis análisis (asociado)' })
  async getMyAnalyses(@CurrentUser('id') asociadoId: string) {
    return this.analysisService.getAnalysesByAsociado(asociadoId);
  }
}
