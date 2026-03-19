# Plan de Diseno — CRM Web (Core Associates)

> **Ultima actualizacion**: 15 de julio de 2026
> **Objetivo**: Elevar el CRM a un nivel **enterprise profesional** con diseno pulido, **responsive mobile-first**, coherencia visual, y UX sin fricciones.

---

## Auditoria del Estado Actual (julio 2026)

### Resumen Ejecutivo

El CRM esta **funcional al 100%** con 16 rutas, 60 tests unitarios y build limpio. Se han completado multiples fases de mejoras previas. Esta auditoria identifica **todos** los problemas pendientes — tanto los reportados por el usuario como los descubiertos en revision de codigo.

**Ya implementado:**
- Avatar de usuario CRM (backend + frontend completo)
- Foto/selfie de asociado en tabla (`AsociadoPhoto`)
- Dark mode 100% en todas las paginas
- Sidebar enterprise con borde activo, avatar en footer, indicador visual
- Header enterprise con dropdown avatar, breadcrumb, campana stub, search placeholder
- StatsCards premium con watermark, delta trend, animacion escalonada
- Login con dark mode + ilustracion SVG
- Sistema de temas dinamico (8 presets + editor custom)
- Configuracion de IA (Anthropic/OpenAI/Google)
- Permisos por rol (admin/operador/proveedor)
- Auditoria de acciones
- Menu dinamico desde API
- Avatar preview-first en edicion (seleccionar → previsualizar → confirmar)
- Confirmacion de password en ProveedorFormDialog (Zod refine)
- Logo → avatar sync (al crear usuario CRM para proveedor)
- DataTable con cardRenderer mobile, column toggle, export CSV built-in

**Verificacion actual:**
- Next.js build: 16/16 rutas sin errores TypeScript
- Tests: 60/60 Vitest pasando

---

## PROBLEMAS IDENTIFICADOS — Tabla Maestra

### Criticos (UX/Funcionalidad rota)

| # | Problema | Archivo(s) | Descripcion |
|---|---------|-----------|-------------|
| C1 | **Proveedor edit dialog detras del mapa** | `proveedores/[id]/page.tsx`, `ProveedorFormDialog.tsx` | El dialog de edicion (z-50) queda detras de los tiles de Leaflet que tienen z-index altos por defecto. MapView y el dialog compiten en la misma pagina. |
| C2 | **Hard delete de proveedores** | `proveedores/page.tsx`, `proveedores/[id]/page.tsx` | `DELETE /proveedores/:id` borra fisicamente. Un proveedor con promociones activas y cupones emitidos NO deberia eliminarse — debe ser soft delete (cambiar estado a `inactivo`). |
| C3 | **"Ver detalle completo" innecesario** | `ProveedorDetailModal.tsx`, `AsociadoDetailModal.tsx` | Los modales de detalle tienen un boton que navega a una pagina separada (`/proveedores/[id]`, `/asociados/[id]`). El usuario quiere TODO en el modal: info completa + editar + eliminar. |
| C4 | **Export duplicado: pagina + DataTable** | `asociados/page.tsx`, `proveedores/page.tsx`, `cupones/page.tsx`, `casos-legales/page.tsx` | Cada pagina tiene botones CSV/PDF en el header Y el DataTable tiene su propio boton "Exportar". Funcionalidad duplicada, confusa. |
| C5 | **Favicon no configurado** | `layout.tsx`, `src/app/icon.svg` | Existe `icon.svg` (un cuadrado azul con "CA") pero no hay `favicon.ico` ni referencia a `favicon.png` (que esta en la raiz del monorepo). El navegador usa el default de Next.js o nada. |
| C6 | **Header search es un stub** | `Header.tsx` | El boton de busqueda (`Cmd+K`) es puramente visual — no tiene `onClick`, no abre nada, no busca. Muestra algo que no funciona. |
| C7 | **Header notificaciones es un stub** | `Header.tsx` | La campana con red dot no tiene onClick, no tiene dropdown, no muestra notificaciones. El red dot engana al usuario haciendole creer que hay notificaciones. |

### Importantes (Incoherencia/UX pobre)

