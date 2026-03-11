# 🎨 Plan de Mejoras de Diseño — Core Associates

> Inspirado en dashboards modernos tipo **UYFI Network Intelligence** (dark sidebar, glassmorphism, stat cards con iconos) y **ARXIS Financial Dashboard** (clean layout, progress bars, alert cards, trend charts).

---

## 📐 Filosofía de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Contraste informativo** | Sidebar oscura + contenido claro. Colores solo donde comunican estado. |
| **Densidad inteligente** | Más información por pantalla sin saturar. Cards compactas, tipografía calibrada. |
| **Navegación predictiva** | El usuario llega a lo importante en ≤2 clics. Quick-actions visibles. |
| **Consistencia cross-platform** | CRM Web y App Móvil comparten paleta, iconografía y lenguaje visual. |
| **Accesibilidad** | Contraste WCAG AA, tamaños mínimos touch 44px, focus visible. |

---

## 🖥️ CRM Web — Rediseño

### 1. Sidebar (Navegación Principal)

**Actual**: Sidebar blanca con íconos grises, hover sutil.  
**Propuesto**: Sidebar **dark gradient** (`gray-900` → `gray-950`) con estilo UYFI.

```
┌──────────────────────┐
│  🔷 CORE ASSOCIATES  │  ← Logo + nombre en blanco
│  ─────────────────── │
│  🏠 Dashboard        │  ← Ítem activo: bg-primary-600/20, borde izquierdo primary-500
│  👥 Asociados        │  ← Hover: bg-white/5, transición 200ms
│  🏢 Proveedores      │
│  🎫 Promociones      │
│  🎟️ Cupones          │
│  ⚖️ Casos Legales    │
│  📊 Reportes         │
│  ⚙️ Configuración    │
│  ─────────────────── │
│  👤 Admin            │  ← Avatar + nombre + botón logout
│  📧 admin@core...    │
└──────────────────────┘
```

**Cambios concretos**:
- Background: `bg-gradient-to-b from-gray-900 to-gray-950`
- Texto: `text-gray-400` inactivo → `text-white` activo
- Ítem activo: `bg-primary-600/20 border-l-3 border-primary-500 text-white`
- Hover: `bg-white/5`
- Logo area: padding mayor, logo con glow sutil
- Footer: mini-card usuario con avatar circular

### 2. Dashboard — Stat Cards Mejoradas

**Actual**: Cards planas con número grande y título.  
**Propuesto**: Cards estilo **UYFI** con icono de fondo, micro-trend y color temático.

```
┌─────────────────────────┐
│  📊 Asociados Activos   │
│  ██████████             │  ← mini sparkline o progress
│  ┌────┐                 │
│  │ 150│  +12 este mes   │  ← valor principal + delta con flecha ↑
│  └────┘                 │
│  ● 200 total            │  ← subtitle con bullet color
└─────────────────────────┘
```

**Cambios concretos**:
- Cada card lleva un icono grande semitransparente en la esquina superior derecha (tipo watermark)
- Color de fondo sutil: `bg-blue-50` → azul, `bg-green-50` → verde, etc.
- Borde izquierdo de 3px con el color de la card
- Badge de delta: `+12 ↑` en verde o `-3 ↓` en rojo
- Animación de entrada: fade-in + slide-up escalonado

### 3. Tablas de Datos (DataTable)

**Actual**: Tabla estándar con bordes grises.  
**Propuesto**: Tablas modernas estilo ARXIS.

**Cambios concretos**:
- Header: `bg-gray-50/80 backdrop-blur-sm`, texto `text-xs uppercase tracking-wider text-gray-500`
- Filas: hover `bg-primary-50/50`, transición suave
- Status pills: pills redondeadas con punto de color + texto. Ej: `● Activo` con bg-green-50
- Avatares/iniciales en columna de nombre
- Acciones al hover: íconos que aparecen con fade
- Zebra striping muy sutil: `odd:bg-gray-25`
- Skeleton loading: pulso animado en gradiente

### 4. Detail Pages (Asociado, Proveedor, Caso Legal)

**Actual**: Grid de 3 columnas con cards simples.  
**Propuesto**: Layout moderno con header ProfileCard + tabs.

