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
   * After completing, auto-approve/reject the document based on AI confidence thresholds.
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
      const analisis = await this.prisma.analisisDocumento.update({
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

      // Auto-approve/reject the document based on thresholds
      await this.autoDecideDocumento(analisis.documentoId, data);
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

  /**
   * Auto-approve or auto-reject a document based on AI confidence vs configured thresholds.
   */
  private async autoDecideDocumento(documentoId: string, aiData: any) {
    const confianza: number = aiData.confianza_global ?? 0;
    const validaciones: Record<string, boolean> = aiData.validaciones || {};

    // Get configurable thresholds
    const config = await this.prisma.configuracionIA.findUnique({
      where: { clave: 'document_analyzer' },
    }).catch(() => null);

    const umbralAprobacion = config?.umbralAutoAprobacion ?? 0.90;
    const umbralRechazo = config?.umbralAutoRechazo ?? 0.40;

    // Check critical validation failures
    const criticalKeys = [
      'es_ine_valida', 'es_ine_reverso', 'es_selfie_valida',
      'es_tarjeta_circulacion', 'imagen_legible',
    ];
    const hasCriticalFailure = criticalKeys.some(
      (key) => validaciones[key] === false,
    );

    if (hasCriticalFailure || confianza < umbralRechazo) {
      // Auto-reject
      const motivos: string[] = [];
      if (hasCriticalFailure) {
        const failed = criticalKeys.filter((k) => validaciones[k] === false);
        motivos.push(`Validación IA fallida: ${failed.join(', ')}`);
      }
      if (confianza < umbralRechazo) {
        motivos.push(`Confianza muy baja: ${(confianza * 100).toFixed(0)}%`);
      }

      await this.prisma.documento.update({
        where: { id: documentoId },
        data: {
          estado: 'rechazado',
          motivoRechazo: `[Auto-IA] ${motivos.join('. ')}`,
          fechaRevision: new Date(),
        },
      });
      this.logger.log(`Document ${documentoId} auto-rejected: ${motivos.join('. ')}`);
      return;
    }

    // All validations passed and high confidence → auto-approve
    const allValidationsPass = Object.values(validaciones).every((v) => v === true);
    if (allValidationsPass && confianza >= umbralAprobacion) {
      await this.prisma.documento.update({
        where: { id: documentoId },
        data: {
          estado: 'aprobado',
          motivoRechazo: null,
          fechaRevision: new Date(),
        },
      });
      this.logger.log(`Document ${documentoId} auto-approved: confidence=${(confianza * 100).toFixed(0)}%`);
      return;
    }

    // Between thresholds → leave as 'pendiente' for manual review
    this.logger.log(`Document ${documentoId} left for manual review: confidence=${(confianza * 100).toFixed(0)}%`);
  }
}
