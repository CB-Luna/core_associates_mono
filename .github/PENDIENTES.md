# Pendientes — Core Associates

> **Última actualización**: 20 de marzo de 2026
> Documento unificado con TODO lo que falta por implementar. Consolida y reemplaza los documentos fragmentados que ahora viven en `.github/completados/`.

---

## Resumen Ejecutivo

Quedan **features críticas de RBAC dinámico**, mejoras al flujo del abogado, y módulos de vehículos. Ordenadas por impacto de negocio.

> ⚠️ **Prioridad actual**: D.3 (RBAC dinámico — bloquea roles nuevos), I (Mejoras flujo abogado CRM), J (Verificación vehicular), C.3 (App Móvil shell profesional).

| # | Feature | Impacto | Esfuerzo | Alcance |
|---|---------|---------|----------|----------|
| **A** | ~~KYC Guard — Restricción por estado~~ | ✅ Completado | — | API + App |
| **B** | ~~IA Bilateral — B.1/B.2/B.3/B.4/B.5~~ ✅ Completo | ✅ Completo | — | API + App + CRM |
| **C** | ~~Rol de Abogado — C.0/C.1/C.2/C.4~~ ✅ (falta C.3 App) | ✅ API+CRM | Pendiente App | API + CRM + App |
| **D** | RBAC v2 — Plantillas de rol | ✅ D.1+D.2 | ❌ **D.3 Consolidación CRÍTICA** | API + CRM |
| **E** | Mejoras menores (App + CRM + API) | ✅ E1.1+E1.2 | Resto pendiente | Varios |
| **F** | ~~Abogados Management CRM~~ | ✅ Completado | — | CRM |
| **G** | Experiencia Abogado — Mejoras CRM | ✅ G.1+G.3-G.6 | ❌ G.2 pendiente | API + CRM |
| **H** | IA — Hardening y guardrails | ✅ H.1-H.4 | ℹ️ H.5 informativo | API + CRM |
| **I** | **Flujo Abogado — Mejoras CRM (NUEVO)** | ❌ Pendiente | Medio-Alto | API + CRM |
| **J** | **Verificación Vehicular (NUEVO)** | ❌ Pendiente (preparación) | Medio | API + CRM + App |

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

### ~~B.1 — Capa 1: Pre-validación en App (filtro rápido)~~ ✅

> **Completado** el 19 de marzo de 2026 (commit `f5bd43b`).
> - `POST /documentos/pre-validar` con prompt ligero de clasificación
> - `PRE_VALIDACION_PROMPT`: tolerante, solo rechaza tipo incorrecto o ilegible
> - Flutter: flujo pick → preview → pre-validar IA → upload (con dialog de error si falla)
> - `documents_repository.dart`: `preValidar()` multipart

### ~~B.2 — Capa 2: Auto-aprobación/rechazo~~ ✅

> **Completado** el 19 de marzo de 2026 (commit `f5bd43b`).
> - `autoDecideDocumento()` en `ai-analysis.service.ts` tras análisis completo
> - Umbrales configurables desde ConfiguracionIA (clave `document_analyzer`)
> - Detecta fallos críticos (`es_ine_valida`, `imagen_legible`, etc.)
> - Auto-rechaza con motivo `[Auto-IA]`, auto-aprueba si confianza alta, deja `pendiente` si intermedio
> - CRM ConfAITab: sección "Validación Documental IA" con sliders umbral y campos anti-abuso

### ~~B.3 — Anti-troll: Límite de rechazos~~ ✅

> **Completado** el 19 de marzo de 2026 (commit `f5bd43b`).
> - Modelo `IntentoDocumento` (`intentos_documentos`) con migración
> - `checkAntiTroll()`: max rechazos por tipo en ventana de tiempo configurable
> - Campos en ConfiguracionIA: `maxRechazosPreval`, `horasBloqueoPreval`
> - `BadRequestException` si excede límite

### B.4 — CRM: Admin sube documentos por un asociado

> **Completado** el 18 de marzo de 2026.
> - Migración: permiso `documentos:cargar` asignado a admin y operador
> - Endpoint `POST /documentos/upload-para/:asociadoId` con `@Permisos('documentos:cargar')`
> - Método `uploadDocumentForAsociado()` valida existencia del asociado y reutiliza `uploadDocument()`
> - CRM: Botón "Subir" en sección Documentos del detalle de asociado con selector de tipo + file input

### B.5 — Notificaciones: Documentos incompletos

> **Completado** el 18 de marzo de 2026.
> - Cron service `DocumentosCronService` con `@Cron(EVERY_DAY_AT_9AM)`
> - Busca asociados (pendiente/activo) registrados hace 3+ días con documentos faltantes
> - Tipos requeridos: `ine_frente`, `ine_reverso`, `selfie`, `tarjeta_circulacion`
> - Escalación: 3+ días recordatorio amable, 7+ días recordatorio urgente
> - Usa `NotificacionesService.sendPush()` (FCM real ya funcional)

---

## ~~C. Rol de Abogado — Refactoring Completo~~ ✅ (API + CRM Web)

> **Nota**: C.3 (App Móvil — Shell del Abogado) queda pendiente como tarea separada.

### Diagnóstico del problema (resuelto)

El abogado está modelado como `Proveedor tipo='abogado'` (una entidad de empresa) en lugar de ser un **Usuario con rol RBAC "abogado"** (una persona). Esto causa:

| Defecto | Consecuencia |
|---------|-------------|
| `CasoLegal.abogadoId` → `Proveedor.id` | Se asigna un _despacho_, no un individuo |
| `RolUsuario` enum no incluye `abogado` | No se puede crear un Usuario con `rol = 'abogado'` |
| Abogado hereda menú de `proveedor` | Ve cupones/promociones en vez de casos legales |
| `DispositivoToken` solo tiene `asociadoId` | No se le pueden enviar push al abogado |
| Sin bandeja de notificaciones persistente | No hay historial de alertas para ningún usuario CRM |
| Sin acceso a app móvil | Depende 100% del operador para todo |

**Prerrequisito**: El rol "abogado" ya fue creado en la tabla `Rol` vía el configurador RBAC del CRM en producción (IONOS). Falta: migración de schema, endpoints, UI en CRM y App.

---

### ~~C.0 — Modelo de datos + Migración~~ ✅

**C.0.1 — Enum `RolUsuario`: agregar `abogado`**

```sql
ALTER TYPE "RolUsuario" ADD VALUE 'abogado';
```

Permite crear `Usuario { rol: 'abogado', rolId: <UUID del rol creado en CRM> }`.

**C.0.2 — Refactorizar `CasoLegal`: asignación individual**

Agregar campo `abogadoUsuarioId` que apunte a `Usuario.id` (el individuo), manteniendo `abogadoId` como referencia opcional a la firma (`Proveedor`).

```prisma
model CasoLegal {
  // ... campos existentes ...
  abogadoId         String?  @map("abogado_id") @db.Uuid          // Firma (Proveedor) — legacy
  abogadoUsuarioId  String?  @map("abogado_usuario_id") @db.Uuid  // Individuo (Usuario) — NUEVO
  
  abogado           Proveedor? @relation(fields: [abogadoId], references: [id])
  abogadoUsuario    Usuario?   @relation("AbogadoCasoLegal", fields: [abogadoUsuarioId], references: [id])
}
```

- La asignación ahora va al **individuo** (`abogadoUsuarioId`)
- Si el Usuario tiene `proveedorId`, se puede derivar la firma automáticamente
- `abogadoId` (Proveedor) se mantiene por retrocompatibilidad pero se depreca gradualmente

**C.0.3 — `DispositivoToken`: soporte para usuarios CRM**

