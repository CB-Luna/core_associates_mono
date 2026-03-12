import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from './ai.service';
import { INE_FRENTE_PROMPT, INE_REVERSO_PROMPT } from './prompts/ine-prompt';
import { TARJETA_CIRCULACION_PROMPT } from './prompts/vehicle-prompt';
import { SELFIE_PROMPT } from './prompts/selfie-prompt';

const BUCKET = 'core-associates-documents';

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Get the appropriate prompt for a document type.
   */
  private getPromptForType(tipo: string): string {
    switch (tipo) {
      case 'ine_frente':
        return INE_FRENTE_PROMPT;
      case 'ine_reverso':
        return INE_REVERSO_PROMPT;
      case 'tarjeta_circulacion':
        return TARJETA_CIRCULACION_PROMPT;
      case 'selfie':
        return SELFIE_PROMPT;
      default:
        return 'Analiza este documento y extrae toda la información relevante. Responde con JSON.';
    }
  }

  /**
   * Trigger AI analysis for a document. Creates the record and runs async.
   */
  async analyzeDocument(documentoId: string): Promise<{ analisisId: string }> {
    const doc = await this.prisma.documento.findUnique({
      where: { id: documentoId },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');

    // Check if analysis already exists
    const existing = await this.prisma.analisisDocumento.findUnique({
      where: { documentoId },
    });
    if (existing && existing.estado === 'completado') {
      return { analisisId: existing.id };
    }

    // Create or reset analysis record
    const analisis = existing
      ? await this.prisma.analisisDocumento.update({
          where: { id: existing.id },
          data: { estado: 'procesando', errorMsg: null, datosExtraidos: Prisma.DbNull },
        })
      : await this.prisma.analisisDocumento.create({
          data: {
            documentoId,
            provider: 'anthropic',
            modelo: 'claude-sonnet-4-5-20250929',
            estado: 'procesando',
          },
        });

    // Run analysis asynchronously
    this.runAnalysis(analisis.id, doc.s3Bucket, doc.s3Key, doc.contentType, doc.tipo).catch(
      (err) => this.logger.error(`Analysis failed for ${documentoId}: ${err.message}`),
    );

    return { analisisId: analisis.id };
  }

  /**
   * Run the actual AI analysis (async, fire-and-forget).
   */
  private async runAnalysis(
    analisisId: string,
    s3Bucket: string,
    s3Key: string,
    contentType: string,
    tipo: string,
  ) {
    try {
      // Get file from MinIO
      const buffer = await this.storage.getFile(s3Bucket, s3Key);
      const prompt = this.getPromptForType(tipo);

      // Send to Claude
      const { data, tokens, timeMs } = await this.aiService.analyzeImage(
        buffer,
        contentType,
        prompt,
      );

      // Update analysis record
      await this.prisma.analisisDocumento.update({
        where: { id: analisisId },
        data: {
          estado: 'completado',
          datosExtraidos: data.campos || data,
          confianza: data.confianza_global ?? null,
          validaciones: data.validaciones || Prisma.DbNull,
          tokensUsados: tokens,
          tiempoMs: timeMs,
          modelo: 'claude-sonnet-4-5-20250929',
        },
      });

      this.logger.log(`Analysis ${analisisId} completed: confidence=${data.confianza_global}`);
    } catch (err) {
      this.logger.error(`Analysis ${analisisId} error: ${err.message}`);
      await this.prisma.analisisDocumento.update({
        where: { id: analisisId },
        data: {
          estado: 'error',
          errorMsg: err.message || 'Error desconocido',
        },
      });
    }
  }

  /**
   * Get analysis result for a document.
   */
  async getAnalysis(documentoId: string) {
    const analisis = await this.prisma.analisisDocumento.findUnique({
      where: { documentoId },
    });
    if (!analisis) return null;
    return analisis;
  }

  /**
   * Get all analyses for an asociado (via their documents).
   */
  async getAnalysesByAsociado(asociadoId: string) {
    return this.prisma.analisisDocumento.findMany({
      where: {
        documento: { asociadoId },
      },
      include: {
        documento: {
          select: { id: true, tipo: true, estado: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Re-analyze a document (force re-run).
   */
  async reanalyzeDocument(documentoId: string) {
    // Delete existing analysis
    await this.prisma.analisisDocumento.deleteMany({
      where: { documentoId },
    });
    return this.analyzeDocument(documentoId);
  }
}
