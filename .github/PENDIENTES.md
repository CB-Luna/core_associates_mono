# Pendientes — Core Associates

> **Última actualización**: 22 de marzo de 2026  
> Solo tareas **pendientes**. Lo completado está archivado en `.github/completados/`.  
> Commit actual en producción: `23ecdf8` → `https://core-asoc.cbluna-dev.com`

---

## Resumen Ejecutivo

El CRM web (admin/operador/abogado) y la API están funcionales al ~98%. La App Flutter del asociado al ~93%. Quedan estas líneas de trabajo:

| Módulo | Descripción | Prioridad |
|--------|-------------|-----------|
| **F** | Flujo abogado — mejoras operativas pendientes | Alta |
| **K** | Asistente IA (chatbot CRM) — modo clásico + modo IA avanzado | Alta |
| **C** | App Móvil — shell profesional del abogado | Media-Alta |
| **J** | Verificación vehicular | Media |
| **D** | RBAC — eliminar enum legacy `RolUsuario` | Baja |
| **E** | Mejoras menores (App + CRM) | Baja |

---

## F. Flujo Abogado — Mejoras Operativas Pendientes

Hallazgos tras auditar el código actual del flujo de casos legales. El abogado tiene las herramientas base (ver casos, notas, documentos, aceptar/rechazar/escalar) pero hay huecos operativos.

### F.1 — Abogado puede marcar caso como "Resuelto"

**Problema**: Hoy el abogado solo puede cambiar un caso a `en_atencion` o `escalado` (DTO `CambiarEstadoAbogadoDto`). Si termina su gestión legal, tiene que avisar por fuera al operador para que resuelva/cierre. Eso es un cuello de botella.

**Solución**: Agregar `resuelto` al DTO `CambiarEstadoAbogadoDto` + botón "Marcar como resuelto" en `mis-casos/[id]/page.tsx`. Flujo propuesto:
1. **Abogado resuelve** → estado pasa a `resuelto`, notifica a operadores
2. **Operador verifica** → si todo bien, cambia a `cerrado` (cierre administrativo)

**Alcance**: API (DTO + service) + CRM (botón en vista abogado)  
**Esfuerzo**: Bajo

### F.2 — Validación de transiciones de estado

**Problema**: `updateEstado()` en el service acepta cualquier transición — un admin puede saltar de `cerrado` a `abierto` sin restricciones. Puede causar inconsistencias (reabrir sin re-asignar abogado).

**Solución**: Matriz de transiciones permitidas en el service:
```
abierto      → en_atencion, cancelado
en_atencion  → escalado, resuelto, cancelado
escalado     → en_atencion, resuelto, cancelado
resuelto     → cerrado, en_atencion (reabrir)
cerrado      → (fin)
cancelado    → abierto (reactivar, solo admin)
```

**Alcance**: API (service)  
**Esfuerzo**: Bajo

### F.3 — Notas privadas del abogado

**Problema**: La UI del abogado (`mis-casos/[id]`) fuerza `esPrivada: false`. El abogado no puede dejar notas internas que solo vea el equipo admin/operador (ej: "Asociado no coopera", "Documento sospechoso").

**Solución**: Agregar toggle `esPrivada` en el formulario de notas del abogado, idéntico al del admin.  
**Esfuerzo**: Bajo

### F.4 — Solicitud de documentos al asociado

> Antes catalogado como I.4.2

**Problema**: No hay mecanismo para que el abogado solicite documentos específicos al asociado (credencial, comprobante, póliza).

**Solución**:
- Modelo `SolicitudDocumento` (estado: pendiente/entregado/vencido)
- Endpoint: `POST /casos-legales/:id/solicitar-documento` + push notification al asociado
- CRM: botón "Solicitar documento" en detalle del caso (admin + abogado)
- App Flutter: pantalla "Documentos solicitados" dentro del detalle del caso del asociado

**Alcance**: API (modelo + migración + endpoints) + CRM + App Flutter  
**Esfuerzo**: Alto