```prisma
model DispositivoToken {
  asociadoId  String?  @map("asociado_id") @db.Uuid  // Hacer nullable
  usuarioId   String?  @map("usuario_id") @db.Uuid   // NUEVO — para abogados en app
  // ... resto igual ...
  
  asociado    Asociado? @relation(...)
  usuario     Usuario?  @relation(...)
}
```

Constraint: exactamente uno de `asociadoId` o `usuarioId` debe ser no-null. Validar en aplicación.

**C.0.4 — Modelo `NotificacionCRM`: bandeja persistente**

```prisma
model NotificacionCRM {
  id            String   @id @default(uuid()) @db.Uuid
  usuarioId     String   @map("usuario_id") @db.Uuid
  titulo        String   @db.VarChar(200)
  mensaje       String
  tipo          String   @db.VarChar(50)      // 'caso_asignado' | 'nota_nueva' | 'estado_cambio' | 'general'
  referenciaId  String?  @map("referencia_id") @db.Uuid  // ID del caso, asociado, etc.
  referenciaTipo String? @map("referencia_tipo") @db.VarChar(50) // 'caso_legal' | 'asociado'
  leida         Boolean  @default(false)
  createdAt     DateTime @default(now()) @map("created_at")
  
  usuario       Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  
  @@index([usuarioId, leida])
  @@index([createdAt])
  @@map("notificaciones_crm")
}
```

Sirve para **todos** los roles CRM (admin, operador, abogado) — la campana del Header pasa de placeholder a funcional.

**C.0.5 — Permisos específicos del abogado (seed/migración)**

Crear permisos en tabla `Permiso` y asignarlos al rol "abogado" vía `RolPermiso`:

| Código permiso | Grupo | Descripción |
|---|---|---|
| `casos-legales:ver-propios` | `casos-legales` | Ver solo los casos asignados al abogado |
| `casos-legales:agregar-notas` | `casos-legales` | Agregar notas a casos propios |
| `casos-legales:cambiar-estado-limitado` | `casos-legales` | Cambiar a `en_atencion`, `escalado` (no cerrar/resolver sin operador) |
| `casos-legales:aceptar-rechazar` | `casos-legales` | Aceptar o rechazar una asignación de caso |
| `casos-legales:ver-disponibles` | `casos-legales` | Ver casos sin abogado asignado para postularse |
| `notificaciones-crm:ver` | `notificaciones` | Ver sus notificaciones |
| `notificaciones-crm:marcar-leida` | `notificaciones` | Marcar notificaciones como leídas |

**C.0.6 — Menú del abogado**

Asignar vía `RolModuloMenu` (el configurador ya lo soporta):
- Dashboard (filtrado)
- Mis Casos (nuevo módulo de menú)
- Casos Disponibles (nuevo módulo de menú, opcional)
- Notificaciones (opcional si se usa solo campana)

**Archivos a crear/modificar:**
- `schema.prisma` — enum + 3 modelos modificados + 1 modelo nuevo
- `prisma/migrations/YYYYMMDD_rol_abogado_refactoring/migration.sql`
- Seed data para permisos + menú del abogado

---

### ~~C.1 — Backend: Endpoints y Servicios~~ ✅

**C.1.1 — Asignación individual de abogado (refactorizar)**

Actualizar `assignAbogado()` para aceptar un `usuarioId` (individuo) en vez de `proveedorId` (firma):

```
PUT /casos-legales/:id/asignar-abogado
Body: { abogadoUsuarioId: string }
```

- Validar que el Usuario exista, tenga `rol = 'abogado'` y `estado = 'activo'`
- Setear `abogadoUsuarioId` en el caso (y opcionalmente `abogadoId` = `usuario.proveedorId` si tiene firma)
- Crear `NotificacionCRM` para el abogado: "Se te asignó el caso {codigo}"
- Enviar push (si tiene `DispositivoToken`)
- Registrar en auditoría

**C.1.2 — Endpoints del abogado**

| Método | Ruta | Guard | Descripción |
|--------|------|-------|-------------|
| `GET` | `/casos-legales/abogado/mis-casos` | `@Permisos('casos-legales:ver-propios')` | Casos donde `abogadoUsuarioId = currentUser.id` |
| `GET` | `/casos-legales/abogado/mis-casos/:id` | `@Permisos('casos-legales:ver-propios')` | Detalle de caso propio (con notas + asociado) |
| `GET` | `/casos-legales/abogado/disponibles` | `@Permisos('casos-legales:ver-disponibles')` | Casos `abierto` sin abogado asignado |
| `POST` | `/casos-legales/:id/aceptar` | `@Permisos('casos-legales:aceptar-rechazar')` | Abogado acepta asignación |
| `POST` | `/casos-legales/:id/rechazar` | `@Permisos('casos-legales:aceptar-rechazar')` | Abogado rechaza (con motivo) → vuelve a `abierto` |
| `POST` | `/casos-legales/:id/postularse` | `@Permisos('casos-legales:ver-disponibles')` | Abogado se ofrece para un caso abierto |
| `PUT` | `/casos-legales/:id/estado-abogado` | `@Permisos('casos-legales:cambiar-estado-limitado')` | Cambiar a `en_atencion` o `escalado` (no cerrar) |
| `POST` | `/casos-legales/:id/notas` | (ya existe) | Ampliar para reconocer `autorId` de abogado |

**C.1.3 — Flujo de asignación "Dispatch Híbrido"**

Tres modos de asignación (configurable por caso):

1. **Asignación directa**: Operador elige abogado → abogado recibe push → acepta/rechaza
2. **Auto-postulación**: Caso queda en "disponibles" → abogado se postula → operador aprueba
3. **Broadcast**: Operador publica caso a todos los abogados → el primero que acepta lo toma

Meta-estados de asignación en `CasoLegal`:

| Estado caso | `abogadoUsuarioId` | Significado |
|---|---|---|
| `abierto` | null | Sin abogado, disponible para asignación |
| `abierto` | set | Asignado, pendiente de aceptación del abogado |
| `en_atencion` | set | Abogado aceptó y está atendiendo |
| `escalado` | set | Abogado escaló al operador |
| `abierto` (tras rechazo) | null | Abogado rechazó, vuelve al pool |

