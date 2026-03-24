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

// ── Conversation history (in-memory, per userId) ──
interface HistoryMessage { role: 'user' | 'assistant'; content: string }
interface ConversationEntry { messages: HistoryMessage[]; lastAccess: number }
const conversationMap = new Map<string, ConversationEntry>();
const CONVERSATION_TTL_MS = 30 * 60 * 1000; // 30 min
const MAX_HISTORY_MESSAGES = 10; // 5 pairs

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
    _modoAvanzado: boolean,
    userId: string,
    userPermisos: string[],
  ): Promise<RespuestaAsistente> {
    // 1. Content guard
    const guardResult = validateContent(pregunta);
    if (!guardResult.allowed) {
      return { respuesta: guardResult.reason!, fuente: 'clasico' };
    }

    // Save user message to history
    this.addToHistory(userId, 'user', pregunta);

    // 2. Entity resolver (direct DB lookup — no AI tokens)
    const entityResult = await this.resolveEntityQuery(pregunta);
    if (entityResult) {
      this.addToHistory(userId, 'assistant', entityResult);
      return { respuesta: entityResult, fuente: 'clasico', intent: 'entity_lookup' };
    }

    // 3. Classic mode: intent matching (always tried first)
    const match = matchIntent(pregunta);
    if (match) {
      const respuesta = await this.resolveIntent(match.resolverKey);
      this.addToHistory(userId, 'assistant', respuesta);
      return { respuesta, fuente: 'clasico', intent: match.id };
    }

    // 4. Auto-escalate to IA if user has permission (no toggle needed)
    const puedeAvanzado = userPermisos.includes('asistente:modo-avanzado');
    if (puedeAvanzado) {
      const result = await this.askIA(pregunta, userId, userPermisos);
      this.addToHistory(userId, 'assistant', result.respuesta);
      return result;
    }

    // 5. No match in classic mode and no AI permission
    const fallback =
      'No encontré información para esa pregunta. Intenta con algo como "¿Cuántos asociados hay?", un ID como **ASC-0017**, o escribe **ayuda** para ver lo que puedo hacer.';
    this.addToHistory(userId, 'assistant', fallback);
    return { respuesta: fallback, fuente: 'clasico' };
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
        respuesta: `Has alcanzado el límite de ${rateLimitResult.limit} preguntas por hora con IA. Intenta más tarde o haz preguntas directas como "¿Cuántos asociados hay?".`,
        fuente: 'clasico',
      };
    }

    try {
      const dataContext = await this.buildDataContext(pregunta);

      // Build conversation context from history (exclude current question)
      const history = this.getHistory(userId);
      const previousMessages = history.slice(0, -1);
      let conversationContext: string | undefined;
      if (previousMessages.length > 0) {
        conversationContext = previousMessages
          .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
          .join('\n');
      }

      const systemPrompt = buildSystemPrompt(userPermisos, dataContext, conversationContext);
      const { text } = await this.aiService.chat(pregunta, systemPrompt, 'chatbot_assistant');

      if (!text.trim()) {
        return { respuesta: 'La IA no generó una respuesta. Intenta reformular tu pregunta.', fuente: 'ia' };
      }

      return { respuesta: text, fuente: 'ia' };
    } catch (err) {
      this.logger.error(`Error calling IA: ${err instanceof Error ? err.message : err}`);
      return {
        respuesta: 'No pude conectar con el servicio de IA en este momento. Intenta de nuevo en unos minutos.',
        fuente: 'clasico',
      };
    }
  }

  // ── Conversation history helpers ──

  private addToHistory(userId: string, role: 'user' | 'assistant', content: string) {
    this.cleanExpiredConversations();
    const entry = conversationMap.get(userId) || { messages: [], lastAccess: Date.now() };
    entry.messages.push({ role, content });
    if (entry.messages.length > MAX_HISTORY_MESSAGES) {
      entry.messages = entry.messages.slice(-MAX_HISTORY_MESSAGES);
    }
    entry.lastAccess = Date.now();
    conversationMap.set(userId, entry);
  }

  private getHistory(userId: string): HistoryMessage[] {
    const entry = conversationMap.get(userId);
    if (!entry) return [];
    if (Date.now() - entry.lastAccess > CONVERSATION_TTL_MS) {
      conversationMap.delete(userId);
      return [];
    }
    return entry.messages;
  }

  private cleanExpiredConversations() {
    const now = Date.now();
    for (const [key, entry] of conversationMap) {
      if (now - entry.lastAccess > CONVERSATION_TTL_MS) {
        conversationMap.delete(key);
      }
    }
  }

  // ── Entity resolver: direct DB lookups (classic mode, zero AI tokens) ──

  private async resolveEntityQuery(pregunta: string): Promise<string | null> {
    // 1. ASC-XXXX direct lookup
    const ascMatch = pregunta.match(/ASC-?\s*(\d{1,5})/i);
    if (ascMatch) {
      const num = ascMatch[1].padStart(4, '0');
      return this.lookupAsociado(`ASC-${num}`);
    }

    // 2. PRV-XXXX direct lookup
    const prvMatch = pregunta.match(/PRV-?\s*(\d{1,5})/i);
    if (prvMatch) {
      const num = prvMatch[1].padStart(4, '0');
      return this.lookupProveedor(`PRV-${num}`);
    }

    // 3. Phone number lookup (10-digit, optional +52)
    const phoneMatch = pregunta.match(/(?:\+52)?(\d{10})/);
    if (phoneMatch) {
      return this.lookupByPhone(phoneMatch[1]);
    }

    // 4. Name search: "quien es [nombre]", "buscar asociado [nombre]", etc.
    const namePatterns = [
      /(?:quien|quién)\s+es\s+(?:el\s+)?(?:asociado\s+)?(.{3,})/i,
      /busca(?:r)?\s+(?:al?\s+)?(?:asociado\s+)?(.{3,})/i,
      /datos?\s+(?:del?\s+)?(?:asociado\s+)?(.{3,})/i,
      /informaci[oó]n\s+(?:del?\s+)?(?:asociado\s+)?(.{3,})/i,
    ];

    // 5. Phone-by-name: "teléfono de Ana García", "dame el número de Juan"
    const phoneByNamePatterns = [
      /(?:tel[eé]fono|numero|n[uú]mero|celular|tel)\s+(?:de(?:l)?\s+)?(?:(?:el|la|los)\s+)?(?:asociado\s+)?(.{3,})/i,
      /(?:dame|dime|cu[aá]l\s+es)\s+(?:el\s+)?(?:tel[eé]fono|numero|n[uú]mero|celular)\s+(?:de(?:l)?\s+)?(?:(?:el|la)\s+)?(?:asociado\s+)?(.{3,})/i,
    ];
    for (const pattern of phoneByNamePatterns) {
      const match = pregunta.match(pattern);
      if (match) {
        const name = match[1].trim().replace(/[?¿!¡.,"]/g, '').trim();
        if (name.length >= 3 && !/^\d+$/.test(name)) {
          return this.searchPhoneByName(name);
        }
      }
    }

    for (const pattern of namePatterns) {
      const match = pregunta.match(pattern);
      if (match) {
        const name = match[1].trim().replace(/[?¿!¡.,"]/g, '').trim();
        if (name.length >= 3 && !/^\d+$/.test(name)) {
          return this.searchAsociadoByName(name);
        }
      }
    }

    return null;
  }

  private async lookupAsociado(idUnico: string): Promise<string | null> {
    try {
      const a = await this.prisma.asociado.findFirst({
        where: { idUnico },
        include: {
          vehiculos: { select: { marca: true, modelo: true, anio: true, placas: true, color: true } },
          documentos: { select: { tipo: true, estado: true, motivoRechazo: true } },
          casosLegales: { select: { tipoPercance: true, estado: true, createdAt: true }, take: 5, orderBy: { createdAt: 'desc' } },
        },
      });
      if (!a) return `No se encontró ningún asociado con ID **${idUnico}**.`;
      return this.formatAsociadoResponse(a);
    } catch {
      return null;
    }
  }

  private formatAsociadoResponse(a: any): string {
    let r = `📋 **Asociado ${a.idUnico}**\n`;
    r += `- **Nombre**: ${a.nombre || ''} ${a.apellidoPat || ''} ${a.apellidoMat || ''}\n`;
    r += `- **Teléfono**: ${a.telefono}\n`;
    r += `- **Email**: ${a.email || 'No registrado'}\n`;
    r += `- **Estado**: ${a.estado}\n`;
    r += `- **Registro**: ${a.fechaRegistro?.toISOString().split('T')[0] || 'N/A'}`;
    if (a.vehiculos?.length) {
      r += `\n- **Vehículos**: ${a.vehiculos.map((v: any) => `${v.marca} ${v.modelo} ${v.anio} (${v.placas}, ${v.color})`).join('; ')}`;
    }
    if (a.documentos?.length) {
      r += `\n- **Documentos**: ${a.documentos.map((d: any) => `${d.tipo}: ${d.estado}${d.motivoRechazo ? ' (' + d.motivoRechazo + ')' : ''}`).join('; ')}`;
    }
    if (a.casosLegales?.length) {
      r += `\n- **Casos legales**: ${a.casosLegales.map((c: any) => `${c.tipoPercance} (${c.estado})`).join('; ')}`;
    }
    return r;
  }

  private async lookupProveedor(idUnico: string): Promise<string | null> {
    try {
      const p = await this.prisma.proveedor.findFirst({
        where: { idUnico },
        include: {
          promociones: { where: { estado: 'activa' }, select: { titulo: true, tipoDescuento: true, valorDescuento: true, fechaFin: true } },
          _count: { select: { cuponesEmitidos: true, cuponesCanjeados: true } },
        },
      });
      if (!p) return `No se encontró ningún proveedor con ID **${idUnico}**.`;
      let r = `🏪 **Proveedor ${p.idUnico}**\n`;
      r += `- **Razón social**: ${p.razonSocial}\n`;
      r += `- **Tipo**: ${p.tipo}\n`;
      r += `- **Estado**: ${p.estado}\n`;
      r += `- **Contacto**: ${p.contactoNombre || 'N/A'} | ${p.telefono || 'Sin tel.'} | ${p.email || 'Sin email'}\n`;
      r += `- **Cupones emitidos**: ${p._count.cuponesEmitidos} | **Canjeados**: ${p._count.cuponesCanjeados}`;
      if (p.promociones?.length) {
        r += `\n- **Promociones activas**:`;
        p.promociones.forEach((pr: any) => {
          r += `\n  • ${pr.titulo} (${pr.tipoDescuento === 'porcentaje' ? pr.valorDescuento + '%' : '$' + pr.valorDescuento} — vence ${pr.fechaFin.toISOString().split('T')[0]})`;
        });
      }
      return r;
    } catch {
      return null;
    }
  }

  private async searchAsociadoByName(name: string): Promise<string | null> {
    try {
      const parts = name.split(/\s+/).filter((p) => p.length >= 2);
      if (!parts.length) return null;

      const asociados = await this.prisma.asociado.findMany({
        where: {
          OR: parts.flatMap((part) => [
            { nombre: { contains: part, mode: 'insensitive' as const } },
            { apellidoPat: { contains: part, mode: 'insensitive' as const } },
            { apellidoMat: { contains: part, mode: 'insensitive' as const } },
          ]),
        },
        select: { idUnico: true, nombre: true, apellidoPat: true, apellidoMat: true, estado: true, telefono: true },
        take: 5,
      });

      if (!asociados.length) return `No encontré asociados con el nombre **"${name}"**.`;
      if (asociados.length === 1) return this.lookupAsociado(asociados[0].idUnico);

      let r = `Encontré **${asociados.length}** asociados que coinciden con "${name}":\n`;
      asociados.forEach((a, i) => {
        r += `${i + 1}. **${a.idUnico}** — ${a.nombre} ${a.apellidoPat} ${a.apellidoMat || ''} (${a.estado})\n`;
      });
      r += `\nEscribe el ID (ej: **${asociados[0].idUnico}**) para ver el detalle completo.`;
      return r;
    } catch {
      return null;
    }
  }

  private async searchPhoneByName(name: string): Promise<string | null> {
    try {
      const parts = name.split(/\s+/).filter((p) => p.length >= 2);
      if (!parts.length) return null;

      const asociados = await this.prisma.asociado.findMany({
        where: {
          OR: parts.flatMap((part) => [
            { nombre: { contains: part, mode: 'insensitive' as const } },
            { apellidoPat: { contains: part, mode: 'insensitive' as const } },
            { apellidoMat: { contains: part, mode: 'insensitive' as const } },
          ]),
        },
        select: { idUnico: true, nombre: true, apellidoPat: true, apellidoMat: true, telefono: true, estado: true },
        take: 10,
      });

      if (!asociados.length) return `No encontré asociados con el nombre **"${name}"**.`;
      if (asociados.length === 1) {
        const a = asociados[0];
        return `📞 **${a.nombre} ${a.apellidoPat} ${a.apellidoMat || ''}** (${a.idUnico})\n- Teléfono: **${a.telefono}**\n- Estado: ${a.estado}`;
      }

      let r = `Encontré **${asociados.length}** asociados que coinciden con "${name}":\n`;
      asociados.forEach((a, i) => {
        r += `${i + 1}. **${a.idUnico}** — ${a.nombre} ${a.apellidoPat} ${a.apellidoMat || ''} — Tel: **${a.telefono}** (${a.estado})\n`;
      });
      return r;
    } catch {
      return null;
    }
  }

  private async lookupByPhone(phone: string): Promise<string | null> {
    try {
      const telefono = `+52${phone}`;
      const a = await this.prisma.asociado.findUnique({
        where: { telefono },
        include: {
          vehiculos: { select: { marca: true, modelo: true, anio: true, placas: true, color: true } },
          documentos: { select: { tipo: true, estado: true } },
        },
      });
      if (!a) return `No se encontró ningún asociado con teléfono **${telefono}**.`;
      return this.formatAsociadoResponse(a);
    } catch {
      return null;
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
      case 'docs_faltantes': {
        return this.resolveDocsFaltantes();
      }
      case 'vehiculos_marca': {
        return this.resolveVehiculosMarca();
      }
      case 'asociados_rechazados': {
        const count = await this.prisma.asociado.count({ where: { estado: 'rechazado' } });
        return `Hay **${count}** asociados rechazados.`;
      }
      case 'listar_ultimos_asociados': {
        const asociados = await this.prisma.asociado.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { idUnico: true, nombre: true, apellidoPat: true, estado: true, createdAt: true },
        });
        if (!asociados.length) return 'No hay asociados registrados aún.';
        const lines = asociados.map((a, i) => `${i + 1}. **${a.idUnico}** — ${a.nombre} ${a.apellidoPat} (${a.estado}) — ${a.createdAt.toISOString().split('T')[0]}`);
        return `Últimos 5 asociados registrados:\n${lines.join('\n')}`;
      }
      case 'proveedores_activos': {
        const d = await this.reportes.getDashboardMetrics();
        return `Hay **${d.proveedores.activos}** proveedores activos de un total de ${d.proveedores.total}.`;
      }
      case 'proveedores_tipo': {
        const groups = await this.prisma.proveedor.groupBy({
          by: ['tipo'],
          _count: { id: true },
        });
        if (!groups.length) return 'No hay proveedores registrados.';
        const lines = groups.map((g) => `• ${g.tipo}: **${g._count.id}**`);
        return `Proveedores por tipo:\n${lines.join('\n')}`;
      }
      case 'promociones_activas': {
        const promos = await this.prisma.promocion.findMany({
          where: { estado: 'activa' },
          include: { proveedor: { select: { razonSocial: true } } },
          take: 10,
          orderBy: { fechaFin: 'asc' },
        });
        if (!promos.length) return 'No hay promociones activas en este momento.';
        const lines = promos.map((p, i) => `${i + 1}. **${p.titulo}** (${p.proveedor.razonSocial}) — ${p.tipoDescuento === 'porcentaje' ? p.valorDescuento + '%' : '$' + p.valorDescuento} — vence ${p.fechaFin.toISOString().split('T')[0]}`);
        return `Promociones activas (${promos.length}):\n${lines.join('\n')}`;
      }
      case 'listar_abogados': {
        const abogados = await this.prisma.usuario.findMany({
          where: { rolRef: { nombre: 'abogado' } },
          select: { nombre: true, email: true, especialidad: true, cedulaProfesional: true },
        });
        if (!abogados.length) return 'No hay abogados registrados en el sistema.';
        const lines = abogados.map((a, i) => `${i + 1}. **${a.nombre}** — ${a.especialidad || 'General'} | Cédula: ${a.cedulaProfesional || 'N/A'}`);
        return `Abogados registrados (${abogados.length}):\n${lines.join('\n')}`;
      }
      case 'resumen_general': {
        const d = await this.reportes.getDashboardMetrics();
        return `📊 **Resumen general de la plataforma:**\n` +
          `- Asociados: **${d.asociados.total}** total (${d.asociados.activos} activos, ${d.asociados.pendientes} pendientes)\n` +
          `- Proveedores: **${d.proveedores.total}** total (${d.proveedores.activos} activos)\n` +
          `- Cupones este mes: **${d.cupones.delMes}**\n` +
          `- Casos legales abiertos: **${d.casosLegales.abiertos}**\n` +
          `- Documentos pendientes: **${d.documentos.pendientes}**`;
      }
      case 'saludo':
        return '¡Hola! 👋 Soy el asistente de Core Associates. Puedo ayudarte con información sobre asociados, proveedores, cupones, casos legales y más. ¿Qué necesitas saber?';
      case 'ayuda':
        return `Puedo responder preguntas como:\n` +
          `• ¿Cuántos asociados hay? / asociados activos / pendientes / rechazados\n` +
          `• Últimos asociados registrados\n` +
          `• ¿Quién es ASC-0017? (buscar por ID)\n` +
          `• Buscar asociado Abraham Domínguez (buscar por nombre)\n` +
          `• Teléfono de Ana García (buscar teléfono por nombre)\n` +
          `• ¿Cuántos proveedores hay? / proveedores por tipo\n` +
          `• Promociones activas\n` +
          `• ¿Cuántos cupones este mes? / cupones canjeados\n` +
          `• Casos abiertos / desglose por estado / por tipo\n` +
          `• Abogados disponibles\n` +
          `• Documentos pendientes / faltantes\n` +
          `• ¿Quiénes no han subido la INE? / ¿sin selfie?\n` +
          `• Asociados con Toyota / Nissan (vehículos por marca)\n` +
          `• Resumen general / dashboard\n\n` +
          `Escribe tu pregunta en lenguaje natural, o usa un ID como **ASC-0017** o **PRV-0001** para consultar directamente.`;
      default:
        this.logger.warn(`Resolver key no encontrada: ${key}`);
        return 'No pude procesar esa consulta. Intenta con otro tema.';
    }
  }

  // ── New resolvers for docs faltantes and vehiculos por marca ──

  private async resolveDocsFaltantes(): Promise<string> {
    const docTypes = ['ine_frente', 'ine_reverso', 'selfie', 'tarjeta_circulacion'];
    const labels: Record<string, string> = {
      ine_frente: 'INE Frente',
      ine_reverso: 'INE Reverso',
      selfie: 'Selfie',
      tarjeta_circulacion: 'Tarjeta de Circulación',
    };

    try {
      const totalAsociados = await this.prisma.asociado.count({
        where: { estado: { in: ['activo', 'pendiente'] } },
      });

      const lines: string[] = [];
      for (const tipo of docTypes) {
        const conDoc = await this.prisma.documento.groupBy({
          by: ['asociadoId'],
          where: {
            tipo: tipo as any,
            estado: { in: ['pendiente', 'aprobado'] },
            asociado: { estado: { in: ['activo', 'pendiente'] } },
          },
        });
        const sinDoc = totalAsociados - conDoc.length;
        lines.push(`• **${labels[tipo]}**: ${sinDoc} asociados sin subir (${conDoc.length} ya subieron)`);
      }

      return `📋 **Documentos faltantes** (de ${totalAsociados} asociados activos/pendientes):\n${lines.join('\n')}`;
    } catch {
      return 'No pude obtener la información de documentos faltantes.';
    }
  }

  private async resolveVehiculosMarca(): Promise<string> {
    try {
      const groups = await this.prisma.vehiculo.groupBy({
        by: ['marca'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      });

      if (!groups.length) return 'No hay vehículos registrados en el sistema.';

      const total = groups.reduce((sum, g) => sum + g._count.id, 0);
      const lines = groups.map((g, i) => `${i + 1}. **${g.marca}**: ${g._count.id} vehículo(s)`);
      return `🚘 **Vehículos por marca** (${total} total):\n${lines.join('\n')}`;
    } catch {
      return 'No pude obtener la información de vehículos por marca.';
    }
  }
}