### F.5 — Notificaciones push al asociado sobre su caso

**Problema**: Cuando el abogado acepta, agrega una nota, escala o resuelve — el asociado no se entera. El módulo de notificaciones está como stub.

**Solución**: Implementar notificaciones push (FCM) al asociado en eventos clave: caso aceptado, nueva nota, caso escalado, caso resuelto.  
**Dependencia**: Requiere el módulo de notificaciones activo (hoy es stub).  
**Esfuerzo**: Medio

---

## K. Asistente IA — Chatbot CRM

Chatbot embebido en el CRM, accesible desde cualquier página via icono en el Header. Tiene dos modos: **clásico** (consultas directas a BD, sin costo de tokens) y **avanzado** (IA por API para preguntas complejas).

### K.1 — Componente UI del chatbot

**Requerimientos UX**:
- Icono en el Header (visible en todas las páginas del dashboard)
- Al presionar: se abre una **ventana flotante draggable** (no modal bloqueante)
- Puede **moverse** por la pantalla, **minimizarse** (queda como icono flotante), y **cerrarse**
- Solo una instancia a la vez
- Persiste entre cambios de página (vive en el layout del dashboard, no en cada page)
- Historial de conversación en la sesión actual (se limpia al cerrar/refresh)

**Componentes**:
```
components/chat/
├── ChatWidget.tsx        ← ventana flotante draggable (wrapper)
├── ChatHeader.tsx        ← título, toggle modo, botones minimizar/cerrar
├── ChatMessages.tsx      ← lista de mensajes con scroll
├── ChatInput.tsx         ← input de texto + enviar
└── ChatBubble.tsx        ← burbuja individual (usuario vs asistente)
```

**Alcance**: CRM Web  
**Esfuerzo**: Medio

### K.2 — Modo clásico (consultas directas a BD)

**Concepto**: Un conjunto de "intents" predefinidos que mapean preguntas en español a queries específicas a la API. **Sin costo de tokens.**

**Intents de ejemplo**:
| Pregunta natural | Intent | Endpoint API |
|---|---|---|
| "¿Cuántos asociados tengo?" | `count_asociados` | `GET /reportes/estadisticas` |
| "¿Cuántos proveedores hay?" | `count_proveedores` | `GET /reportes/estadisticas` |
| "¿Tengo más asociados que proveedores?" | `compare_asociados_proveedores` | `GET /reportes/estadisticas` |
| "¿Cuál proveedor tiene más promociones?" | `top_proveedor_promociones` | `GET /reportes/top-proveedores` |
| "¿Cuántos abogados tengo?" | `count_abogados` | `GET /auth/users?rol=abogado` |
| "¿Cuántos abogados de penal?" | `count_abogados_especialidad` | `GET /auth/users?rol=abogado&especialidad=penal` |
| "¿Abogados sin casos asignados?" | `abogados_sin_casos` | Nuevo endpoint o query |
| "¿Cuántos casos abiertos hay?" | `count_casos_estado` | `GET /reportes/estadisticas` |
| "¿Cuántos cupones se canjearon este mes?" | `count_cupones_mes` | `GET /reportes/estadisticas` |

**Implementación**:
- Motor de matching sencillo: normalizar texto (quitar acentos, lowercase) → buscar keywords → mapear a intent → ejecutar query → formatear respuesta amigable
- Si no matchea ningún intent → responder amablemente que no entiende + sugerir preguntas ejemplo
- **No requiere API de IA** — es matching de patrones + calls a endpoints existentes

**Alcance**: CRM Web (lógica en frontend, usa endpoints API existentes + algunos nuevos)  
**Esfuerzo**: Medio

### K.3 — Modo avanzado (IA por API)

**Concepto**: Al activar el toggle "Asistente avanzado" (nombre final TBD — algo profesional, no "IA avanzada"), las preguntas que el modo clásico no pueda responder se envían a la API de IA (Anthropic/OpenAI/Google según configuración en `ConfiguracionIA`).

