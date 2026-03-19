/**
 * Prompt ligero para pre-validar imágenes antes de subir.
 * Objetivo: clasificar rápidamente si la imagen es del tipo esperado
 * y tiene calidad mínima aceptable. NO extrae datos — solo valida.
 */
export const PRE_VALIDACION_PROMPT = (tipoEsperado: string): string => {
  const descripciones: Record<string, string> = {
    ine_frente:
      'la parte FRONTAL de una credencial INE/IFE mexicana (credencial para votar). ' +
      'Debe mostrar foto, nombre, domicilio, CURP y clave de elector.',
    ine_reverso:
      'la parte REVERSA (trasera) de una credencial INE/IFE mexicana. ' +
      'Debe mostrar código de barras, MRZ, y/o datos adicionales de la credencial.',
    selfie:
      'una selfie/autorretrato de verificación de identidad. ' +
      'Debe mostrar un rostro humano claro, centrado, bien iluminado, sin obstrucciones.',
    tarjeta_circulacion:
      'una Tarjeta de Circulación vehicular mexicana. ' +
      'Debe mostrar placas, número de serie (VIN), marca, modelo y datos del propietario.',
  };

  const desc = descripciones[tipoEsperado] || 'un documento de identificación válido';

  return `Eres un clasificador rápido de documentos. Tu ÚNICO trabajo es determinar si esta imagen es ${desc}

Evalúa SOLO estos criterios:
1. ¿La imagen corresponde al tipo de documento esperado? (no es un meme, paisaje, captura de pantalla, etc.)
2. ¿La imagen tiene calidad mínima para ser procesada? (no completamente borrosa, no en negro, tamaño razonable)
3. ¿Se pueden distinguir al menos algunas letras o elementos del documento? (o en caso de selfie, un rostro)

Responde SOLO con JSON válido, sin explicaciones adicionales:
{
  "valida": true,
  "motivo": null,
  "advertencia": null
}

Si NO es válida:
{
  "valida": false,
  "motivo": "Descripción breve del problema en español mexicano",
  "advertencia": null
}

Si es válida pero tiene problemas menores (algo borrosa, iluminación pobre pero legible):
{
  "valida": true,
  "motivo": null,
  "advertencia": "Descripción breve de la advertencia en español mexicano"
}

IMPORTANTE: Sé tolerante. Si la imagen parece ser el documento correcto aunque no sea perfecta, marca como válida con advertencia. Solo rechaza si claramente NO es el tipo de documento esperado o si es completamente ilegible.`;
};
