export const SELFIE_PROMPT = (nivelRigurosidad: number = 2): string => {
  const livenessBlock = nivelRigurosidad >= 3
    ? `\n10. **es_foto_de_foto** - ¿La imagen parece ser una foto de otra foto impresa o de una pantalla? Busca: bordes de papel/pantalla, patrón Moiré, reflejos de monitor, textura de impresión, iluminación plana antinatural (boolean, true = ES foto de foto)
11. **indicios_liveness** - ¿Hay indicios de que la persona está presente en el momento? Busca: reflejos naturales en ojos, profundidad de campo, micro-texturas de piel (boolean)${nivelRigurosidad >= 4 ? '\n\nREGLA LIVENESS NIVEL MÁXIMO: Si "es_foto_de_foto" es true O "indicios_liveness" es false, marca "es_selfie_valida" como false. No se aceptan fotos de fotos ni de pantallas.' : '\n\nNOTA: Si detectas foto de foto o pantalla, registra el hallazgo pero no invalides automáticamente la selfie.'}`
    : '';

  const livenessFields = nivelRigurosidad >= 3
    ? `,
    "es_foto_de_foto": { "valor": false, "confianza": 0.85 },
    "indicios_liveness": { "valor": true, "confianza": 0.80 }`
    : '';

  return `Eres un experto en verificación de identidad. Analiza esta imagen que debería ser una selfie/autorretrato de una persona.

Evalúa los siguientes aspectos:

1. **rostro_detectado** - ¿Se detecta un rostro humano claro? (boolean)
2. **solo_una_persona** - ¿Hay exactamente una persona en la imagen? (boolean)
3. **rostro_centrado** - ¿El rostro está centrado y bien encuadrado? (boolean)
4. **buena_iluminacion** - ¿La iluminación es adecuada? (boolean)
5. **sin_obstrucciones** - ¿El rostro no está obstruido (gafas de sol, mascarilla, etc.)? (boolean)
6. **imagen_nitida** - ¿La imagen es nítida, no borrosa? (boolean)
7. **aparenta_ser_foto_real** - ¿Parece una foto tomada en el momento (no foto de foto, no pantalla)? (boolean)
8. **genero_aparente** - Género aparente (H/M)
9. **rango_edad_aparente** - Rango de edad aparente ("20-30", "30-40", etc.)${livenessBlock}

Validaciones:
- "es_selfie_valida": ¿Cumple con los requisitos mínimos de una selfie de verificación? (boolean)
- "calidad_aceptable": ¿La calidad de imagen es suficiente para verificación? (boolean)

Responde SOLO con JSON válido:
{
  "tipo_documento": "selfie",
  "campos": {
    "rostro_detectado": { "valor": true, "confianza": 0.99 },
    "solo_una_persona": { "valor": true, "confianza": 0.98 },
    "rostro_centrado": { "valor": true, "confianza": 0.95 },
    "buena_iluminacion": { "valor": true, "confianza": 0.90 },
    "sin_obstrucciones": { "valor": true, "confianza": 0.95 },
    "imagen_nitida": { "valor": true, "confianza": 0.92 },
    "aparenta_ser_foto_real": { "valor": true, "confianza": 0.85 },
    "genero_aparente": { "valor": "H", "confianza": 0.80 },
    "rango_edad_aparente": { "valor": "25-35", "confianza": 0.70 }${livenessFields}
  },
  "validaciones": {
    "es_selfie_valida": true,
    "calidad_aceptable": true
  },
  "confianza_global": 0.90,
  "observaciones": "..."
}`;
};
