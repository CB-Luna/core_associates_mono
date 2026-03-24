# Auditoría de Preguntas del Chatbot — Core Associates CRM

> Documento generado como referencia para el diseño del asistente IA del CRM.
> Última actualización: 2026-03-24

---

## Resumen de Arquitectura del Chatbot

El chatbot opera en dos modos con escalamiento automático:

```
Pregunta del usuario
  │
  ├─ 1. Content Guard     → Bloquea contenido ofensivo / fuera de tema
  ├─ 2. Entity Resolver   → Busca por ID (ASC-XXXX, PRV-XXXX), teléfono o nombre → Respuesta directa de BD
  ├─ 3. Intent Matching   → Keywords → Consulta directa a BD (modo clásico, 0 tokens IA)
  ├─ 4. Modo Avanzado IA  → Gemini/Anthropic con contexto de BD + historial de conversación
  └─ 5. Fallback          → "No encontré información, intenta con..."
```

**Principio**: El modo clásico (pasos 2-3) intenta resolver el máximo posible de preguntas sin consumir tokens de IA. Solo se escala al modo avanzado (paso 4) cuando la pregunta es compleja y el usuario tiene activado el modo avanzado.

---

## Roles del CRM y Permisos de Chatbot

| Rol | `asistente:ver` | `asistente:modo-avanzado` | `asistente:configurar` | Alcance |
|---|:---:|:---:|:---:|---|
| **Admin** | ✅ | ✅ | ✅ | Acceso total: todas las entidades, reportes, configuración |
| **Operador** | ✅ | ✅ | ❌ | Asociados, proveedores, casos legales, documentos, reportes básicos |
| **Abogado** | ✅ | ❌ | ❌ | Solo modo clásico. Solo casos propios, dashboard básico |
| **Proveedor** | ❌ | ❌ | ❌ | Sin acceso al chatbot (usa dashboard propio) |

---

## Preguntas por Rol

### 1. Admin — Acceso Total

#### 1.1 Asociados

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 1 | ¿Cuántos asociados hay? | Clásico | `count_asociados` | ✅ Implementado |
| 2 | ¿Cuántos asociados activos? | Clásico | `asociados_activos` | ✅ Implementado |
| 3 | ¿Cuántos asociados pendientes? | Clásico | `asociados_pendientes` | ✅ Implementado |
| 4 | ¿Cuántos asociados rechazados? | Clásico | `asociados_rechazados` | ✅ Implementado |
| 5 | Últimos asociados registrados | Clásico | `listar_ultimos_asociados` | ✅ Implementado |
| 6 | ¿Quién es ASC-0017? | Clásico | Entity Resolver (ASC-XXXX) | ✅ Implementado |
| 7 | Buscar asociado Abraham Domínguez | Clásico | Entity Resolver (nombre) | ✅ Implementado |
| 8 | Buscar por teléfono 5512345678 | Clásico | Entity Resolver (teléfono) | ✅ Implementado |
| 9 | ¿Quién es el asociado con placas ABC-123? | Avanzado | IA con contexto | ⬜ Solo IA |
| 10 | ¿Qué documentos tiene ASC-0017? | Clásico | Entity Resolver (incluye docs) | ✅ Implementado |
| 11 | ¿Qué vehículos tiene ASC-0017? | Clásico | Entity Resolver (incluye vehículos) | ✅ Implementado |
| 12 | ¿Qué casos legales tiene ASC-0017? | Clásico | Entity Resolver (incluye casos) | ✅ Implementado |
| 13 | ¿Cuántos asociados se registraron esta semana? | Avanzado | IA con métricas | ⬜ Solo IA |
| 14 | ¿Cuántos asociados hay por estado? (desglose) | Avanzado | IA con métricas | ⬜ Solo IA |
| 15 | ¿Cuál es la tasa de aprobación de asociados? | Avanzado | IA con métricas | ⬜ Solo IA |

#### 1.2 Proveedores

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 16 | ¿Cuántos proveedores hay? | Clásico | `count_proveedores` | ✅ Implementado |
| 17 | ¿Cuántos proveedores activos? | Clásico | `proveedores_activos` | ✅ Implementado |
| 18 | Proveedores por tipo / categoría | Clásico | `proveedores_tipo` | ✅ Implementado |
| 19 | ¿Hay más asociados que proveedores? | Clásico | `compare_asociados_proveedores` | ✅ Implementado |
| 20 | ¿Cuál es el mejor proveedor? | Clásico | `top_proveedor` | ✅ Implementado |
| 21 | Información de PRV-0001 | Clásico | Entity Resolver (PRV-XXXX) | ✅ Implementado |
| 22 | ¿Cuántos cupones ha emitido el proveedor X? | Clásico | Entity Resolver (incluye cupones) | ✅ Implementado |
| 23 | ¿Qué proveedores son talleres? | Avanzado | IA con contexto | ⬜ Solo IA |
| 24 | Listar proveedores inactivos | Avanzado | IA con contexto | ⬜ Solo IA |

