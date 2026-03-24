import { Injectable, Logger } from '@nestjs/common';
import { ReportesService } from '../reportes/reportes.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { matchIntent } from './intents/intent-matcher';
import { validateContent } from './guards/content-guard';
import { buildSystemPrompt } from './prompts/system-prompt';

export interface RespuestaAsistente {
  respuesta: string;
  fuente: 'clasico' | 'ia';
  intent?: string;
}

/** Simple in-memory rate limiter: Map<userId, { count, windowStart }> */
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AsistenteIaService {
  private readonly logger = new Logger(AsistenteIaService.name);

  constructor(
    private readonly reportes: ReportesService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  async preguntar(
    pregunta: string,
    modoAvanzado: boolean,
    userId: string,
    userPermisos: string[],
  ): Promise<RespuestaAsistente> {
    // 1. Content guard
    const guardResult = validateContent(pregunta);
    if (!guardResult.allowed) {
      return { respuesta: guardResult.reason!, fuente: 'clasico' };
    }

    // 2. Classic mode: intent matching (always tried first, even in advanced mode)
    const match = matchIntent(pregunta);
    if (match) {
      const respuesta = await this.resolveIntent(match.resolverKey);
      return { respuesta, fuente: 'clasico', intent: match.id };
    }

    // 3. If modoAvanzado requested → call IA API
    if (modoAvanzado) {
      return this.askIA(pregunta, userId, userPermisos);
    }

    // 4. No match in classic mode
    return {
      respuesta:
        'No encontré información para esa pregunta. Intenta con algo como "¿Cuántos asociados hay?" o escribe **ayuda** para ver lo que puedo hacer.',
      fuente: 'clasico',
    };
  }

  // ── Advanced mode: call IA provider ──

  private async askIA(
    pregunta: string,
    userId: string,
    userPermisos: string[],
  ): Promise<RespuestaAsistente> {
    // Rate limiting
    const rateLimitResult = await this.checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      return {
        respuesta: `Has alcanzado el límite de ${rateLimitResult.limit} preguntas por hora en modo avanzado. Intenta más tarde o usa el modo clásico.`,
        fuente: 'clasico',
      };
    }

    try {
      const dataContext = await this.buildDataContext(pregunta);
      const systemPrompt = buildSystemPrompt(userPermisos, dataContext);
      const { text } = await this.aiService.chat(pregunta, systemPrompt, 'chatbot_assistant');

      if (!text.trim()) {
        return { respuesta: 'La IA no generó una respuesta. Intenta reformular tu pregunta.', fuente: 'ia' };
      }

      return { respuesta: text, fuente: 'ia' };
    } catch (err) {
      this.logger.error(`Error calling IA: ${err instanceof Error ? err.message : err}`);
      return {
        respuesta: 'No pude conectar con el servicio de IA en este momento. Intenta de nuevo o usa el modo clásico.',
        fuente: 'clasico',
      };
    }
  }

  /**
   * Build real-time data context from the DB based on the user's question.
   * Detects entity references (IDs, phones, names) and fetches relevant records.
   */
  private async buildDataContext(pregunta: string): Promise<string | undefined> {
    const sections: string[] = [];
    const normalized = pregunta.toLowerCase();

    // Always include summary metrics for context
    try {
      const metrics = await this.reportes.getDashboardMetrics();
      sections.push(
        `### Resumen general:\n` +
        `- Asociados: ${metrics.asociados.total} total (${metrics.asociados.activos} activos, ${metrics.asociados.pendientes} pendientes)\n` +
        `- Proveedores: ${metrics.proveedores.total} total (${metrics.proveedores.activos} activos)\n` +
        `- Cupones este mes: ${metrics.cupones.delMes}\n` +
        `- Casos legales abiertos: ${metrics.casosLegales.abiertos}\n` +
        `- Documentos pendientes: ${metrics.documentos.pendientes}`,
      );
    } catch {
      // non-critical
    }

    // Detect asociado ID pattern (ASC-0001, ASC-17, etc.)
    const ascMatch = pregunta.match(/ASC-?\s*(\d{1,5})/i);
    if (ascMatch) {
      const num = ascMatch[1].padStart(4, '0');
      const idUnico = `ASC-${num}`;
      try {
        const asociado = await this.prisma.asociado.findFirst({
          where: { idUnico },
          include: {
            vehiculos: { select: { marca: true, modelo: true, anio: true, placas: true, color: true } },
            documentos: { select: { tipo: true, estado: true, motivoRechazo: true, createdAt: true } },
            casosLegales: { select: { id: true, tipoPercance: true, estado: true, createdAt: true }, take: 5, orderBy: { createdAt: 'desc' } },
          },
        });
        if (asociado) {
          let info = `### Asociado ${asociado.idUnico}:\n` +
            `- Nombre: ${asociado.nombre} ${asociado.apellidoPat} ${asociado.apellidoMat || ''}\n` +
            `- Teléfono: ${asociado.telefono}\n` +
            `- Email: ${asociado.email || 'No registrado'}\n` +
            `- Estado: ${asociado.estado}\n` +
            `- Fecha registro: ${asociado.fechaRegistro?.toISOString().split('T')[0] || 'N/A'}`;
          if (asociado.vehiculos?.length) {
            info += `\n- Vehículos: ${asociado.vehiculos.map((v) => `${v.marca} ${v.modelo} ${v.anio} (${v.placas})`).join(', ')}`;
          }
          if (asociado.documentos?.length) {
            info += `\n- Documentos: ${asociado.documentos.map((d) => `${d.tipo}: ${d.estado}`).join(', ')}`;
          }
          if (asociado.casosLegales?.length) {
            info += `\n- Casos legales recientes: ${asociado.casosLegales.map((c) => `${c.tipoPercance} (${c.estado})`).join(', ')}`;
          }
          sections.push(info);
        } else {
          sections.push(`### Asociado ${idUnico}: No encontrado en la base de datos.`);
        }
      } catch {
        // non-critical
      }
    }

    // Detect phone number patterns (+52..., 55...)
    const phoneMatch = pregunta.match(/(?:\+52)?(\d{10})/);
    if (phoneMatch && !ascMatch) {
      const telefono = `+52${phoneMatch[1]}`;
      try {
        const asociado = await this.prisma.asociado.findUnique({
          where: { telefono },
          select: { idUnico: true, nombre: true, apellidoPat: true, estado: true, telefono: true },
        });
        if (asociado) {
          sections.push(
            `### Búsqueda por teléfono ${telefono}:\n` +
            `- ${asociado.idUnico}: ${asociado.nombre} ${asociado.apellidoPat} (${asociado.estado})`,
          );
        }
      } catch {
        // non-critical
      }
    }

    // Detect proveedor/provider queries
    if (/proveedor|proveedores|negocio|comercio|taller|restaurante/i.test(normalized)) {
      try {
        const report = await this.reportes.getReporteAvanzado();
        if (report.topProveedores?.length) {
          const top5 = report.topProveedores.slice(0, 5);
          sections.push(
            `### Top proveedores:\n` +
            top5.map((p: { razonSocial: string; cuponesEmitidos: number; cuponesCanjeados: number }, i: number) => `${i + 1}. ${p.razonSocial} — ${p.cuponesEmitidos} cupones emitidos, ${p.cuponesCanjeados} canjeados`).join('\n'),
          );
        }
      } catch {
        // non-critical
      }
    }

    // Detect caso/legal queries
    if (/caso|legal|percance|accidente|asalto|abogado/i.test(normalized)) {
      try {
        const report = await this.reportes.getReporteAvanzado();
        const porEstado = Object.entries(report.casosLegales.porEstado);
        const porTipo = Object.entries(report.casosLegales.porTipo);
        if (porEstado.length || porTipo.length) {
          let info = '### Casos legales:';
          if (porEstado.length) info += `\n- Por estado: ${porEstado.map(([e, c]) => `${e}: ${c}`).join(', ')}`;
          if (porTipo.length) info += `\n- Por tipo: ${porTipo.map(([t, c]) => `${t}: ${c}`).join(', ')}`;
          sections.push(info);
        }
      } catch {
        // non-critical
      }
    }

    // Detect cupon/coupon queries
    if (/cup[oó]n|cupones|canje|promoci[oó]n/i.test(normalized)) {
      try {
        const report = await this.reportes.getReporteAvanzado();
        const porEstado = report.cupones?.porEstado;
        if (porEstado) {
          sections.push(
            `### Cupones:\n- Por estado: ${Object.entries(porEstado).map(([e, c]) => `${e}: ${c}`).join(', ')}`,
          );
        }
      } catch {
        // non-critical
      }
    }

    return sections.length > 0 ? sections.join('\n\n') : undefined;
  }

  private async checkRateLimit(userId: string): Promise<{ allowed: boolean; limit: number }> {
    // Get configured limit
    const config = await this.prisma.configuracionIA.findUnique({
      where: { clave: 'chatbot_assistant' },
      select: { maxPreguntasPorHora: true },
    }).catch(() => null);
    const limit = config?.maxPreguntasPorHora ?? 20;

    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
      rateLimitMap.set(userId, { count: 1, windowStart: now });
      return { allowed: true, limit };
    }

    if (entry.count >= limit) {
      return { allowed: false, limit };
    }

    entry.count++;
    return { allowed: true, limit };
  }

  // ── Intent resolvers (use ReportesService directly) ──

  private async resolveIntent(key: string): Promise<string> {
    switch (key) {
      case 'count_asociados': {
        const d = await this.reportes.getDashboardMetrics();
        return `Hay **${d.asociados.total}** asociados registrados (${d.asociados.activos} activos, ${d.asociados.pendientes} pendientes).`;
      }
      case 'asociados_activos': {
        const d = await this.reportes.getDashboardMetrics();
        return `Hay **${d.asociados.activos}** asociados activos de un total de ${d.asociados.total}.`;
      }
      case 'asociados_pendientes': {
        const d = await this.reportes.getDashboardMetrics();
        return `Hay **${d.asociados.pendientes}** asociados pendientes de aprobación.`;
      }
      case 'count_proveedores': {
        const d = await this.reportes.getDashboardMetrics();
        return `Hay **${d.proveedores.total}** proveedores registrados (${d.proveedores.activos} activos).`;
      }
      case 'compare_asociados_proveedores': {
        const d = await this.reportes.getDashboardMetrics();
        const diff = d.asociados.total - d.proveedores.total;
        if (diff > 0) return `Sí, hay **${diff} más** asociados que proveedores (${d.asociados.total} vs ${d.proveedores.total}).`;
        if (diff < 0) return `No, hay **${Math.abs(diff)} más** proveedores que asociados (${d.proveedores.total} vs ${d.asociados.total}).`;
        return `Hay exactamente la misma cantidad: **${d.asociados.total}** asociados y proveedores.`;
      }
      case 'top_proveedor': {
        const r = await this.reportes.getReporteAvanzado();
        if (!r.topProveedores?.length) return 'No hay datos de proveedores aún.';
        const top = r.topProveedores[0];
        return `El proveedor con más actividad es **${top.razonSocial}** con ${top.cuponesEmitidos} cupones emitidos y ${top.cuponesCanjeados} canjeados.`;
      }
      case 'cupones_mes': {
        const d = await this.reportes.getDashboardMetrics();
        return `Se han generado **${d.cupones.delMes}** cupones este mes.`;
      }
      case 'cupones_canjeados': {
        const r = await this.reportes.getReporteAvanzado();
        const canjeados = r.cupones.porEstado?.['canjeado'] ?? 0;
        return `Se han canjeado **${canjeados}** cupones en el período.`;
      }
      case 'casos_abiertos': {
        const d = await this.reportes.getDashboardMetrics();
        return `Hay **${d.casosLegales.abiertos}** casos legales abiertos (incluye en atención y escalados).`;
      }
      case 'casos_por_estado': {
        const r = await this.reportes.getReporteAvanzado();
        const entries = Object.entries(r.casosLegales.porEstado);
        if (!entries.length) return 'No hay casos legales registrados.';
        const lines = entries.map(([estado, count]) => `• ${estado}: **${count}**`);
        return `Desglose de casos por estado:\n${lines.join('\n')}`;
      }
      case 'casos_por_tipo': {
        const r = await this.reportes.getReporteAvanzado();
        const entries = Object.entries(r.casosLegales.porTipo);
        if (!entries.length) return 'No hay casos legales registrados.';
        const lines = entries.map(([tipo, count]) => `• ${tipo}: **${count}**`);
        return `Desglose de casos por tipo de percance:\n${lines.join('\n')}`;
      }
      case 'docs_pendientes': {
        const d = await this.reportes.getDashboardMetrics();
        return `Hay **${d.documentos.pendientes}** documentos pendientes de revisión.`;
      }
      case 'saludo':
        return '¡Hola! 👋 Soy el asistente de Core Associates. Puedo ayudarte con información sobre asociados, proveedores, cupones, casos legales y más. ¿Qué necesitas saber?';
      case 'ayuda':
        return `Puedo responder preguntas como:\n• ¿Cuántos asociados hay?\n• ¿Cuántos casos abiertos tengo?\n• ¿Cuántos cupones se generaron este mes?\n• ¿Cuál es el mejor proveedor?\n• ¿Cuántos documentos pendientes hay?\n• Desglose de casos por estado\n\nEscribe tu pregunta en lenguaje natural.`;
      default:
        this.logger.warn(`Resolver key no encontrada: ${key}`);
        return 'No pude procesar esa consulta. Intenta con otro tema.';
    }
  }
}