| # | Problema | Archivo(s) | Descripcion |
|---|---------|-----------|-------------|
| I1 | **Botones export sin color** | `asociados/page.tsx`, `proveedores/page.tsx`, etc. | Los botones CSV/PDF usan estilo gris neutro (`border-gray-300 bg-white text-gray-700`). En Reportes usan `bg-green-600`/`bg-blue-600` con texto blanco — inconsistente. |
| I2 | **Leaflet "OSM" attribution feo** | `MapView.tsx`, `MapLocationPicker.tsx` | El texto "OSM" en la esquina inferior derecha del mapa se ve mal/fuera de lugar. Deberia minimizarse o eliminarse. |
| I3 | **Header dropdown duplicado** | `Header.tsx` | El dropdown del usuario tiene "Configuracion" Y "Mi Perfil" — ambos navegan a `/configuracion`. Redundante. |
| I4 | **Configuracion no responsive** | `configuracion/page.tsx`, `TabLayout.tsx` | Los tabs se desplazan horizontalmente (OK), pero el contenido interno (tablas de usuarios, roles, permisos) no se adapta a mobile. |
| I5 | **Boton ExternalLink confuso** | `asociados/page.tsx`, `proveedores/page.tsx` | En la columna de acciones hay un boton `ExternalLink` que abre la pagina de detalle en nueva pestana. Si el detalle va a estar completo en el modal, este boton sobra. |
| I6 | **Paginas de detalle separadas redundantes** | `proveedores/[id]/page.tsx`, `asociados/[id]/page.tsx` | Si se migra toda la funcionalidad al modal, estas paginas se vuelven redundantes (pueden mantenerse como deep-link pero no como flujo principal). |

### Mejoras de coherencia/polish

| # | Problema | Archivo(s) | Descripcion |
|---|---------|-----------|-------------|
| P1 | **Mapas sin soporte dark mode** | `MapView.tsx`, `MapLocationPicker.tsx` | Los tiles de OpenStreetMap son siempre claros. En dark mode el mapa desentona con el resto de la UI. Se puede usar un tile server con estilo oscuro o aplicar filtro CSS. |
| P2 | **Componentes avatar duplicados** | `UserAvatar`, `AsociadoPhoto`, `UserAvatarCell` | Tres componentes distintos para mostrar avatares con iniciales como fallback. Podrian unificarse en uno solo parametrizable. |
| P3 | **TabLayout sin dark mode en contenedor** | `TabLayout.tsx` | El contenedor de tabs usa `bg-white` hardcoded sin `dark:bg-gray-800`. |

---

## PLAN DE IMPLEMENTACION

### Fase A — Fixes Criticos y Quick Wins ✅ COMPLETADA

**A1. Favicon desde `favicon.png`** ✅
- Copiar `favicon.png` de la raiz del monorepo a `core-associates-web/src/app/`
- Agregar metadata `icons` en `layout.tsx`:
  ```tsx
  export const metadata: Metadata = {
    title: 'Core Associates - CRM',
    icons: { icon: '/favicon.png' },
  };
  ```
- O renombrar a `icon.png` para que Next.js lo detecte automaticamente via file-based metadata.

**A2. Quitar atribucion OSM de los mapas** ✅
- En `MapView.tsx` y `MapLocationPicker.tsx`: cambiar `attribution` a `false` o string vacio.
- Nota legal: OpenStreetMap requiere atribucion por licencia. Alternativa: usar `attributionControl: false` en el mapa y agregar un tooltip discreto o nota en footer de la pagina.

**A3. Fix z-index del dialog sobre el mapa** ✅
- En `proveedores/[id]/page.tsx`: cuando se abre `ProveedorFormDialog`, el mapa Leaflet debajo tiene tiles con z-index alto. Solucion: el overlay del dialog debe usar `z-[9999]` o agregar `position: relative; z-index: 0` al contenedor del mapa para crear un nuevo stacking context.

**A4. Quitar red dot de notificaciones** ✅
- En `Header.tsx`: eliminar el `<span>` del red dot de la campana. Dejar la campana como boton deshabilitado o con tooltip "Proximamente". Cuando se implemente el sistema de notificaciones real, agregar el dot dinamicamente.

