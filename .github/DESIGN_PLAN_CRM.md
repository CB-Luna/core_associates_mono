# 🎨 Plan de Diseño — CRM Web (Core Associates)

> **Última actualización**: 12 de marzo de 2026  
> **Objetivo**: Elevar el CRM a un nivel **enterprise profesional** con diseño pulido, **responsive mobile-first**, y preparado para personalización de temas.  
> **Referencia visual**: Estilo tipo UYFI Network Intelligence — tablas con iconos inline, badges coloridos, acciones claras, modales de detalle, layout limpio.

---

## 📊 Auditoría del Estado Actual (post cambios de la sesión anterior)

### Resumen Ejecutivo

El CRM está **funcional al 100%** con todas las páginas implementadas. Se completaron las siguientes mejoras:

**Ya implementado (sesión anterior):**
- ✅ Avatar de usuario CRM — backend (Prisma + API endpoints) + frontend (Header, UsuariosTab, Sidebar)
- ✅ Foto/selfie de asociado en tabla de listado (componente `AsociadoPhoto`)
- ✅ Dark mode al 100% en todas las páginas (dashboard, detalles, listas, reportes, login)
- ✅ Sidebar enterprise con borde activo `border-l-3`, avatar en footer, indicador visual
- ✅ Header enterprise con dropdown avatar, breadcrumb chevron, campana stub, search placeholder
- ✅ StatsCards premium con watermark icon, delta trend, animación fade-in-up escalonada
- ✅ Login con dark mode, ilustración SVG expandida (semáforo, faroles, más vehículos)
- ✅ Sistema de temas dinámico con 8 presets y editor custom
- ✅ Configuración de IA (Anthropic/OpenAI/Google)
- ✅ Permisos por rol (admin/operador/proveedor)
- ✅ Auditoría de acciones
- ✅ Menú dinámico desde API

**Verificación:**
- ✅ Next.js build exitoso sin errores TypeScript (16 rutas)
- ✅ 15/15 tests Playwright E2E pasando (login, dashboard, navegación completa)

### Estado por Pantalla

| Pantalla | Lógica | Dark Mode | Responsive | Problemas pendientes |
|----------|--------|-----------|------------|---------------------|
| **Login** | ✅ | ✅ | ✅ | — |
| **Dashboard** | ✅ | ✅ | ⚠️ Parcial | Cards y gráficos se apilan, pero sidebar no colapsa |
| **Asociados (lista)** | ✅ | ✅ | ❌ | Tabla se desborda en mobile, fechas formato corto, acciones simplones |
| **Asociados (detalle)** | ✅ | ✅ | ❌ | Navega a página completa — debería ser modal. Grid 3 cols no se adapta |
| **Proveedores (lista)** | ✅ | ✅ | ❌ | Mismos problemas que asociados |
| **Proveedores (detalle)** | ✅ | ✅ | ❌ | Navega a página completa — debería ser modal |
| **Promociones** | ✅ | ✅ | ❌ | Tabla desborda |
| **Cupones** | ✅ | ✅ | ❌ | Tabla desborda |
| **Casos Legales** | ✅ | ✅ | ❌ | Tabla desborda |
| **Mapa SOS** | ✅ | ✅ | ⚠️ | Leaflet responsivo pero panel lateral no colapsa |
| **Reportes** | ✅ | ✅ | ⚠️ | Gráficos se adaptan, filtros no |
| **Documentos** | ✅ | ✅ | ❌ | Tabla desborda |
| **Configuración** | ✅ | ✅ | ⚠️ | Tabs scroll OK, contenido interno variable |

### Componentes UI Existentes

| Componente | Estado | Problemas |
|-----------|--------|-----------|
| `DataTable` | ✅ Avanzado | No responsive. Sin formato rico de datos. Acciones poco visibles |
| `Badge` | ✅ Completo | OK |
| `StatsCards` | ✅ Premium | Watermark + trend + animación. OK |
| `SearchToolbar` | ✅ Funcional | No colapsa en mobile |
| `Sidebar` | ✅ Enterprise | **No colapsa en mobile** — siempre `w-64` fijo |
| `Header` | ✅ Enterprise | Avatar + dropdown + search. Avatar duplicado con sidebar |

