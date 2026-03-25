/**
 * Intent registry: define all classic-mode intents with keyword groups.
 * Each intent has an id, keyword groups (OR of AND patterns), and a
 * resolver key that maps to a handler in the service.
 */

export interface IntentDef {
  id: string;
  keywords: string[][];   // OR of AND groups
  resolverKey: string;     // key used by IntentMatcher to dispatch
}

export const INTENTS: IntentDef[] = [
  // ── Asociados ─────────────────────────────────────
  {
    id: 'count_asociados',
    keywords: [['cuantos', 'asociados'], ['total', 'asociados'], ['numero', 'asociados']],
    resolverKey: 'count_asociados',
  },
  {
    id: 'asociados_activos',
    keywords: [['asociados', 'activos']],
    resolverKey: 'asociados_activos',
  },
  {
    id: 'asociados_pendientes',
    keywords: [['asociados', 'pendientes']],
    resolverKey: 'asociados_pendientes',
  },
  {
    id: 'asociados_rechazados',
    keywords: [['asociados', 'rechazados']],
    resolverKey: 'asociados_rechazados',
  },
  {
    id: 'listar_ultimos_asociados',
    keywords: [['ultimos', 'asociados'], ['asociados', 'recientes'], ['nuevos', 'asociados'], ['ultimos', 'registros']],
    resolverKey: 'listar_ultimos_asociados',
  },

  // ── Proveedores ───────────────────────────────────
  {
    id: 'count_proveedores',
    keywords: [['cuantos', 'proveedores'], ['total', 'proveedores'], ['numero', 'proveedores']],
    resolverKey: 'count_proveedores',
  },
  {
    id: 'proveedores_activos',
    keywords: [['proveedores', 'activos']],
    resolverKey: 'proveedores_activos',
  },
  {
    id: 'proveedores_tipo',
    keywords: [['proveedores', 'tipo'], ['tipos', 'proveedor'], ['categorias', 'proveedores']],
    resolverKey: 'proveedores_tipo',
  },
  {
    id: 'compare_asociados_proveedores',
    keywords: [['mas', 'asociados', 'proveedores'], ['asociados', 'que', 'proveedores']],
    resolverKey: 'compare_asociados_proveedores',
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
    resolverKey: 'top_proveedor',
  },

  // ── Cupones ───────────────────────────────────────
  {
    id: 'cupones_mes',
    keywords: [['cupones', 'mes'], ['cupones', 'este mes'], ['cuantos', 'cupones']],
    resolverKey: 'cupones_mes',
  },
  {
    id: 'cupones_canjeados',
    keywords: [['cupones', 'canjeados'], ['cupones', 'canjearon']],
    resolverKey: 'cupones_canjeados',
  },

  // ── Promociones ───────────────────────────────────
  {
    id: 'promociones_activas',
    keywords: [['promociones', 'activas'], ['que', 'promociones'], ['promociones', 'disponibles'], ['listar', 'promociones']],
    resolverKey: 'promociones_activas',
  },

  // ── Casos legales ─────────────────────────────────
  {
    id: 'casos_abiertos',
    keywords: [['casos', 'abiertos'], ['casos', 'activos'], ['cuantos', 'casos']],
    resolverKey: 'casos_abiertos',
  },
  {
    id: 'casos_por_estado',
    keywords: [['casos', 'estado'], ['casos', 'resumen'], ['desglose', 'casos']],
    resolverKey: 'casos_por_estado',
  },
  {
    id: 'casos_por_tipo',
    keywords: [['casos', 'tipo'], ['tipo', 'percance'], ['accidentes', 'asaltos']],
    resolverKey: 'casos_por_tipo',
  },

  // ── Abogados ──────────────────────────────────────
  {
    id: 'listar_abogados',
    keywords: [['abogados', 'disponibles'], ['lista', 'abogados'], ['cuantos', 'abogados'], ['abogados', 'registrados']],
    resolverKey: 'listar_abogados',
  },

  // ── Documentos ────────────────────────────────────
  {
    id: 'docs_pendientes',
    keywords: [['documentos', 'pendientes'], ['docs', 'pendientes'], ['documentos', 'revision']],
    resolverKey: 'docs_pendientes',
  },
  {
    id: 'docs_faltantes',
    keywords: [
      ['no', 'subido', 'ine'], ['falta', 'ine'], ['sin', 'ine'],
      ['no', 'subido', 'selfie'], ['falta', 'selfie'], ['sin', 'selfie'],
      ['no', 'subido', 'tarjeta'], ['falta', 'tarjeta'], ['sin', 'tarjeta'],
      ['documentos', 'faltantes'], ['docs', 'faltantes'],
      ['no', 'han', 'subido'], ['no', 'subieron'],
      ['faltan', 'documentos'], ['sin', 'documentos'],
    ],
    resolverKey: 'docs_faltantes',
  },

  // ── Vehículos por marca ───────────────────────────
  {
    id: 'vehiculos_marca',
    keywords: [
      ['asociados', 'toyota'], ['asociados', 'nissan'], ['asociados', 'suzuki'],
      ['asociados', 'honda'], ['asociados', 'chevrolet'], ['asociados', 'volkswagen'],
      ['asociados', 'ford'], ['asociados', 'mazda'], ['asociados', 'hyundai'], ['asociados', 'kia'],
      ['vehiculos', 'marca'], ['autos', 'marca'], ['coches', 'marca'],
      ['tienen', 'toyota'], ['tienen', 'nissan'], ['tienen', 'suzuki'],
      ['tienen', 'honda'], ['tienen', 'chevrolet'], ['tienen', 'volkswagen'],
      ['tienen', 'ford'], ['tienen', 'mazda'], ['tienen', 'hyundai'], ['tienen', 'kia'],
    ],
    resolverKey: 'vehiculos_marca',
  },

  // ── Vehículos: conteo por asociado ────────────────
  {
    id: 'vehiculos_por_asociado',
    keywords: [
      ['cuantos', 'carros'], ['cuantos', 'vehiculos'], ['cuantos', 'autos'],
      ['vehiculos', 'tiene'], ['carros', 'tiene'], ['autos', 'tiene'],
    ],
    resolverKey: 'vehiculos_por_asociado',
  },

  // ── Listar asociados por estado ───────────────────
  {
    id: 'listar_asociados_estado',
    keywords: [
      ['lista', 'asociados', 'pendientes'], ['listar', 'asociados', 'pendientes'],
      ['lista', 'asociados', 'activos'], ['listar', 'asociados', 'activos'],
      ['lista', 'asociados', 'rechazados'], ['listar', 'asociados', 'rechazados'],
      ['quienes', 'pendientes'], ['quienes', 'activos'], ['quienes', 'rechazados'],
      ['cuales', 'pendientes'], ['cuales', 'activos'], ['cuales', 'rechazados'],
      ['nombres', 'asociados', 'pendientes'], ['nombres', 'asociados', 'activos'],
      ['mostrar', 'asociados', 'pendientes'], ['mostrar', 'asociados', 'activos'],
    ],
    resolverKey: 'listar_asociados_estado',
  },

  // ── Listar proveedores ────────────────────────────
  {
    id: 'listar_proveedores',
    keywords: [
      ['lista', 'proveedores'], ['listar', 'proveedores'],
      ['todos', 'proveedores'], ['mostrar', 'proveedores'],
      ['nombres', 'proveedores'],
    ],
    resolverKey: 'listar_proveedores',
  },

  // ── Casos legales recientes ───────────────────────
  {
    id: 'casos_recientes',
    keywords: [
      ['casos', 'recientes'], ['ultimos', 'casos'], ['lista', 'casos'],
      ['listar', 'casos'], ['mostrar', 'casos'],
    ],
    resolverKey: 'casos_recientes',
  },

  // ── Asociados suspendidos ─────────────────────────
  {
    id: 'asociados_suspendidos',
    keywords: [['asociados', 'suspendidos'], ['cuenta', 'suspendida']],
    resolverKey: 'asociados_suspendidos',
  },

  // ── Resumen general ───────────────────────────────
  {
    id: 'resumen_general',
    keywords: [['resumen', 'general'], ['resumen', 'plataforma'], ['como', 'va'], ['estado', 'general'], ['dashboard']],
    resolverKey: 'resumen_general',
  },

  // ── Saludos / meta ────────────────────────────────
  {
    id: 'saludo',
    keywords: [['hola'], ['buenos dias'], ['buenas tardes'], ['buenas noches'], ['que tal']],
    resolverKey: 'saludo',
  },
  {
    id: 'ayuda',
    keywords: [['ayuda'], ['que puedes hacer'], ['como funciona'], ['comandos']],
    resolverKey: 'ayuda',
  },
];