**Flujo inteligente de routing** (ahorrar tokens):
1. El usuario escribe una pregunta
2. Primero pasa por el motor de intents del modo clásico
3. **Si hay match** → responde el motor clásico (gratis, incluso con modo avanzado activo)
4. **Si no hay match** → se envía a la IA por API
5. Antes de enviar a IA: el guard de contenido valida que la pregunta sea relevante al sistema

**Guard de contenido / filtro**:
- Lista de temas permitidos: asociados, proveedores, promociones, cupones, casos legales, abogados, membresías, vehículos, reportes, configuración
- Si la pregunta no tiene relación con el sistema → rechazar con mensaje educado ("Solo puedo ayudarte con temas relacionados a la plataforma de Core Associates")
- Bloquear contenido ofensivo, spam, intentos de prompt injection
- Opcional: limitar N preguntas por hora/día por usuario (configuración para evitar abuso de tokens)

**Restricción por rol**:
- El guard debe validar que el usuario no pregunte sobre datos a los que su rol no tiene acceso
- Ejemplo: un operador no debería poder preguntar "¿Cuánto gasta la empresa en IA?" si eso es solo para admins
- Se implementa inyectando el contexto de permisos del usuario en el system prompt de la IA

**Alcance**: API (nuevo módulo `asistente-ia`) + CRM Web  
**Esfuerzo**: Alto

### K.4 — Configuración de IA para chatbot

**Ubicación**: Página Configuración → pestaña "Conf IA" (ya existe `ConfAITab` para documentos KYC)

**Nuevos parámetros** (dentro de `ConfAITab` o nuevo sub-tab):
| Parámetro | Descripción | Default |
|---|---|---|
| `chatbotActivo` | Activar/desactivar el chatbot globalmente | `true` |
| `modoAvanzadoDisponible` | Permitir que usuarios activen el modo IA | `true` |
| `maxPreguntasPorHora` | Límite de preguntas IA (modo avanzado) por usuario/hora | `20` |
| `maxTokensPorPregunta` | Tope de tokens por respuesta | `1024` |
| `temasPermitidos` | Lista de temas/keywords que el guard permite | (array predefinido) |
| `promptSistemaChat` | System prompt para el asistente IA | (template con contexto del dominio) |
| `providerChat` | Provider de IA para el chatbot (puede diferir del de documentos) | `anthropic` |
| `modeloChat` | Modelo específico (ej: claude-3-haiku para ahorrar) | `claude-3-haiku-20240307` |

### K.5 — Permiso RBAC del chatbot

**Ubicación**: Configuración → Roles y Permisos

Nuevos permisos a crear:
| Permiso | Descripción |
|---|---|
| `asistente:ver` | Puede ver y usar el chatbot (modo clásico) |
| `asistente:modo-avanzado` | Puede activar el toggle de modo avanzado (IA por API) |
| `asistente:configurar` | Puede editar la configuración del chatbot en Conf IA |

**Seed por rol**:
- **Admin**: `asistente:ver`, `asistente:modo-avanzado`, `asistente:configurar`
- **Operador**: `asistente:ver`, `asistente:modo-avanzado`
- **Abogado**: `asistente:ver` (solo modo clásico por defecto)
- **Proveedor**: ninguno (o solo `asistente:ver` si se desea)

El icono del chatbot en el Header solo aparece si el usuario tiene `asistente:ver`. El toggle de modo avanzado solo aparece si tiene `asistente:modo-avanzado`.

### K.6 — Backend: módulo `asistente-ia`

```
modules/asistente-ia/
├── asistente-ia.module.ts
├── asistente-ia.controller.ts      ← POST /asistente/preguntar
├── asistente-ia.service.ts         ← routing clásico→IA, guard contenido
├── dto/
│   └── preguntar.dto.ts            ← { pregunta: string, modoAvanzado: boolean }
├── intents/
│   ├── intent-matcher.ts           ← motor de matching de intents
│   └── intents.registry.ts         ← registro de todos los intents
└── guards/
    └── content-guard.ts            ← validación de contenido + roles
```