**A5. Eliminar/Reemplazar search stub** ✅
- Opcion A (quitar): Eliminar el boton de busqueda del header hasta que haya funcionalidad real.
- Opcion B (implementar): Crear un dialog `Cmd+K` basico que busque en las rutas del sidebar (command palette). Manejar `useEffect` con `keydown` para `Ctrl+K`/`Cmd+K`.

**A6. Eliminar "Mi Perfil" duplicado del dropdown** ✅
- En `Header.tsx`: quitar el item "Mi Perfil" que redirige al mismo lugar que "Configuracion". Dejar solo "Configuracion".

### Fase B — Unificar Exports ✅ COMPLETADA

**B1. Eliminar botones CSV/PDF de page-level**
- En `asociados/page.tsx`, `proveedores/page.tsx`, `cupones/page.tsx`, `casos-legales/page.tsx`: **eliminar** los botones CSV/PDF del header de pagina (los que usan `exportToCSV`/`exportToPrintPDF`).
- El DataTable ya tiene su boton "Exportar" via prop `exportable` — usar solo ese.
- Mantener los exports custom de `reportes/page.tsx` (ahí es diferente: exporta reporte completo con graficos + jsPDF, no una tabla).

**B2. Mejorar estilo del boton Exportar en DataTable**
- En `DataTable.tsx`: el boton "Exportar" actualmente es gris neutro (`border-gray-200 bg-white text-gray-600`). Cambiarlo a estilo con color (ej: `bg-primary-50 text-primary-600 border-primary-200 hover:bg-primary-100`) para que sea mas visible y coherente con los de Reportes.

### Fase C — Modales de Detalle Completos ✅ COMPLETADA

**C1. Enriquecer ProveedorDetailModal** ✅
- Agregados botones de accion: Editar (abre ProveedorFormDialog), Desactivar (soft delete con ConfirmDialog)
- Agregado upload de logotipo con hover overlay (mismo patron que pagina detalle)
- Eliminado boton "Ver detalle completo" y navegacion a pagina separada
- Agregado callback `onUpdated` para refrescar la tabla al editar/desactivar
- Acciones controladas por permisos (`editar:proveedores`, `eliminar:proveedores`)

**C2. Enriquecer AsociadoDetailModal** ✅
- Agregados botones de gestion de estado: Aprobar/Rechazar (si pendiente), Suspender (si activo)
- Suspender abre dialog inline con campo de motivo (mismo patron que pagina detalle)
- Eliminado boton "Ver detalle completo" y navegacion a pagina separada
- Agregado callback `onUpdated` para refrescar la tabla al cambiar estado
- Acciones controladas por permisos (`aprobar:asociados`, `editar:asociados`)

**C3. Eliminar boton ExternalLink de acciones en tablas** ✅
- Eliminado de `asociados/page.tsx` (columna desktop + cardRenderer mobile)
- Eliminado de `proveedores/page.tsx` (columna desktop + cardRenderer mobile)
- Eliminado de `casos-legales/page.tsx` (columna desktop + cardRenderer mobile)
- Solo queda: Eye (ver modal/detalle) + Trash2 (eliminar, si aplica)

**C4. Mantener rutas [id] como deep-link** ✅
- Las paginas `proveedores/[id]` y `asociados/[id]` se mantienen como deep-link standalone

### Fase D — Soft Delete de Proveedores ✅ COMPLETADA

**D1. API: endpoint PATCH para desactivar** ✅ (ya existia via PUT)
- Cambiar la logica de "eliminar" proveedor: en vez de `DELETE /proveedores/:id` (que borra fisicamente), usar `PATCH /proveedores/:id` con `{ estado: 'inactivo' }`.
- El endpoint DELETE puede mantenerse en la API pero solo para admin y solo si el proveedor no tiene promociones/cupones asociados.
- En el service: verificar que no tenga cupones pendientes antes de permitir eliminacion fisica.

