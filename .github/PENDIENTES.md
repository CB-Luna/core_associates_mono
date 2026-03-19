# Pendientes — Core Associates

> **Última actualización**: 21 de marzo de 2026
> Documento unificado con TODO lo que falta por implementar. Consolida y reemplaza los documentos fragmentados que ahora viven en `.github/completados/`.

---

## Resumen Ejecutivo

Quedan **3 features grandes** y varias mejoras menores. Ordenadas por impacto de negocio.

> ⚠️ **Prioridad actual**: G.4/G.5 (Flujo abogado en CRM), C.3 (App Móvil — Shell del Abogado) y D.3 (Consolidación RBAC).

| # | Feature | Impacto | Esfuerzo | Alcance |
|---|---------|---------|----------|----------|
| **A** | ~~KYC Guard — Restricción por estado~~ | ✅ Completado | — | API + App |
| **B** | ~~IA Bilateral — B.1/B.2/B.3/B.4/B.5~~ ✅ Completo | ✅ Completo | — | API + App + CRM |
| **C** | ~~Rol de Abogado — C.0/C.1/C.2/C.4~~ ✅ (falta C.3 App) | ✅ API+CRM | Pendiente App | API + CRM + App |
| **D** | RBAC v2 — Plantillas de rol | ✅ D.1+D.2 | ❌ D.3 Consolidación | API + CRM |
| **E** | Mejoras menores (App + CRM + API) | ✅ E1.1+E1.2 | Resto pendiente | Varios |
| **F** | ~~Abogados Management CRM~~ | ✅ Completado | — | CRM |
| **G** | Experiencia Abogado — Mejoras CRM | Pendiente | G.1-G.6 | API + CRM |

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

## G. Experiencia Abogado — Mejoras Pendientes (21-mar-2026)

Features solicitadas para completar la experiencia del rol abogado en el CRM y preparar su extensión a la app móvil.

### G.1 — Crear abogados desde Abogados page (modal)

Similar al modal de creación de proveedores en `/proveedores`, agregar botón "Nuevo Abogado" en `/abogados` que abra modal con:
- Campos: nombre, email, contraseña, especialidad, dirección, teléfono
- Auto-asigna `rolId` del rol "abogado"
- POST a `/auth/users` con rol abogado
- Refresh de la tabla tras crear

**Esfuerzo**: Bajo | **Prioridad**: Alta

### G.2 — Más campos para abogado

Ampliar el modelo de abogado con campos adicionales:
- `direccion` — dirección de contacto
- `telefono` — teléfono directo
- `cedula` — cédula profesional
- Requiere migración Prisma + actualizar DTOs + formularios CRM

**Esfuerzo**: Bajo-Medio | **Prioridad**: Media

### G.3 — Dashboard con widgets controlados por rol

En vez de 3 componentes distintos (`DashboardAdmin`, `DashboardProveedor`, `DashboardAbogado`), un solo componente `Dashboard` con widgets configurables por rol:
- Cada widget tiene permisos asociados (ej: widget "Asociados" requiere `asociados:ver`)
- Layout responsive tipo grid
- Widgets arrastrables (drag & drop) — opcional, fase posterior

**Esfuerzo**: Alto | **Prioridad**: Baja (funcional actual es suficiente)

### G.4 — Flujo de aceptación de casos para abogado

Cuando un abogado ve "Casos Disponibles", poder:
- Ver resumen del caso sin revelar información sensible
- Botón "Tomar Caso" → `PUT /casos-legales/:id/tomar-caso`
- El caso cambia `abogadoUsuarioId` al usuario y estado a `en_atencion`
- Notificación al operador de que el caso fue tomado

**Esfuerzo**: Medio | **Prioridad**: Alta

### G.5 — Pantallas de seguimiento de caso (abogado)

Vista de caso del abogado con:
- Timeline de notas (ya existe endpoint `abogado/mis-casos/:id`)
- Agregar notas al caso
- Cambiar estado del caso (resolver, escalar)
- Subir documentos al caso
- Ver datos del asociado/vehículo implicado

**Esfuerzo**: Medio | **Prioridad**: Alta

### G.6 — Notificaciones CRM para abogado

El sistema ya tiene `notificaciones_crm` pero falta:
- Trigger: al asignar caso a abogado, crear notificación
- Trigger: al recibir nota nueva en caso asignado
- Trigger: caso escalado/resuelto por operador
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

Fase 4 (Pendiente — Consolidación + App):
  ├─ C.3 App Móvil: shell profesional + push
  └─ D.3 Consolidación RBAC (eliminar enum legacy)

Fase 5 (Pendiente — Mejoras y polish):
  ├─ E1.3 Cifrar API keys IA
  ├─ E2.1 Perfil completitud
  ├─ E2.2 Filtro cupones (completar TabBar)
  └─ Resto de mejoras menores (E1.4, E2.3, E2.4, E3.1-E3.4)
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

## Estado del Sistema (21-mar-2026)

| Componente | Progreso | Notas |
|------------|----------|-------|
| **API** | ~99% | Twilio SMS ✅, Rate limiting ✅, RBAC v2 backend ✅, Dashboard abogado ✅. Falta: cifrar API keys, D.3 consolidación |
| **CRM Web** | ~97% | 18+ rutas. RBAC v2 tabs ✅, Dashboard por rol (admin/proveedor/abogado) ✅. Falta: D.3, crear abogados modal, responsive tabs menores |
| **App Flutter** | ~92% | 139 tests. Falta: C.3 shell profesional, perfil completitud, mapa proveedores |
| **Infra** | ✅ | Docker + Nginx + SSL + deploy script funcionando |

**Desplegado en**: `https://core-asoc.cbluna-dev.com`

### Bugs corregidos (21-mar-2026)

| Bug | Causa raíz | Fix |
|-----|-----------|-----|
| Header mostraba "Operador" para abogados | `validEnumValues` en `createUser()` y `updateUser()` no incluía `'abogado'` → campo enum `rol` se default a `'operador'` | Agregado `'abogado'` a `validEnumValues` en `auth.service.ts` |
| Abogados no aparecían en lista ni dropdown de asignación | Mismo bug: `getAbogados()` filtra por `rol: 'abogado'` pero el usuario tenía `rol: 'operador'` | Mismo fix + migración SQL `20260321000000_fix_abogado_rol_enum` |
| Dashboard abogado mostraba "Error cargando métricas" | No existía endpoint `/reportes/dashboard-abogado` y el abogado no tiene permiso `reportes:ver` para el dashboard general | Creado endpoint `dashboard-abogado` con métricas de casos + trend mensual |
| Badge color de abogado igual a operador en Usuarios tab | `UsuariosTab.tsx` solo manejaba `admin`/`operador`/`default` | Agregado variant `'secondary'` (púrpura) para abogado |
| Sin color de abogado en Permisos tab | `ROLE_COLORS` en `PermisosTab.tsx` no tenía entrada para abogado | Agregado `abogado: 'bg-purple-100 text-purple-700'` |