**Endpoint**: `POST /api/v1/asistente/preguntar`
- Body: `{ pregunta, modoAvanzado }`
- Respuesta: `{ respuesta, fuente: 'clasico' | 'ia', intent?: string }`
- Guard: `JwtAuthGuard` + permiso `asistente:ver` (+ `asistente:modo-avanzado` si `modoAvanzado=true`)

**Esfuerzo total módulo K**: Alto  
**Prioridad**: Alta

---

## C. App Móvil — Shell Profesional del Abogado

La app actual solo tiene login OTP para asociados. El abogado necesita acceso móvil para recibir push y gestionar casos en campo.

### C.1 — Login dual en la app

- Nueva pantalla `LoginProfesionalScreen` con email + password
- Reutiliza `POST /auth/login` (mismo endpoint del CRM)
- Pantalla de selección: "Soy asociado" (OTP) vs "Soy profesional" (email)

### C.2 — Shell profesional

GoRouter detecta `tipo` del JWT → redirige a shell correspondiente:
```
/profesional/home     → Resumen de casos (activos, pendientes, resueltos este mes)
/profesional/casos    → Lista de casos asignados (filtro por estado, pull-to-refresh)
/profesional/perfil   → Datos personales, cambiar contraseña, cerrar sesión
```
Bottom nav: **Inicio** · **Mis Casos** · **Perfil**

### C.3 — Pantalla de detalle del caso

Info caso + asociado + mapa + timeline de notas + agregar nota + botones aceptar/rechazar/escalar/resolver + documentos.

### C.4 — Push notifications para abogado

- Registrar token FCM con `POST /notificaciones/register-token-usuario`
- Push: asignación de caso, nueva nota, cambio de estado
- Tap → navega al detalle del caso

### C.5 — Estructura de archivos

```
features/profesional/
├── data/
│   ├── profesional_repository.dart
│   └── models/
└── presentation/
    ├── providers/
    └── screens/
```

**Esfuerzo**: Alto  
**Prioridad**: Media-Alta

---

## J. Verificación Vehicular

> **Nota**: El cliente NO ha dado detalle funcional exacto. Tareas preparatorias.

### J.1 — Estado de verificación por vehículo

Agregar al modelo `Vehiculo`:
- `verificado Boolean @default(false)`
- `documentoTarjetaUrl String?`
- `fechaVerificacion DateTime?`

Badge visual en CRM y App: "No verificado" / "Verificado".

### J.2 — Flujo UX progresivo

1. **Registro KYC**: 1 vehículo principal + tarjeta = obligatorio
2. **Post-aprobación**: Vehículos adicionales como "no verificados" con banner
3. **Activación**: Para SOS/cupones, vehículo debe estar verificado (diálogo si no)

### J.3 — Relaciones vehículo-operaciones (futuro)

- `CasoLegal.vehiculoId` → ¿con cuál vehículo ocurrió el incidente?
- `Cupon.vehiculoId` → ¿para cuál vehículo se usó el beneficio?
- Historial de incidentes por vehículo (scoring futuro)

**Esfuerzo**: Medio  
**Prioridad**: Media

---

## D. RBAC — Eliminar enum legacy `RolUsuario`

El campo `Usuario.rol` (enum: admin, operador, proveedor, abogado) coexiste con `rolId` (FK). Toda la lógica ya usa `rolId` + permisos dinámicos, pero el enum sigue en BD por backward compat.

**Plan**: Eliminar enum → dejar solo `rolId`. Requiere coordinar con C (App Móvil) porque la app lee `user.rol` del JWT para decisiones de routing.

**Decisión**: Posponer hasta implementar C (shell profesional).  
**Esfuerzo**: Bajo  
**Prioridad**: Baja (sin bloqueo funcional)

---

## E. Mejoras Menores

### App Flutter

