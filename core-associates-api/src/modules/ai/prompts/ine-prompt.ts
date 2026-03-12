export const INE_FRENTE_PROMPT = `Eres un experto en documentos de identidad mexicanos. Analiza esta imagen de la parte FRONTAL de una credencial INE/IFE (Instituto Nacional Electoral).

Extrae los siguientes campos con la mayor precisión posible:

1. **nombre_completo** - Nombre(s) y apellidos como aparecen en la credencial
2. **apellido_paterno** - Apellido paterno
3. **apellido_materno** - Apellido materno
4. **nombre** - Nombre(s) de pila
5. **curp** - CURP (18 caracteres alfanuméricos)
6. **clave_elector** - Clave de elector (18 caracteres)
7. **anio_registro** - Año de registro
8. **seccion** - Sección electoral
9. **vigencia** - Año de vigencia
10. **estado** - Estado de la credencial
11. **municipio** - Municipio
12. **localidad** - Localidad
13. **domicilio** - Dirección completa
14. **fecha_nacimiento** - Fecha de nacimiento (DD/MM/AAAA)
15. **sexo** - Sexo (H/M)

Para cada campo devuelve:
- "valor": el valor extraído (string)
- "confianza": nivel de confianza de 0.0 a 1.0

Además, realiza estas **validaciones**:
- "es_ine_valida": ¿La imagen parece ser una INE/IFE legítima? (boolean)
- "imagen_legible": ¿La imagen es clara y legible? (boolean)
- "vigencia_ok": ¿La vigencia no ha expirado? (boolean, compara con año actual 2026)
- "formato_curp_valido": ¿El CURP tiene formato válido? (boolean)

Responde SOLO con un JSON válido con esta estructura:
{
  "tipo_documento": "ine_frente",
  "campos": {
    "nombre_completo": { "valor": "...", "confianza": 0.95 },
    "apellido_paterno": { "valor": "...", "confianza": 0.95 },
    ...
  },
  "validaciones": {
    "es_ine_valida": true,
    "imagen_legible": true,
    "vigencia_ok": true,
    "formato_curp_valido": true
  },
  "confianza_global": 0.92,
  "observaciones": "Texto con cualquier observación relevante"
}`;

export const INE_REVERSO_PROMPT = `Eres un experto en documentos de identidad mexicanos. Analiza esta imagen de la parte REVERSA de una credencial INE/IFE.

Extrae los siguientes campos:

1. **codigo_barras_presente** - ¿Se detecta el código de barras/QR? (boolean)
2. **mrz_presente** - ¿Se detecta la zona de lectura mecánica (MRZ)? (boolean)
3. **cic** - Código de Identificación de Credencial (CIC) si es visible
4. **ocr** - Número OCR si es visible
5. **identificador_reverso** - Cualquier identificador adicional visible

Validaciones:
- "es_ine_reverso": ¿La imagen corresponde al reverso de una INE? (boolean)
- "imagen_legible": ¿La imagen es clara? (boolean)
- "integridad_visual": ¿El documento se ve íntegro, sin alteraciones? (boolean)

Responde SOLO con JSON válido:
{
  "tipo_documento": "ine_reverso",
  "campos": {
    "codigo_barras_presente": { "valor": true, "confianza": 0.98 },
    "mrz_presente": { "valor": true, "confianza": 0.95 },
    "cic": { "valor": "...", "confianza": 0.85 },
    "ocr": { "valor": "...", "confianza": 0.80 }
  },
  "validaciones": {
    "es_ine_reverso": true,
    "imagen_legible": true,
    "integridad_visual": true
  },
  "confianza_global": 0.90,
  "observaciones": "..."
}`;
