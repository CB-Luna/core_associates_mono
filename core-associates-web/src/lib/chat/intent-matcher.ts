import { apiClient } from '@/lib/api-client';

/* ── Tipos ── */

interface Intent {
  id: string;
  keywords: string[][];          // OR groups of AND keywords — match any group
  handler: () => Promise<string>;
}

interface MatchResult {
  intent: string;
  respuesta: string;
  source: 'clasico';
}

/* ── Helpers ── */

/** Remove accents and lowercase */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function containsAll(text: string, words: string[]): boolean {
  return words.every((w) => text.includes(w));
}

/* ── Cache (avoid hammering the API on every message) ── */

interface CacheEntry<T> { data: T; ts: number }
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60_000; // 1 min

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  const data = await fetcher();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

/* ── API Types (inlined, only what we need) ── */

interface DashboardMetrics {
  asociados: { total: number; activos: number; pendientes: number; suspendidos: number };
  proveedores: { total: number; activos: number };
  cupones: { delMes: number };
  casosLegales: { abiertos: number };
  documentos: { pendientes: number };
}

interface ReporteAvanzado {
  asociados: { registrados: number; porEstado: Record<string, number> };
  cupones: { generados: number; porEstado: Record<string, number> };
  casosLegales: { porTipo: Record<string, number>; porEstado: Record<string, number> };
  topProveedores: Array<{ razonSocial: string; cuponesEmitidos: number; cuponesCanjeados: number }>;
}

/* ── Fetchers ── */

const fetchDashboard = () =>
  cached('dashboard', () => apiClient<DashboardMetrics>('/reportes/dashboard'));

const fetchAvanzado = () =>
  cached('avanzado', () => apiClient<ReporteAvanzado>('/reportes/avanzado'));

/* ── Registro de intents ── */