**C.1.4 — NotificacionesCRM: endpoints**

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/notificaciones-crm` | Bandeja del usuario logueado (paginada, filtro `leida`) |
| `GET` | `/notificaciones-crm/no-leidas/count` | Contador para badge en campana |
| `PUT` | `/notificaciones-crm/:id/leer` | Marcar como leída |
| `PUT` | `/notificaciones-crm/leer-todas` | Marcar todas como leídas |

**C.1.5 — Push a usuarios CRM (ampliar NotificacionesService)**

- `registerTokenUsuario(usuarioId, token, plataforma)` — nuevo endpoint para app del abogado
- `sendPushUsuario(usuarioId, titulo, mensaje, data)` — busca tokens en `DispositivoToken` por `usuarioId`
- Siempre crear `NotificacionCRM` al enviar push (persistencia aunque no tenga app)

**C.1.6 — Crear Usuario abogado desde CRM**

Adaptar el flujo actual de creación de usuarios (`configuracion/UsuariosTab`) para soportar `rol = 'abogado'`:
- Dropdown de rol: carga roles dinámicos desde la tabla `Rol` (no hardcodeado)
- Si `rol = 'abogado'`: opcionalmente vincular a un `proveedorId` (firma/despacho)
- No obligar a que exista un `Proveedor` — un abogado independiente no necesita firma

**Archivos a crear/modificar:**
- `casos-legales.controller.ts` — endpoints C.1.2
- `casos-legales.service.ts` — métodos del abogado + refactorizar `assignAbogado`
- `notificaciones-crm.module.ts` — nuevo módulo
- `notificaciones-crm.controller.ts` — endpoints C.1.4
- `notificaciones-crm.service.ts` — CRUD + integración con push
- `notificaciones.service.ts` — ampliar `sendPushUsuario()`
- DTOs nuevos: `PostularseDto`, `RechazarAsignacionDto`, etc.

---

### ~~C.2 — CRM Web: Vistas para el Abogado~~ ✅

**C.2.1 — Dashboard parcial**

El Dashboard existente, pero mostrando **solo métricas del abogado**:
- Mis casos activos / resueltos / pendientes de aceptar
- Últimos casos asignados
- Sin métricas globales (asociados, cupones, etc.)

Detectar `rol` del usuario desde `useAuthStore()` y filtrar las tarjetas/queries según corresponda.

**C.2.2 — Página "Mis Casos" (`/mis-casos`)**

- Tabla con los casos asginados al abogado (paginada, con búsqueda)
- Columnas: código, tipo percance, asociado, estado, prioridad, fecha asignación
- Badge de estado con colores
- Click → detalle del caso

**C.2.3 — Página "Casos Disponibles" (`/casos-disponibles`)**

- Tabla de casos `abierto` sin `abogadoUsuarioId`
- Botón "Postularme" por caso
- Visible solo si el abogado tiene permiso `casos-legales:ver-disponibles`

**C.2.4 — Detalle de caso para abogado (`/mis-casos/:id`)**

- Info del caso + datos del asociado (nombre, teléfono, vehículo)
- Timeline de notas (existentes + agregar nueva)
- Botonera: Aceptar / Rechazar (si pendiente), Escalar, cambiar a `en_atencion`
- NO puede: cerrar, resolver, reasignar, ver datos de otros casos

**C.2.5 — Campana de notificaciones (Header)**

La campana en el Header ya existe como placeholder. Hacerla funcional:
- Poll `GET /notificaciones-crm/no-leidas/count` cada 30s (o WebSocket futuro)
- Dropdown con últimas 10 notificaciones
- Click en notificación → navega al caso referenciado
- "Marcar todas como leídas"

**C.2.6 — Adaptar UsuariosTab para crear abogados**

- Dropdown de rol: cargar dinámicamente de `GET /roles` (no hardcodeado a admin/operador/proveedor)
- Campo opcional "Despacho/Firma" (vincula a Proveedor) — solo visible si rol = abogado
- Un abogado independiente no necesita firma

**Archivos a crear/modificar:**
- `src/app/(dashboard)/mis-casos/page.tsx` — nuevo
- `src/app/(dashboard)/mis-casos/[id]/page.tsx` — nuevo
- `src/app/(dashboard)/casos-disponibles/page.tsx` — nuevo
- `src/components/layout/Header.tsx` — campana funcional
- `src/components/notifications/NotificationBell.tsx` — nuevo componente
- `src/app/(dashboard)/configuracion/tabs/UsuariosTab.tsx` — adaptar dropdown rol
- `src/app/(dashboard)/dashboard/page.tsx` — filtrar por rol
- `src/lib/api-types.ts` — interfaces nuevas

---

### C.3 — App Móvil: Shell del Abogado

El abogado necesita acceso desde el celular para recibir push y ver sus casos en campo.

**C.3.1 — Login dual en la app**

La app actual solo tiene login OTP (para asociados). Agregar **login email/password** para profesionales:

- Nueva pantalla `LoginProfesionalScreen` con email + password
- Reutiliza `POST /auth/login` (mismo endpoint del CRM)
- JWT devuelve `tipo: 'usuario', rol: 'abogado'`
- Pantalla de selección: "Soy asociado" (OTP) vs "Soy profesional" (email)

**C.3.2 — Shell profesional (distinto al de asociado)**

GoRouter detecta `tipo` del JWT → redirige a shell correspondiente:

```
/login-profesional      → LoginProfesionalScreen
/profesional            → ProfesionalShell (BottomNav diferente)
  /profesional/home     → ProfesionalHomeScreen (resumen de casos)
  /profesional/casos    → MisCasosProfScreen (lista de casos asignados)
  /profesional/perfil   → PerfilProfScreen
```

Bottom nav: **Inicio** · **Mis Casos** · **Perfil**

**C.3.3 — Pantallas profesional**

| Pantalla | Contenido |
|----------|-----------|
| `ProfesionalHomeScreen` | Cards: casos activos, pendientes de aceptar, resueltos este mes. Últimas notificaciones. |
| `MisCasosProfScreen` | Lista de casos asignados con filtro por estado. Pull-to-refresh. |
| `CasoDetalleProfScreen` | Info caso + asociado + mapa + timeline notas + agregar nota + botones aceptar/rechazar/escalar |
| `PerfilProfScreen` | Datos personales, cambiar contraseña, cerrar sesión |

**C.3.4 — Push notifications para abogado**

- Al abrir la app profesional: registrar token FCM con `POST /notificaciones/register-token-usuario`
- Push al asignar caso, nueva nota del operador/asociado, cambio de estado
- Tap en push → navega al detalle del caso

**C.3.5 — Repositorios y providers**

```
features/profesional/
├── data/
│   ├── profesional_repository.dart      # Endpoints del abogado
│   └── models/
│       ├── caso_profesional.dart        # Modelo simplificado
│       └── notificacion_crm.dart
└── presentation/
    ├── providers/
    │   ├── profesional_auth_provider.dart  # Login email/password
    │   ├── mis_casos_prof_provider.dart
    │   └── notificaciones_prof_provider.dart
    └── screens/
        ├── login_profesional_screen.dart
        ├── profesional_home_screen.dart
        ├── mis_casos_prof_screen.dart
        ├── caso_detalle_prof_screen.dart
        └── perfil_prof_screen.dart
```

---

### ~~C.4 — Operador: Adaptar flujo de asignación~~ ✅

**C.4.1 — Selector de abogado individual**

El dropdown actual en el CRM muestra **Proveedores tipo=abogado** (despachos/firmas). Cambiarlo a mostrar **Usuarios con rol=abogado**:

- `GET /usuarios?rol=abogado` — lista de abogados individuales
- Dropdown muestra: "Lic. Roberto Hernández (Despacho Jurídico Lex)" o "Lic. María López (independiente)"
- Al asignar: `PUT /casos-legales/:id/asignar-abogado { abogadoUsuarioId: '...' }`

**C.4.2 — Vista de estado de asignación**

En la tabla de casos del operador, nueva columna "Asignación" con badges:
- 🔴 Sin asignar
- 🟡 Asignado (pendiente aceptación)
- 🟢 Aceptado (en atención)
- ⚪ Rechazado (necesita reasignar)

**C.4.3 — Notificaciones al operador**

- Abogado acepta/rechaza → `NotificacionCRM` al operador que asignó
- Abogado escala caso → notificación al operador
- Abogado agrega nota → notificación al operador

---

### Orden de implementación (sub-fases)

```
C.0  Modelo de datos + migración (PRIMERO — bloquea todo lo demás)
 ├── C.0.1 Enum RolUsuario + abogado
 ├── C.0.2 CasoLegal.abogadoUsuarioId
 ├── C.0.3 DispositivoToken.usuarioId
 ├── C.0.4 NotificacionCRM model
 ├── C.0.5 Seed permisos + RolPermiso
 └── C.0.6 Seed menú abogado
     ↓
C.1  Backend endpoints + servicios
 ├── C.1.1 Refactorizar asignar-abogado
 ├── C.1.2 Endpoints abogado (mis-casos, disponibles, aceptar/rechazar, postularse)
 ├── C.1.3 Dispatch Híbrido (lógica de estados)
 ├── C.1.4 NotificacionesCRM endpoints
 ├── C.1.5 Push a usuarios CRM
 └── C.1.6 Crear usuario abogado desde CRM
     ↓
C.2  CRM Web (paralelo con C.3)
 ├── C.2.1 Dashboard parcial por rol
 ├── C.2.2 Mis Casos page
 ├── C.2.3 Casos Disponibles page
 ├── C.2.4 Detalle caso (abogado view)
 ├── C.2.5 Campana notificaciones
 └── C.2.6 UsuariosTab: crear abogados
     ↓
