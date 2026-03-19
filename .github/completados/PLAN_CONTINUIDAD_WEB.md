# Plan de Continuidad — Core Associates CRM Web (Next.js)

> Fecha inicio: 2026-03-15  
> Última actualización: 2026-03-17 (Sesión 6)  
> Alcance: Mejoras de diseño, responsividad, funcionalidad y UX del CRM web.

---

## 1. Estado Actual del CRM

### Resumen de Arquitectura
- **Stack**: Next.js 15 (App Router) + Tailwind CSS 3.4 + Zustand 5 + TanStack Table 8 + Recharts + Lucide React
- **Auth**: JWT manual en `localStorage`, guard con `useEffect` en layout dashboard
- **Data fetching**: `useEffect` + `useState` + `apiClient()` (manual)
- **Formularios**: `react-hook-form` + `zod` (implementado en UsuariosTab), `useState` manual (resto)
- **API**: `https://core-asoc.cbluna-dev.com/api/v1` via Nginx
- **Deploy**: Docker + `deploy-ionos.ps1`

### Páginas existentes
| Ruta | Estado | Notas |
|------|--------|-------|
| `/login` | ✅ Operativa | Auth básica |
| `/dashboard` | ✅ Operativa | StatsCards + gráficos |
| `/asociados` | ✅ Operativa | Lista + modal detalle con docs/AI/timeline |
| `/proveedores` | ✅ Operativa | Lista + detalle + editar |
| `/promociones` | ✅ Operativa | CRUD con imagen |
| `/cupones` | ✅ Operativa | Lista con QR |
| `/casos-legales` | ✅ Operativa | Lista + detalle con mapa |
| `/documentos` | ✅ Operativa | Revisión con AI analysis |
| `/reportes` | ✅ Operativa | Gráficos estadísticos |
| `/mapa-sos` | ✅ Operativa | Mapa de casos activos |
| `/configuracion` | ✅ Operativa | 7 tabs (Usuarios, Roles, Menú, Temas, Sistema, Auditoría, Conf AI) |

---

## 2. Completados (referencia rápida)

| ID | Tarea | Sesión |
|----|-------|--------|
| WEB-01 | Responsividad de `/configuracion` (TabLayout, TemasTab, RolesTab, PermisosTab) | S1 |
| WEB-03 | Vista previa de tabla en Temas (toggle Dashboard/Tabla) | S1 |
| WEB-04 | Rediseño de Roles y Permisos (gradient cards, iconos por acción, permisos agrupados) | S1+S2 |
| WEB-06 | Temas por usuario (modelo Tema en BD, CRUD API, asignación, carga al login) | S1+S2 |
| WEB-07 | Puente servidor ↔ localStorage para temas | S2 |
| WEB-08 | Vista previa expandida (minHeight) | S2 |
| WEB-09 | Cards responsive Usuarios (mobile) | S2 |
| WEB-10 | Cards responsive Auditoría (mobile) | S2 |
| WEB-11 | Header Search (command palette) + Notificaciones (placeholder) | S2 |
| WEB-12 | Temas: categorías, "Crear template", COLOR_HINTS, columna Tema en UsuariosTab | S3 |
| WEB-13 | Fix backend: `getUsers()` devuelve `temaId`, modal "Por defecto", 5 swatches | S3 |
| WEB-14 | TemasTab: columnas scrollables independientes (PresetPanel + ColorEditorPanel) | S4 |
| WEB-15 | "Global activo" renombrado a "Default" en TemasTab | S4 |
| WEB-16 | CSV export: `meta.exportValue` en DataTable + 10 columnas arregladas (6 páginas) | S4 |
| WEB-17 | Dark/Light toggle unificado: DarkModeToggle sincroniza CSS variables via ThemeProvider | S4 |
| — | Fix foto 404/503 en asociados | 2026-03-13 |
| — | Favicon faltante | 2026-03-13 |
| — | Super-admin protegido (`admin@coreassociates.com`) | Pre-sprint |
| — | Imágenes de vehículos en CRM + autocomplete marca/modelo en Flutter | Pre-sprint |
| WEB-02 | Casos Legales: vehículos siempre visibles, timeline notas, mapa expandible | S5 |
| WEB-05 | Menú Dinámico: CRUD completo + reordenar + toggle visible (ya implementado) | S5 |
| WEB-18 | Mapa SOS: marcadores SVG por tipoPercance + panel con foto/teléfono/vehículos | S5 |
| — | Flutter: Redesign tarjetas Mis Vehículos (hero image, gradient badge, chips) | S5 |
| WEB-19 | Dropdown Proveedor: Verificado — falso positivo, 11 proveedores activos en prod | S5 |

