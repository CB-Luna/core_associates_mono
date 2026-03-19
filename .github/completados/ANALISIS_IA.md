# Análisis de Inteligencia Artificial — Core Associates

> Fecha: 2026-03-17  
> Propósito: Documentar el estado actual de las integraciones de IA en el sistema, qué existe, qué funciona, qué es placeholder, y qué se podría hacer.

---

## 1. Resumen Ejecutivo

El sistema tiene una **integración funcional con Anthropic Claude Vision** para analizar documentos de asociados (INE, selfie, tarjeta de circulación). El backend está **acoplado exclusivamente a Anthropic** — aunque el frontend (`ConfAITab`) muestra opciones para OpenAI y Google, el backend solo implementa la API de Anthropic. No existe chatbot ni asistente conversacional. No hay IA en la app móvil Flutter.

---

## 2. Lo que EXISTE y FUNCIONA

### 2.1 Backend — Módulo `ai/` (NestJS)

| Archivo | Función |
|---------|---------|
| `modules/ai/ai.service.ts` | Servicio base que envía imágenes/PDFs a la API de Anthropic (`https://api.anthropic.com/v1/messages`). Convierte a base64, construye el mensaje multimodal, parsea respuesta JSON. |
| `modules/ai/ai-analysis.service.ts` | Orquestador: recibe un `documentoId`, descarga el archivo de MinIO, selecciona el prompt correcto según el tipo, invoca `ai.service`, guarda resultado en tabla `analisis_documento`. Ejecución asíncrona (fire-and-forget). |
| `modules/ai/ai-config.controller.ts` | CRUD de configuraciones de IA (`configuracion_ia`). Solo admin. GET enmascara API keys (`••••` + últimos 8 chars). |
| `modules/ai/dto/ai-config.dto.ts` | DTOs para crear/actualizar: `nombre`, `provider`, `modelo`, `apiKey`, `temperatura`, `maxTokens`, `activo`. |
| `modules/ai/prompts/ine-prompt.ts` | Prompt especializado para INE frontal y reverso. Extrae: nombre, CURP, clave elector, vigencia, domicilio, etc. Incluye validaciones (es_ine_valida, imagen_legible, vigencia_ok, formato_curp_valido). |
| `modules/ai/prompts/vehicle-prompt.ts` | Prompt para tarjeta de circulación. Extrae: placas, VIN, marca, modelo, año, propietario. |
| `modules/ai/prompts/selfie-prompt.ts` | Prompt para selfie de verificación. Evalúa: rostro detectado, una sola persona, nitidez, si parece foto real. |

**Flujo de análisis:**
1. Operador abre documento del asociado en el CRM
2. Click en "Analizar con IA" → `POST /ai/analysis/document/{id}`
3. Backend descarga de MinIO → envía a Claude con prompt según tipo
4. Claude responde JSON con datos extraídos + niveles de confianza
5. Se guarda en tabla `analisis_documento` (estado: procesando → completado/error)
6. Frontend muestra resultados con badges de confianza por campo

### 2.2 Frontend Web — Componentes

| Archivo | Función |
|---------|---------|
| `components/documentos/AIAnalysisPanel.tsx` | Panel que muestra resultados del análisis: campos extraídos con badge de confianza (verde ≥85%, amarillo ≥60%, rojo <60%), validaciones (checks verdes/rojos), botón para re-analizar. |
| `configuracion/tabs/ConfAITab.tsx` | Pestaña de configuración con: lista de configuraciones, selector de provider (Anthropic/OpenAI/Google), selector de modelo, campo API key (con toggle show/hide), temperatura, max tokens, prompt del sistema, toggle activo/inactivo. |
| Integrado en `documentos/page.tsx` | Panel de IA dentro del visor de documentos (lista global). |
| Integrado en `AsociadoDetailModal.tsx` | Panel de IA dentro del expediente del asociado. |

### 2.3 Base de Datos (Prisma)

| Tabla | Campos clave |
|-------|-------------|
| `configuracion_ia` | `id`, `clave`, `nombre`, `provider`, `modelo`, `apiKey`, `promptSistema`, `temperatura`, `maxTokens`, `activo` |
| `analisis_documento` | `id`, `documentoId`, `provider`, `modelo`, `estado` (procesando/completado/error), `datosExtraidos` (JSON), `validaciones` (JSON), `tokensUsados`, `tiempoMs`, `errorMsg` |

---

## 3. Lo que es PLACEHOLDER / No funciona

### 3.1 Providers OpenAI y Google — Solo visual
`ConfAITab.tsx` muestra 3 providers:
```typescript
const AI_PROVIDERS = [
  { key: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'] },
  { key: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { key: 'google', label: 'Google AI', models: ['gemini-2.0-flash', 'gemini-2.0-pro'] },
];
```

**Pero el backend (`ai.service.ts`) solo implementa Anthropic:**
- URL hardcodeada: `https://api.anthropic.com/v1/messages`
- Headers específicos de Anthropic: `x-api-key`, `anthropic-version`
- Formato de mensajes exclusivo de Anthropic