```
┌──────────────────────────────────────────────────┐
│  ← Volver                                        │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ [FOTO]  Carlos García López          Activo │ │  ← Profile header card con blur bg
│  │         A-001 · +52 55 1000 0001            │ │
│  │  [Aprobar] [Suspender] [Crear Nota]         │ │  ← Quick actions
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  [Datos] [Vehículos] [Documentos] [Cupones] [Timeline]  ← Tabs
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │  Contenido del tab seleccionado              ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Cambios concretos**:
- Header card con gradiente sutil (`bg-gradient-to-r from-primary-50 to-white`)
- Foto/avatar circular más grande (64px → 80px) con borde
- Badge de estado con animación pulse para "pendiente"
- Tabs underline style (no pills), con counter badges
- Timeline con línea vertical conectora estilo UYFI
- Documentos: preview thumbnail con overlay de estado

### 5. Gráficos del Dashboard

**Actual**: BarChart + PieChart de Recharts básicos.  
**Propuesto**: Gráficos refinados estilo ARXIS.

**Cambios concretos**:
- BarChart: bordes redondeados (`radius: [8,8,0,0]`), gradientes verticales
- Agregar **AreaChart** como alternativa para tendencia (más visual)
- PieChart: donut con label central mostrando total
- Tooltips: card con sombra, borde sutil, backdrop blur
- Agregar indicador de "período" con selector (7d / 30d / 90d / 1a)
- Color palette refinada: blue-500, violet-500, emerald-500, amber-500

### 6. Formularios

**Actual**: Inputs estándar con bordes grises.  
**Propuesto**: Inputs refinados con mejor UX.

**Cambios concretos**:
- Focus ring: `ring-2 ring-primary-500/20 border-primary-500`
- Labels flotantes animadas (opcional)
- Validación inline con ícono ✓ / ✗ en el input
- Select dropdowns con search incorporado para listas largas
- File upload: drag & drop area con preview
- Botón submit: gradiente `bg-gradient-to-r from-primary-600 to-primary-700`

### 7. Notificaciones y Toasts

**Actual**: Toast básico en esquina.  
**Propuesto**: Toast mejorado + notification center.

**Cambios concretos**:
- Toast: glassmorphism (`bg-white/80 backdrop-blur-xl`), ícono animado, progress bar de autocierre
- Bell icon en header con badge de count
- Dropdown de notificaciones recientes al hacer clic

### 8. Header

**Actual**: Breadcrumb + user info + logout.  
**Propuesto**: Header moderno con más utilidad.

**Cambios concretos**:
- Breadcrumb con separador chevron (`/` → `›`)
- Barra de búsqueda global (cmd+k) para buscar asociados, proveedores, casos
- Campana de notificaciones con badge
- Avatar circular con dropdown (perfil, configuración, logout)
- Dark mode toggle (preparar pero no implementar aún)

---

## 📱 App Móvil — Rediseño

### 1. Bottom Navigation Bar

**Actual**: BottomNavigationBar estándar Material.  
**Propuesto**: Custom bottom bar con indicador animado.

```
┌─────────────────────────────────────┐
│  🏠      🎫      🆘      👤       │
│ Inicio  Promos   SOS    Perfil     │
│  ───                               │  ← indicador animado bajo el tab activo
└─────────────────────────────────────┘
```

**Cambios concretos**:
- Background: `Colors.white` con `BoxShadow` sutil hacia arriba
- Ícono activo: `primary-600` con ícono filled
- Indicador: dot o línea corta animada con `AnimatedPositioned`
- Texto activo: `FontWeight.w600`, inactivo: `FontWeight.w400`
- Efecto de tap: ripple circular contenido

### 2. Home Screen

**Actual**: Bienvenida + lista de promociones destacadas.  
**Propuesto**: Dashboard personal del conductor.

```
┌─────────────────────────────┐
│  Buenos días, Carlos 👋     │  ← Greeting + avatar
│  Membresía #A-001           │
│                              │
│  ┌─────────┐ ┌─────────┐   │
│  │ 3       │ │ 1       │   │  ← Mini stat cards
│  │ Cupones │ │ Caso    │   │
│  │ activos │ │ abierto │   │
│  └─────────┘ └─────────┘   │
│                              │
│  🎫 Promociones Destacadas  │  ← Section header
│  ┌──────────────────────┐   │
│  │ [IMG] 20% aceite     │   │  ← Horizontal scroll cards
│  │       Talleres El... │   │
│  └──────────────────────┘   │
│                              │
│  📋 Actividad Reciente      │
│  ● Cupón canjeado ayer      │  ← Timeline items
│  ● Caso #CL-003 resuelto   │
└─────────────────────────────┘
```

**Cambios concretos**:
- Header personalizado con saludo por hora del día
- Row de stat cards con sombra sutil y esquinas redondeadas (16px)
- Promociones en `horizontal ListView` con cards tipo Tinder
- Cards de promoción: imagen con overlay gradiente oscuro + texto blanco
- Sección de actividad reciente como feed vertical

### 3. Promotion Cards

**Actual**: Cards con CachedNetworkImage + texto.  
**Propuesto**: Cards premium estilo app de delivery.

**Cambios concretos**:
- Card con `ClipRRect(borderRadius: 16)`
- Imagen: aspect ratio 16:9, con `ShaderMask` gradiente oscuro en la parte inferior
- Texto del título sobre la imagen (blanco, bold)
- Badge de descuento: círculo `primary-600` con `-20%` en bold blanco
- Nombre del proveedor en texto secundario
- Chip de vigencia: `"Válido hasta 31 Dic"`
- Animación de entrada: `FadeTransition + SlideTransition`
- Shimmer placeholder mientras carga

### 4. Coupon Detail Screen

**Actual**: QR + información del cupón.  
**Propuesto**: Pantalla de ticket/voucher.

```
┌─────────────────────────────┐
│       ← Detalle del Cupón   │
│                              │
│  ┌──────────────────────┐   │
│  │   ┌──────────────┐   │   │
│  │   │              │   │   │  ← Container tipo "ticket" con recortes
│  │   │   [QR CODE]  │   │   │     circulares en los bordes
│  │   │              │   │   │
│  │   └──────────────┘   │   │
│  │                      │   │
│  │  - - - - - - - - -   │   │  ← Línea punteada separadora
│  │                      │   │
│  │  20% Cambio Aceite   │   │
│  │  Talleres El Rápido  │   │
│  │                      │   │
│  │  📅 Válido hasta:    │   │
│  │     15 Jul 2025      │   │
│  │  📍 Insurgentes 1234 │   │
│  └──────────────────────┘   │
│                              │
│  [ Mostrar al Proveedor ]   │  ← Botón que amplía el QR
└─────────────────────────────┘
```

**Cambios concretos**:
- Container tipo "ticket" con CustomClipper para recortes circulares laterales
- QR centrado con borde y padding generoso
- Línea punteada separadora (DashedLinePainter)
- Información organizada con íconos
- Botón de pantalla completa para el QR (brightness máximo)
- Animación de confetti al generar cupón nuevo

### 5. Legal SOS Screen

**Actual**: Formulario + lista de casos.  
**Propuesto**: Pantalla de emergencia con UX optimizada.

**Cambios concretos**:
- Botón SOS grande y prominente (círculo rojo, pulse animation)
- Al presionar: bottom sheet con selector de tipo de incidente (íconos grandes)
- GPS auto-detect con mapa miniatura
- Lista de casos como cards con timeline lateral
- Badge de prioridad con colores claros (alta=rojo, media=amarillo, baja=verde)
- Case detail: timeline vertical con nodos circulares conectados

### 6. Profile Screen

**Actual**: Avatar + datos + botones.  
**Propuesto**: Profile card premium.

**Cambios concretos**:
- Header con gradiente `primary-600` → `primary-800` + avatar grande con borde blanco
- Card de ID virtual con diseño tipo credencial
- Secciones con `ExpansionTile` animados: "Mis Datos", "Vehículos", "Documentos"
- Progress indicator de perfil completo (`75% completado`)
- Badge de membresía (Activa / Pendiente / etc.) con ícono

### 7. Documents Screen

**Actual**: Lista de documentos con estado.  
**Propuesto**: Galería visual de documentos.

**Cambios concretos**:
- Grid de 2 columnas con thumbnail preview
- Overlay de estado: ícono check verde (aprobado), reloj amarillo (pendiente), X roja (rechazado)
- Presionar para ver en pantalla completa con zoom (InteractiveViewer)
- Botón de cámara/galería mejorado con bottom sheet
- Upload progress: barra animada sobre el thumbnail

### 8. Tema y Colores

**Paleta principal**:
```dart
// Primary (azul corporativo)
primary-50:  #eff6ff
primary-100: #dbeafe
primary-500: #3b82f6
primary-600: #2563eb
primary-700: #1d4ed8
primary-900: #1e3a5f

