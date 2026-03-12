# 📱 DESIGN PLAN — App Móvil (Flutter)

> Plan de rediseño visual para `core_associates_app/` — hacer la app más llamativa, moderna y profesional.

---

## 📋 Estado Actual — Diagnóstico

### Tema (`shared/theme/app_theme.dart`)

| Aspecto | Estado actual | Problema |
|---|---|---|
| **Colores** | 13 constantes planas (`AppColors`) | Sin paleta de sombras (50-950), sin gradientes reutilizables |
| **Tipografía** | Font por defecto de Material | Sin fuente custom, sin escala tipográfica definida |
| **Dark mode** | No existe | Solo `ThemeData.light` |
| **Border radius** | 12px hardcoded por screen | Inconsistente, no centralizado |
| **Sombras** | Solo en MembershipCard y SOS button | La mayoría de cards usa `Border.all(color: border)` sin profundidad |
| **Animaciones** | Ninguna custom | `NoTransitionPage` en todas las rutas, sin skeleton loaders |
| **Iconos** | Material Icons genéricos | Sin iconografía custom ni logo real (usa `Icons.groups_rounded` como logo) |

### Pantallas — Observaciones

| Pantalla | Lo que funciona | Lo que falta |
|---|---|---|
| **Login** | Estructura clara, auto-submit a 10 dígitos | Logo genérico (`Icons.groups_rounded`), sin ilustración, sin branding |
| **OTP** | Pin input funcional, versión web diferenciada | Sin animación de entrada, sin countdown visual circular |
| **Home** | MembershipCard con gradiente (único elemento rico), KYC banner contextual | Quick actions son boxes planas sin depth, promos recientes sin imagen hero |
| **Promotions** | Category chips horizontales, manejo de estados vacío/error/loading | Cards planas (border sin shadow), `CircularProgressIndicator` crudo, sin shimmer |
| **Coupon Detail** | QR con `QrImageView` estilizado (ojos circulares), fullscreen al tap | Sin diseño tipo ticket/boleto, info card genérica |
| **Legal SOS** | Botón SOS circular rojo con sombra (bien diseñado) | Sin pulse animation, diálogo SOS es un `AlertDialog` genérico |
| **Documents** | Preview antes de subir, bottom sheet para cámara/galería, InteractiveViewer | Sin progress stepper visual, upload progress no visible |
| **Profile** | Avatar con CachedNetworkImage, menú tipo settings | Sin header con gradiente, avatar pequeño (40px), lista plana |
| **Vehicles/Edit Profile** | Funcionales | UI genérica de formulario |

### Elementos positivos a preservar

- ✅ **MembershipCard**: gradiente `primary → primaryDark`, sombra coloreada, layout de credencial — patrón a extender
- ✅ **SOS button**: círculo rojo, sombra difusa, composición icono+texto — referencia para CTAs
- ✅ **KYC banner**: color contextual por estado, borde sutil, ícono + texto — patrón de banner útil
- ✅ **OTP Peek banner**: gradiente violet, sombra coloreada — muestra que gradientes funcionan bien
- ✅ **QR estilizado**: ojos circulares, data modules circulares — toque premium

---

## 🎨 Sistema de Diseño Propuesto

### 1. Paleta de Colores Expandida

Migrar de 13 constantes planas a paleta completa con sombras (alineada con Tailwind y el CRM).