---

## 🔴 PRIORIDAD ALTA — Layout Responsive + Mobile Navigation

### Problema Actual
- El **Sidebar es fijo `w-64`** y nunca se oculta — en pantallas pequeñas se come todo el espacio
- No existe menú hamburguesa ni navbar mobile
- Las tablas se desbordan horizontalmente sin scroll ni adaptación
- El layout `DashboardLayout` es `flex` sin breakpoints responsive
- El avatar del usuario aparece **duplicado**: en el footer del Sidebar Y en el dropdown del Header

### Implementación Requerida

#### 1. Layout Responsive (`layout.tsx`)
- **Desktop (≥1024px `lg:`)**: Sidebar fijo `w-64` + contenido a la derecha (como ahora)
- **Tablet/Mobile (<1024px)**: Sidebar oculto. Header con botón hamburguesa `☰` que abre sidebar como **drawer overlay** (slide-in desde la izquierda con backdrop oscuro)
- El drawer se cierra al: click fuera, click en un item del menú, o botón X

#### 2. Sidebar — Quitar avatar/usuario del footer
- **Eliminar** la sección de avatar + nombre + rol del footer del Sidebar
- El usuario logueado ya se muestra en el **Header** (dropdown con avatar) — esa es la ubicación correcta y única
- Sidebar footer: solo mostrar versión `v1.0.0` o dejarlo vacío/limpio

#### 3. Header — Adaptación mobile
- En mobile: agregar botón hamburguesa ☰ a la izquierda del breadcrumb
- Breadcrumb: en mobile mostrar solo la página actual (sin ruta completa)
- Search bar: ocultar en mobile (ya tiene `md:flex`)
- Notificaciones + avatar: siempre visibles

#### 4. Contenido principal (`main`)
- Padding responsive: `p-4 lg:p-6`
- StatsCards grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

---

## 🔴 PRIORIDAD ALTA — Tablas Enterprise con Datos Ricos

### Problema Actual
- Las **fechas** se muestran como `"6/3/2026"` — formato corto poco legible
- Los **botones de acción** son iconos minúsculos (`Eye`, `ExternalLink`) con hover casi invisible
- Las celdas muestran texto plano sin iconos contextuales
- No hay formato rico en datos como teléfono, email, badges de tipo
- Al hacer click en "ver" (eye icon), **navega a una página completa** — es disruptivo

### Implementación Requerida

#### 1. Formateo de Fechas — Legible y humano
Crear helper `formatFechaLegible(fecha: string): string` en `lib/utils.ts`:
```
"2026-03-06" → "6 de marzo de 2026"
"2026-03-06T14:30:00" → "6 de marzo de 2026, 14:30"
```
Usar `Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })`.  
Aplicar en **todas** las tablas y detail views que muestren fechas.

#### 2. Celdas con Iconos y Formato Rico (estilo referencia UYFI)
Cada celda de la tabla debe usar íconos contextuales + formato visual:

- **Email**: `📧 icono Mail` + texto email (ambos en `text-gray-600`)
- **Teléfono**: `📱 icono Phone` + número formateado en badge `bg-emerald-50 text-emerald-700` con borde
- **Estado**: Badge colorido con dot indicator (●) — no solo texto
- **Tipo/Plan**: Badge con color por categoría (como "Residential Premium" en la referencia)
- **Nombre**: Avatar foto/iniciales + nombre en `font-medium` + ID secundario en `text-xs text-gray-400`

#### 3. Columna de Acciones — Botones visibles y claros
**Actual**: Iconos `Eye` y `ExternalLink` de 16px con hover casi invisible.  
**Nuevo**: Grupo de botones icono bien definidos (estilo referencia UYFI):

```
[👁 Ver]  [✏️ Editar]  [🗑 Eliminar]
```

- Cada botón: `w-8 h-8 rounded-lg` con borde sutil y hover pronunciado
- **Ver** (Eye): `text-primary-500 hover:bg-primary-50` → abre **modal de detalle** (no navega)
- **Editar** (Pencil): `text-amber-500 hover:bg-amber-50` → abre formulario de edición
- **Eliminar** (Trash2): `text-red-400 hover:bg-red-50` → confirm dialog (solo si tiene permiso)
- Separados con `gap-1`, alineados a la derecha
- En mobile: convertir a menú dropdown con `MoreHorizontal` (⋯)