#### 1.3 Promociones y Cupones

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 25 | ¿Cuántos cupones se generaron este mes? | Clásico | `cupones_mes` | ✅ Implementado |
| 26 | ¿Cuántos cupones se han canjeado? | Clásico | `cupones_canjeados` | ✅ Implementado |
| 27 | Promociones activas | Clásico | `promociones_activas` | ✅ Implementado |
| 28 | ¿Qué promociones están por vencer? | Avanzado | IA con contexto | ⬜ Solo IA |
| 29 | ¿Cuántos cupones están vencidos? | Avanzado | IA con contexto | ⬜ Solo IA |
| 30 | ¿Cuál es la tasa de canje de cupones? | Avanzado | IA con métricas | ⬜ Solo IA |

#### 1.4 Casos Legales

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 31 | ¿Cuántos casos abiertos hay? | Clásico | `casos_abiertos` | ✅ Implementado |
| 32 | Desglose de casos por estado | Clásico | `casos_por_estado` | ✅ Implementado |
| 33 | Desglose de casos por tipo de percance | Clásico | `casos_por_tipo` | ✅ Implementado |
| 34 | ¿Cuántos casos tiene ASC-0017? | Clásico | Entity Resolver (incluye casos) | ✅ Implementado |
| 35 | ¿Cuántos casos urgentes hay? | Avanzado | IA con contexto | ⬜ Solo IA |
| 36 | ¿Cuántos casos hay sin abogado asignado? | Avanzado | IA con contexto | ⬜ Solo IA |
| 37 | ¿Cuántos accidentes se reportaron este mes? | Avanzado | IA con métricas | ⬜ Solo IA |
| 38 | ¿Cuál es el tiempo promedio de resolución? | Avanzado | IA con métricas | ⬜ Solo IA |

#### 1.5 Abogados

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 39 | ¿Cuántos abogados hay? / Lista de abogados | Clásico | `listar_abogados` | ✅ Implementado |
| 40 | ¿Qué abogado tiene más casos? | Avanzado | IA con contexto | ⬜ Solo IA |
| 41 | ¿Qué abogados están disponibles? | Avanzado | IA con contexto | ⬜ Solo IA |

#### 1.6 Documentos

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 42 | ¿Cuántos documentos pendientes hay? | Clásico | `docs_pendientes` | ✅ Implementado |
| 43 | ¿Cuántos documentos se han rechazado? | Avanzado | IA con contexto | ⬜ Solo IA |
| 44 | ¿Qué documentos tiene ASC-0017? | Clásico | Entity Resolver (incluye docs) | ✅ Implementado |
| 45 | ¿Cuántos documentos se aprobaron esta semana? | Avanzado | IA con métricas | ⬜ Solo IA |

#### 1.7 Reportes y Dashboard

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 46 | Resumen general / Dashboard | Clásico | `resumen_general` | ✅ Implementado |
| 47 | ¿Cómo va la plataforma? | Clásico | `resumen_general` | ✅ Implementado |
| 48 | Comparativa de este mes vs el anterior | Avanzado | IA con métricas | ⬜ Solo IA |
| 49 | Tendencia de registros de asociados | Avanzado | IA con métricas | ⬜ Solo IA |

#### 1.8 Configuración / Sistema (solo Admin)

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 50 | ¿Qué modelo de IA está configurado? | Avanzado | IA con contexto | ⬜ Solo IA |
| 51 | ¿Cuántas preguntas por hora se permiten? | Avanzado | IA con contexto | ⬜ Solo IA |
| 52 | ¿Cuántos usuarios CRM hay? | Avanzado | IA con contexto | ⬜ Solo IA |

#### 1.9 Meta / Ayuda

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 53 | Hola / Buenos días | Clásico | `saludo` | ✅ Implementado |
| 54 | Ayuda / ¿Qué puedes hacer? | Clásico | `ayuda` | ✅ Implementado |

---

### 2. Operador — Soporte y Atención

> Mismo alcance que Admin excepto: sin configuración del sistema, sin gestión de usuarios, sin configurar IA.

| # | Preguntas disponibles | Modo | Estado |
|---|---|---|---|
| 1-15 | Todas las de Asociados | Clásico + Avanzado | ✅ / ⬜ |
| 16-24 | Todas las de Proveedores (solo ver) | Clásico + Avanzado | ✅ / ⬜ |
| 25-30 | Todas las de Cupones/Promociones | Clásico + Avanzado | ✅ / ⬜ |
| 31-38 | Todas las de Casos Legales | Clásico + Avanzado | ✅ / ⬜ |
| 39-41 | Todas las de Abogados | Clásico + Avanzado | ✅ / ⬜ |
| 42-45 | Todas las de Documentos | Clásico + Avanzado | ✅ / ⬜ |
| 46-49 | Resumen/Dashboard | Clásico + Avanzado | ✅ / ⬜ |
| 53-54 | Saludo / Ayuda | Clásico | ✅ |

