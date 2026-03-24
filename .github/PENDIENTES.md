# Pendientes — Core Associates

> **Última actualización**: 24 de marzo de 2026  
> Solo tareas **pendientes**. Lo completado está archivado en `.github/completados/`.  
> Commit actual en producción: `ac8499b` → `https://core-asoc.cbluna-dev.com`

---

## Resumen Ejecutivo

El CRM web (admin/operador/abogado) y la API están funcionales al ~98%. La App Flutter del asociado al ~93%. Quedan estas líneas de trabajo:

| Módulo | Descripción | Prioridad |
|--------|-------------|-----------|
| **F** | Flujo abogado — F.1/F.2/F.3 ✅ completados; F.4/F.5 pendientes | Media |
| **K** | Asistente IA (chatbot CRM) — ✅ COMPLETADO | — |
| **C** | App Móvil Abogados — app separada `core_associates_app_abogados/` | **Alta** |
| **J** | Verificación vehicular | Media |
| **D** | RBAC — eliminar enum legacy `RolUsuario` | Baja |
| **E** | Mejoras menores (App + CRM) | Baja |

---

## F. Flujo Abogado — Mejoras Operativas Pendientes

Hallazgos tras auditar el código actual del flujo de casos legales. El abogado tiene las herramientas base (ver casos, notas, documentos, aceptar/rechazar/escalar) pero hay huecos operativos.

### ~~F.1 — Abogado puede marcar caso como "Resuelto"~~ ✅ `856240b`

Completado. DTO `CambiarEstadoAbogadoDto` acepta `resuelto`. Botón "Marcar como resuelto" en `mis-casos/[id]/page.tsx`. Al resolver: `fechaCierre` se estampa + notificación a operadores.

### ~~F.2 — Validación de transiciones de estado~~ ✅ `856240b`

Completado. Matriz `TRANSICIONES_VALIDAS` en `casos-legales.service.ts`. `updateEstado()` valida transiciones y lanza `BadRequestException` si es inválida. Tests: 21/21.

### ~~F.3 — Notas privadas del abogado~~ ✅ `856240b`

Completado. Toggle `esPrivada` con icono Lock en formulario de notas del abogado. Notas privadas con borde/fondo amber + icono candado.

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

### ~~K.1 — Componente UI del chatbot~~ ✅ `65088a5`

Completado. Ventana flotante draggable con 5 componentes: `ChatWidget.tsx` (wrapper draggable), `ChatHeader.tsx` (título + toggle modo + minimizar/cerrar), `ChatMessages.tsx` (lista mensajes + sugerencias), `ChatInput.tsx` (input + enviar), `ChatBubble.tsx` (burbujas user/assistant). Store Zustand `chat-store.ts`. Integrado en dashboard layout + botón MessageCircle en Header.

### ~~K.2 — Modo clásico (consultas directas a BD)~~ ✅ `65088a5`

Completado. Motor de intents en `lib/chat/intent-matcher.ts` con 15 intents: count_asociados, asociados_activos, asociados_pendientes, count_proveedores, compare_asociados_proveedores, top_proveedor_promociones, cupones_mes, cupones_canjeados, casos_abiertos, casos_por_estado, casos_por_tipo, docs_pendientes, saludo, ayuda. Normalización de acentos, cache de 1 min, usa endpoints `/reportes/dashboard` y `/reportes/avanzado`. 12 tests unitarios.

### K.3 — Modo avanzado (IA por API) ✅ `812ae1d`

Completado: `AiService.chat()` para mensajes de texto al proveedor de IA (Anthropic). System prompt con inyección de permisos del usuario (`buildSystemPrompt`). Rate limiting in-memory por usuario (configurable via `maxPreguntasPorHora` en `ConfiguracionIA`). Flujo inteligente: primero intents clásicos (gratis), luego IA solo si no hay match y modo avanzado activo. Content guard bloquea contenido ofensivo y prompt injection.

**Módulo K completo** — Chatbot CRM con modo clásico + avanzado, RBAC, config admin, backend centralizado.

### ~~K.4 — Configuración de IA para chatbot~~ ✅ `ba3bb58`

Completado: migración `20260323110000_add_chatbot_config_fields` con 3 campos nuevos en `ConfiguracionIA` (chatbotActivo, modoAvanzadoDisponible, maxPreguntasPorHora). Seed `chatbot_assistant` con provider Anthropic + claude-haiku. Endpoint `GET /ai/config/chatbot-status` (JWT sin permiso específico). ConfAITab muestra sección "Configuración del Chatbot" para configs tipo chatbot. ChatWidget consulta config global y oculta widget si chatbot desactivado. ChatHeader respeta modoAvanzadoDisponible global.

