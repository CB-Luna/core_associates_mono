# Pendientes — Core Associates

> **Última actualización**: 22 de marzo de 2026
> Documento con lo que falta por implementar. Solo tareas pendientes — lo completado se registra en `.github/completados/`.

---

## Resumen Ejecutivo

D.3 RBAC dinámico (core) está completado. Quedan mejoras al flujo del abogado, limpieza RBAC, y módulos de vehículos.

> ⚠️ **Prioridad actual**: I (Mejoras flujo abogado CRM), E3.5 (eye icon UX), D.3 limpieza (enum + ModuloMenu), C.3 (App Móvil shell profesional), J (Verificación vehicular).

| # | Feature | Impacto | Esfuerzo | Alcance |
|---|---------|---------|----------|----------|
| **C.3** | App Móvil: shell profesional (abogado) | ❌ Pendiente | Alto | App |
| **D.3** | RBAC limpieza — eliminar enum + ModuloMenu legacy | ❌ D.3.6/D.3.8/D.3.9 | Medio | API + CRM |
| **E** | Mejoras menores (App + CRM) | ❌ E2.2-E2.4, E3.1-E3.5 | Varios | App + CRM |
| **G.2** | Más campos abogado (dirección, teléfono, cédula) | ❌ Pendiente | Bajo-Medio | API + CRM |
| **I** | Flujo Abogado — Mejoras CRM | ❌ Pendiente | Medio-Alto | API + CRM |
| **J** | Verificación Vehicular | ❌ Pendiente (preparación) | Medio | API + CRM + App |

---

## C.3 — App Móvil: Shell del Abogado ❌ PENDIENTE

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
│   ├── profesional_repository.dart
│   └── models/
│       ├── caso_profesional.dart
│       └── notificacion_crm.dart
└── presentation/
    ├── providers/
    │   ├── profesional_auth_provider.dart
    │   ├── mis_casos_prof_provider.dart
    │   └── notificaciones_prof_provider.dart
    └── screens/
        ├── login_profesional_screen.dart
        ├── profesional_home_screen.dart
        ├── mis_casos_prof_screen.dart
        ├── caso_detalle_prof_screen.dart
        └── perfil_prof_screen.dart