#### 4. Detalle en Modal — NO navegación de página
**Cambio clave**: Al presionar "Ver" (Eye), en vez de navegar a `/asociados/[id]` o `/proveedores/[id]`, se abre un **modal/drawer lateral** con TODA la información y funcionalidad de la detail page actual.

**Estructura del modal de detalle:**
```
┌─────────────────────────────────────────┐
│ [Avatar] Nombre Completo     [ACTIVO] ✕ │
│          email@example.com              │
├─────────────────────────────────────────┤
│ [Editar]  [Suspender]  [Cambiar Plan]   │
├─────────────────────────────────────────┤
│ Información General                     │
│ ┌─────────────────────────────────────┐ │
│ │ 📧 Email: email@example.com        │ │
│ │ 📱 Teléfono: +52 55 1234 5678      │ │
│ │ 📋 Plan: Residential Premium       │ │
│ │ 📅 Registro: 15 de marzo de 2024   │ │
│ │ 📍 Dirección: Calle Reforma 123... │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Vehículos Asignados    [1]             │
│ ┌─────────────────────────────────────┐ │
│ │ CPE-CDMX-001234   ● ONLINE   🔗    │ │
│ │ Router WiFi 6 AX3000               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Documentos / Notas / Cupones (tabs)     │
└─────────────────────────────────────────┘
```

- Modal: `max-w-2xl` desktop, full-screen en mobile
- Scrollable internamente
- Botones de acción funcionales (aprobar, rechazar, suspender, editar)
- La lógica actual de las detail pages (`asociados/[id]`, `proveedores/[id]`) se reutiliza **dentro del modal**
- Las rutas `/asociados/[id]` y `/proveedores/[id]` pueden mantenerse como fallback de acceso directo (URL compartible)

---

## 🟡 PRIORIDAD MEDIA — Pulido Visual Global

### 1. Tablas — Estilo Enterprise Refinado

**Headers**: `bg-gray-50/80 dark:bg-gray-800/70`, texto `uppercase tracking-wider text-[11px] font-medium text-gray-500`  
**Filas**: hover `bg-primary-50/30 dark:hover:bg-primary-900/20`, transición `transition-colors duration-150`  
**Zebra**: ultra-sutil `even:bg-gray-50/40 dark:even:bg-gray-800/30`  
**Bordes**: `divide-y divide-gray-100 dark:divide-gray-700/50` entre filas (líneas finas)  
**Padding células**: `px-5 py-3.5` — cómodo, no apretado  
**Row highlight on hover**: toda la fila ligeramente resaltada, no solo texto  

### 2. Badges con Dot Indicator
Todos los badges de estado deben incluir un dot (●) antes del texto:
- Activo: `● ACTIVO` en verde (`bg-emerald-50 text-emerald-700 border border-emerald-200`)
- Pendiente: `● PENDIENTE` en amarillo
- Suspendido: `● SUSPENDIDO` en rojo
- Rechazado: `● RECHAZADO` en rojo oscuro

### 3. Formularios — UX Premium
- Focus ring: `ring-2 ring-primary-500/20 border-primary-500` con transición
- Labels con `font-medium text-sm`
- Botones submit: gradiente sutil `bg-gradient-to-r from-primary-600 to-primary-700`
- Modales: `backdrop-blur-sm`, bordes redondeados `rounded-2xl`, sombra `shadow-2xl`

### 4. Dashboard — Gráficos Premium
- BarChart con bordes redondeados (`radius: [8,8,0,0]`)
- PieChart → Donut con label central mostrando total
- Tooltips glassmorphism: `bg-white/90 backdrop-blur-sm`

---

## 🔵 PRIORIDAD BAJA — Configurador de Temas Avanzado

> Ya existe la base. Estas mejoras lo convertirían en un sistema de theming completo.

### Funcionalidades a Agregar