```dart
/// Paleta primaria — azul corporativo
abstract class AppColors {
  // Primary shades (blue-600 = base)
  static const Color primary50  = Color(0xFFEFF6FF);
  static const Color primary100 = Color(0xFFDBEAFE);
  static const Color primary200 = Color(0xFFBFDBFE);
  static const Color primary300 = Color(0xFF93C5FD);
  static const Color primary400 = Color(0xFF60A5FA);
  static const Color primary500 = Color(0xFF3B82F6);
  static const Color primary    = Color(0xFF2563EB);  // primary-600 (base)
  static const Color primary700 = Color(0xFF1D4ED8);
  static const Color primary800 = Color(0xFF1E40AF);
  static const Color primary900 = Color(0xFF1E3A5F);
  
  // Secondary shades (emerald-500 = base)
  static const Color secondary50  = Color(0xFFECFDF5);
  static const Color secondary100 = Color(0xFFD1FAE5);
  static const Color secondary    = Color(0xFF10B981);  // secondary-500
  static const Color secondary700 = Color(0xFF047857);
  
  // Accent (violet — para highlights y elementos premium)
  static const Color accent    = Color(0xFF8B5CF6);
  static const Color accent50  = Color(0xFFF5F3FF);
  static const Color accent100 = Color(0xFFEDE9FE);
  static const Color accent700 = Color(0xFF6D28D9);

  // Semantic
  static const Color error     = Color(0xFFEF4444);
  static const Color error50   = Color(0xFFFEF2F2);
  static const Color warning   = Color(0xFFF59E0B);
  static const Color warning50 = Color(0xFFFFFBEB);
  static const Color success   = Color(0xFF22C55E);
  static const Color success50 = Color(0xFFF0FDF4);
  static const Color info      = Color(0xFF06B6D4);

  // Neutrals
  static const Color surface       = Color(0xFFF8FAFC);  // slate-50
  static const Color background    = Color(0xFFFFFFFF);
  static const Color textPrimary   = Color(0xFF0F172A);  // slate-900 (más oscuro)
  static const Color textSecondary = Color(0xFF64748B);  // slate-500
  static const Color textTertiary  = Color(0xFF94A3B8);  // slate-400
  static const Color border        = Color(0xFFE2E8F0);  // slate-200
  static const Color divider       = Color(0xFFF1F5F9);  // slate-100
}
```

**Nota de alineación CRM**: El CRM tiene `generatePalette()` que genera 11 sombras desde un hex base con matemática HSL. Para la app, usamos constantes fijas pero con los mismos valores. Si en el futuro se implementa tematización dinámica, se puede portar la misma lógica HSL a Dart.

### 2. Gradientes Reutilizables

```dart
abstract class AppGradients {
  static const LinearGradient primary = LinearGradient(
    colors: [AppColors.primary, AppColors.primary800],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accent = LinearGradient(
    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient success = LinearGradient(
    colors: [AppColors.secondary, AppColors.secondary700],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient danger = LinearGradient(
    colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Gradiente sutil para fondos de sección
  static const LinearGradient surfaceSubtle = LinearGradient(
    colors: [Color(0xFFF8FAFC), Color(0xFFEFF6FF)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
```

### 3. Sombras Estandarizadas

```dart
abstract class AppShadows {
  /// Sombra sutil para cards elevadas
  static final List<BoxShadow> sm = [
    BoxShadow(
      color: Colors.black.withOpacity(0.04),
      blurRadius: 6,
      offset: const Offset(0, 2),
    ),
  ];

  /// Sombra media para cards interactivas
  static final List<BoxShadow> md = [
    BoxShadow(
      color: Colors.black.withOpacity(0.06),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  /// Sombra coloreada para elementos con gradiente
  static List<BoxShadow> colored(Color color) => [
    BoxShadow(
      color: color.withOpacity(0.25),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];
}
```

### 4. Tipografía

**Font**: **Inter** (consistente con el CRM web que ya la usa via Tailwind).

```dart
// En pubspec.yaml agregar google_fonts
// O descargar Inter y usar como asset

abstract class AppTypography {
  static const String fontFamily = 'Inter';

  static const TextStyle h1 = TextStyle(
    fontFamily: fontFamily, fontSize: 28, fontWeight: FontWeight.w700, height: 1.2,
  );
  static const TextStyle h2 = TextStyle(
    fontFamily: fontFamily, fontSize: 22, fontWeight: FontWeight.w600, height: 1.3,
  );
  static const TextStyle h3 = TextStyle(
    fontFamily: fontFamily, fontSize: 18, fontWeight: FontWeight.w600, height: 1.35,
  );
  static const TextStyle body = TextStyle(
    fontFamily: fontFamily, fontSize: 15, fontWeight: FontWeight.w400, height: 1.5,
  );
  static const TextStyle bodySmall = TextStyle(
    fontFamily: fontFamily, fontSize: 13, fontWeight: FontWeight.w400, height: 1.5,
  );
  static const TextStyle label = TextStyle(
    fontFamily: fontFamily, fontSize: 12, fontWeight: FontWeight.w500, height: 1.4,
    letterSpacing: 0.3,
  );
  static const TextStyle button = TextStyle(
    fontFamily: fontFamily, fontSize: 15, fontWeight: FontWeight.w600, height: 1.2,
  );
}
```