**Si alguien selecciona OpenAI o Google en la configuración y pone una API key**, esa key se guardará en BD pero el backend seguirá enviando las peticiones a Anthropic con formato Anthropic — **la petición fallará** porque la API key no es de Anthropic.

### 3.2 App Móvil — Sin IA
No hay ninguna funcionalidad de IA en la app Flutter. Las referencias a Google son por Fonts/Maps, no por AI. El análisis de documentos solo se puede disparar desde el CRM web.

### 3.3 Chatbot / Asistente — No existe
No hay ningún chatbot, asistente conversacional, ni interfaz de pregunta-respuesta con IA. Solo análisis de imágenes de documentos.

---

## 4. Riesgos Identificados

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| API key en BD sin cifrar | 🟡 Media | La API key de Anthropic se guarda en texto plano en `configuracion_ia.apiKey`. El endpoint GET la enmascara, pero está legible en BD. |
| Provider mismatch | 🟡 Media | El frontend permite seleccionar OpenAI/Google pero el backend solo soporta Anthropic. Puede causar confusión o errores silenciosos. |
| Fire-and-forget sin reintentos | 🟠 Baja | Si Claude falla (rate limit, timeout), el análisis queda en estado "error" sin reintento automático. El usuario debe re-analizar manualmente. |
| Costos sin control | 🟡 Media | No hay límite de uso ni tracking de costos. Cada análisis consume tokens de Claude (modelo Sonnet ≈ 3-8K tokens por imagen). Sin alertas de gasto. |
| Sin caché de análisis | 🟢 Baja | Si un documento ya fue analizado con éxito, el botón "Re-analizar" vuelve a gastar tokens. Podría mostrarse el resultado previo como default. |

---

## 5. Recomendaciones — Qué podríamos hacer

### 5.1 Correcciones inmediatas (sin riesgo)

1. **Ocultar providers no soportados**: En `ConfAITab.tsx`, deshabilitar o quitar OpenAI/Google del selector hasta que el backend los soporte. Esto evita que alguien configure un provider que no funciona.

2. **Mostrar provider activo claramente**: Indicar en la UI que "Actualmente solo Anthropic (Claude) está soportado" para evitar confusión.

3. **Cachear análisis exitosos**: Si `analisis_documento.estado === 'completado'`, el backend ya devuelve el existente. Verificar que el frontend también muestre el resultado cacheado y solo ofrezca "Re-analizar" como opción secundaria.

### 5.2 Mejoras de mediano plazo

4. **Multi-provider en backend**: Implementar un patrón strategy/factory en `ai.service.ts`:
   - `AnthropicProvider` (actual)
   - `OpenAIProvider` (con API de OpenAI Vision)
   - `GoogleProvider` (con Gemini Vision API)
   - Selección basada en el campo `provider` de `configuracion_ia`

5. **Cifrar API keys**: Usar encryption at rest para el campo `apiKey` (AES-256 con key derivada de env var).

6. **Límites de uso**: Agregar campo `limiteTokensMensuales` a `configuracion_ia` y trackear uso acumulado. Alertar al admin cuando se acerque al límite.

7. **Análisis desde app móvil**: Permitir que el asociado vea el resultado del análisis de sus documentos (lectura), o incluso disparar el análisis al subir un documento desde la app.

### 5.3 Funcionalidades nuevas (largo plazo)

8. **Chatbot para operadores**: Asistente que ayude a resolver casos legales, buscar información de asociados, o sugerir acciones basándose en el historial.

9. **Comparación facial**: Comparar selfie del asociado con foto de INE para verificación biométrica (requiere prompts especializados o servicio dedicado).

10. **OCR + validación cruzada**: Comparar datos extraídos de INE vs datos del registro del asociado para detectar discrepancias automáticamente.

11. **Análisis de documentos adicionales**: Licencia de conducir, comprobante de domicilio, póliza de seguro — agregar prompts y parsers.

---

## 6. Archivos Relevantes — Referencia Rápida

### Backend (core-associates-api)
```
src/modules/ai/
├── ai.module.ts
├── ai.service.ts              ← Comunicación con Anthropic API
├── ai-analysis.service.ts     ← Orquestador de análisis de documentos
├── ai-config.controller.ts    ← CRUD configuración IA (admin only)
├── dto/
│   └── ai-config.dto.ts       ← CreateAiConfigDto, UpdateAiConfigDto
└── prompts/
    ├── ine-prompt.ts           ← Prompt INE frente/reverso
    ├── vehicle-prompt.ts       ← Prompt tarjeta circulación
    └── selfie-prompt.ts        ← Prompt selfie verificación
```

### Frontend (core-associates-web)
```
src/app/(dashboard)/configuracion/tabs/ConfAITab.tsx    ← Config de providers
src/components/documentos/AIAnalysisPanel.tsx            ← Panel de resultados
src/app/(dashboard)/documentos/page.tsx                  ← Integración en visor
src/components/shared/AsociadoDetailModal.tsx             ← Integración en expediente
```

### Prisma
```
Modelos: configuracion_ia, analisis_documento
```
