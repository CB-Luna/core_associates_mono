/**
 * Prompt ligero para pre-validar imágenes antes de subir.
 * Objetivo: clasificar rápidamente si la imagen es del tipo esperado
 * y tiene calidad mínima aceptable. NO extrae datos — solo valida.
 */
export const PRE_VALIDACION_PROMPT = (
  tipoEsperado: string,
  datosVehiculo?: { marca?: string; modelo?: string; anio?: number; color?: string; placas?: string; numeroSerie?: string },
  nivelRigurosidad: number = 2,
): string => {
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

  // Reglas estrictas adicionales por tipo de documento
  const reglaEstricta =
    tipoEsperado === 'selfie'
      ? `\nREGLA ESTRICTA PARA SELFIE: Si la imagen NO muestra un rostro humano claramente visible (por ejemplo: es una foto de un objeto, teclado, animal, paisaje, papel, pantalla, etc.), debes responder SIEMPRE con "valida": false. No hay excepciones. La presencia de un rostro humano es el criterio mínimo obligatorio.`
      : '';

  // Contexto de datos del vehículo para tarjeta_circulacion
  let contextVehiculo = '';
  if (tipoEsperado === 'tarjeta_circulacion' && datosVehiculo) {
    const partes: string[] = [];
    if (datosVehiculo.marca) partes.push(`Marca: ${datosVehiculo.marca}`);
    if (datosVehiculo.modelo) partes.push(`Modelo: ${datosVehiculo.modelo}`);
    if (datosVehiculo.anio) partes.push(`Año: ${datosVehiculo.anio}`);
    if (datosVehiculo.color) partes.push(`Color: ${datosVehiculo.color}`);
    if (datosVehiculo.placas) partes.push(`Placas: ${datosVehiculo.placas}`);
    if (datosVehiculo.numeroSerie) partes.push(`No. de serie: ${datosVehiculo.numeroSerie}`);
    if (partes.length > 0) {
      contextVehiculo = `\n\nDAtos del vehículo ya registrado:\n${partes.join(', ')}\n\nREGLA ADICIONAL PARA TARJETA DE CIRCULACIÓN: Verifica que la tarjeta corresponde a este vehículo. Si las placas o la marca/modelo visibles en la tarjeta NO coinciden con los datos del vehículo registrado, rechaza con "valida": false indicando la discrepancia. Si la imagen es borrosa y no se pueden leer los datos para comparar, acepta como advertencia (valida: true, advertencia explicando la baja legibilidad).`;
    }
  }

  return `Eres un clasificador rápido de documentos. Tu ÚNICO trabajo es determinar si esta imagen es ${desc}${reglaEstricta}${contextVehiculo}

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

IMPORTANTE: Sé tolerante con la calidad de imagen (brillo, enfoque), pero sé ESTRICTO con el tipo de contenido. Solo rechaza si claramente NO es el tipo de documento esperado o si es completamente ilegible.${nivelRigurosidad >= 3 ? `

VALIDACIÓN DE AUTENTICIDAD (nivel ${nivelRigurosidad}):
- Verifica que el documento NO sea una foto de pantalla (busca bordes de monitor, reflejos de pantalla, patrones Moiré, pixelado de pantalla).
- Si es selfie: verifica que NO sea una foto de otra foto impresa (busca bordes de papel, textura de impresión, iluminación plana antinatural).${nivelRigurosidad >= 4 ? '\n- LIVENESS: Busca indicios de que la persona está presente en el momento: reflejos naturales en los ojos, profundidad de campo natural, micro-texturas de piel reales. Si detectas que es claramente una foto de foto o de pantalla, rechaza con "valida": false y motivo "Se detectó imagen no tomada en vivo".' : '\n- Si detectas evidente foto de pantalla o foto de foto, marca advertencia pero no rechaces automáticamente.'}` : ''}`;
};