### 5. Design Tokens Centralizados

```dart
abstract class AppRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double full = 999;
}

abstract class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double section = 32;
}
```

---

## 🖼️ Rediseño por Pantalla

### 1. Login Screen

**Objetivo**: Primera impresión memorable — branding sólido.

**Cambios**:
- **Reemplazar** `Icons.groups_rounded` por logo real SVG o imagen de marca (cuando exista)
- **Agregar ilustración** decorativa sutil arriba (silueta de conductor o iconografía de la ciudad)
- **Fondo**: gradiente muy sutil `surfaceSubtle` en lugar de blanco plano
- **Input con prefijo mejorado**: container redondeado para `🇲🇽 +52` con fondo `primary50`
- **Botón "Continuar"**: gradiente `primary → primary700` en lugar de color sólido
- **Animación**: `FadeTransition` + `SlideTransition` escalonada para los elementos al cargar
- **Footer legal**: hacer los textos "Términos y Condiciones" como links clicables con underline

```
┌─────────────────────────────────┐
│                                 │
│      [Ilustración sutil]        │  ← SVG o Lottie animation
│                                 │
│      ⬡  CORE ASSOCIATES        │  ← Logo + nombre
│      Asociación de Conductores  │
│                                 │
│  ┌─────────────────────────┐    │
│  │  🇲🇽 +52 │ 55 1234 5678 │    │  ← Input mejorado
│  └─────────────────────────┘    │
│                                 │
│  [   ▓▓▓ Continuar ▓▓▓   ]     │  ← Botón con gradiente
│                                 │
│  Términos · Privacidad          │
└─────────────────────────────────┘
```

### 2. OTP Screen

**Cambios**:
- **Countdown circular**: `CircularProgressIndicator` custom alrededor del timer (no solo texto)
- **Animación de entrada**: pin boxes aparecen una a una con `staggered animation`
- **Estado de verificación**: al completar los 6 dígitos, mostrar animación de loading en el pin (borde pulsante) antes de navegar
- **Reenvío**: botón "Reenviar código" aparece con fade al terminar countdown

### 3. Home Screen — Dashboard Personal

**Objetivo**: Pantalla más rica e informativa, primer contacto post-login.

```
┌──────────────────────────────────┐
│  Buenos días, Carlos 👋          │  ← Saludo contextual por hora
│  Core Associates                 │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ✓  Membresía Activa       │  │  ← MembershipCard (ya existe, mejorar)
│  │    Carlos García López     │  │     + efecto shimmer en el borde
│  │    Asociado #A-001         │  │     + ícono de verificación animado
│  │    📱 +52 55 1000 0001    │  │
│  │    🚗 Toyota Corolla 2020 │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌── KYC Banner ──────────────┐  │  ← Ya existe, agregar:
│  │  📤 Completa tu expediente │  │     · Barra de progreso (2/4 docs)
│  └────────────────────────────┘  │     · Animación pulse en estado pendiente
│                                  │
│  Acceso Rápido                   │
│  ┌────────┐ ┌────────┐          │
│  │ 🎫     │ │ 📄     │          │  ← Cards con sombra sm + ícono coloreado
│  │ Mis    │ │ Docs   │          │     en container circular con bg tenue
│  │ Cupones│ │        │          │
│  └────────┘ └────────┘          │
│  ┌────────┐ ┌────────┐          │
│  │ 🚗     │ │ ⚠️     │          │
│  │ Vehíc. │ │ SOS    │          │
│  └────────┘ └────────┘          │
│                                  │
│  Promociones Recientes           │
│  ┌──────────────────────────┐   │
│  │ [IMG]  20% Cambio Aceite │   │  ← Cards con imagen hero + overlay
│  │        Talleres El Rap...│   │     gradiente oscuro + badge descuento
│  └──────────────────────────┘   │
└──────────────────────────────────┘
```