C.3  App Móvil (paralelo con C.2)
 ├── C.3.1 Login profesional (email/password)
 ├── C.3.2 Shell profesional (GoRouter)
 ├── C.3.3 Pantallas profesional
 ├── C.3.4 Push notifications
 └── C.3.5 Repos + providers
     ↓
C.4  Operador: adaptar asignación
 ├── C.4.1 Selector abogado individual
 ├── C.4.2 Vista estado asignación
 └── C.4.3 Notificaciones cruzadas
```

---

## D. RBAC v2 — Plantillas de Rol (Rediseño CRM)

**Contexto**: RBAC v1 está completado (Fases 1-4). La v2 unifica Rol + Menú + Permisos bajo el concepto de "Plantilla".

### ~~D.1 — Fase 5: Backend~~ ✅

> **Auditado 21-mar-2026** — TODO COMPLETADO.
> - Modelo `Rol` tiene `icono`, `color`, `esPorDefecto`, `esProtegido`, `temaIdPorDefecto` en schema.prisma
> - Tabla `RolModuloMenu` (M:N con `orden`) existe y funciona
> - Endpoints implementados: `GET/PUT /roles/:id/menu-items`, `PUT /roles/:id/permisos`, `POST /roles/:id/asignar-usuarios`, CRUD completo
> - `GET /menu` usa `RolModuloMenu` con fallback a `permisos String[]` (compatibilidad)

### ~~D.2 — Fase 6: Frontend (3 tabs)~~ ✅

> **Auditado 21-mar-2026** — TODO COMPLETADO. Existen 6 tabs en `/configuracion`:
> - `PlantillasPanel.tsx` — CRUD de roles con ícono picker + color picker
> - `PermisosMenuPanel.tsx` — Checkboxes de permisos + items de menú
> - `AsignacionesPanel.tsx` — Asignar usuarios a roles (multi-select)
> - `RolesTab.tsx`, `RolesAdminTab.tsx`, `PermisosTab.tsx` — Vista legacy + nueva unificada

### D.3 — Fase 7: Consolidación ❌ PENDIENTE — **PRIORIDAD CRÍTICA**

> **Problema en producción** (detectado 20-mar-2026): Los roles nuevos creados en el configurador RBAC **no funcionan correctamente**. Al crear un rol custom (ej. "Supervisor") y asignar un usuario, el Header muestra "Operador" porque el enum `RolUsuario` solo tiene 4 valores. El Dashboard queda vacío porque `usePermisos()` no matchea `esAdmin/esOperador/esProveedor/esAbogado`. Los permisos del rol SÍ se cargan correctamente — el problema es que **todo el frontend depende del enum hardcodeado**.

**Impacto**: Bloquea la creación de roles custom (feature clave del configurador RBAC).

**Problema detallado**:

| Componente afectado | Qué lee | Qué debería leer |
|---|---|---|
| **Header.tsx** `rolLabels` | `user.rol` (enum) → lookup en mapa estático de 4 entradas | Nombre del `Rol` dinámico desde la tabla Rol (vía `rolId`) |
| **permisos.ts** `usePermisos()` | `user.rol === 'abogado'` etc. → booleans hardcodeados | `user.permisos[]` para todo + nombre de rol para display |
| **dashboard/page.tsx** | `esAbogado` / `esProveedor` → dashboard específico | **Permisos granulares** por widget (ej. `dashboard:metricas-generales`, `dashboard:metricas-abogado`) |
| **auth.service.ts** `createUser()` | `validEnumValues = ['admin','operador','proveedor','abogado']` → si no matchea, usa fallback | Eliminar enum, asignar solo `rolId` (FK a tabla Rol) |
| **PermisosGuard** bypass admin | `user.rol === 'admin'` | `user.permisos.includes(...)` o flag `esAdmin` derivado del Rol |

**Solución completa** (múltiples sub-tareas):

- **D.3.1** — Endpoint `/auth/login` y `/auth/otp/verify`: incluir en la respuesta `rolNombre` (label del Rol dinámico) además de `rol` (enum)
- **D.3.2** — `auth-store.ts`: almacenar `rolNombre` y `rolId`
- **D.3.3** — `Header.tsx`: mostrar `user.rolNombre` en vez de lookup estático
- **D.3.4** — `usePermisos()`: eliminar booleans por enum, derivar capacidades de `user.permisos[]`
- **D.3.5** — `dashboard/page.tsx`: seleccionar dashboard por **permisos** (no por rol enum)
  - Crear permisos: `dashboard:metricas-generales`, `dashboard:metricas-casos`, `dashboard:metricas-cupones`, `dashboard:metricas-abogado`, `dashboard:metricas-proveedor`, `dashboard:graficos`
  - Dashboard compuesto: muestra cada sección si el rol tiene el permiso correspondiente
- **D.3.6** — Backend: eliminar enum `RolUsuario`, campo `Usuario.rol` → `String` derivado de `Rol.nombre` (o mejor: eliminar y usar solo `rolId`)
- **D.3.7** — `PermisosGuard`: determinar admin vía flag `Rol.esProtegido` + nombre `'admin'` en tabla Rol, no via enum
- **D.3.8** — Eliminar campo `permisos String[]` de `ModuloMenu` (legacy fallback)
- **D.3.9** — Seed: crear `RolModuloMenu` entries para roles por defecto (admin, operador, proveedor, abogado)

### Bugs a resolver (previos al rediseño)

| # | Bug | Detalle | Estado |
|---|-----|---------|--------|
| B1 | ~~Rol sin ícono/color en BD~~ | ~~RolesTab hardcodea colores por nombre~~ | ✅ UsuariosTab ahora usa `rol.icono`/`rol.color` dinámicos desde DB vía `getIcon()` |
| B2 | Dropdown de rol hardcodeado en UsuariosTab | No carga roles dinámicos | Pendiente (D.3) |
| B3 | ~~Menú no reconoce roles nuevos~~ | ~~`permisos String[]` no tiene FK~~ | ✅ Sidebar `filterByRole()` eliminado — se confía en RolModuloMenu del API |
| B4 | Sistema dual enum + FK en Usuario | `rol` enum + `rolId` UUID coexisten | Pendiente (D.3) |
| B5 | PermisosGuard bypass admin usa enum | Si se elimina enum, se rompe | Pendiente (D.3) |
| B6 | **Header muestra nombre de enum, no nombre de rol dinámico** | `rolLabels` hardcodeado → roles nuevos aparecen como "Operador" | Pendiente (D.3.3) |
| B7 | **Dashboard vacío para roles custom** | No matchea `esAbogado`/`esProveedor` → no renderiza nada | Pendiente (D.3.5) |
| B8 | **Falta eye icon en contraseña de crear usuario** | Login lo tiene, UsuariosTab no | Pendiente (E3.5) |
| B9 | **Mapa SOS clickeable sin control de permiso** | Abogado puede navegar a detalle de caso y asignar/modificar | Pendiente (I.1) |

---

## E. Mejoras Menores

### E.1 — API

| # | Mejora | Esfuerzo | Prioridad | Estado |
|---|--------|----------|-----------|--------|
| E1.1 | **SMS real vía Twilio** — ✅ `SmsService` con Twilio ya implementado + fallback a console log. **Bypass OTP `000000` se conserva intencionalmente** (números demo + entorno dev) hasta compra del proyecto | Bajo | — | ✅ Implementado (bypass intencional) |
| E1.2 | **Rate limiting** — `@nestjs/throttler`: global 100/min + endpoints auth 5/min | Bajo | — | ✅ Implementado |
| E1.3 | **Cifrar API keys de IA** — AES-256-GCM con `AI_ENCRYPTION_KEY` env var. Backward-compatible. | Bajo | Media | ✅ Implementado (H.1) |
| E1.4 | **Ocultar providers no soportados** — Solo Anthropic visible en ConfAITab | Bajo | Baja | ✅ Implementado (H.3) |

### E.2 — App Flutter

| # | Mejora | Esfuerzo | Prioridad | Estado |
|---|--------|----------|-----------|--------|
| E2.1 | **Perfil completitud** — `DocumentProgress` widget da crédito parcial (50%) a docs pendientes de revisión + 100% a aprobados | Bajo | Media | ✅ Implementado |
| E2.2 | **Filtro en Mis Cupones** — tabs Activos / Canjeados / Vencidos + mini estadística "$X ahorrado" | Bajo | Media | ❌ Pendiente |
| E2.3 | **Mapa de proveedores** — toggle lista↔mapa en Promociones con marcadores por tipo | Medio | Baja | ❌ Pendiente |
| E2.4 | **Rediseño visual** — sistema de diseño expandido (paleta, gradientes, tipografía Inter, shimmer loaders) | Alto | Baja | ❌ Pendiente |

### E.3 — CRM Web

| # | Mejora | Esfuerzo | Prioridad | Estado |
|---|--------|----------|-----------|--------|
| E3.1 | **Responsive tabs pendientes** — UsuariosTab, RolesTab, MenuDinamicoTab sin cardRenderer mobile | Bajo | Baja | ❌ Pendiente |
| E3.2 | **Dark mode en mapas** — Leaflet tiles no respetan dark mode | Bajo | Baja | ❌ Pendiente |
| E3.3 | **WebSockets** — dashboard y mapa SOS sin actualizaciones en tiempo real | Alto | Baja | ❌ Pendiente |
| E3.4 | **Migrar a React Query** — data fetching manual con useEffect+useState | Medio | Baja | ❌ Pendiente |
| E3.5 | **Eye icon en password de crear usuario** — Toggle visibilidad en UsuariosTab y NuevoAbogadoDialog | Bajo | Media | ❌ Pendiente |

---

## G. Experiencia Abogado — Mejoras Pendientes (21-mar-2026)

Features solicitadas para completar la experiencia del rol abogado en el CRM y preparar su extensión a la app móvil.

### ~~G.1 — Crear abogados desde Abogados page (modal)~~ ✅

> **Implementado** el 22 de marzo de 2026.
> - `NuevoAbogadoDialog.tsx` — modal con nombre, email, especialidad (dropdown 7 opciones), contraseña
> - Fetch dinámico de roles (`GET /roles`) para obtener `rolId` del rol abogado
> - POST a `POST /auth/register-admin` con `{ nombre, email, password, rolId, especialidad }`
> - `CreateUsuarioDto` actualizado para aceptar campo `especialidad`
> - `auth.service.ts` `createUser()` pasa `especialidad` a Prisma
> - Botón "Nuevo Abogado" en toolbar de `/abogados`, refresh automático tras crear

### G.2 — Más campos para abogado ❌ PENDIENTE

Ampliar el modelo de abogado con campos adicionales:
- `direccion` — dirección de contacto
- `telefono` — teléfono directo
- `cedula` — cédula profesional
- Requiere migración Prisma + actualizar DTOs + formularios CRM

> **Auditoría**: El modelo `Usuario` solo tiene `especialidad` para diferenciar abogados. No hay campos `direccion`, `telefono`, `cedula` en el schema.

**Esfuerzo**: Bajo-Medio | **Prioridad**: Media

### ~~G.3 — Dashboard con widgets controlados por rol~~ ✅

> **Auditado 21-mar-2026** — COMPLETADO.
> - Dashboard detecta `esAbogado` y carga `DashboardAbogado` con endpoint `/reportes/dashboard-abogado`
> - También diferencia `esProveedor` → `DashboardProveedor` y admin/operador → `DashboardAdmin`
> - Cada rol ve su propio dashboard con métricas relevantes

### ~~G.4 — Flujo de aceptación de casos para abogado~~ ✅

> **Auditado 21-mar-2026** — COMPLETADO.
> - Endpoints: `POST /casos-legales/:id/aceptar` (cambia a `en_atencion`), `POST /:id/rechazar` (limpia `abogadoUsuarioId`), `POST /:id/postularse` (nota de postulación)
> - Permisos: `casos-legales:aceptar-rechazar`
> - Notificaciones a operadores al aceptar/rechazar/postularse
> - Nota automática con motivo de rechazo

### ~~G.5 — Pantallas de seguimiento de caso (abogado)~~ ✅

> **Auditado 21-mar-2026** — COMPLETADO.
> - Página `/mis-casos/[id]` con header (código, tipo, fecha apertura, badge estado)
> - Botones de acción: Aceptar/Rechazar (caso abierto), Escalar (caso en_atencion)
> - Timeline de notas con formulario "Agregar nota" (POST a `/casos-legales/:id/notas`)
> - Mapa del caso con coordenadas GPS
> - `CambiarEstadoAbogadoDto` limita estados a `en_atencion | escalado`
> - Subir documentos al caso: **NO implementado** (pendiente menor)

### ~~G.6 — Notificaciones CRM para abogado~~ ✅

> **Auditado 21-mar-2026** — COMPLETADO.
> - Trigger: al asignar caso a abogado → `notificarOperadores()` notifica admin+operadores
> - Trigger: aceptar caso → notifica operadores "El abogado aceptó el caso"
> - Trigger: rechazar caso → notifica operadores con motivo
> - Trigger: escalar caso → notifica operadores "El abogado escaló el caso"
> - Servicio `NotificacionesCrmService` con findAll, countNoLeidas, marcarLeida, marcarTodasLeidas
- Mostrar badge contador en campana del header

**Esfuerzo**: Medio | **Prioridad**: Media

---


> **Completado** el 20 de marzo de 2026.

- ✅ **Migración**: `20260320100000_abogado_especialidad` — campo `especialidad` en usuarios + menú "Abogados" + asignación a admin/operador
- ✅ **API endpoints**: `GET /auth/users/abogados` (paginado, búsqueda, filtro estado) + `GET /auth/users/abogados/:id` (detalle con breakdown de casos)
- ✅ **DTO**: `UpdateUsuarioDto` acepta `especialidad` + servicio `updateUser()` actualizado
- ✅ **CRM lista** (`/abogados`): DataTable con avatar, especialidad, casos activos, estado, último acceso. Mobile cardRenderer.
- ✅ **CRM detalle** (`/abogados/[id]`): Perfil con editor de especialidad, stats grid, breakdown por estado, tabla de casos recientes clickeables.
- ✅ **Tipos**: `AbogadoCRM` + `AbogadoDetalle` en `api-types.ts`
- ✅ **Menú**: Ítem dinámico "Abogados" (icono Gavel, orden 7) asignado a admin y operador vía `RolModuloMenu`
- ✅ **Breadcrumbs**: `/abogados` → "Abogados" en Header
- ✅ **Seed**: actualizado con nuevo menú + orden corregido

---

## Orden de Implementación Sugerido

```
Fase 1 (Completada ✅):
  ├─ A. KYC Guard (API + App) ✅
  ├─ B.1 Pre-validación en App ✅
  ├─ B.2 Auto-aprobación/rechazo ✅
  └─ B.3 Anti-troll ✅

