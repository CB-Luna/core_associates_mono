# Pendientes — Core Associates

> **Última actualización**: 19 de marzo de 2026
> Documento unificado con TODO lo que falta por implementar. Consolida y reemplaza los documentos fragmentados que ahora viven en `.github/completados/`.

---

## Resumen Ejecutivo

Quedan **3 features grandes** y varias mejoras menores. Ordenadas por impacto de negocio:

| # | Feature | Impacto | Esfuerzo | Alcance |
|---|---------|---------|----------|---------|
| **A** | ~~KYC Guard — Restricción por estado~~ | ✅ Completado | — | API + App |
| **B** | IA Bilateral — Validación de documentos | 🔴 Alto | Alto | API + App + CRM |
| **C** | Rol de Abogado/Profesional | 🟡 Medio | Medio | API + CRM |
| **D** | RBAC v2 — Plantillas de rol | 🟡 Medio | Medio | API + CRM |
| **E** | Mejoras menores (App + CRM + API) | 🟢 Bajo | Bajo-Medio | Varios |

---

## ~~A. KYC Guard — Restricción por Estado del Asociado~~ ✅

> **Completado** el 19 de marzo de 2026.
> - Guard `EstadoAsociadoGuard` + decorador `@RequireActivo()` creados (sincrónico, lee estado del JWT).
> - Aplicado a 6 endpoints: `POST /cupones`, `POST /casos-legales`, `POST /asociados/me/vehiculos`, `PUT /vehiculos/:id`, `DELETE /vehiculos/:id`, `POST /vehiculos/:id/foto`.
> - Flutter: interceptor Dio 403 con callback `onKycBlocked`, diálogo contextual `showKycBlockedDialog()`, check proactivo `checkKycBlocked()` en pantallas de promociones y SOS.

<details><summary>Detalle original (colapsado)</summary>

**Problema**: El campo `estado` del asociado (`pendiente/activo/suspendido/baja/rechazado`) no tiene efecto funcional. Un asociado `pendiente` o `suspendido` puede hacer todo: generar cupones, reportar SOS, agregar vehículos. El flujo KYC es puramente cosmético.

**Solución**: Guard estricto en la API + manejo en la App.

### A.1 — Backend: `EstadoAsociadoGuard` (NestJS)

Crear guard reutilizable que verifica `estado === 'activo'` antes de permitir acceso:

**Endpoints bloqueados si `estado !== 'activo'`:**
- `POST /cupones` — generar cupón
- `POST /casos-legales` — reportar caso SOS
- `POST /vehiculos` — agregar vehículo

**Endpoints permitidos siempre (cualquier estado):**
- `GET /promociones` — ver catálogo (browsing)
- `GET /cupones/mis-cupones` — ver historial
- `GET /asociados/me` — ver su perfil
- `POST /documentos` — subir documentos KYC (necesario para activar cuenta)
- `GET /documentos/mis-documentos` — ver sus documentos

**Respuestas por estado:**
| Estado | HTTP | Mensaje |
|--------|------|---------|
| `pendiente` | 403 | "Tu cuenta está pendiente de aprobación. Completa tu documentación para activarla." |
| `suspendido` | 403 | "Tu cuenta ha sido suspendida. Contacta a soporte para más información." |
| `rechazado` | 403 | "Tu cuenta ha sido rechazada. Contacta a soporte." |
| `baja` | 403 | "Tu cuenta no está activa." |

**Archivos a crear/modificar:**
- `common/guards/estado-asociado.guard.ts` — nuevo guard
- `common/decorators/require-activo.decorator.ts` — decorador `@RequireActivo()`
- Controllers: `cupones.controller.ts`, `casos-legales.controller.ts`, `vehiculos.controller.ts`

### A.2 — App Flutter: Manejo de 403 + Banner KYC

- **Interceptor Dio**: Capturar 403 con mensaje del servidor, mostrar dialog informativo
- **Banner en Home**: Si `estado !== 'activo'`, banner persistente con mensaje contextual y botón "Completar documentos"
- **Overlay en tabs restringidas**: Si `estado !== 'activo'`, al tocar Promociones/SOS mostrar overlay "Completa tu KYC para desbloquear"
- **Archivo**: `api_client.dart`, `home_screen.dart`, widgets de overlay

</details>

---

## B. IA Bilateral — Validación de Documentos KYC