**Mejoras específicas**:

- **Quick Actions**: Reemplazar boxes planas por cards con:
  - Ícono dentro de container circular con `color.withOpacity(0.1)` como background
  - Sombra `sm` en lugar de border
  - Animación `scale` al tap (`AnimatedScale` o `InkWell` con splash)
  
- **MembershipCard**: 
  - Agregar efecto shimmer sutil en el borde (tipo tarjeta premium)
  - Ícono `verified` con pequeña animación pulse si está activo
  
- **Promo cards en Home**:
  - Mostrar imagen de la promoción como hero (si existe `imagenUrl`)
  - Overlay gradiente oscuro → texto blanco sobre la imagen
  - Badge de descuento: círculo pequeño `primary` con `-20%`

### 4. Promotions Screen

**Cambios principales**:

- **Category chips**: Agregar animación de selección (backgroundColor animated transition)
- **Promotion cards rediseñadas**:
  ```
  ┌──────────────────────────────┐
  │ [  📸 IMAGEN HERO 16:9    ] │  ← ClipRRect con borderRadius top
  │ ┌──────────────────────────┐ │
  │ │ 🏷️ -20%  ← badge float  │ │  ← Positioned sobre la imagen
  │ └──────────────────────────┘ │
  │                              │
  │  Cambio de Aceite Premium    │  ← Título bold
  │  Talleres El Rápido S.A.    │  ← Subtítulo secondary
  │                              │
  │  📅 Hasta 31 Dic  [ Cupón ] │  ← Vigencia + CTA button
  └──────────────────────────────┘
  ```
  - Imagen: `CachedNetworkImage` con `ShaderMask` gradiente si se monta texto encima
  - Badge de descuento: `Positioned` top-right sobre la imagen
  - Sombra `sm` en la card completa
  - Botón "Generar Cupón" como `FilledButton.tonal` dentro de la card

- **Loading state**: Reemplazar `CircularProgressIndicator` por **shimmer placeholders** (3-4 cards grises pulsantes)
- **Empty state**: Agregar ilustración simple (icono grande + texto descriptivo, ya existe pero mejorar con `primary100` background circle detrás del ícono)
- **Animación de lista**: `AnimatedList` o `SliverList` con `FadeTransition` escalonada al cargar

### 5. Coupon Detail — Diseño Tipo Ticket

**Objetivo**: El cupón debe verse como un boleto/ticket real.

```
┌──────────────────────────────────┐
│       ← Detalle del Cupón        │
│                                  │
│  ┌──────────────────────────┐    │
│  │                          │    │
│  │       [  QR CODE  ]      │    │  ← Container blanco con sombra
│  │       Toca para ampliar  │    │
│  │                          │    │
│  ◖─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─◗    │  ← Línea punteada + semicírculos
│  │                          │    │     en los bordes (CustomClipper)
│  │  ● ACTIVO                │    │  ← Badge de estado
│  │                          │    │
│  │  20% Cambio de Aceite    │    │  ← Título promoción
│  │  Talleres El Rápido      │    │  ← Proveedor
│  │                          │    │
│  │  Código: CPN-ABC123      │    │  ← Código con letterSpacing
│  │  📅 Generado: 15/06/2025 │    │
│  │  ⏳ Vence: 15/07/2025    │    │
│  └──────────────────────────┘    │
│                                  │
│  [  Mostrar al Proveedor  ]     │  ← Botón que maximiza QR + brillo
└──────────────────────────────────┘
```

**Cambios**:
- **CustomClipper `TicketClipper`**: recortes semicirculares en los bordes izquierdo/derecho a la altura del separador
- **Línea punteada**: `CustomPainter` con `DashedLinePainter` como separador visual
- **Animación confetti**: al generar un cupón nuevo, animación breve de celebración (package `confetti`)
- **Fullscreen QR**: activar `Brightness.max` cuando se muestra, restaurar al cerrar

### 6. Legal SOS — Pantalla de Emergencia

**Objetivo**: UX de emergencia que transmita urgencia sin causar pánico.