---

## 3. Pendientes — Sprint Actual

### RBAC v2: Rediseño Plantillas de Rol
- **Fase 5**: Backend — Enriquecer Rol (icono, color, default) + tabla `RolModuloMenu` M:N + endpoint bulk assign
- **Fase 6**: Frontend — Rediseño 3 tabs (Plantillas | Permisos & Menú | Asignaciones)
- **Fase 7**: Consolidación — eliminar enum dual, eliminar `permisos[]` de ModuloMenu, cleanup dead code

### Bugs previos al rediseño
- B1: Rol no tiene campo `icono` ni `color` en BD
- B2: UsuariosTab tiene dropdown de rol hardcodeado (no dinámico)
- B3: Menú dinámico no reconoce roles nuevos (`permisos: String[]` no usa FK)
- B4: Sistema dual `rol` enum + `rolId` FK en Usuario
- B5: PermisosGuard bypass admin usa enum, no dinámico

---

## 4. Fase RBAC — Sistema de Roles y Permisos Dinámicos

> Diseño aprobado. Reemplaza el enum hardcodeado `RolUsuario { admin, operador, proveedor }` por roles y permisos configurables desde el CRM.

### Fase 1: Modelos y Migración
- **Objetivo**: Crear tablas `Rol`, `Permiso`, `RolPermiso` en BD
- **Pasos**:
  1. Nuevos modelos en `schema.prisma`: `Rol(id, nombre, descripcion, esProtegido)`, `Permiso(id, codigo, grupo, descripcion)`, `RolPermiso(rolId, permisoId)`
  2. Relación `Usuario.rolId → Rol.id` (reemplaza el campo enum `rol`)
  3. Migración Prisma + seed con los 3 roles existentes (admin, operador, proveedor) y permisos iniciales
  4. Actualizar Prisma Client
- **Archivos**: `schema.prisma`, `seed-demo.ts`, nueva migración

### Fase 2: Backend — Guard de Permisos
- **Objetivo**: Nuevo `@Permisos()` decorador + `PermisosGuard` que valida permisos dinámicos
- **Pasos**:
  1. `common/decorators/permisos.decorator.ts` — `@Permisos('asociados:ver', 'asociados:editar')`
  2. `common/guards/permisos.guard.ts` — consulta `RolPermiso` del usuario autenticado
  3. Endpoint `GET /auth/mis-permisos` — retorna lista de permisos del usuario logueado
  4. Migración gradual: mantener `@Roles()` temporalmente, agregar `@Permisos()` a nuevos endpoints
- **Archivos**: `permisos.decorator.ts`, `permisos.guard.ts`, `auth.controller.ts`

### Fase 3: Frontend — CRUD de Roles y Permisos
- **Objetivo**: Administrar roles y permisos desde el CRM
- **Pasos**:
  1. `RolesTab.tsx` → CRUD completo: crear/editar/eliminar roles (los 3 protegidos no se eliminan)
  2. Asignar permisos a roles con toggles interactivos (matriz Rol × Permiso)
  3. Asignar rol a usuario desde UsuariosTab
  4. `usePermisos()` hook en frontend para ocultar botones/menús según permisos del usuario logueado
- **Archivos**: `RolesTab.tsx`, `UsuariosTab.tsx`, `hooks/usePermisos.ts`, `Sidebar.tsx`

### Fase 4: Migración Completa ✅
- **Objetivo**: Reemplazar todos los `@Roles()` por `@Permisos()` en 15 controllers (65 usages)
- **Completado**: Migración total — 0 `@Roles()` residuales en controllers
- **Pasos realizados**:
  1. ✅ Auditoría completa: 65 `@Roles()` en 15 controllers
  2. ✅ Mapeo semántico `@Roles('rol') → @Permisos('modulo:accion')` con 33 permisos
  3. ✅ Reemplazo de imports (`RolesGuard` → `PermisosGuard`, `Roles` → `Permisos`)
  4. ✅ Build limpio + 6/6 tests PermisosGuard pasando