```

**Esfuerzo**: Alto | **Prioridad**: Media

---

## D.3 — RBAC Limpieza: enum + ModuloMenu legacy ❌ PENDIENTE PARCIAL

> **Core completado** (commit `11c0c99`, 22-mar-2026): Login retorna `rolNombre`, `permisos.ts` reescrito (sin booleans hardcodeados), `PermisosGuard` usa permiso `sistema:super-admin` en BD, Header muestra `rolNombre` dinámico, Dashboard por permisos, `layout.tsx`/`PromocionFormDialog.tsx` usan `proveedorId`.
>
> **Pendiente**: limpieza de deuda técnica — el enum `RolUsuario` se conservó por backward compat.

### D.3.6 — Eliminar enum `RolUsuario` ❌ PENDIENTE (deferred)

- El campo `Usuario.rol` (enum con 4 valores: admin, operador, proveedor, abogado) sigue en BD
- Toda la lógica ya usa `rolId` + permisos, pero el enum coexiste
- Plan: eliminar enum → campo `rol` pasa a `String` derivado de `Rol.nombre`, o se elimina por completo dejando solo `rolId`
- **Riesgo**: la App Flutter lee `user.rol` del JWT para algunas decisiones. Requiere coordinar con C.3.
- **Decisión**: posponer hasta C.3 para no romper la app actual

### D.3.8 — Eliminar campo `permisos String[]` de `ModuloMenu` ❌ PENDIENTE

- `ModuloMenu` tiene `permisos String[]` (legacy de RBAC v1) que ya no se usa — el menú ahora se controla por `RolModuloMenu`
- Eliminar el campo requiere migración + verificar que ningún endpoint/vista lo lea
- Bajo riesgo pero requiere verificación

### D.3.9 — Seed `RolModuloMenu` entries ❌ PENDIENTE

- Los roles por defecto (admin, operador, proveedor, abogado) necesitan entries en `RolModuloMenu` en el seed
- Actualmente se crean manualmente desde el configurador RBAC del CRM
- Agregar al seed para que `prisma:seed` deje todo configurado automáticamente

### Bugs pendientes de D.3

| # | Bug | Detalle | Tarea |
|---|-----|---------|-------|
| B2 | Dropdown de rol hardcodeado en UsuariosTab | No carga roles dinámicos desde API | D.3 limpieza |
| B4 | Sistema dual enum + FK en Usuario | `rol` enum + `rolId` UUID coexisten | D.3.6 |

**Esfuerzo**: Medio | **Prioridad**: Media (sin bloqueo funcional — los roles custom YA funcionan)

---

## E. Mejoras Menores Pendientes

### E.2 — App Flutter

| # | Mejora | Esfuerzo | Prioridad |
|---|--------|----------|-----------|
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
| E3.5 | **Eye icon en password de crear usuario** — Toggle visibilidad en UsuariosTab y NuevoAbogadoDialog | Bajo | Media |

---

## G.2 — Más campos para abogado ❌ PENDIENTE

Ampliar el modelo de abogado con campos adicionales:
- `direccion` — dirección de contacto
- `telefono` — teléfono directo
- `cedula` — cédula profesional
- Requiere migración Prisma + actualizar DTOs + formularios CRM

> **Auditoría**: El modelo `Usuario` solo tiene `especialidad` para diferenciar abogados. No hay campos `direccion`, `telefono`, `cedula` en el schema.

**Esfuerzo**: Bajo-Medio | **Prioridad**: Media

---

## I. Flujo Abogado — Mejoras CRM ❌ PENDIENTE

Hallazgos de pruebas en producción. El rol abogado tiene las pantallas base pero le faltan herramientas operativas para dar seguimiento real a los casos.

### I.1 — Mapa SOS: Control de permisos en interacción ✅ COMPLETADO (commit `9153ffe`)

Abogado solo puede ver "Ver detalle completo" para sus casos asignados. API incluye `abogadoUsuario` en respuesta de `findAll`.

### I.2 — Mis Casos: Info completa del asociado + mapa ❌ PENDIENTE

**Problema**: La tabla de "Mis Casos" del abogado solo muestra el nombre del asociado. Necesita datos de contacto y ubicación del incidente.

**Solución — Detalle de caso** (`/mis-casos/[id]`):

| Sección | Datos | Estado actual |
|---------|-------|---------------|
| **Asociado** | Nombre completo, teléfono, email, avatar | Solo nombre + teléfono (parcial) |
| **Mapa del incidente** | Mapa embebido con marcador GPS | ✅ Ya existe |
| **Vehículo involucrado** | Marca, modelo, año, placas, foto | ✅ Ya existe parcial |
| **Documentos del caso** | Archivos adjuntos | ❌ No existe |
| **Botón "Contactar"** | tel:+52... o mailto: | ❌ No existe |
| **Solicitar documentos** | Pedir al asociado que suba algo | ❌ No existe |

**Para la tabla** `/mis-casos`:
- Columna con ícono de teléfono clickeable (tel:)
- Botón/icono de mapa mini-modal con ubicación

**Archivos**: `mis-casos/page.tsx`, `mis-casos/[id]/page.tsx`, API response expandido

**Esfuerzo**: Medio | **Prioridad**: Alta

### I.3 — Casos Disponibles: Info del asociado visible ❌ PENDIENTE

**Problema**: Tabla de "Casos Disponibles" no muestra datos del asociado. El abogado necesita contexto mínimo para decidir si postularse.

**Solución**:
- Columna "Asociado" (nombre + avatar miniatura)
- Botón mapa mini-modal con ubicación del incidente
- No mostrar teléfono/email (se revela solo después de aceptar, por privacidad)

**Archivos**: `casos-disponibles/page.tsx`

**Esfuerzo**: Bajo | **Prioridad**: Media

### I.4 — Documentos del caso: subida y solicitud ❌ PENDIENTE

**Problema**: No existe mecanismo para que el abogado suba documentos al caso ni para solicitar documentos al asociado.

**I.4.1 — Documentos adjuntos (subida directa)**
- Modelo `DocumentoCaso` vinculado a `CasoLegal`
- Endpoint: `POST /casos-legales/:id/documentos` — MinIO bucket `core-associates-legal`
- Endpoint: `GET /casos-legales/:id/documentos` — lista
- UI CRM: sección "Documentos del caso" en detalle

**I.4.2 — Solicitar documentos al asociado**
- Modelo `SolicitudDocumento` con estado pendiente/entregado/vencido
- Endpoint: `POST /casos-legales/:id/solicitar-documento` + push al asociado
- App Flutter: pantalla "Documentos solicitados"

**Archivos**: `schema.prisma`, migración, `casos-legales.service.ts`, `casos-legales.controller.ts`, CRM, App Flutter

**Esfuerzo**: Alto | **Prioridad**: Media-Alta

### I.5 / E3.5 — Eye icon en password de crear usuario ✅ COMPLETADO (commit `9153ffe`)

Toggle Eye/EyeOff implementado en UsuariosTab.tsx (crear + reset) y NuevoAbogadoDialog.tsx.

---

## J. Verificación Vehicular ❌ PENDIENTE (preparación)

> **Nota**: El cliente NO ha dado detalle funcional exacto. Estas tareas son **preparatorias**.

### J.1 — Estado de verificación por vehículo

Agregar campos al modelo `Vehiculo`:
- `verificado Boolean @default(false)`
- `documentoTarjetaUrl String?`
- `fechaVerificacion DateTime?`

Al subir tarjeta de circulación, vincularla al vehículo. IA pre-valida y extrae placas. Badge visual: 🔒 "No verificado" / ✅ "Verificado".

### J.2 — Flujo UX progresivo

1. **Registro KYC**: 1 vehículo principal + tarjeta = obligatorio
2. **Post-aprobación**: Vehículos adicionales se crean "no verificados" con banner
3. **Activación**: Para SOS/cupones, vehículo debe estar verificado (diálogo si no)

### J.3 — Relaciones vehículo-operaciones (futuro)

- `CasoLegal.vehiculoId` — ¿con cuál vehículo ocurrió el incidente?
- `Cupon.vehiculoId` — ¿para cuál vehículo se usó el beneficio?
- Historial de incidentes por vehículo (scoring futuro)

### J.4 — Análisis de impacto

| Aspecto | Valor |
|---------|-------|
| Validación legal (KYC) | Tarjeta vincula usuario con vehículo real |
| SOS con contexto | Abogado recibe placas verificadas |
| Anti-fraude | Sin verificación, vehículos fake posibles |

**Recomendación**: J.1 como migración preparatoria, J.2 como UX. J.3 espera claridad del cliente.

---

## Orden de Implementación

```
Fase 4 (Completada parcialmente ✅):
  ├─ D.3.1-D.3.5, D.3.7 ✅ (commit 11c0c99)
  └─ D.3.6/D.3.8/D.3.9 deferred