const intents: Intent[] = [
  // ── Asociados ─────────────────────────────────────
  {
    id: 'count_asociados',
    keywords: [['cuantos', 'asociados'], ['total', 'asociados'], ['numero', 'asociados']],
    handler: async () => {
      const d = await fetchDashboard();
      return `Hay **${d.asociados.total}** asociados registrados (${d.asociados.activos} activos, ${d.asociados.pendientes} pendientes).`;
    },
  },
  {
    id: 'asociados_activos',
    keywords: [['asociados', 'activos']],
    handler: async () => {
      const d = await fetchDashboard();
      return `Hay **${d.asociados.activos}** asociados activos de un total de ${d.asociados.total}.`;
    },
  },
  {
    id: 'asociados_pendientes',
    keywords: [['asociados', 'pendientes']],
    handler: async () => {
      const d = await fetchDashboard();
      return `Hay **${d.asociados.pendientes}** asociados pendientes de aprobación.`;
    },
  },

  // ── Proveedores ───────────────────────────────────
  {
    id: 'count_proveedores',
    keywords: [['cuantos', 'proveedores'], ['total', 'proveedores'], ['numero', 'proveedores']],
    handler: async () => {
      const d = await fetchDashboard();
      return `Hay **${d.proveedores.total}** proveedores registrados (${d.proveedores.activos} activos).`;
    },
  },
  {
    id: 'compare_asociados_proveedores',
    keywords: [['mas', 'asociados', 'proveedores'], ['asociados', 'que', 'proveedores']],
    handler: async () => {
      const d = await fetchDashboard();
      const diff = d.asociados.total - d.proveedores.total;
      if (diff > 0) return `Sí, hay **${diff} más** asociados que proveedores (${d.asociados.total} vs ${d.proveedores.total}).`;
      if (diff < 0) return `No, hay **${Math.abs(diff)} más** proveedores que asociados (${d.proveedores.total} vs ${d.asociados.total}).`;
      return `Hay exactamente la misma cantidad: **${d.asociados.total}** asociados y proveedores.`;
    },
  },

  // ── Top proveedores ───────────────────────────────
  {
    id: 'top_proveedor_promociones',
    keywords: [
      ['proveedor', 'mas', 'promociones'],
      ['proveedor', 'mas', 'cupones'],
      ['mejor', 'proveedor'],
      ['top', 'proveedor'],
    ],
    handler: async () => {
      const r = await fetchAvanzado();
      if (!r.topProveedores?.length) return 'No hay datos de proveedores aún.';
      const top = r.topProveedores[0];
      return `El proveedor con más actividad es **${top.razonSocial}** con ${top.cuponesEmitidos} cupones emitidos y ${top.cuponesCanjeados} canjeados.`;
    },
  },

  // ── Cupones ───────────────────────────────────────
  {
    id: 'cupones_mes',
    keywords: [['cupones', 'mes'], ['cupones', 'este mes'], ['cuantos', 'cupones']],
    handler: async () => {
      const d = await fetchDashboard();
      return `Se han generado **${d.cupones.delMes}** cupones este mes.`;
    },
  },
  {
    id: 'cupones_canjeados',
    keywords: [['cupones', 'canjeados'], ['cupones', 'canjearon']],
    handler: async () => {
      const r = await fetchAvanzado();
      const canjeados = r.cupones.porEstado?.['canjeado'] ?? 0;
      return `Se han canjeado **${canjeados}** cupones en el período.`;
    },
  },

  // ── Casos legales ─────────────────────────────────
  {
    id: 'casos_abiertos',
    keywords: [['casos', 'abiertos'], ['casos', 'activos'], ['cuantos', 'casos']],
    handler: async () => {
      const d = await fetchDashboard();
      return `Hay **${d.casosLegales.abiertos}** casos legales abiertos (incluye en atención y escalados).`;
    },
  },
  {
    id: 'casos_por_estado',
    keywords: [['casos', 'estado'], ['casos', 'resumen'], ['desglose', 'casos']],
    handler: async () => {
      const r = await fetchAvanzado();
      const entries = Object.entries(r.casosLegales.porEstado);
      if (!entries.length) return 'No hay casos legales registrados.';
      const lines = entries.map(([estado, count]) => `• ${estado}: **${count}**`);
      return `Desglose de casos por estado:\n${lines.join('\n')}`;
    },
  },
  {
    id: 'casos_por_tipo',
    keywords: [['casos', 'tipo'], ['tipo', 'percance'], ['accidentes', 'asaltos']],
    handler: async () => {
      const r = await fetchAvanzado();
      const entries = Object.entries(r.casosLegales.porTipo);
      if (!entries.length) return 'No hay casos legales registrados.';
      const lines = entries.map(([tipo, count]) => `• ${tipo}: **${count}**`);
      return `Desglose de casos por tipo de percance:\n${lines.join('\n')}`;
    },
  },

  // ── Documentos ────────────────────────────────────
  {
    id: 'docs_pendientes',
    keywords: [['documentos', 'pendientes'], ['docs', 'pendientes'], ['documentos', 'revision']],
    handler: async () => {
      const d = await fetchDashboard();
      return `Hay **${d.documentos.pendientes}** documentos pendientes de revisión.`;
    },
  },

  // ── Saludos / meta ────────────────────────────────
  {
    id: 'saludo',
    keywords: [['hola'], ['buenos dias'], ['buenas tardes'], ['buenas noches'], ['que tal']],
    handler: async () =>
      '¡Hola! 👋 Soy el asistente de Core Associates. Puedo ayudarte con información sobre asociados, proveedores, cupones, casos legales y más. ¿Qué necesitas saber?',
  },
  {
    id: 'ayuda',
    keywords: [['ayuda'], ['que puedes hacer'], ['como funciona'], ['comandos']],
    handler: async () =>
      `Puedo responder preguntas como:\n• ¿Cuántos asociados hay?\n• ¿Cuántos casos abiertos tengo?\n• ¿Cuántos cupones se generaron este mes?\n• ¿Cuál es el mejor proveedor?\n• ¿Cuántos documentos pendientes hay?\n• Desglose de casos por estado\n\nEscribe tu pregunta en lenguaje natural.`,
  },
];

/* ── Motor de matching ── */

export async function matchIntent(input: string): Promise<MatchResult | null> {
  const text = normalize(input);

  for (const intent of intents) {
    const matched = intent.keywords.some((group) => containsAll(text, group));
    if (matched) {
      const respuesta = await intent.handler();
      return { intent: intent.id, respuesta, source: 'clasico' };
    }
  }

  return null;
}

/** Suggestions shown when chat opens or when no intent matches */
export const SUGERENCIAS = [
  '¿Cuántos asociados hay?',
  '¿Cuántos casos abiertos tengo?',
  '¿Cupones generados este mes?',
  '¿Cuál es el mejor proveedor?',
  '¿Documentos pendientes?',
];