**Arquitectura de 2 capas**: La IA valida documentos tanto en la App (antes de subir) como en el CRM (análisis profundo después de subir).

### B.1 — Capa 1: Pre-validación en App (filtro rápido)

Nuevo endpoint que analiza la imagen ANTES de subirla a MinIO. Evita que lleguen al CRM fotos de paisajes, memes, o imágenes ilegibles.

**Endpoint**: `POST /documentos/pre-validar`
- Input: imagen (multipart) + `tipo` esperado (ine_frente, ine_reverso, selfie, tarjeta_circulacion)
- IA: Prompt ligero de clasificación (Claude Haiku o similar)
- Output: `{ valida: boolean, motivo?: string, advertencia?: string }`
- Si `valida: true` → la app procede a subir normalmente
- Si `valida: false` → la app muestra el motivo y NO sube

**Flutter**: Modificar `documents_screen.dart` para llamar pre-validar antes de upload. Mostrar resultado en un dialog.

**Archivos a crear/modificar:**
- `documentos.controller.ts` — nuevo endpoint `pre-validar`
- `documentos.service.ts` — método `preValidar()`
- `ai/prompts/pre-validacion-prompt.ts` — prompt ligero de clasificación
- `documents_repository.dart` — método `preValidar()`
- `documents_screen.dart` — flujo: seleccionar → pre-validar → subir

### B.2 — Capa 2: Análisis profundo en CRM (ya existe, mejorar)

El análisis profundo con Claude ya funciona. Mejoras:

- **Auto-aprobación**: Si todos los campos tienen confianza ≥ 90%, marcar documento como `aprobado` automáticamente (sin intervención manual)
- **Auto-rechazo**: Si validaciones críticas fallan (imagen ilegible, documento equivocado), marcar como `rechazado` con motivo
- **Re-análisis**: Permitir re-ejecutar análisis cuando el operador lo necesite (ya existe botón)

**Archivos a modificar:**
- `ai-analysis.service.ts` — lógica de auto-aprobación/rechazo
- `documentos.service.ts` — actualizar estado según resultado IA

### B.3 — Anti-troll: Límite de rechazos

Evitar abuso del endpoint pre-validar / upload con imágenes basura.

**Modelo nuevo**: `IntentoDocumento`
```
IntentoDocumento {
  id, asociadoId, tipo, resultado (aprobado/rechazado),
  motivoRechazo?, creadoEn
}
```

**Reglas**:
- Máx 5 rechazos por tipo por día
- Tras 5 rechazos: bloquear pre-validación por 24h para ese tipo, notificar al operador
- Tras 15 rechazos acumulados (cualquier tipo): marcar asociado para revisión manual

**Archivos a crear:**
- `schema.prisma` — modelo `IntentoDocumento`
- Migración Prisma
- `documentos.service.ts` — verificar intentos antes de pre-validar

### B.4 — CRM: Admin sube documentos por un asociado

Permitir que admin/operador suba documentos en nombre de un asociado desde el CRM.

**Endpoint**: `POST /documentos/upload-para/:asociadoId`
- Requiere permiso `documentos:subir-por-asociado`
- Misma lógica que upload normal pero usando `asociadoId` del path en vez del JWT
- Dispara análisis IA igual que el flujo normal

**Frontend**: Botón "Subir documento" en el modal de detalle del asociado.

**Archivos a crear/modificar:**
- `documentos.controller.ts` — nuevo endpoint
- `documentos.service.ts` — método `uploadParaAsociado()`
- `AsociadoDetailModal.tsx` — sección de upload

### B.5 — Notificaciones: Documentos incompletos

Cron jobs que notifican a asociados que no han completado sus documentos.

**Flujo**:
| Día | Acción |
|-----|--------|
| 3 | Push: "Faltan X documentos para activar tu cuenta" |
| 7 | Push + Email: "Tu cuenta será suspendida si no completas tus documentos" |
| 14 | Auto-suspensión: `estado → suspendido` + notificación |

**Dependencias**: Requiere que las notificaciones push funcionen (módulo `notificaciones` actualmente es stub). Implementar FCM real o al menos guardar los recordatorios en BD para que el operador los vea.

**Archivos a crear:**
- `notificaciones/notificaciones.service.ts` — implementar servicio real
- `documentos/documentos-cron.service.ts` — cron de verificación (NestJS `@Cron`)
- `schema.prisma` — tabla `Notificacion` si no existe

