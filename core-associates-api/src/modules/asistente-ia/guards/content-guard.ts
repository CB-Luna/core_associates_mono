/**
 * Content guard: validates user input before processing.
 * Blocks offensive content, prompt injection attempts, and off-topic queries.
 */

/** Words/patterns that indicate abusive or off-topic content */
const BLOCKED_PATTERNS = [
  // Offensive / abusive
  /\b(idiota|estupido|pendejo|imbecil|maldito|chinga|puta|verga|cabron)\b/,
  // Prompt injection attempts
  /ignore\s+(previous|all|above)\s+(instructions|prompts)/i,
  /system\s*prompt/i,
  /you\s+are\s+now/i,
  /act\s+as\s+a/i,
  /\bDAN\b/,
  /jailbreak/i,
  /bypass\s+(safety|filter|guard)/i,
];

/** Patterns that represent entity references — always allowed through the guard */
const ENTITY_PATTERNS = [
  /^[A-Z]{2,4}-?\s*\d{1,5}$/i,   // ASC-0017, PRV-001
  /^(?:\+?52)?\d{10}$/,            // Phone numbers (10 digits, optional +52)
];

/** Topics that are within scope of the Core Associates platform */
const ALLOWED_TOPIC_KEYWORDS = [
  // Entities
  'asociado', 'conductor', 'membresia', 'registro', 'kyc',
  'proveedor', 'establecimiento', 'aliado', 'negocio', 'comercio', 'taller',
  'cupon', 'promocion', 'descuento', 'beneficio',
  'caso', 'legal', 'percance', 'accidente', 'asalto', 'infraccion', 'abogado', 'sos',
  'documento', 'validacion', 'aprobacion',
  'reporte', 'dashboard', 'estadistica', 'metrica',
  'configuracion', 'sistema', 'usuario', 'rol', 'permiso',
  // Entity ID prefixes
  'asc', 'prv',
  // Query words
  'cuantos', 'cuantas', 'cuanto', 'cuanta',
  'quien', 'quienes', 'cual', 'cuales',
  'buscar', 'busca', 'encontrar', 'consultar',
  'detalle', 'informacion', 'datos', 'info',
  'listar', 'lista', 'listado', 'mostrar',
  'ultimo', 'ultimos', 'reciente', 'recientes',
  'estado', 'estatus', 'activo', 'pendiente',
  'nombre', 'telefono', 'email', 'correo',
  'vehiculo', 'placa', 'auto', 'coche', 'carro',
  'nota', 'notas', 'seguimiento',
  'resumen', 'total', 'top', 'mejor',
  // Greetings / meta
  'hola', 'ayuda', 'gracias', 'bien', 'bueno',
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export interface ContentGuardResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates that the user question is appropriate and within scope.
 * Returns { allowed: true } if OK, or { allowed: false, reason } if blocked.
 */
export function validateContent(pregunta: string): ContentGuardResult {
  const text = normalize(pregunta);

  // Check blocked patterns first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: 'Tu mensaje contiene contenido inapropiado. Por favor reformula tu pregunta.',
      };
    }
  }

  // For very short inputs (greetings, etc.), allow
  if (text.length < 8) return { allowed: true };

  // Entity references (IDs like ASC-0017, phone numbers) are always allowed
  const trimmed = pregunta.trim();
  if (ENTITY_PATTERNS.some((p) => p.test(trimmed))) {
    return { allowed: true };
  }

  // Check if the input has at least one domain-related keyword
  const hasRelevantTopic = ALLOWED_TOPIC_KEYWORDS.some((kw) => text.includes(kw));

  if (!hasRelevantTopic) {
    return {
      allowed: false,
      reason: 'Solo puedo ayudarte con temas relacionados a la plataforma de Core Associates (asociados, proveedores, cupones, casos legales, documentos).',
    };
  }

  return { allowed: true };
}