Fase 5 — SIGUIENTE PRIORIDAD:
  ├─ E3.5 / I.5 Eye icon en password (rápido)
  ├─ I.1 Mapa SOS: control de permisos (alta prioridad)
  ├─ I.2 Mis Casos: info completa asociado + mapa
  ├─ I.3 Casos Disponibles: info asociado
  ├─ I.4 Documentos del caso: subida + solicitud
  └─ G.2 Más campos abogado (dirección, teléfono, cédula)

Fase 6 — App Móvil + Verificación:
  ├─ C.3 App Móvil: shell profesional + push
  ├─ J.1 Estado verificación por vehículo
  └─ J.2 UX progresivo de verificación vehicular

Fase 7 — Limpieza RBAC:
  ├─ D.3.6 Eliminar enum RolUsuario
  ├─ D.3.8 Eliminar permisos String[] de ModuloMenu
  └─ D.3.9 Seed RolModuloMenu entries

Fase 8 (Polish):
  ├─ E2.2 Filtro cupones
  ├─ J.3 Relaciones vehículo-operaciones
  └─ Resto mejoras menores (E2.3, E2.4, E3.1-E3.4)
```

---

## Notas Operativas

- **`AI_ENCRYPTION_KEY`**: Pendiente agregar al `.env` de producción para activar cifrado de API keys IA
- **H.5 Content filtering**: No aplica aún — no hay chat. Aplica cuando se implemente endpoint conversacional.

---

## Estado del Sistema (22-mar-2026)

| Componente | Progreso | Notas |
|------------|----------|-------|
| **API** | ~97% | Todo funcional. Pendiente: D.3 limpieza (enum), I.4 documentos caso, J.1 verificación vehicular |
| **CRM Web** | ~97% | 18+ rutas. Pendiente: I.2-I.4 flujo abogado (casos/documentos) |
| **App Flutter** | ~93% | 139 tests. Pendiente: C.3 shell profesional, E2.2 filtro cupones, J.2 UX verificación |
| **Infra** | ✅ | Docker + Nginx + SSL + deploy script. Commit `9153ffe` en producción |
| **IA** | ~98% | Documentos ✅, Auto-decide ✅, Anti-troll ✅, Cifrado ✅ |

**Desplegado en**: `https://core-asoc.cbluna-dev.com` (commit `9153ffe` — 22-mar-2026)

### Problemas pendientes en producción

| # | Problema | Severidad | Tarea |
|---|----------|-----------|-------|
| P5 | Mis Casos: falta info completa del asociado | Alta | I.2 |
| P6 | Casos Disponibles: no muestra datos del asociado | Media | I.3 |
| P7 | No hay mecanismo de documentos adjuntos al caso | Media-Alta | I.4 |