**Diferencias con Admin**: No puede preguntar sobre configuración del sistema (preguntas 50-52). El modo avanzado (IA) limita las respuestas según sus permisos.

---

### 3. Abogado — Solo Casos Propios

> Solo modo clásico (`asistente:ver`). Sin modo avanzado.
> Permisos: `dashboard:ver`, `casos-legales:ver-propios`, `casos-legales:agregar-notas`, etc.

| # | Pregunta ejemplo | Modo | Intent / Resolver | Estado |
|---|---|---|---|---|
| 1 | Hola / Buenos días | Clásico | `saludo` | ✅ |
| 2 | Ayuda / ¿Qué puedes hacer? | Clásico | `ayuda` | ✅ |
| 3 | ¿Cuántos casos abiertos hay? | Clásico | `casos_abiertos` | ✅ |
| 4 | Desglose de casos por estado | Clásico | `casos_por_estado` | ✅ |
| 5 | Desglose de casos por tipo | Clásico | `casos_por_tipo` | ✅ |
| 6 | Resumen general | Clásico | `resumen_general` | ✅ |

**Preguntas que NO debe poder responder** (no tiene permisos):
- Detalle de asociados (no tiene `asociados:ver`)
- Información de proveedores
- Cupones y promociones
- Documentos de asociados
- Configuración del sistema

**Nota**: En modo clásico, las consultas de entidades no validan permisos actualmente. La IA (si se habilitara) sí respeta permisos via el system prompt. Esto es un área de mejora futura para reforzar RBAC en modo clásico.

---

### 4. Proveedor — Sin Acceso al Chatbot

> El rol proveedor **no tiene** el permiso `asistente:ver`, por lo que el widget del chatbot no se renderiza.
> Usa el dashboard propio del proveedor (`/dashboard`) para ver sus métricas.

---

## Cobertura Actual vs Deseada

### Preguntas resueltas en modo Clásico (0 tokens IA):

| Categoría | Implementadas | Pendientes |
|---|---|---|
| Asociados (conteos) | 4 | 0 |
| Asociados (entity lookup: ID, nombre, teléfono) | 3 mecanismos | 0 |
| Proveedores (conteos + entity) | 4 | 0 |
| Cupones | 2 | 0 |
| Promociones | 1 | 0 |
| Casos legales | 3 | 0 |
| Abogados | 1 | 0 |
| Documentos | 1 | 0 |
| Resumen general | 1 | 0 |
| Saludo + Ayuda | 2 | 0 |
| **Total clásico** | **22 intents + 4 entity resolvers** | **0** |

### Preguntas que solo el modo Avanzado puede resolver:

- Consultas con filtros temporales ("esta semana", "este mes", "comparativa")
- Preguntas que requieren cruzar múltiples entidades ("abogado con más casos")
- Análisis de tendencias y tasas
- Búsquedas complejas por campos no indexados (ej: placas)
- Preguntas sobre configuración del sistema

### Mejoras Futuras Posibles:

1. **RBAC en modo clásico**: Validar permisos del usuario antes de hacer entity lookups (ej: abogado no debería poder consultar ASC-0017).
2. **Intents por rango de fechas**: "Asociados registrados esta semana" podría ser clásico con un resolver que haga `WHERE createdAt >= now() - interval '7 days'`.
3. **Búsqueda de proveedores por nombre**: Agregar entity resolver para nombre de proveedor (similar al de asociado).
4. **Casos del abogado actual**: Intent `mis_casos` que muestre los casos asignados al usuario autenticado.
5. **Cache de métricas**: El `getDashboardMetrics()` se llama frecuentemente; agregar cache de 30s.

---

## Historial de Conversación

El chatbot ahora mantiene un historial in-memory por usuario (máximo 10 mensajes, TTL 30 min). Esto permite:

- **Seguimiento de contexto**: Si preguntas "¿quién es el asociado Abraham?" y luego "ASC-0017", el sistema resuelve directamente con el entity resolver.
- **IA con memoria**: En modo avanzado, el historial se inyecta en el system prompt para que la IA entienda follow-ups como "¿y cuántos casos tiene?" después de consultar un asociado.

---

## Apéndice: Permisos del Chatbot

```
asistente:ver              → Puede ver y usar el chatbot (modo clásico)
asistente:modo-avanzado    → Puede activar el modo avanzado (IA por API)
asistente:configurar       → Puede editar la configuración del chatbot
```

### Distribución por rol:

| Permiso | Admin | Operador | Abogado | Proveedor |
|---|:---:|:---:|:---:|:---:|
| `asistente:ver` | ✅ | ✅ | ✅ | ❌ |
| `asistente:modo-avanzado` | ✅ | ✅ | ❌ | ❌ |
| `asistente:configurar` | ✅ | ❌ | ❌ | ❌ |