**Cambios**:
- **Botón SOS con pulse**: agregar `AnimationController` que escale el botón suavemente (1.0 → 1.05 → 1.0) en loop
- **Reemplazar AlertDialog por Bottom Sheet**: al presionar SOS → `showModalBottomSheet` con:
  - Opciones tipo grid con íconos grandes (accidente 🚗, infracción 📝, robo 🔒, asalto ⚡, otro ❓)
  - Cada opción es un card tap-able con ícono + label
  - Mapa miniatura con ubicación actual (si ya se obtuvo GPS)
- **Cards de cobertura**: agregar gradiente sutil de fondo (`primary50`) + ícono dentro de container circular coloreado
- **Lista de casos**: agregar timeline lateral con línea conectora vertical y dots de estado coloreados, en lugar de solo cards sueltas
- **Badge de estado del caso**: pill redondeado con colores semánticos (abierto=blue, en_proceso=amber, resuelto=green, cerrado=gray)

### 7. Documents Screen

**Cambios**:
- **Progress stepper visual**: barra en la parte superior mostrando `2/4 documentos completados` con segmentos coloreados (ya existe `DocumentProgress` widget — verificar y mejorar)
- **Grid de documentos**: cambiar de lista vertical a grid 2 columnas:
  ```
  ┌───────────┐ ┌───────────┐
  │  [thumb]  │ │  [thumb]  │
  │  ✓ INE F. │ │  ⏳ INE R. │  ← Thumbnail + overlay de estado
  └───────────┘ └───────────┘
  ```
- **Upload progress**: `LinearProgressIndicator` sobre la card durante el upload, con color del estado
- **Estado por documento**: ícono overlay en la esquina (✓ verde, ⏳ amarillo, ✗ rojo, ➕ gris para pendiente)
- **Animación de upload**: el thumbnail aparece con `FadeTransition` después de subir exitosamente

### 8. Profile Screen

**Cambios**:
```
┌──────────────────────────────────┐
│  ┌──────────────────────────┐    │
│  │  ▓▓▓ GRADIENTE ▓▓▓▓▓▓▓  │    │  ← Header con gradiente primary
│  │       [ AVATAR ]         │    │     Avatar 64px → 80px con borde blanco
│  │     Carlos García López  │    │     Texto blanco sobre gradiente
│  │     ✓ Miembro activo     │    │
│  │     A-001                │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌ Completitud del perfil ──┐    │  ← Barra de progreso circular
│  │  ████████░░ 75% completo │    │     (docs + datos + vehículo + foto)
│  └──────────────────────────┘    │
│                                  │
│  📋 Datos Personales       →    │  ← Menu items con ícono en container
│  🚗 Mis Vehículos          →    │     circular coloreado + chevron
│  📄 Mis Documentos         →    │
│  💳 Mi Membresía           →    │
│  🔔 Notificaciones         →    │
│  ❓ Ayuda y Soporte        →    │
│                                  │
│  [  Cerrar Sesión  ]            │
│                                  │
│  Core Associates v1.0.0          │
└──────────────────────────────────┘
```

- **Header con gradiente**: container `primary → primary800` con `ClipPath` o `borderRadius` inferior curvo
- **Avatar más grande**: 80px con borde blanco de 3px y sombra
- **Progress indicator**: indicador circular o lineal de completitud del perfil
- **Menu items mejorados**: ícono dentro de container circular con `color.withOpacity(0.1)`, separadores sutiles, `chevron_right` a la derecha
- **Versión**: footer sutil con versión dinámica (usar `package_info_plus`)

### 9. Bottom Navigation Bar

**Cambios**:
- **Indicador animado**: dot o línea corta debajo del tab activo con `AnimatedPositioned`
- **Íconos filled/outlined**: usar variante `_outlined` para inactivo, filled para activo
- **Sombra superior**: `BoxShadow` hacia arriba en lugar del `elevation: 8` genérico de Material
- **Custom BottomNav**: reemplazar `BottomNavigationBar` de Material por un `Container` custom con `Row` para control total del estilo