- **Archivos modificados**: 15 controllers en `modules/`
- **Nota**: `roles.guard.ts` y `roles.decorator.ts` quedan como dead code (sin imports)

---

## 4B. RBAC v2 — Rediseño "Plantillas de Rol" (inspirado en UI de referencia)

> **Concepto clave**: Unificar Rol + Menú + Permisos bajo el concepto de **"Plantilla"**. Una plantilla define QUÉ puede hacer un usuario (permisos backend) y QUÉ puede ver (items de menú). Se asigna a uno o múltiples usuarios desde una sola interfaz.
>
> **Referencia visual**: Las imágenes de inspiración muestran un sistema con 3 tabs (Plantillas | Items | Asignaciones), assignment drag-and-drop de items, y asignación masiva de plantillas a entidades.

### Bugs/Issues Detectados (previos al rediseño)

| # | Issue | Detalle | Impacto |
|---|-------|---------|---------|
| B1 | Rol sin ícono ni color | Tabla `Rol` no tiene campos `icono`, `color`; RolesTab hardcodea colores por nombre | ❌ Roles nuevos no tienen personalización visual |
| B2 | Dropdown de rol hardcodeado | UsuariosTab muestra `admin/operador/proveedor` fijo en `<select>`, no carga roles dinámicos de API | ❌ Roles nuevos no pueden asignarse a usuarios |
| B3 | Menú no reconoce roles nuevos | `ModuloMenu.permisos: String[]` almacena nombres de rol como strings; roles nuevos no están en el array | ❌ Items de menú no se muestran para roles custom |
| B4 | Sistema dual enum + FK | `Usuario` tiene `rol: RolUsuario` (enum) Y `rolId: UUID?` (FK), generando inconsistencia | ⚠️ Puede causar desync entre enum y FK |
| B5 | PermisosGuard bypass admin por enum | Guard usa `user.rol === 'admin'` (enum) para bypass, no consulta `rolId` | ⚠️ Si se elimina enum, bypass se rompe |

### Fase 5: Backend — Modelo Enriquecido + Relación Rol↔Menú

**Objetivo**: Enriquecer el modelo `Rol` con campos visuales, crear relación M:N `Rol ↔ ModuloMenu`, y endpoints para asignación de items y usuarios masiva.

**Pasos**:

1. **Migración Prisma** — Nuevos campos y tabla:
   ```prisma
   model Rol {
     // ... campos existentes ...
     icono        String?             // Nombre ícono Lucide (ej: "Shield", "Users")
     color        String?             // HEX color (ej: "#EF4444")
     esPorDefecto Boolean @default(false) // Una sola plantilla puede ser default
     menuItems    RolModuloMenu[]     // Relación M:N con menú
   }

   model RolModuloMenu {
     id          String     @id @default(uuid())
     rolId       String
     moduloMenuId String
     orden       Int        @default(0)  // Orden dentro de esta plantilla
     rol         Rol        @relation(fields: [rolId], references: [id], onDelete: Cascade)
     moduloMenu  ModuloMenu @relation(fields: [moduloMenuId], references: [id], onDelete: Cascade)

     @@unique([rolId, moduloMenuId])
     @@map("roles_modulos_menu")
   }
   ```

2. **Nuevos endpoints en `roles.controller.ts`**:
   ```
   GET    /roles/:id/menu-items           → Items asignados al rol (con orden)
   PUT    /roles/:id/menu-items           → Asignar items al rol (array de {moduloMenuId, orden})
   POST   /roles/asignar-usuarios         → Asignar rol a múltiples usuarios {rolId, usuarioIds[]}
   ```

3. **Actualizar `GET /menu`**: Usar `RolModuloMenu` join en lugar de `permisos String[]` para filtrar items por rol del usuario autenticado. Mantener fallback temporal al array durante migración.

4. **Actualizar DTOs**: `CreateRolDto` y `UpdateRolDto` con campos `icono?`, `color?`, `esPorDefecto?`.

5. **Seed**: Poblar `RolModuloMenu` para los 3 roles protegidos con sus items de menú correspondientes.

