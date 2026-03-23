import { Injectable, Logger } from '@nestjs/common';
import { ReportesService } from '../reportes/reportes.service';
import { matchIntent } from './intents/intent-matcher';
import { validateContent } from './guards/content-guard';

export interface RespuestaAsistente {
  respuesta: string;
  fuente: 'clasico' | 'ia';
  intent?: string;
}

@Injectable()
export class AsistenteIaService {
  private readonly logger = new Logger(AsistenteIaService.name);

  constructor(private readonly reportes: ReportesService) {}

  async preguntar(
    pregunta: string,
    modoAvanzado: boolean,
  ): Promise<RespuestaAsistente> {
    // 1. Content guard
    const guardResult = validateContent(pregunta);
    if (!guardResult.allowed) {
      return { respuesta: guardResult.reason!, fuente: 'clasico' };
    }

    // 2. Classic mode: intent matching
    const match = matchIntent(pregunta);
    if (match) {
      const respuesta = await this.resolveIntent(match.resolverKey);
      return { respuesta, fuente: 'clasico', intent: match.id };
    }

    // 3. If modoAvanzado requested → placeholder for K.3
    if (modoAvanzado) {
      return {
        respuesta: 'El modo avanzado con IA está en desarrollo. Por ahora solo puedo responder con datos del sistema.',
        fuente: 'clasico',
      };
    }

    // 4. No match
    return {
      respuesta:
        'No encontré información para esa pregunta. Intenta con algo como "¿Cuántos asociados hay?" o escribe **ayuda** para ver lo que puedo hacer.',
      fuente: 'clasico',
    };
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
