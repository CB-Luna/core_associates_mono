export const TARJETA_CIRCULACION_PROMPT = `Eres un experto en documentos vehiculares mexicanos. Analiza esta imagen de una Tarjeta de Circulación.

Extrae los siguientes campos:

1. **placas** - Número de placas del vehículo
2. **numero_serie** - Número de serie (VIN) del vehículo (17 caracteres)
3. **marca** - Marca del vehículo
4. **modelo** - Modelo/línea del vehículo
5. **anio_modelo** - Año modelo
6. **color** - Color del vehículo
7. **tipo_vehiculo** - Tipo (sedán, SUV, pickup, etc.)
8. **nombre_propietario** - Nombre del propietario/titular
9. **numero_tarjeta** - Número de la tarjeta de circulación
10. **vigencia** - Fecha de vigencia
11. **estado_emision** - Estado que emitió la tarjeta
12. **uso** - Uso del vehículo (particular, público, etc.)
13. **cilindros** - Número de cilindros
14. **combustible** - Tipo de combustible

Para cada campo:
- "valor": valor extraído
- "confianza": 0.0 a 1.0

Validaciones:
- "es_tarjeta_circulacion": ¿Es una tarjeta de circulación legítima? (boolean)
- "imagen_legible": ¿La imagen es clara y legible? (boolean)
- "formato_placas_valido": ¿Las placas tienen formato mexicano válido? (boolean)
- "formato_vin_valido": ¿El VIN tiene 17 caracteres válidos? (boolean)
- "vigencia_ok": ¿La vigencia no ha expirado? (boolean)

Responde SOLO con JSON válido:
{
  "tipo_documento": "tarjeta_circulacion",
  "campos": {
    "placas": { "valor": "...", "confianza": 0.95 },
    "numero_serie": { "valor": "...", "confianza": 0.90 },
    ...
  },
  "validaciones": {
    "es_tarjeta_circulacion": true,
    "imagen_legible": true,
    "formato_placas_valido": true,
    "formato_vin_valido": true,
    "vigencia_ok": true
  },
  "confianza_global": 0.88,
  "observaciones": "..."
}`;