- **Archivos**: `schema.prisma`, nueva migración, `roles.service.ts`, `roles.controller.ts`, DTOs, `menu.service.ts`, `seed-demo.ts`

### Fase 6: Frontend — Rediseño "Administración de Roles" (3 Tabs)

**Objetivo**: Reemplazar las tabs actuales de Roles + Permisos + Menú Dinámico por una interfaz unificada de 3 tabs inspirada en las pantallas de referencia.

> **Layout general**: Página dedicada o sección en `/configuracion` con 3 tabs principales.

#### Tab 1: Plantillas (CRUD de Roles)

**Inspiración**: Imagen 2 (lista de plantillas) + Imagen 4 (modal nueva plantilla)

- **Lista de Plantillas/Roles**: Cards o rows con:
  - Ícono + Color (circle badge)
  - Nombre + Descripción
  - Badge "Por Defecto" si `esPorDefecto=true`
  - Badge "Protegido" si `esProtegido=true`
  - Contadores: `N usuarios`, `M permisos`, `K items menú`
  - Acciones: [Configurar permisos] [Gestionar items] [Editar] [Eliminar]
- **Botón "+ Nueva Plantilla"** → Modal:
  - Nombre* (input)
  - Descripción (textarea)
  - Ícono (icon picker con catálogo Lucide)
  - Color (color picker / swatches predefinidos)
  - Toggle "Plantilla por defecto" (solo una activa)
- **Protecciones**: Roles protegidos (`admin`, `operador`, `proveedor`) no se eliminan pero SÍ pueden editarse (icono, color, descripción).

#### Tab 2: Permisos & Menú (configuración de plantilla seleccionada)

**Inspiración**: Imagen 1 (estructura menú 3 paneles) + Imagen 3 (asignaciones 2 columnas)

- **Selector de Plantilla** (dropdown arriba): Elige qué rol/plantilla configurar
- **Sección Permisos** (izquierda o arriba):
  - Checkboxes agrupados por módulo (`dashboard`, `asociados`, `proveedores`, etc.)
  - Toggle "Seleccionar todo" por grupo
  - Counter: "X/Y permisos seleccionados"
  - Botón "Guardar Permisos"
- **Sección Items de Menú** (derecha o abajo):
  - **2 columnas**: Items Asignados (izq) | Items Disponibles (der)
  - Columna Asignados: drag handles para reordenar, toggle visibilidad, botón ✕ para quitar
  - Columna Disponibles: botón ⊕ para agregar, muestra icono + título + ruta
  - Contadores: "Asignados: N" | "Disponibles: M"
  - Botón "Guardar Menú"

#### Tab 3: Asignaciones (Usuarios ↔ Roles)

**Inspiración**: Imagen 5 (asignar empresas a plantilla) + concepto multi-select

- **Selector de Plantilla** (dropdown): Elige qué rol ver
- **Usuarios Asignados** (lista con avatar, nombre, email, fecha asignación)
  - Botón ✕ para quitar usuario del rol
  - Acción rápida: cambiar a otro rol
- **Botón "Asignar Usuarios"** → Modal:
  - Lista de todos los usuarios SIN este rol (con checkboxes)
  - Barra de búsqueda para filtrar
  - Info banner: "Los usuarios seleccionados usarán esta plantilla"
  - Botón "Guardar (N)" con counter dinámico
- **Asignación masiva**: Seleccionar múltiples usuarios + asignar de una vez
- **Vista "Sin Rol"**: Sección especial para usuarios que no tienen rol asignado

**Archivos frontend**: Nuevo componente `RolesAdminTab.tsx` (o refactor de `RolesTab.tsx`), subcomponentes `PlantillasPanel.tsx`, `PermisosMenuPanel.tsx`, `AsignacionesPanel.tsx`. Eliminar o deprecar `PermisosTab.tsx` y `MenuDinamicoTab.tsx` (su funcionalidad se absorbe en el nuevo diseño).

### Fase 7: Consolidación y Limpieza

**Objetivo**: Eliminar el sistema dual (enum + FK), limpiar dead code, y asegurar consistencia total.