---

## C. Rol de Abogado / Profesional de Atención

**Problema**: El abogado es un `Proveedor` con `tipo = 'abogado'` en la BD. No tiene acceso al sistema — no ve sus casos, no puede agregar notas, depende 100% del operador.

**Solución**: Nuevo rol RBAC "Abogado" (o genérico "Profesional") con acceso al CRM limitado a sus casos.

### C.1 — Backend: Endpoints para profesional

- `GET /casos-legales/mis-casos-profesional` — Solo los casos donde el profesional es el `abogadoId` asignado
- `POST /casos-legales/:id/notas` — Agregar nota como profesional (ya existe para operador, necesita reconocer al profesional como autor)
- Filtro automático: el profesional solo ve/opera sus propios casos

**Nota**: El endpoint `GET /casos-legales/mis-casos/:id` ya existe para asociados. Se necesita uno análogo para profesionales.

### C.2 — CRM: Vista de profesional

- **Dashboard personalizado**: Solo métricas de sus casos (abiertos, cerrados, pendientes)
- **Página "Mis Casos"**: Lista filtrada con sus casos asignados
- **Detalle de caso**: Timeline de notas, agregar nota, cambiar estado (limitado: no puede cerrar sin aprobación del operador)
- **Menú reducido**: Solo Dashboard + Mis Casos (gestionado vía RBAC + menú dinámico)

### C.3 — Notificación al profesional

- Cuando le asignan un caso: notificación en campana del CRM
- Cuando el asociado agrega info: notificación
- Modelo `Notificacion` para CRM (campana en Header ya es placeholder, hacerla funcional)

**Archivos a crear/modificar:**
- `casos-legales.controller.ts` — endpoint mis-casos-profesional
- `casos-legales.service.ts` — queries filtradas por profesional
- CRM: dashboard parcial + "Mis Casos" para rol abogado

---

## D. RBAC v2 — Plantillas de Rol (Rediseño CRM)

**Contexto**: RBAC v1 está completado (Fases 1-4). La v2 unifica Rol + Menú + Permisos bajo el concepto de "Plantilla".

### D.1 — Fase 5: Backend

- Enriquecer modelo `Rol` con campos `icono`, `color`, `esPorDefecto`
- Nueva tabla `RolModuloMenu` (M:N entre Rol y ModuloMenu con campo `orden`)
- Endpoints: `GET/PUT /roles/:id/menu-items`, `POST /roles/asignar-usuarios`
- Actualizar `GET /menu` para usar `RolModuloMenu` en vez de `permisos String[]`

### D.2 — Fase 6: Frontend (3 tabs)

Reemplazar las tabs actuales (Roles + Permisos + Menú Dinámico) por:
1. **Plantillas**: CRUD de roles con ícono picker + color picker
2. **Permisos & Menú**: Configurar permisos (checkboxes) + items de menú (2 columnas drag) para un rol seleccionado
3. **Asignaciones**: Ver/asignar usuarios a cada rol (multi-select)

### D.3 — Fase 7: Consolidación

- Eliminar enum `RolUsuario` del schema (todo usa `rolId` FK)
- Eliminar campo `permisos String[]` de `ModuloMenu` (todo usa `RolModuloMenu`)
- Actualizar `PermisosGuard` bypass admin: usar nombre de rol dinámico, no enum
- Limpiar dead code: `roles.guard.ts`, `roles.decorator.ts`
- Actualizar seed con roles enriquecidos + `RolModuloMenu`

### Bugs a resolver (previos al rediseño)

| # | Bug | Detalle |
|---|-----|---------|
| B1 | Rol sin ícono/color en BD | RolesTab hardcodea colores por nombre |
| B2 | Dropdown de rol hardcodeado en UsuariosTab | No carga roles dinámicos |
| B3 | Menú no reconoce roles nuevos | `permisos String[]` no tiene FK |
| B4 | Sistema dual enum + FK en Usuario | `rol` enum + `rolId` UUID coexisten |
| B5 | PermisosGuard bypass admin usa enum | Si se elimina enum, se rompe |

---

## E. Mejoras Menores

### E.1 — API

