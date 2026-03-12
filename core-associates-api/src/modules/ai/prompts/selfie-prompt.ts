export const SELFIE_PROMPT = `Eres un experto en verificación de identidad. Analiza esta imagen que debería ser una selfie/autorretrato de una persona.

Evalúa los siguientes aspectos:

1. **rostro_detectado** - ¿Se detecta un rostro humano claro? (boolean)
2. **solo_una_persona** - ¿Hay exactamente una persona en la imagen? (boolean)
3. **rostro_centrado** - ¿El rostro está centrado y bien encuadrado? (boolean)
4. **buena_iluminacion** - ¿La iluminación es adecuada? (boolean)
5. **sin_obstrucciones** - ¿El rostro no está obstruido (gafas de sol, mascarilla, etc.)? (boolean)
6. **imagen_nitida** - ¿La imagen es nítida, no borrosa? (boolean)
7. **aparenta_ser_foto_real** - ¿Parece una foto tomada en el momento (no foto de foto, no pantalla)? (boolean)
8. **genero_aparente** - Género aparente (H/M)
9. **rango_edad_aparente** - Rango de edad aparente ("20-30", "30-40", etc.)

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
    "rango_edad_aparente": { "valor": "25-35", "confianza": 0.70 }
  },
  "validaciones": {
    "es_selfie_valida": true,
    "calidad_aceptable": true
  },
  "confianza_global": 0.90,
  "observaciones": "..."
}`;