| # | Mejora | Esfuerzo | Prioridad |
|---|--------|----------|-----------|
| E.1 | **Filtro en Mis Cupones** — tabs Activos / Canjeados / Vencidos + estadística "$X ahorrado" | Bajo | Media |
| E.2 | **Mapa de proveedores** — toggle lista↔mapa en Promociones con marcadores por tipo | Medio | Baja |
| E.3 | **Rediseño visual** — paleta expandida, gradientes, tipografía Inter, shimmer loaders | Alto | Baja |

### CRM Web

| # | Mejora | Esfuerzo | Prioridad |
|---|--------|----------|-----------|
| E.4 | **Responsive tabs** — UsuariosTab, RolesTab, MenuDinamicoTab sin cardRenderer mobile | Bajo | Baja |
| E.5 | **Dark mode en mapas** — Leaflet tiles no respetan dark mode | Bajo | Baja |
| E.6 | **WebSockets** — dashboard y mapa SOS sin actualizaciones en tiempo real | Alto | Baja |
| E.7 | **Migrar a React Query** — data fetching manual con useEffect+useState | Medio | Baja |

---

## Orden de Implementación

```
Fase 1 — Flujo Abogado (mejoras rápidas):
  ├─ F.1 Abogado puede resolver caso (DTO + botón)
  ├─ F.2 Validación de transiciones de estado
  └─ F.3 Notas privadas del abogado

Fase 2 — Asistente IA (chatbot CRM):
  ├─ K.1 Componente UI (ventana flotante draggable)
  ├─ K.2 Modo clásico (intents → queries BD)
  ├─ K.5 Permisos RBAC (asistente:ver, asistente:modo-avanzado)
  ├─ K.4 Configuración IA para chatbot (ConfAITab)
  ├─ K.6 Backend módulo asistente-ia
  └─ K.3 Modo avanzado (IA por API + guard contenido)

Fase 3 — App Móvil Profesional:
  ├─ C.1 Login dual (email/password para profesionales)
  ├─ C.2 Shell profesional (GoRouter + BottomNav)
  ├─ C.3 Detalle de caso (notas, docs, acciones)
  ├─ C.4 Push notifications (FCM)
  └─ D   Eliminar enum RolUsuario (coordinar con nuevo routing)

Fase 4 — Notificaciones y Documentos Bidireccionales:
  ├─ F.5 Push al asociado sobre cambios en su caso
  └─ F.4 Solicitud de documentos al asociado (API + CRM + App)

Fase 5 — Verificación Vehicular:
  ├─ J.1 Migración: campos verificación en modelo Vehiculo
  ├─ J.2 UX progresivo (badges, restricciones)
  └─ J.3 Relaciones vehículo-operaciones (si el cliente define)

Fase 6 — Polish:
  ├─ E.1 Filtro cupones App
  ├─ E.4 Responsive tabs CRM
  ├─ E.6 WebSockets (dashboard + mapa SOS tiempo real)
  └─ Resto mejoras menores
```

---

## Notas Operativas

- **`AI_ENCRYPTION_KEY`**: Pendiente agregar al `.env` de producción para activar cifrado de API keys IA.
- **Config IA actual**: Solo Anthropic implementado para documentos KYC. El tab `ConfAITab` en CRM muestra opciones OpenAI/Google pero el backend no las soporta aún. El chatbot (K) reutilizará la infraestructura existente.

---

## Estado del Sistema (22-mar-2026)

| Componente | Progreso | Pendiente principal |
|------------|----------|---------------------|
| **API** | ~98% | F (flujo abogado), K.6 (backend chatbot), J.1 (verificación) |
| **CRM Web** | ~98% | K.1-K.5 (chatbot UI + config), F.1/F.3 (botones abogado) |
| **App Flutter** | ~93% | C (shell profesional), F.4 (docs bidireccionales), E.1 (filtro cupones) |
| **Infra** | 100% | Docker + Nginx + SSL + deploy script funcionando |
| **IA** | ~98% | K.3/K.6 (chatbot IA), documentos KYC ya funcional |

**Producción**: `https://core-asoc.cbluna-dev.com` (commit `23ecdf8`)