**D2. Frontend: usar soft delete** ✅
- En `proveedores/page.tsx` y `proveedores/[id]/page.tsx`: cambiado `DELETE` a `PUT` con `{ estado: 'inactivo' }`.
- El `ConfirmDialog` debe decir "Desactivar proveedor" en vez de "Eliminar proveedor".
- Proveedores inactivos: mostrar en la tabla con badge rojo, filtrable por estado.

### Fase E — Configuracion Responsive (parcial)

**E1. TabLayout responsive** ✅
- `TabLayout.tsx`: dark mode agregado al contenedor (`dark:bg-gray-800 dark:border-gray-700`), tabs activos e inactivos.
- Los tabs ya hacen scroll horizontal (OK), pero los labels podrian ocultarse en mobile para solo mostrar iconos.

**E2. Contenido de tabs responsive**
- `UsuariosTab`: la tabla de usuarios debe tener `cardRenderer` para mobile.
- `RolesTab`, `PermisosTab`: tablas internas deben usar DataTable con cardRenderer o al menos scroll horizontal.
- `MenuDinamicoTab`: el formulario/listado debe apilarse en mobile.

### Fase F — Pulido Visual

**F1. Estilo coherente de botones de accion**
- Definir un patron unico para botones de accion en tablas:
  - Eye: `border-primary-200 text-primary-500 hover:bg-primary-50`
  - Pencil: `border-amber-200 text-amber-500 hover:bg-amber-50`
  - Trash2: `border-red-200 text-red-400 hover:bg-red-50`
- Ya se usa este patron en algunas paginas pero no en todas.

**F2. Unificar componentes avatar**
- Crear un unico `Avatar` component que acepte: `src`, `fallbackText` (iniciales), `size`, `shape`.
- Reemplazar `UserAvatar`, `AsociadoPhoto`, `UserAvatarCell` con este componente unificado.

**F3. Dark mode en mapas**
- Agregar filtro CSS al contenedor del mapa en dark mode:
  ```css
  .dark .leaflet-container { filter: brightness(0.8) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3); }
  ```
- O usar un tile provider con tema oscuro (ej: CartoDB dark matter).

---

## Guia de Estilo Enterprise

### Paleta de Colores (Base)

| Token | Valor | Uso |
|-------|-------|-----|
| `primary-600` | `#2563eb` | Acciones principales, enlaces, sidebar active |
| `primary-50` | `#eff6ff` | Fondos hover, highlights sutiles |
| `success` | `#10b981` | Estados positivos, aprobado |
| `warning` | `#f59e0b` | Pendiente, atencion |
| `error` | `#ef4444` | Rechazado, peligro, eliminar |
| `info` | `#3b82f6` | Informativo, badges neutros |
| `background` | `#f9fafb` | Fondo de pagina |
| `surface` | `#ffffff` | Cards, modals, dropdowns |
| `border` | `#e5e7eb` | Bordes de cards, separadores |
| `text-primary` | `#111827` | Texto principal |
| `text-secondary` | `#6b7280` | Texto secundario, labels |

### Formato de Fechas

| Contexto | Formato | Ejemplo |
|----------|---------|---------|
| Tablas / listas | Dia + mes largo + ano | `6 de marzo de 2026` |
| Con hora | Dia + mes largo + ano + hora | `6 de marzo de 2026, 14:30` |
| Relativo (notas/timeline) | Hace X minutos/horas/dias | `hace 2 horas` |
| **Nunca usar** | DD/MM/YYYY ni MM/DD/YYYY | ~~`6/3/2026`~~ |

### Border Radius

| Elemento | Valor |
|----------|-------|
| Cards | `rounded-xl` (12px) |
| Botones | `rounded-lg` (8px) |
| Badges | `rounded-full` |
| Inputs | `rounded-lg` (8px) |
| Modales | `rounded-2xl` (16px) |
| Avatares | `rounded-full` |

### Sombras

| Nivel | Clase | Uso |
|-------|-------|-----|
| Sutil | `shadow-sm` | Cards en reposo |
| Media | `shadow-md` | Cards hover, dropdowns |
| Alta | `shadow-xl` | Modales, overlays |
| Maxima | `shadow-2xl` | Login card, dialogs principales |