### ~~K.5 — Permiso RBAC del chatbot~~ ✅ `618b2b4`

Completado: migración `20260323100000_add_asistente_permisos` con 3 permisos (`asistente:ver`, `asistente:modo-avanzado`, `asistente:configurar`). Header, ChatWidget y ChatHeader condicionados a permisos RBAC.

### K.6 — Backend: módulo `asistente-ia` ✅

Completado: módulo NestJS `asistente-ia` con controller (`POST /asistente/preguntar`), service (intent-matcher + content-guard backend), DTO validado, 15 intents replicados del frontend. ChatWidget migrado a usar API backend en lugar de intent-matcher local. Commit `4d2e1e1`.

**Esfuerzo total módulo K**: Alto  
**Prioridad**: Alta

---

## C. App Móvil Abogados — App Separada

> **Plan detallado**: ver [APP_ABOGADOS.md](APP_ABOGADOS.md)

App Flutter independiente (`core_associates_app_abogados/`) para abogados como operadores de campo. Conectada al mismo backend `core-associates-api`. El abogado deja de ser "usuario de CRM" y pasa a ser "agente en tiempo real".

**Login**: Email/password (reutiliza `POST /auth/login`).  
**Bottom Nav**: Inicio | Casos | Mapa | Perfil.

### C.1 — Scaffold + Auth (Fase 3.1)

- Proyecto Flutter nuevo, core infrastructure (ApiClient, SecureStorage, Theme)
- LoginScreen email/password, GoRouter + shell con BottomNav

### C.2 — Casos: feature principal (Fase 3.2)

- Dashboard con stats, Mis Casos (lista + detalle), Casos Disponibles + postularse
- Notas (timeline + agregar + privadas), documentos (subir foto/archivo)
- Acciones: aceptar, rechazar, en_atención, escalar, resolver

### C.3 — Mapa + Navegación (Fase 3.3)

- Mapa SOS con markers por tipo/prioridad
- Deeplink a Google Maps/Waze
- Filtros en mapa

### C.4 — Push Notifications FCM (Fase 3.4)

- Registro token FCM, notificaciones foreground/background
- Deep link desde push → detalle del caso

### C.5 — Extras (Fase 3.5)

- Toggle disponibilidad (migración backend)
- Chat interno básico + deeplink WhatsApp
- Perfil completo

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
Fase 1 — Flujo Abogado (mejoras rápidas): ✅ COMPLETADA (856240b)
  ├─ ✅ F.1 Abogado puede resolver caso
  ├─ ✅ F.2 Validación de transiciones de estado
  └─ ✅ F.3 Notas privadas del abogado

Fase 2 — Asistente IA (chatbot CRM):
  ├─ ✅ K.1 Componente UI (ventana flotante draggable)
  ├─ ✅ K.2 Modo clásico (intents → queries BD)
  ├─ ✅ K.5 Permisos RBAC (asistente:ver, asistente:modo-avanzado)
  ├─ ✅ K.4 Configuración IA para chatbot (ConfAITab)
  ├─ ✅ K.6 Backend módulo asistente-ia
  └─ ✅ K.3 Modo avanzado (IA por API + guard contenido)

Fase 3 — App Móvil Abogados (app separada → core_associates_app_abogados/):
  ├─ C.1 Scaffold + Auth (email/password, GoRouter shell)
  ├─ C.2 Casos: dashboard, mis casos, disponibles, detalle, notas, docs, acciones
  ├─ C.3 Mapa SOS + navegación GPS
  ├─ C.4 Push notifications (FCM)
  ├─ C.5 Extras: disponibilidad, chat básico, perfil
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
| **API** | ~99% | F (flujo abogado), J.1 (verificación) |
| **CRM Web** | ~99% | K.1-K.6 ✅ (chatbot completo), F.1/F.3 (botones abogado) |
| **App Flutter** | ~93% | C (shell profesional), F.4 (docs bidireccionales), E.1 (filtro cupones) |
| **Infra** | 100% | Docker + Nginx + SSL + deploy script funcionando |
| **IA** | 100% | Módulo K completo (chatbot clásico + IA avanzado). Requires `ANTHROPIC_API_KEY` en producción para modo avanzado. |

**Producción**: `https://core-asoc.cbluna-dev.com` (commit `812ae1d`)