Fase 2 (Completada ✅ — API + CRM):
  ├─ C.0 Modelo de datos + migración ✅
  ├─ C.1 Backend: endpoints abogado + notificaciones CRM ✅
  ├─ C.2 CRM Web: vistas abogado + campana notificaciones ✅
  ├─ C.4 Operador: adaptar asignación ✅
  └─ F. Abogados Management CRM ✅

Fase 3 (Completada ✅):
  ├─ E1.1 SMS real (Twilio) ✅
  ├─ E1.2 Rate limiting (Throttler) ✅
  ├─ B.4 Admin sube docs por asociado ✅
  ├─ B.5 Notificaciones docs incompletos ✅
  └─ D.1 + D.2 RBAC v2 Backend + Frontend ✅

Fase 4 — RBAC Dinámico (SIGUIENTE PRIORIDAD):
  ├─ D.3 Consolidación RBAC (eliminar dependencia de enum)
  │   ├─ D.3.1 Login response incluye rolNombre
  │   ├─ D.3.2 auth-store almacena rolNombre
  │   ├─ D.3.3 Header muestra rolNombre dinámico
  │   ├─ D.3.4 usePermisos() sin booleans hardcodeados
  │   ├─ D.3.5 Dashboard por permisos granulares (no por rol)
  │   ├─ D.3.6 Eliminar enum RolUsuario → solo rolId
  │   ├─ D.3.7 PermisosGuard sin bypass hardcodeado
  │   ├─ D.3.8 Eliminar permisos String[] de ModuloMenu
  │   └─ D.3.9 Seed RolModuloMenu entries
  └─ E3.5 Eye icon en password crear usuario (rápido)