---

## Historial de Fases Completadas

### Fase 0 — Avatar de Usuario [COMPLETADA]
1. ~~Migracion BD: campo `avatarUrl` en `Usuario`~~ Done
2. ~~Endpoints API: upload/get/delete avatar~~ Done
3. ~~Header CRM: avatar del usuario logueado con dropdown~~ Done
4. ~~UsuariosTab: avatar en tabla + upload en formulario~~ Done
5. ~~Tabla Asociados: selfie como avatar~~ Done

### Fase 1 — Diseno Enterprise Base [COMPLETADA]
6. ~~Sidebar: borde active, indicador visual~~ Done
7. ~~Header: dropdown avatar, busqueda placeholder, breadcrumb chevron~~ Done
8. ~~StatsCards: iconos watermark, delta trend, animacion entrada~~ Done
9. ~~Login: dark mode, ilustracion expandida~~ Done
10. ~~Dark mode 100% en todas las paginas~~ Done
11. ~~DataTable: dark mode completo, cardRenderer mobile, column toggle, export~~ Done

### Fase 2 — Formularios (avatar/password/logo) [COMPLETADA]
12. ~~Avatar preview-first en modo edicion~~ Done
13. ~~Confirmacion de password en ProveedorFormDialog~~ Done
14. ~~Logo-to-avatar sync al crear usuario CRM de proveedor~~ Done

---

## Problemas Resueltos (historico)

| # | Problema | Estado |
|---|---------|--------|
| R1 | Foto de asociado no se muestra en tabla | Resuelto |
| R2 | Usuario CRM sin campo avatar | Resuelto |
| R3 | Header sin avatar | Resuelto |
| R4 | Login sin dark mode | Resuelto |
| R5 | Dark mode incompleto en paginas | Resuelto |
| R6 | Avatar se sube inmediatamente al seleccionar (sin preview) | Resuelto |
| R7 | ProveedorFormDialog sin confirmacion de password | Resuelto |
| R8 | Logo de proveedor no se sincroniza como avatar del usuario CRM | Resuelto |
| R9 | DataTable `getByText` duplicados en tests (dual render table+cards) | Resuelto |
| R10 | Favicon no configurado (C5) | Resuelto — `favicon.png` copiado a `src/app/`, metadata `icons` en `layout.tsx` |
| R11 | OSM attribution feo (I2) | Resuelto — attribution eliminada en MapView y MapLocationPicker |
| R12 | Z-index dialog vs mapa (C1/A3) | Resuelto — `relative z-0` en contenedores de MapView y MapLocationPicker |
| R13 | Red dot notificaciones engañoso (C7) | Resuelto — red dot eliminado, tooltip "Próximamente" |
| R14 | Search stub sin funcionalidad (C6) | Resuelto — tooltip "Próximamente" agregado |
| R15 | "Mi Perfil" duplicado en dropdown (I3) | Resuelto — eliminado, solo queda "Configuración" |
| R16 | Export duplicado página + DataTable (C4) | Resuelto — botones CSV/PDF eliminados de 4 páginas, solo DataTable export |
| R17 | Botón export sin color (I1) | Resuelto — DataTable export restyled a verde temático |
| R18 | Hard delete proveedores (C2) | Resuelto — cambiado a soft delete (PUT estado: 'inactivo') |
| R19 | TabLayout sin dark mode (P3) | Resuelto — dark mode agregado a contenedor y tabs |
| R20 | Cupones filtros/modal sin dark mode | Resuelto — dark mode en filtros avanzados, modal detalle, DetailRow |
| R21 | "Ver detalle completo" innecesario en modales (C3) | Resuelto — eliminado de ProveedorDetailModal y AsociadoDetailModal, reemplazado con acciones directas |
| R22 | Boton ExternalLink confuso en tablas (I5) | Resuelto — eliminado de asociados, proveedores y casos-legales (desktop + mobile) |
| R23 | Modales sin acciones de gestion (C3) | Resuelto — ProveedorDetailModal: editar/desactivar/upload logo. AsociadoDetailModal: aprobar/rechazar/suspender |
