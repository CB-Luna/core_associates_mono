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

/** Topics that are within scope of the Core Associates platform */
const ALLOWED_TOPIC_KEYWORDS = [
  'asociado', 'conductor', 'membresia', 'registro', 'kyc',
  'proveedor', 'establecimiento', 'aliado',
  'cupon', 'promocion', 'descuento', 'beneficio',
  'caso', 'legal', 'percance', 'accidente', 'asalto', 'infraccion', 'abogado', 'sos',
  'documento', 'validacion', 'aprobacion',
  'reporte', 'dashboard', 'estadistica', 'metrica',
  'configuracion', 'sistema', 'usuario', 'rol', 'permiso',
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

  // Check blocked patterns
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