**Pasos**:
1. **Deprecar enum `RolUsuario`**: Migración para eliminar campo `rol` enum de `Usuario`. Todo usa `rolId` (FK).
2. **Deprecar `permisos String[]` de `ModuloMenu`**: Eliminar campo, usar solo `RolModuloMenu`.
3. **Actualizar `PermisosGuard`**: Bypass admin por nombre de rol dinámico (`rol.nombre === 'admin'` via join), no por enum.
4. **Actualizar `auth.service.ts`**: Login/createUser usan solo `rolId`. JWT payload incluye `rolId` y `rolNombre`.
5. **Eliminar dead code**: `roles.guard.ts`, `roles.decorator.ts`, enum `RolUsuario`.
6. **UsuariosTab**: Dropdown de rol carga dinámicamente de `GET /roles` (ya no hardcodeado).
7. **Login flow**: Al hacer login, respuesta incluye `permisos[]` + `menuItems[]` del rol dinámico.
8. **Seed completo**: Actualizar `seed-demo.ts` con permisos, roles (con icono+color), `RolModuloMenu`, y `rolId` en usuarios.
9. **Tests**: Actualizar tests de PermisosGuard para nuevo bypass dinámico. E2E para flujo plantilla→items→asignación.

- **Archivos**: `schema.prisma`, migración, `auth.service.ts`, `permisos.guard.ts`, `menu.service.ts`, `UsuariosTab.tsx`, `seed-demo.ts`, eliminar archivos deprecados

### Resumen de Fases RBAC v2

| Fase | Scope | Entregable |
|------|-------|------------|
| **5** | Backend | Rol enriquecido (icono, color, default) + `RolModuloMenu` M:N + endpoint bulk assign |
| **6** | Frontend | 3 tabs: Plantillas \| Permisos & Menú \| Asignaciones — UX inspirada en referencia |
| **7** | Full-stack | Eliminar enum, eliminar permisos[], cleanup dead code, seed completo |

---

## 5. Áreas de Riesgo

### Alto Riesgo
| Ítem | Descripción | Impacto |
|------|-------------|---------|
| MinIO foto flooding | Si se agrega foto de asociado a más listas sin guard, puede repetirse el 503 | Todos los usuarios |
| `localStorage` auth | JWT en localStorage es vulnerable a XSS | Seguridad |

### Medio Riesgo
| Ítem | Descripción | Impacto |
|------|-------------|---------|
| Sin React Query | Data fetching manual → sin cache, dedup, ni refetch inteligente | UX/Performance |
| No SSR | Todo es `'use client'` — SEO nulo y primera carga lenta | Performance |

### Mejoras Futuras
| Ítem | Descripción |
|------|-------------|
| Dark mode completo | Toggle unificado (WEB-17), pero falta auditar todos los componentes para usar CSS variables o `dark:` en vez de colores hardcodeados |
| Exportar reportes a PDF | Solo CSV disponible |
| Notificaciones en tiempo real | Sin websockets / SSE |
| Búsqueda global mejorada | Integrar search del Header con índice real de backend |

---

## 6. Prioridades

### Prioridad 1 — RBAC v1 ✅ COMPLETADO
1. **RBAC Fase 1**: Modelos en BD + migración ✅
2. **RBAC Fase 2**: Guard de permisos en backend ✅
3. **RBAC Fase 3**: CRUD de roles/permisos en CRM ✅
4. **RBAC Fase 4**: Migración completa de `@Roles()` → `@Permisos()` ✅

### Prioridad 2 — RBAC v2: Plantillas de Rol (PRÓXIMO)
5. **RBAC Fase 5**: Backend — Rol enriquecido (icono, color) + tabla `RolModuloMenu` + bulk assign
6. **RBAC Fase 6**: Frontend — Rediseño 3 tabs (Plantillas | Permisos & Menú | Asignaciones)
7. **RBAC Fase 7**: Consolidación — eliminar enum, eliminar permisos[], cleanup, seed

### Prioridad 3 — Mediano Plazo
8. Migrar data fetching a React Query
9. Notificaciones reales (backend + websockets)
10. Dark mode global audit

---

## 7. Comandos de Verificación

```bash
# Tests (desde core-associates-web/)
npm test

# Dev server local
npm run dev

# Build de producción (verifica que compila)
npm run build

# Deploy al servidor
cd ..  # raíz del monorepo
.\deploy-ionos.ps1

# Verificar en producción
# https://core-asoc.cbluna-dev.com
```