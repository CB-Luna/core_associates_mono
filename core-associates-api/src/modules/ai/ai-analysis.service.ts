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

    // Read provider/model from config
    const aiConfig = await this.aiService.getConfig('document_analyzer');

    // Create or reset analysis record
    const analisis = existing
      ? await this.prisma.analisisDocumento.update({
          where: { id: existing.id },
          data: { estado: 'procesando', errorMsg: null, datosExtraidos: Prisma.DbNull },
        })
      : await this.prisma.analisisDocumento.create({
          data: {
            documentoId,
            provider: aiConfig.provider,
            modelo: aiConfig.model,
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

      // Read current provider/model for the finished record
      const finishedConfig = await this.aiService.getConfig('document_analyzer');

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
          provider: finishedConfig.provider,
          modelo: finishedConfig.model,
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
   * Human-readable labels for critical validation keys.
   */
  private readonly VALIDATION_LABELS: Record<string, string> = {
    es_ine_valida: 'El documento no parece ser una credencial INE válida',
    es_ine_reverso: 'El documento no parece ser el reverso de una credencial INE',
    es_selfie_valida: 'La selfie no cumple con los requisitos (rostro visible, buena iluminación)',
    es_tarjeta_circulacion: 'El documento no parece ser una tarjeta de circulación',
    imagen_legible: 'La imagen no es legible, por favor sube una foto más clara',
  };

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
      // Auto-reject — build user-friendly messages
      const motivos: string[] = [];
      if (hasCriticalFailure) {
        const failed = criticalKeys.filter((k) => validaciones[k] === false);
        const friendlyMessages = failed.map((k) => this.VALIDATION_LABELS[k] || k);
        motivos.push(...friendlyMessages);
      }
      if (confianza < umbralRechazo) {
        motivos.push('La calidad o claridad de la imagen es insuficiente');
      }

      // Delete S3 file on auto-rejection so user must re-upload
      const doc = await this.prisma.documento.findUnique({
        where: { id: documentoId },
        select: { s3Bucket: true, s3Key: true },
      });
      if (doc) {
        await this.storage.deleteFile(doc.s3Bucket, doc.s3Key).catch(() => {});
      }

      await this.prisma.documento.update({
        where: { id: documentoId },
        data: {
          estado: 'rechazado',
          motivoRechazo: motivos.join('. '),
          s3Key: doc ? '' : undefined,
          fechaRevision: new Date(),
        },
      });
      this.logger.log(`Document ${documentoId} auto-rejected: ${motivos.join('. ')}`);
      return;
    }

    // AI never auto-approves — always leave for human review (pendiente)
    this.logger.log(`Document ${documentoId} pre-validated OK, left for human review: confidence=${(confianza * 100).toFixed(0)}%`);
  }
}