```dart
// Estructura del nav custom
Container(
  decoration: BoxDecoration(
    color: Colors.white,
    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: Offset(0, -2))],
  ),
  child: Row(
    mainAxisAlignment: MainAxisAlignment.spaceAround,
    children: [
      _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Inicio', isActive: ...),
      _NavItem(icon: Icons.local_offer_outlined, activeIcon: Icons.local_offer, label: 'Promos', isActive: ...),
      _NavItem(icon: Icons.sos_outlined, activeIcon: Icons.sos, label: 'SOS', isActive: ...),
      _NavItem(icon: Icons.person_outline, activeIcon: Icons.person, label: 'Perfil', isActive: ...),
    ],
  ),
)
```

---

## 🧩 Componentes Reutilizables a Crear

| Componente | Ubicación | Descripción |
|---|---|---|
| `AppCard` | `shared/widgets/app_card.dart` | Card base con sombras `sm`/`md` y border radius configurable |
| `ShimmerPlaceholder` | `shared/widgets/shimmer_placeholder.dart` | Placeholder animado para loading states (reemplaza `CircularProgressIndicator`) |
| `GradientButton` | `shared/widgets/gradient_button.dart` | `ElevatedButton` con `BoxDecoration` gradiente |
| `StatusBadge` | `shared/widgets/status_badge.dart` | Pill redondeado con dot + texto + color semántico |
| `IconContainer` | `shared/widgets/icon_container.dart` | Ícono dentro de círculo con fondo tenue (para quick actions, menú, etc.) |
| `TicketCard` | `shared/widgets/ticket_card.dart` | Container tipo boleto con `CustomClipper` para recortes laterales |
| `AnimatedBottomNav` | `shared/widgets/animated_bottom_nav.dart` | Bottom navigation custom con indicador animado |
| `SectionHeader` | `shared/widgets/section_header.dart` | Título de sección con estilo consistente + acción opcional |
| `EmptyState` | `shared/widgets/empty_state.dart` | Ícono + título + subtítulo para estados vacíos (con fondo circular tenue) |

---

## 🔗 Alineación con CRM Web (Consideración Futura)