Fase 5 — Flujo Abogado Completo:
  ├─ I.1 Mapa SOS: control de permisos
  ├─ I.2 Mis Casos: info completa asociado + mapa
  ├─ I.3 Casos Disponibles: info asociado
  ├─ I.4 Documentos del caso: subida + solicitud
  ├─ I.5 Eye icon contraseña
  └─ G.2 Más campos abogado (direccion, telefono, cedula)

Fase 6 — App Móvil + Verificación:
  ├─ C.3 App Móvil: shell profesional + push
  ├─ J.1 Estado verificación por vehículo (preparación)
  └─ J.2 UX progresivo de verificación vehicular

Fase 7 (Polish):
  ├─ E2.2 Filtro cupones (completar TabBar) ❌
  ├─ J.3 Relaciones vehículo-operaciones (futuro)
  └─ Resto de mejoras menores (E2.3, E2.4, E3.1-E3.4) ❌
```

---

## H. IA — Hardening y Guardrails (NUEVA — 21-mar-2026)

Auditoría del módulo de IA reveló que la funcionalidad base está **completamente implementada y funcional**, pero faltan hardening y guardrails de seguridad.

### Estado actual de la IA ✅

| Componente | Estado |
|---|---|
| **Trigger automático** | ✅ Al subir documento (`POST /documentos`) se dispara `analyzeDocument()` fire-and-forget |
| **Análisis con Claude Vision** | ✅ `ai.service.ts` → POST a `api.anthropic.com` con imagen base64 + prompt específico |
| **Prompts por tipo** | ✅ `ine-prompt.ts` (frente + reverso), `vehicle-prompt.ts`, `selfie-prompt.ts`, `pre-validacion-prompt.ts` |
| **Auto-aprobación/rechazo** | ✅ `autoDecideDocumento()` con umbrales configurables (default: ≥90% aprueba, <40% rechaza) |
| **Anti-troll** | ✅ Límite de rechazos pre-validación + bloqueo temporal (configurable) |
| **CRM: Panel de análisis** | ✅ `AIAnalysisPanel.tsx` visible en detalle de asociado, modal de asociado, y lista de documentos |
| **CRM: Config de IA** | ✅ `ConfAITab.tsx` — CRUD configs, sliders de umbrales, API key, modelo, temperatura |
| **API Key** | ⚠️ Prioridad: BD (`ConfiguracionIA.apiKey`) → fallback env var `ANTHROPIC_API_KEY` |
| **Obtención de API key** | ⚠️ Si no hay registro en `ConfiguracionIA` NI env var → error silencioso, IA no funciona |

### Dónde es visible la IA en el CRM

1. **Configuración → pestaña IA**: Gestión completa de API keys, modelos, umbrales
2. **Detalle de Asociado** (`/asociados/[id]`): Panel `AIAnalysisPanel` junto a cada documento
3. **Modal de Asociado** (`AsociadoDetailModal`): Panel AI en sección documentos
4. **Lista de Documentos** (`/documentos`): Panel AI por cada documento expandido
5. Botones "Analizar con IA" y "Re-analizar" disparan análisis manual desde CRM

### ~~H.1 — Cifrar API keys en BD~~ ✅

> **Implementado** el 22 de marzo de 2026.
> - `common/utils/crypto.util.ts` — AES-256-GCM encrypt/decrypt con `AI_ENCRYPTION_KEY` env var
> - Formato: `enc:iv_hex:tag_hex:ciphertext_hex` con detección automática via prefijo `enc:`
> - `ai-config.controller.ts`: cifra en create/update, máscara `🔒 ••••(cifrada)` en GET
> - `ai.service.ts`: descifra en `getApiKey()` al leer de BD
> - Backward-compatible: sin env var o keys sin prefijo `enc:` siguen funcionando en texto plano
> - **Requiere**: agregar `AI_ENCRYPTION_KEY` al `.env` de producción para activar cifrado

### ~~H.2 — Inyectar `promptSistema` en llamadas~~ ✅

> **Implementado** el 22 de marzo de 2026.
> - `getConfig()` ahora retorna `promptSistema: dbConfig?.promptSistema || null`
> - Body de la petición a Anthropic incluye `system: config.promptSistema` (condicional)
> - El prompt del CRM ahora sí se inyecta en el análisis de documentos

### ~~H.3 — Ocultar providers no soportados~~ ✅

> **Implementado** el 22 de marzo de 2026.
> - `AI_PROVIDERS` en `ConfAITab.tsx` reducido a solo `anthropic`
> - OpenAI y Google removidos del dropdown hasta que se implemente multi-provider

### ~~H.4 — Seed de `ConfiguracionIA`~~ ✅

> **Implementado** el 22 de marzo de 2026.
> - `seed-demo.ts` incluye `prisma.configuracionIA.upsert()` para clave `document_analyzer`
> - Provider `anthropic`, modelo `claude-sonnet-4-5-20250929`, umbrales default (0.90/0.40)
> - maxRechazos 5, horasBloqueo 24, promptSistema descriptivo
> - Sin API key en seed (se configura vía CRM o env var)

### H.5 — Content filtering / guardrails para chat futuro ℹ️ INFORMATIVO

Actualmente **NO existe** un endpoint de chat/conversacional. La IA se usa **solo para análisis de documentos** (Claude Vision). Los prompts son cerrados y específicos ("analiza esta INE y devuelve JSON").

**Para un chat futuro** (si se implementa):
- Necesitará system prompt con restricciones de tema ("Solo contestas sobre trámites de la asociación")
- Input sanitization contra prompt injection
- Output validation contra respuestas off-topic
- Rate limiting por usuario
- Logging de conversaciones para auditoría

**Estado**: No aplica aún — no hay chat. Cuando se implemente, agregar guardrails desde el inicio.

---

## I. Flujo Abogado — Mejoras CRM (NUEVO — 20-mar-2026)

Hallazgos de pruebas en producción. El rol abogado tiene las pantallas base pero le faltan herramientas operativas para dar seguimiento real a los casos.

### I.1 — Mapa SOS: Control de permisos en interacción ❌ PENDIENTE

**Problema**: Al hacer clic en un marcador del Mapa SOS, cualquier rol puede ver el panel lateral y navegar a "Ver detalle completo" del caso. Un abogado podría ver el detalle y modificar casos que no son suyos (asignar, cambiar estado, etc.).

**Solución**:
- **Permiso nuevo**: `mapa-sos:ver-detalle-caso` — controla si el clic en marcador permite navegar al detalle
- **Permiso nuevo**: `mapa-sos:interactuar` — controla si los marcadores del mapa son clickeables (para roles que solo necesitan ver el mapa de forma pasiva)
- `mapa-sos/page.tsx`: verificar `puede('mapa-sos:ver-detalle-caso')` antes de mostrar el botón "Ver detalle completo"
- Si el abogado no tiene el permiso, el panel lateral muestra info resumida pero **sin** link al detalle ni capacidad de asignar
- Alternativamente: si es abogado y el caso es suyo → permitir, si no es suyo → solo ver

**Archivos**: `mapa-sos/page.tsx`, migración permisos, seed

**Esfuerzo**: Bajo | **Prioridad**: Alta

### I.2 — Mis Casos: Info completa del asociado + mapa ❌ PENDIENTE

**Problema**: La tabla de "Mis Casos" del abogado solo muestra el nombre del asociado. Para dar seguimiento real, el abogado necesita **datos de contacto y ubicación del incidente**.

**Solución — Detalle de caso para abogado** (`/mis-casos/[id]`):

Agregar/mejorar las siguientes secciones:

| Sección | Datos | Estado actual |
|---------|-------|---------------|
| **Asociado** | Nombre completo, teléfono, email, foto de perfil (avatar) | Solo nombre + teléfono (parcial) |
| **Mapa del incidente** | Mapa embebido con marcador en coordenadas GPS del caso | ✅ Ya existe en detalle |
| **Vehículo involucrado** | Marca, modelo, año, placas, foto, si es principal | ✅ Ya existe parcial |
| **Documentos del caso** | Archivos adjuntos subidos por asociado/operador | ❌ No existe |
| **Botón "Contactar"** | Abrir enlace tel:+52... o mailto: para contactar rápido | ❌ No existe |
| **Solicitar documentos** | Botón para pedir al asociado que suba algo (ej. acta, parte de hechos) | ❌ No existe |

**Para la tabla** `/mis-casos`:
- Agregar columna con ícono de teléfono clickeable (tel:)
- Agregar botón/icono de mapa que abra un mini-modal con el marcador de ubicación

**Archivos**: `mis-casos/page.tsx`, `mis-casos/[id]/page.tsx`, API: incluir más datos del asociado en response

**Esfuerzo**: Medio | **Prioridad**: Alta

### I.3 — Casos Disponibles: Info del asociado visible ❌ PENDIENTE

**Problema**: La tabla de "Casos Disponibles" no muestra datos del asociado (solo descripción y ubicación textual). Para que el abogado decida si postularse, necesita contexto mínimo.

**Solución**:
- Agregar columna "Asociado" (nombre + avatar miniatura)
- Agregar botón mapa que abre mini-modal con ubicación del incidente
- No mostrar teléfono/email (se revela solo **después de aceptar** el caso, por privacidad)

**Archivos**: `casos-disponibles/page.tsx`

**Esfuerzo**: Bajo | **Prioridad**: Media

### I.4 — Documentos del caso: subida y solicitud ❌ PENDIENTE

**Problema**: No existe un mecanismo para que el abogado **suba documentos al caso** (actas, dictámenes, fotos de evidencia) ni para **solicitar documentos al asociado** (que el asociado reciba una notificación pidiéndole que suba algo específico).

**Solución**:

**I.4.1 — Documentos adjuntos al caso (subida directa)**
- Nuevo modelo `DocumentoCaso` vinculado a `CasoLegal`:
  ```prisma
  model DocumentoCaso {
    id          String   @id @default(uuid()) @db.Uuid
    casoId      String   @map("caso_id") @db.Uuid
    nombre      String   @db.VarChar(200)
    tipo        String   @db.VarChar(50)  // 'acta', 'dictamen', 'foto_evidencia', 'parte_hechos', 'otro'
    url         String
    subidoPorId String   @map("subido_por_id") @db.Uuid
    subidoPorTipo String @map("subido_por_tipo") @db.VarChar(20) // 'usuario' | 'asociado'
    createdAt   DateTime @default(now()) @map("created_at")
    
    caso        CasoLegal @relation(fields: [casoId], references: [id], onDelete: Cascade)
    @@map("documentos_caso")
  }
  ```
- Endpoint: `POST /casos-legales/:id/documentos` — sube archivo a MinIO bucket `core-associates-legal`
- Endpoint: `GET /casos-legales/:id/documentos` — lista documentos del caso
- UI en CRM: sección "Documentos del caso" en detalle con botón "Subir documento" + lista de existentes
- El abogado y el operador pueden subir; el asociado sube desde la app

**I.4.2 — Solicitar documentos al asociado**
- Nuevo modelo `SolicitudDocumento`:
  ```prisma
  model SolicitudDocumento {
    id           String   @id @default(uuid()) @db.Uuid
    casoId       String   @map("caso_id") @db.Uuid
    asociadoId   String   @map("asociado_id") @db.Uuid
    tipo         String   @db.VarChar(50)   // tipo de doc solicitado
    descripcion  String?                     // descripción libre de qué se necesita
    estado       String   @default("pendiente") @db.VarChar(20) // pendiente | entregado | vencido
    solicitadoPorId String @map("solicitado_por_id") @db.Uuid
    documentoCasoId String? @map("documento_caso_id") @db.Uuid // referencia al doc entregado
    createdAt    DateTime @default(now()) @map("created_at")
    
    caso         CasoLegal @relation(fields: [casoId], references: [id])
    @@map("solicitudes_documento")
  }
  ```
- Endpoint: `POST /casos-legales/:id/solicitar-documento` — crea solicitud + envía push al asociado
- App Flutter: pantalla de "Documentos solicitados" donde el asociado ve qué le piden y sube directamente
- Al subir, la solicitud se marca como `entregado` y se vincula al `DocumentoCaso`

**Archivos**: `schema.prisma`, migración, `casos-legales.service.ts`, `casos-legales.controller.ts`, CRM `mis-casos/[id]/page.tsx`, App Flutter feature nueva

**Esfuerzo**: Alto | **Prioridad**: Media-Alta

### I.5 — Toggle de visibilidad de contraseña en crear usuario ❌ PENDIENTE

**Problema**: El formulario de crear usuario en UsuariosTab no tiene el icono de ojito (Eye/EyeOff) para mostrar/ocultar la contraseña. El login sí lo tiene.

**Solución**: Agregar toggle Eye/EyeOff idéntico al del login en el campo password de UsuariosTab (y en NuevoAbogadoDialog.tsx si aplica).

**Archivos**: `UsuariosTab.tsx`, `NuevoAbogadoDialog.tsx`

**Esfuerzo**: Bajo | **Prioridad**: Baja (UX)

---

## J. Verificación Vehicular — Tarjeta de Circulación por Vehículo (NUEVO — 20-mar-2026)

> **Contexto estratégico**: La app permite registrar múltiples vehículos con uno como "principal". El KYC actual pide tarjeta de circulación como documento de asociado (tipo `tarjeta_circulacion`), pero no la vincula a un vehículo específico. El análisis indica que la tarjeta de circulación es un **documento del vehículo** (prueba de pertenencia legal + identificación en SOS + anti-fraude), no del usuario.
>
> **Nota**: El cliente NO ha dado detalle funcional exacto sobre vehículos aún. Estas tareas son **preparatorias** — implementar progresivamente cuando haya claridad del negocio.

### J.1 — Estado de verificación por vehículo ❌ PENDIENTE (preparación)

**Problema actual**: No hay forma de saber si un vehículo está "verificado" (con tarjeta de circulación) o no. Todos los vehículos se tratan igual.

**Solución — Modelo de datos**:
```prisma
model Vehiculo {
  // ... campos existentes ...
  verificado          Boolean  @default(false)
  documentoTarjetaUrl String?  @map("documento_tarjeta_url")
  fechaVerificacion   DateTime? @map("fecha_verificacion")
}
```

- Al subir tarjeta de circulación, vincularla al vehículo (no solo al asociado)
- IA pre-valida y extrae placas → cross-reference con las placas registradas del vehículo
- Badge visual en CRM y App: 🔒 "No verificado" / ✅ "Verificado"

### J.2 — Flujo UX progresivo ❌ PENDIENTE (preparación)

**Paso 1** (registro KYC): Asociado sube 1 vehículo (principal) + tarjeta de circulación = obligatorio.

**Paso 2** (post-aprobación): Puede agregar más vehículos. Cada uno se crea como "no verificado". UI muestra banner: "⚠️ Este vehículo no está verificado. Sube la tarjeta de circulación para habilitarlo."

**Paso 3** (activación): Para usar un vehículo en SOS o cupones, requiere estar verificado. Si selecciona vehículo no verificado para SOS → diálogo "Este vehículo no está verificado. Para tu protección legal, sube la tarjeta de circulación. ¿Continuar de todos modos?"

### J.3 — Relaciones vehículo-operaciones ❌ PENDIENTE (futuro)

Vincular vehículos a operaciones para analytics y trazabilidad:
- `CasoLegal.vehiculoId` — ¿con cuál vehículo ocurrió el incidente?
- `Cupon.vehiculoId` — ¿para cuál vehículo se usó el beneficio?
- Historial de incidentes por vehículo (scoring futuro)
- Dashboard: "Vehículos más problemáticos", "Zonas por tipo de vehículo"

### J.4 — Análisis de impacto (para decisión futura)

| Aspecto | Valor |
|---------|-------|
| **Validación legal (KYC)** | La tarjeta vincula al usuario con un vehículo real → conductor verificable |
| **SOS con contexto** | Abogado recibe placas verificadas + identificación inmediata → reduce tiempo de respuesta |
| **Historial por vehículo** | Scoring de riesgo, análisis por unidad operativa |
| **Beneficios específicos** | Descuentos por tipo de vehículo (sedán, moto, taxi), promos por marca/modelo |
| **Anti-fraude** | Sin verificación, alguien podría registrar vehículos fake para generar cupones múltiples |

**Recomendación**: Implementar J.1 como migración preparatoria (agregar campos al modelo) y J.2 como UX. J.3 espera claridad del cliente.

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

## Estado del Sistema (20-mar-2026)

| Componente | Progreso | Notas |
|------------|----------|-------|
| **API** | ~97% | Todo funcional. Falta: D.3 consolidación RBAC (eliminar enum), I.4 documentos caso, J.1 verificación vehicular |
| **CRM Web** | ~95% | 18+ rutas. Falta: D.3 RBAC dinámico (Header, Dashboard, usePermisos), I.1-I.5 flujo abogado completo, E3.5 eye icon |
| **App Flutter** | ~93% | 139 tests. Falta: C.3 shell profesional, E2.2 filtro cupones, J.2 UX verificación vehicular |
| **Infra** | ✅ | Docker + Nginx + SSL + deploy script funcionando. Desplegado commit `0dc108d` |
| **IA** | ~98% | Documentos ✅, Auto-decide ✅, Anti-troll ✅, Cifrado ✅. Pendiente: H.5 (chat futuro, informativo) |

**Desplegado en**: `https://core-asoc.cbluna-dev.com` (commit `0dc108d` — 20-mar-2026)

