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
  private getPromptForType(tipo: string, nivelRigurosidad: number = 2): string {
    switch (tipo) {
      case 'ine_frente':
        return INE_FRENTE_PROMPT;
      case 'ine_reverso':
        return INE_REVERSO_PROMPT;
      case 'tarjeta_circulacion':
        return TARJETA_CIRCULACION_PROMPT;
      case 'selfie':
        return SELFIE_PROMPT(nivelRigurosidad);
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

      // Get nivelRigurosidad from config
      const docConfig = await this.prisma.configuracionIA.findUnique({
        where: { clave: 'document_analyzer' },
      }).catch(() => null);
      const nivelRigurosidad = docConfig?.nivelRigurosidad ?? 2;

      const prompt = this.getPromptForType(tipo, nivelRigurosidad);

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

      // Cross-validate extracted data against registered associate/vehicle info
      await this.crossValidateData(analisis.documentoId, tipo, data);

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
   * Normalize a name string for fuzzy comparison: lowercase, strip accents, collapse spaces.
   */
  private normalizeName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if two name strings match (fuzzy: checks if all words from the shorter name
   * appear in the longer one, allowing partial matches).
   */
  private namesMatch(extracted: string, registered: string): boolean {
    const a = this.normalizeName(extracted);
    const b = this.normalizeName(registered);
    if (!a || !b) return true; // can't compare empty
    const wordsA = a.split(' ').filter(Boolean);
    const wordsB = b.split(' ').filter(Boolean);
    const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB;
    const longer = wordsA.length <= wordsB.length ? wordsB : wordsA;
    const matched = shorter.filter((w) => longer.some((l) => l.includes(w) || w.includes(l)));
    return matched.length >= Math.ceil(shorter.length * 0.6);
  }

  /**
   * Cross-validate AI-extracted data against the associate's registered info.
   * Updates the analisis record with cross-validation results (warns, doesn't block).
   */
  private async crossValidateData(documentoId: string, tipo: string, aiData: any) {
    const campos = aiData.campos || {};
    const validaciones: Record<string, boolean> = aiData.validaciones || {};
    const warnings: string[] = [];

    try {
      const doc = await this.prisma.documento.findUnique({
        where: { id: documentoId },
        select: { asociadoId: true },
      });
      if (!doc?.asociadoId) return;

      // INE front: compare name fields with associate
      if (tipo === 'ine_frente') {
        const asociado = await this.prisma.asociado.findUnique({
          where: { id: doc.asociadoId },
          select: { nombre: true, apellidoPat: true, apellidoMat: true },
        });
        if (asociado) {
          const ineNombre = campos.nombre?.valor || campos.nombre_completo?.valor || '';
          const ineApPat = campos.apellido_paterno?.valor || '';
          const ineApMat = campos.apellido_materno?.valor || '';

          if (ineApPat && asociado.apellidoPat && !this.namesMatch(ineApPat, asociado.apellidoPat)) {
            warnings.push(`Apellido paterno INE "${ineApPat}" no coincide con el registrado "${asociado.apellidoPat}"`);
            validaciones['coincide_apellido_paterno'] = false;
          } else if (ineApPat) {
            validaciones['coincide_apellido_paterno'] = true;
          }

          if (ineApMat && asociado.apellidoMat && !this.namesMatch(ineApMat, asociado.apellidoMat)) {
            warnings.push(`Apellido materno INE "${ineApMat}" no coincide con el registrado "${asociado.apellidoMat}"`);
            validaciones['coincide_apellido_materno'] = false;
          } else if (ineApMat && asociado.apellidoMat) {
            validaciones['coincide_apellido_materno'] = true;
          }

          if (ineNombre && asociado.nombre && !this.namesMatch(ineNombre, asociado.nombre)) {
            warnings.push(`Nombre INE "${ineNombre}" no coincide con el registrado "${asociado.nombre}"`);
            validaciones['coincide_nombre'] = false;
          } else if (ineNombre) {
            validaciones['coincide_nombre'] = true;
          }
        }
      }

      // Tarjeta de circulación: compare vehicle data
      if (tipo === 'tarjeta_circulacion') {
        const vehiculos = await this.prisma.vehiculo.findMany({
          where: { asociadoId: doc.asociadoId },
          select: { marca: true, modelo: true, anio: true, placas: true, color: true },
        });
        if (vehiculos.length > 0) {
          const tcPlacas = (campos.placas?.valor || '').replace(/[-\s]/g, '').toUpperCase();
          const tcMarca = this.normalizeName(campos.marca?.valor || '');
          const tcModelo = this.normalizeName(campos.modelo?.valor || '');
          const tcAnio = parseInt(campos.anio_modelo?.valor || '0', 10);

          // Try to find a matching registered vehicle
          const matchedVehicle = vehiculos.find((v) => {
            const regPlacas = (v.placas || '').replace(/[-\s]/g, '').toUpperCase();
            return tcPlacas && regPlacas && regPlacas === tcPlacas;
          });

          if (tcPlacas && !matchedVehicle) {
            const regPlacas = vehiculos.map((v) => v.placas).join(', ');
            warnings.push(`Placas en tarjeta "${campos.placas?.valor}" no coinciden con las registradas (${regPlacas})`);
            validaciones['coincide_placas'] = false;
          } else if (tcPlacas) {
            validaciones['coincide_placas'] = true;
          }

          // If matched by plates, also check marca/modelo/año
          const refVehicle = matchedVehicle || vehiculos[0];
          if (tcMarca && refVehicle.marca && !this.namesMatch(tcMarca, refVehicle.marca)) {
            warnings.push(`Marca en tarjeta "${campos.marca?.valor}" no coincide con la registrada "${refVehicle.marca}"`);
            validaciones['coincide_marca'] = false;
          } else if (tcMarca) {
            validaciones['coincide_marca'] = true;
          }

          if (tcAnio && refVehicle.anio && tcAnio !== refVehicle.anio) {
            warnings.push(`Año modelo en tarjeta "${tcAnio}" no coincide con el registrado "${refVehicle.anio}"`);
            validaciones['coincide_anio'] = false;
          } else if (tcAnio) {
            validaciones['coincide_anio'] = true;
          }
        }

        // Also compare propietario name if available
        const propietario = campos.nombre_propietario?.valor || '';
        if (propietario) {
          const asociado = await this.prisma.asociado.findUnique({
            where: { id: doc.asociadoId },
            select: { nombre: true, apellidoPat: true, apellidoMat: true },
          });
          if (asociado) {
            const fullName = `${asociado.nombre} ${asociado.apellidoPat} ${asociado.apellidoMat || ''}`;
            if (!this.namesMatch(propietario, fullName)) {
              warnings.push(`Propietario en tarjeta "${propietario}" no coincide con el asociado "${fullName.trim()}"`);
              validaciones['coincide_propietario'] = false;
            } else {
              validaciones['coincide_propietario'] = true;
            }
          }
        }
      }

      // Update analysis with cross-validation data
      if (warnings.length > 0) {
        this.logger.warn(`Cross-validation warnings for doc ${documentoId}: ${warnings.join('; ')}`);
        // Store warnings in validaciones JSON (no separate observaciones field, avoid migration)
        (validaciones as any)['_cross_validation_warnings'] = warnings;
        await this.prisma.analisisDocumento.update({
          where: { documentoId },
          data: { validaciones },
        });
        aiData.validaciones = validaciones;
      } else if (Object.keys(validaciones).some((k) => k.startsWith('coincide_'))) {
        // All cross-checks passed — update validaciones
        await this.prisma.analisisDocumento.update({
          where: { documentoId },
          data: { validaciones },
        });
        aiData.validaciones = validaciones;
      }
    } catch (err) {
      this.logger.error(`Cross-validation error for doc ${documentoId}: ${err.message}`);
    }
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
    coincide_nombre: 'El nombre en el documento no coincide con el registrado',
    coincide_apellido_paterno: 'El apellido paterno en el documento no coincide con el registrado',
    coincide_apellido_materno: 'El apellido materno en el documento no coincide con el registrado',
    coincide_placas: 'Las placas en la tarjeta no coinciden con las del vehículo registrado',
    coincide_marca: 'La marca en la tarjeta no coincide con la del vehículo registrado',
    coincide_anio: 'El año modelo en la tarjeta no coincide con el del vehículo registrado',
    coincide_propietario: 'El nombre del propietario en la tarjeta no coincide con el del asociado',
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
    const nivelRigurosidad = config?.nivelRigurosidad ?? 2;

    // Check critical validation failures
    const criticalKeys = [
      'es_ine_valida', 'es_ine_reverso', 'es_selfie_valida',
      'es_tarjeta_circulacion', 'imagen_legible',
    ];
    const hasCriticalFailure = criticalKeys.some(
      (key) => validaciones[key] === false,
    );

    // Check cross-validation failures based on nivelRigurosidad
    const crossKeys = [
      'coincide_nombre', 'coincide_apellido_paterno', 'coincide_apellido_materno',
      'coincide_placas', 'coincide_marca', 'coincide_anio', 'coincide_propietario',
    ];
    const crossFailures = crossKeys.filter((key) => validaciones[key] === false);
    const crossFailureCount = crossFailures.length;

    let hasCrossFailure = false;
    if (nivelRigurosidad >= 3) {
      // Estricto: reject any cross-validation failure
      hasCrossFailure = crossFailureCount > 0;
    } else if (nivelRigurosidad >= 2) {
      // Moderado: reject if 3+ cross-validation failures
      hasCrossFailure = crossFailureCount >= 3;
    }
    // Nivel 1 (Básico): ignore cross-validation failures

    // Adjust confidence threshold for level 4
    const effectiveUmbralRechazo = nivelRigurosidad >= 4
      ? Math.max(umbralRechazo, 0.50)
      : umbralRechazo;

    if (hasCriticalFailure || hasCrossFailure || confianza < effectiveUmbralRechazo) {
      // Auto-reject — build user-friendly messages
      const motivos: string[] = [];
      if (hasCriticalFailure) {
        const failed = criticalKeys.filter((k) => validaciones[k] === false);
        const friendlyMessages = failed.map((k) => this.VALIDATION_LABELS[k] || k);
        motivos.push(...friendlyMessages);
      }
      if (hasCrossFailure) {
        const failedCross = crossFailures.map((k) => this.VALIDATION_LABELS[k] || k);
        motivos.push(...failedCross);
      }
      if (confianza < effectiveUmbralRechazo) {
        motivos.push('La calidad o claridad de la imagen es insuficiente');
      }

      // Delete S3 file on auto-rejection so user must re-upload
      const doc = await this.prisma.documento.findUnique({
        where: { id: documentoId },
        select: { s3Bucket: true, s3Key: true, tipo: true, asociadoId: true },
      });
      if (doc) {
        await this.storage.deleteFile(doc.s3Bucket, doc.s3Key).catch(() => {});

        // Si se rechaza la selfie, limpiar fotoUrl del asociado y borrar foto de MinIO
        if (doc.tipo === 'selfie' && doc.asociadoId) {
          const asociado = await this.prisma.asociado.findUnique({
            where: { id: doc.asociadoId },
            select: { fotoUrl: true },
          });
          if (asociado?.fotoUrl) {
            await this.storage.deleteFile('core-associates-fotos', asociado.fotoUrl).catch(() => {});
          }
          await this.prisma.asociado.update({
            where: { id: doc.asociadoId },
            data: { fotoUrl: null },
          });
        }
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