El CRM implementó un sistema de temas dinámico (`theme-provider.tsx`) con:
- **`generatePalette(baseHex)`**: genera 11 sombras desde un solo hex con matemática HSL
- **8 presets**: Core Associates (#2563EB), InDriver (#22C55E), Enterprise (#1E293B), Ocean (#0EA5E9), Forest (#059669), Sunset (#F97316), Royal (#7C3AED), Minimal (#6B7280)
- **Dark mode**: toggle que invierte neutrals y ajusta paleta
- **localStorage**: persistencia del tema seleccionado

### Plan de convergencia (NO prioritario ahora)

1. **Fase actual**: App usa constantes estáticas en `AppColors` — suficiente y predecible
2. **Fase futura (si se requiere tematización)**:
   - Portar `generatePalette()` a Dart (`Color` HSL manipulation)
   - Crear `ThemeNotifier` Riverpod que genere dinámicamente la paleta
   - Almacenar preset en `SharedPreferences`
   - Los 8 presets del CRM podrían ser compartidos vía JSON desde la API
3. **Lo que ya está alineado**: colores base (`primary: #2563EB`, `secondary: #10B981`, `error: #EF4444`, `warning: #F59E0B`) son idénticos entre CRM y App
4. **Font Inter**: el CRM ya la usa, agregarla a la app unifica la identidad visual

---

## 📅 Fases de Implementación

### Fase 1 — Fundamentos del Sistema de Diseño (~1-2 días)

| # | Tarea | Impacto |
|---|---|---|
| 1.1 | Expandir `AppColors` con paleta completa (shades 50-900) | 🔴 Alto — base para todo |
| 1.2 | Agregar `AppGradients`, `AppShadows`, `AppRadius`, `AppSpacing` | 🔴 Alto — tokens centralizados |
| 1.3 | Integrar font Inter (via `google_fonts` o asset) | 🟡 Medio — identidad visual |
| 1.4 | Crear `AppCard` y `ShimmerPlaceholder` components | 🟡 Medio — reemplaza patterns repetidos |
| 1.5 | Crear `StatusBadge` y `IconContainer` | 🟢 Bajo — componentes auxiliares |

### Fase 2 — Pantallas de Alto Impacto (~2-3 días)

| # | Tarea | Impacto |
|---|---|---|
| 2.1 | Rediseño Login (logo, ilustración, gradiente en botón, animación entrada) | 🔴 Alto — primera impresión |
| 2.2 | Mejorar Home: Quick Actions con sombra + IconContainer, promo cards con imagen hero | 🔴 Alto — pantalla principal |
| 2.3 | Promotion cards rediseñadas (imagen, badge descuento, shimmer loading) | 🔴 Alto — feature core |
| 2.4 | Profile header con gradiente + avatar grande + progress bar | 🟡 Medio |
| 2.5 | Bottom nav custom con indicador animado | 🟡 Medio — polishment |

### Fase 3 — UX Premium (~2-3 días)

| # | Tarea | Impacto |
|---|---|---|
| 3.1 | Coupon ticket design con `TicketClipper` + línea punteada | 🟡 Medio — diferenciador |
| 3.2 | SOS pulse animation + bottom sheet con grid de tipos | 🟡 Medio — UX emergencia |
| 3.3 | Documents grid view con thumbnails + overlay de estado | 🟡 Medio |
| 3.4 | Animaciones de transición entre pantallas (`FadeTransition` en GoRouter) | 🟢 Bajo — polish |
| 3.5 | Empty states mejorados con `EmptyState` widget | 🟢 Bajo |

### Fase 4 — Avanzado (Futuro)

| # | Tarea | Impacto |
|---|---|---|
| 4.1 | Dark mode (`ThemeData.dark` + toggle en perfil) | 🟡 Medio |
| 4.2 | Tematización dinámica (portar `generatePalette` del CRM) | 🟢 Bajo |
| 4.3 | Animaciones Lottie para estados especiales (confetti al generar cupón, check al verificar OTP) | 🟢 Bajo |
| 4.4 | Onboarding screens ilustrados (primera vez) | 🟢 Bajo |

---

## 📐 Wireframes ASCII — Resumen Visual

### Antes vs Después — Quick Action Card

```
ANTES:                          DESPUÉS:
┌─────────────┐                 ┌─────────────┐
│ 🚗          │ ← ícono suelto  │  (🚗)       │ ← ícono en container circular
│             │                 │              │    con bg color tenue
│ Vehículos   │ ← border plano  │ Vehículos    │ ← sombra sm + scale on tap
└─────────────┘                 └─────────────┘
```

### Antes vs Después — Promotion Card

```
ANTES:                            DESPUÉS:
┌────────────────────┐            ┌────────────────────┐
│ [img]              │            │ [  IMAGEN HERO   ] │ ← 16:9 con overlay
│                    │ ← border   │ 🏷️ -20%           │ ← badge positioned
│ Título             │            │                    │
│ Proveedor          │            │ Título Bold        │
│ Descuento: 20%     │            │ Proveedor          │ ← shadow sm
│                    │            │ 📅 Hasta 31/12     │
│ [ Generar Cupón ]  │            │        [ Cupón ▸ ] │ ← FilledButton.tonal
└────────────────────┘            └────────────────────┘
```

---

## 📦 Dependencias Nuevas (opcionales)

| Package | Uso | Prioridad |
|---|---|---|
| `google_fonts` | Font Inter sin bundlear assets | Fase 1 |
| `shimmer` | Shimmer loading effect | Fase 1 |
| `flutter_animate` | Animaciones declarativas encadenadas | Fase 2 |
| `confetti_widget` | Celebración al generar cupón | Fase 3 |
| `lottie` | Animaciones vectoriales complejas | Fase 4 |

---

## ✅ Criterios de Éxito

1. **Consistencia**: Toda card usa `AppCard` o `AppShadows`, todo color viene de `AppColors` con shades
2. **Loading states**: Ningún `CircularProgressIndicator` desnudo — siempre shimmer o skeleton contextual
3. **Depth hierarchy**: Cards con sombra > superficie > fondo (tres niveles visuales claros)
4. **Animaciones sutiles**: Transiciones de pantalla, scale on tap, fade-in de listas — nunca intrusivas
5. **Alineación CRM**: Mismos valores hex de colores base, misma font, badge/pill patterns similares
6. **0 regresiones**: Todos los tests existentes (139 Flutter) siguen pasando