### Problemas detectados en producción (20-mar-2026)

| # | Problema | Causa raíz | Severidad | Tarea |
|---|----------|-----------|-----------|-------|
| P1 | Roles nuevos creados en configurador no funcionan — Header muestra "Operador" | Todo depende del enum `RolUsuario` (4 valores fijos). Roles custom no encajan. | **Crítica** | D.3 |
| P2 | Dashboard vacío para roles custom | `usePermisos()` usa booleans hardcodeados (`esAbogado`, etc.). Rol custom no matchea ninguno. | **Crítica** | D.3.5 |
| P3 | No hay eye icon en password al crear usuario | Inconsistencia UX — login sí tiene, crear usuario no | **Baja** | E3.5 |
| P4 | Mapa SOS clickeable sin restricción de permisos | Abogado puede ver detalle de caso ajeno y potencialmente modificar | **Alta** | I.1 |
| P5 | Mis Casos: falta info completa del asociado | Abogado no ve teléfono, email, foto, ni mapa del incidente | **Alta** | I.2 |
| P6 | Casos Disponibles: no muestra datos del asociado ni mapa | Abogado no puede evaluar si postularse sin contexto | **Media** | I.3 |
| P7 | No hay mecanismo de documentos adjuntos al caso | Abogado no puede subir ni solicitar documentos al asociado | **Media-Alta** | I.4 |