| # | Mejora | Esfuerzo | Prioridad |
|---|--------|----------|-----------|
| E1.1 | **SMS real vía Twilio** — reemplazar bypass OTP (`000000`) | Bajo | Alta |
| E1.2 | **Rate limiting** — `@nestjs/throttler`: OTP 3/5min, Login 5/15min, General 100/min | Bajo | Alta |
| E1.3 | **Cifrar API keys de IA** — actualmente en texto plano en BD | Bajo | Media |
| E1.4 | **Ocultar providers no soportados** — Frontend muestra OpenAI/Google pero backend solo soporta Anthropic | Bajo | Baja |

### E.2 — App Flutter

| # | Mejora | Esfuerzo | Prioridad |
|---|--------|----------|-----------|
| E2.1 | **Perfil completitud** — barra de progreso en perfil (datos + docs + vehículo = 100%) | Bajo | Media |
| E2.2 | **Filtro en Mis Cupones** — tabs Activos / Canjeados / Vencidos + mini estadística "$X ahorrado" | Bajo | Media |
| E2.3 | **Mapa de proveedores** — toggle lista↔mapa en Promociones con marcadores por tipo | Medio | Baja |
| E2.4 | **Rediseño visual** — sistema de diseño expandido (paleta, gradientes, tipografía Inter, shimmer loaders) | Alto | Baja |

### E.3 — CRM Web

| # | Mejora | Esfuerzo | Prioridad |
|---|--------|----------|-----------|
| E3.1 | **Responsive tabs pendientes** — UsuariosTab, RolesTab, MenuDinamicoTab sin cardRenderer mobile | Bajo | Baja |
| E3.2 | **Dark mode en mapas** — Leaflet tiles no respetan dark mode | Bajo | Baja |
| E3.3 | **WebSockets** — dashboard y mapa SOS sin actualizaciones en tiempo real | Alto | Baja |
| E3.4 | **Migrar a React Query** — data fetching manual con useEffect+useState | Medio | Baja |

---

## Orden de Implementación Sugerido

```
Fase 1 (Alta prioridad — seguridad y lógica de negocio):
  ├─ A. KYC Guard (API + App)
  ├─ E1.1 SMS real (Twilio)
  └─ E1.2 Rate limiting (Throttler)

Fase 2 (Funcionalidad core — IA):
  ├─ B.1 Pre-validación en App
  ├─ B.2 Auto-aprobación/rechazo
  ├─ B.3 Anti-troll
  └─ B.4 Admin sube docs

Fase 3 (Roles y permisos):
  ├─ C. Rol de abogado
  └─ D. RBAC v2 (Plantillas)

Fase 4 (Mejoras y polish):
  ├─ B.5 Notificaciones docs incompletos
  ├─ E2.1 Perfil completitud
  ├─ E2.2 Filtro cupones
  └─ Resto de mejoras menores
```

---

## Referencia — Documentos originales (en `completados/`)

Estos documentos fueron consolidados aquí y movidos a `.github/completados/`:

| Documento | Contenido original |
|-----------|-------------------|
| `ANALISIS_IA.md` | Diagnóstico del módulo IA actual (Anthropic Claude) |
| `analisis_ia_bilateral_documentos.md` | Plan de IA bilateral (2 capas) + anti-troll + notificaciones |
| `analisis_sugerencias_abogado.md` | Plan rol abogado/profesional |
| `Analisis_sugerencias_para_implementar.md` | 10 sugerencias funcionales de auditoría |
| `DESIGN_PLAN_APP.md` | Plan de rediseño visual de la app Flutter |
| `DESIGN_PLAN_CRM.md` | Plan de diseño enterprise del CRM (~90% completado) |
| `PLAN_CONTINUIDAD_APP.md` | Bugs y tareas de la app (100% completado) |
| `PLAN_CONTINUIDAD_WEB.md` | Continuidad CRM con RBAC v2 pendiente |

---

## Estado del Sistema (18-mar-2026)

| Componente | Progreso | Notas |
|------------|----------|-------|
| **API** | ~98% | 73 unit + 11 e2e tests. Falta: SMS real, rate limiting |
| **CRM Web** | ~95% | 16 rutas, 60 tests. Falta: RBAC v2, responsive tabs menores |
| **App Flutter** | ~92% | 139 tests. Falta: KYC overlay, pre-validación IA, mapa proveedores |
| **Infra** | ✅ | Docker + Nginx + SSL + deploy script funcionando |

**Desplegado en**: `https://core-asoc.cbluna-dev.com`
**Último commit**: `f185ca8` — columnas Documentos y Vehículos en tabla asociados