#### Temas Personalizados Guardados
- **Guardar tema custom**: Botón "Guardar como..." → nombre + almacenar en `localStorage`
- **Lista de temas guardados**: Sección debajo de presets con los temas del usuario
- **Exportar/Importar tema**: JSON export/import para compartir entre usuarios
- **Eliminar tema custom**: Botón delete en cada tema guardado

#### Tipografía
- **Selector de fuente**: Dropdown con familias tipográficas disponibles (Inter, Roboto, Poppins, etc.)
- **Tamaño base**: Slider para ajustar el `font-size` base (14px, 15px, 16px)

#### Preview Mejorado
- **Preview en vivo** expandido: tabla mini, card de ejemplo, sidebar mini
- **Undo/Redo**: Historial de cambios para revertir ajustes

---

## 📐 Guía de Estilo Enterprise

### Paleta de Colores (Base)

| Token | Valor | Uso |
|-------|-------|-----|
| `primary-600` | `#2563eb` | Acciones principales, enlaces, sidebar active |
| `primary-50` | `#eff6ff` | Fondos hover, highlights sutiles |
| `success` | `#10b981` | Estados positivos, aprobado |
| `warning` | `#f59e0b` | Pendiente, atención |
| `error` | `#ef4444` | Rechazado, peligro, eliminar |
| `info` | `#3b82f6` | Informativo, badges neutros |
| `background` | `#f9fafb` | Fondo de página |
| `surface` | `#ffffff` | Cards, modals, dropdowns |
| `border` | `#e5e7eb` | Bordes de cards, separadores |
| `text-primary` | `#111827` | Texto principal |
| `text-secondary` | `#6b7280` | Texto secundario, labels |

### Tipografía

| Uso | Weight | Size | Line-height |
|-----|--------|------|-------------|
| Page title | Bold 700 | 24px | 32px |
| Section title | SemiBold 600 | 18px | 28px |
| Card title | SemiBold 600 | 14px | 20px |
| Body | Regular 400 | 14px | 20px |
| Caption/meta | Regular 400 | 12px | 16px |
| Label | Medium 500 | 12px | 16px |
| Button | SemiBold 600 | 14px | 20px |
| Table header | Medium 500 | 11px | 16px |

### Formato de Fechas

| Contexto | Formato | Ejemplo |
|----------|---------|---------|
| Tablas / listas | Día + mes largo + año | `6 de marzo de 2026` |
| Con hora | Día + mes largo + año + hora | `6 de marzo de 2026, 14:30` |
| Relativo (notas/timeline) | Hace X minutos/horas/días | `hace 2 horas` |
| **Nunca usar** | DD/MM/YYYY ni MM/DD/YYYY | ~~`6/3/2026`~~ |

Helper: `Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })`

### Espaciado

| Token | Valor | Uso |
|-------|-------|-----|
| Página padding | `p-4 lg:p-6` | Contenido principal (responsive) |
| Card padding | `p-5` o `p-6` | Interior de cards |
| Card gap | `gap-4 lg:gap-6` | Entre cards del grid |
| Section gap | `mt-6` o `mt-8` | Entre secciones de la página |
| Table row height | `py-3.5 px-5` | Celdas de tabla |

### Border Radius

| Elemento | Valor |
|----------|-------|
| Cards | `rounded-xl` (12px) |
| Botones | `rounded-lg` (8px) |
| Badges | `rounded-full` |
| Inputs | `rounded-lg` (8px) |
| Modales | `rounded-2xl` (16px) |
| Avatares | `rounded-full` |
| Botones acción tabla | `rounded-lg` (8px) |

### Sombras

| Nivel | Clase | Uso |
|-------|-------|-----|
| Ninguna | — | Tablas, elementos inline |
| Sutil | `shadow-sm` | Cards en reposo |
| Media | `shadow-md` | Cards hover, dropdowns |
| Alta | `shadow-xl` | Modales, overlays |
| Máxima | `shadow-2xl` | Login card, dialogs principales, modal detalle |

### Breakpoints Responsive

| Breakpoint | Ancho | Layout |
|-----------|-------|--------|
| Mobile | `<640px` | Sidebar drawer, 1 columna, acciones en dropdown ⋯ |
| Tablet | `640–1023px` | Sidebar drawer, 2 columnas, acciones visibles |
| Desktop | `≥1024px` | Sidebar fijo `w-64`, 3+ columnas, layout completo |