### Cambios implementados (22-mar-2026)

| Tarea | Descripción | Archivos |
|-------|-------------|----------|
| H.1 | Cifrado AES-256-GCM de API keys IA | `crypto.util.ts` (nuevo), `ai-config.controller.ts`, `ai.service.ts` |
| H.2 | Inyectar `promptSistema` en Anthropic API | `ai.service.ts` |
| H.3 | Solo Anthropic en dropdown providers | `ConfAITab.tsx` |
| H.4 | Seed ConfiguracionIA `document_analyzer` | `seed-demo.ts` |
| G.1 | Modal crear abogado + backend especialidad | `NuevoAbogadoDialog.tsx` (nuevo), `abogados/page.tsx`, `create-usuario.dto.ts`, `auth.service.ts` |
| E2.1 | Barra progreso docs con crédito parcial | `document_progress.dart` |

### Bugs corregidos (21-mar-2026)

| Bug | Causa raíz | Fix |
|-----|-----------|-----|
| Header mostraba "Operador" para abogados | `validEnumValues` en `createUser()` y `updateUser()` no incluía `'abogado'` → campo enum `rol` se default a `'operador'` | Agregado `'abogado'` a `validEnumValues` en `auth.service.ts` |
| Abogados no aparecían en lista ni dropdown de asignación | Mismo bug: `getAbogados()` filtra por `rol: 'abogado'` pero el usuario tenía `rol: 'operador'` | Mismo fix + migración SQL `20260321000000_fix_abogado_rol_enum` |
| Dashboard abogado mostraba "Error cargando métricas" | No existía endpoint `/reportes/dashboard-abogado` y el abogado no tiene permiso `reportes:ver` para el dashboard general | Creado endpoint `dashboard-abogado` con métricas de casos + trend mensual |
| Badge color de abogado igual a operador en Usuarios tab | `UsuariosTab.tsx` solo manejaba `admin`/`operador`/`default` | Agregado variant `'secondary'` (púrpura) para abogado |
| Sin color de abogado en Permisos tab | `ROLE_COLORS` en `PermisosTab.tsx` no tenía entrada para abogado | Agregado `abogado: 'bg-purple-100 text-purple-700'` |
| Iconos de documentos idénticos en tabla asociados | Columna Documentos usaba iconos por estado (FileCheck2/FileClock/FileX2) — mismo icono para los 4 tipos | Creado `DOC_TYPE_ICONS` con iconos por tipo (CreditCard, ScanLine, Camera, Car) + `DOC_ESTADO_CLASSES` con colores de fondo |
| Sidebar filtraba menú con sistema legacy | `filterByRole()` re-filtraba items client-side por `permisos.includes(rol)`, sobreescribiendo RolModuloMenu | Eliminado `filterByRole()` — Sidebar confía en items filtrados por API vía RolModuloMenu |
| Iconos/color de rol no sincronizaban en Usuarios tab | `ROL_ICONS` hardcodeado — no usaba `Rol.icono`/`Rol.color` de la BD | Reemplazado por `getIcon(rolRecord.icono)` + inline style con `rolRecord.color` |
| Sin permiso granular para ver detalle de asociado | `asociados:ver` controlaba lista y detalle juntos, sin opción de separar | Nuevo permiso `asociados:ver_detalle` (migración `20260321100000`) + check `usePermisos()` en botón ojo |