// Accent (para CTAs y highlights)
accent: #8b5cf6 (violet-500)

// Status
success: #22c55e (green-500)
warning: #f59e0b (amber-500)
danger:  #ef4444 (red-500)
info:    #06b6d4 (cyan-500)

// Neutrals
surface: #ffffff
background: #f8fafc (slate-50)
card: #ffffff
textPrimary: #0f172a (slate-900)
textSecondary: #64748b (slate-500)
border: #e2e8f0 (slate-200)
```

### 9. Tipografía

| Uso | Weight | Size |
|-----|--------|------|
| Heading 1 | Bold (700) | 24sp |
| Heading 2 | SemiBold (600) | 20sp |
| Heading 3 | SemiBold (600) | 16sp |
| Body | Regular (400) | 14sp |
| Caption | Regular (400) | 12sp |
| Label | Medium (500) | 12sp |
| Button | SemiBold (600) | 14sp |

Font family: **Inter** (consistente entre Web y App).

---

## 🗂️ Prioridades de Implementación

### Fase 1 — Alto Impacto Visual (1-2 semanas)
1. ✅ Sidebar dark gradient (CRM)
2. ✅ Stat cards mejoradas con iconos (CRM)
3. ✅ Tablas con status pills y avatares (CRM)
4. ✅ Promotion cards premium (App)
5. ✅ Bottom navigation con indicador animado (App)

### Fase 2 — Polish & UX (1-2 semanas)
6. Dashboard charts refinados (CRM)
7. Detail pages con tabs (CRM)
8. Home screen tipo dashboard personal (App)
9. Coupon ticket design (App)
10. Profile card premium (App)

### Fase 3 — Features Avanzados (2-3 semanas)
11. Búsqueda global cmd+k (CRM)
12. Notification center (CRM)
13. SOS emergency UX mejorada (App)
14. Document gallery con preview (App)
15. Dark mode (ambos)

---

## 📎 Componentes Reutilizables a Crear

### CRM Web
| Componente | Descripción |
|-----------|-------------|
| `GlassCard` | Card con backdrop-blur y borde translúcido |
| `StatCardV2` | Card de métrica con icono, delta, sparkline |
| `StatusPill` | Pill con dot de color + texto |
| `AvatarGroup` | Grupo de avatares solapados |
| `TabsUnderline` | Tabs con línea indicadora animada |
| `GlobalSearch` | Modal cmd+k con fuzzy search |
| `TimelineVertical` | Timeline con nodos y línea conectora |

### App Móvil
| Componente | Descripción |
|-----------|-------------|
| `TicketCard` | Container tipo boleto con recortes |
| `AnimatedBottomNav` | Bottom bar con indicador animado |
| `PromotionCard` | Card de promoción con imagen y overlay |
| `SOSButton` | Botón circular con animación pulse |
| `ProfileHeader` | Header con gradiente y avatar |
| `DocumentThumbnail` | Grid item con preview y overlay de estado |
| `MiniStatCard` | Card compacta para home screen |

---

## 📐 Mockups de Referencia

Los diseños toman inspiración de:
- **UYFI Network Intelligence**: Sidebar oscura, glassmorphism, stat cards con iconos watermark, gráficos con gradientes
- **ARXIS Financial Dashboard**: Layout limpio, progress bars, alert cards, trend charts, tipografía Inter

Los colores primarios se mantienen del branding actual (`primary-600: #2563eb`), adaptando la estética moderna sin perder la identidad visual de Core Associates.