---

## 🗂️ Plan de Implementación por Fases

### Fase 0 — Avatar de Usuario ✅ COMPLETADA
1. ~~Migración BD: campo `avatarUrl` en `Usuario`~~ ✅
2. ~~Endpoints API: upload/get/delete avatar~~ ✅
3. ~~Header CRM: avatar del usuario logueado con dropdown~~ ✅
4. ~~UsuariosTab: avatar en tabla + upload en formulario~~ ✅
5. ~~Tabla Asociados: selfie como avatar~~ ✅

### Fase 1 — Diseño Enterprise Base ✅ COMPLETADA
6. ~~Sidebar: borde active, indicador visual~~ ✅
7. ~~Header: dropdown avatar, búsqueda placeholder, breadcrumb chevron~~ ✅
8. ~~StatsCards: iconos watermark, delta trend, animación entrada~~ ✅
9. ~~Login: dark mode, ilustración expandida~~ ✅
10. ~~Dark mode 100% en todas las páginas~~ ✅
11. ~~DataTable: dark mode completo~~ ✅

### Fase 2 — Responsive + Mobile Navigation 🔴 PENDIENTE
12. Layout responsive: sidebar drawer en mobile + hamburger en header
13. Sidebar: quitar avatar duplicado del footer, solo versión
14. Header: botón hamburguesa en mobile, breadcrumb adaptativo
15. Contenido: padding y grids responsive
16. SearchToolbar: colapsar en mobile
17. Tablas: scroll horizontal controlado en mobile

### Fase 3 — Tablas Enterprise + Datos Ricos 🔴 PENDIENTE
18. Helper `formatFechaLegible` — aplicar en TODAS las tablas y vistas
19. Celdas con iconos contextuales (Mail, Phone, Calendar, etc.)
20. Teléfonos en badge verde, emails con icono, nombres con avatar
21. Columna acciones: botones Eye/Pencil/Trash2 visibles con colores claros
22. Detalle en modal: migrar lógica de `[id]/page.tsx` a modal reutilizable
23. Headers de tabla: uppercase, tracking-wider, text-xs
24. Filas: hover primary-50, zebra sutil, bordes finos
25. Badges con dot indicator (●) antes del texto

### Fase 4 — Pulido Visual 🟡 PENDIENTE
26. Gráficos: bordes redondeados, donut, tooltips glassmorphism
27. Formularios: focus ring premium, modales con backdrop blur
28. Animaciones de entrada escalonadas en listas

### Fase 5 — Configurador de Temas (BAJA) 🔵 PENDIENTE
29. Guardar/eliminar temas custom
30. Selector de tipografía
31. Export/Import temas JSON
32. Preview expandido

---

## ⚠️ Problemas Identificados

| # | Problema | Severidad | Estado |
|---|---------|-----------|--------|
| 1 | **Sin responsive/mobile** — sidebar nunca colapsa, tablas desbordan | 🔴 Alta | Pendiente |
| 2 | **Avatar duplicado** — aparece en Sidebar footer Y Header dropdown | 🔴 Alta | Pendiente |
| 3 | **Fechas formato corto** `DD/MM/YYYY` — poco legible, no profesional | 🔴 Alta | Pendiente |
| 4 | **Botones acción invisibles** — Eye icon minúsculo sin color ni presencia | 🔴 Alta | Pendiente |
| 5 | **Detalle navega a otra página** — disruptivo, debería ser modal | 🔴 Alta | Pendiente |
| 6 | **Celdas de tabla planas** — texto sin iconos, sin formato rico | 🟡 Media | Pendiente |
| 7 | **Badges sin dot indicator** — solo texto, no tiene el ● visual | 🟡 Media | Pendiente |
| 8 | ~~Foto de asociado no se muestra en tabla~~ | — | ✅ Resuelto |
| 9 | ~~Usuario CRM sin campo avatar~~ | — | ✅ Resuelto |
| 10 | ~~Header sin avatar~~ | — | ✅ Resuelto |
| 11 | ~~Login sin dark mode~~ | — | ✅ Resuelto |
| 12 | ~~Dark mode incompleto en páginas~~ | — | ✅ Resuelto |
