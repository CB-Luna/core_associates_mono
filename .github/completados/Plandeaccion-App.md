# Plan de Acción — App Móvil Flutter (core_associates_app)

> **Estado actual**: ~60% funcional. Auth OTP completo, navegación con GoRouter y shell tabs, modelos y repositorios para todos los features principales, providers Riverpod bien estructurados. Tests unitarios básicos. Faltan pantallas de detalle, flujo SOS completo y widgets reutilizables.

---

## Fase 1 · Completar flujos críticos (Prioridad CRÍTICA)

### Paso 1.1 — SOS Legal: flujo completo de emergencia
- [ ] Conectar botón SOS rojo con diálogo de selección de tipo de percance
- [ ] Integrar GPS real: obtener coordenadas con `geolocator` al tocar SOS
- [ ] Reverse geocoding para mostrar dirección aproximada (`geocoding` package)
- [ ] Enviar `POST /casos-legales` con latitud, longitud, tipoPercance, descripción
- [ ] Pantalla de confirmación: "Caso CAS-XXXXX creado, un operador te contactará"
- [ ] Crear pantalla `case_detail_screen.dart` — Detalle del caso con estado, abogado asignado, timeline de notas
- [ ] Crear pantalla `my_cases_screen.dart` — Lista de "Mis casos" con filtros por estado
- **Archivos nuevos**: `features/legal_support/presentation/screens/case_detail_screen.dart`, `my_cases_screen.dart`
- **Archivos a modificar**: `legal_support_screen.dart`, `legal_provider.dart`, `legal_repository.dart`

### Paso 1.2 — Cupón QR: generación y presentación
- [ ] En `coupon_detail_screen.dart`: botón "Obtener cupón" que llama `POST /cupones`
- [ ] Mostrar QR generado con `qr_flutter` usando el `qrPayload` del response
- [ ] Mostrar datos del cupón: código, vigencia, proveedor, descuento
- [ ] Indicador visual de expiración (countdown timer o fecha)
- [ ] Crear pantalla `my_coupons_screen.dart` — Lista de "Mis cupones" (el provider ya existe, falta UI)
- [ ] Filtros: activos, canjeados, vencidos
- **Archivos nuevos**: `features/promotions/presentation/screens/my_coupons_screen.dart`
- **Archivos a modificar**: `coupon_detail_screen.dart`, `promotions_provider.dart`

### Paso 1.3 — Home Screen: contenido real
- [ ] Tarjeta de membresía digital con: nombre completo, ID único, estado, foto, fecha de afiliación
- [ ] Quick actions: "Mis documentos", "SOS Legal", "Mis cupones", "Mi vehículo"
- [ ] Banner de estado pendiente si el asociado no ha completado KYC
- [ ] Últimas promociones destacadas (carrusel o lista horizontal)
- [ ] Conectar con `profileProvider` para datos reales del asociado
- **Archivos a modificar**: `home_screen.dart`
- **Archivos nuevos**: `features/home/presentation/widgets/membership_card.dart`, `quick_actions.dart`

---

## Fase 2 · Gestión de perfil y documentos

### Paso 2.1 — Editar perfil
- [ ] Crear pantalla `edit_profile_screen.dart` con formulario: nombre, apellidos, email, fecha de nacimiento
- [ ] Upload de foto de perfil (cámara o galería → `PUT /asociados/me`)
- [ ] Validación de campos (email válido, campos requeridos)
- [ ] Agregar ruta `/profile/edit` en GoRouter
- **Archivos nuevos**: `features/profile/presentation/screens/edit_profile_screen.dart`
- **Archivos a modificar**: `profile_screen.dart`, `router.dart`, `profile_provider.dart`

### Paso 2.2 — Gestión de vehículos
- [ ] Crear pantalla `vehicles_screen.dart` — Lista de vehículos con indicador de principal
- [ ] Crear pantalla `add_vehicle_screen.dart` — Formulario: marca, modelo, año, color, placas, número de serie
- [ ] Funcionalidad editar vehículo existente
- [ ] Funcionalidad eliminar vehículo (con confirmación)
- [ ] Marcar vehículo como principal
- [ ] Agregar rutas `/profile/vehicles`, `/profile/vehicles/add` en GoRouter
- **Archivos nuevos**: `features/profile/presentation/screens/vehicles_screen.dart`, `add_vehicle_screen.dart`
- **Archivos a modificar**: `router.dart`, `profile_provider.dart`, `profile_repository.dart`

### Paso 2.3 — Documentos: pulir experiencia
- [ ] Captura directa con cámara (no solo galería) para INE y selfie
- [ ] Preview de documento antes de enviar
- [ ] Indicadores claros de estado por documento: pendiente ⏳, aprobado ✅, rechazado ❌ con motivo
- [ ] Poder re-subir documento rechazado
- [ ] Guía visual de qué tipo de foto se necesita (overlay de marco para INE)
- **Archivos a modificar**: `documents_screen.dart`, `documents_provider.dart`

---

## Fase 3 · Experiencia de usuario y polish

### Paso 3.1 — Widgets reutilizables
- [ ] Crear `shared/widgets/` con componentes comunes:
  - `app_button.dart` — Botón primario/secundario/outline estandarizado
  - `app_card.dart` — Card con sombra y bordes consistentes
  - `loading_overlay.dart` — Overlay de carga para operaciones async
  - `error_dialog.dart` — Diálogo de error global reutilizable
  - `empty_state.dart` — Estado vacío con ilustración y mensaje
  - `status_badge.dart` — Badge de estado con colores semánticos
- **Archivos nuevos**: `lib/shared/widgets/`

### Paso 3.2 — Manejo global de errores
- [ ] Crear interceptor Dio que muestre SnackBar o diálogo en errores de red
- [ ] Manejar `session_expired` redirigiendo a login con mensaje
- [ ] Manejar sin conectividad: mensaje offline amigable
- [ ] Wrapper `AsyncValue` con manejo de error/loading/data consistente
- **Archivos a modificar**: `core/api/api_client.dart`
- **Archivos nuevos**: `shared/widgets/async_value_widget.dart`

### Paso 3.3 — Notificaciones push
- [ ] Integrar Firebase Cloud Messaging (FCM)
- [ ] Solicitar permisos de notificación al usuario
- [ ] Registrar token FCM en el backend tras login (`POST /asociados/me/fcm-token`)
- [ ] Manejar notificaciones en foreground y background
- [ ] Deep linking desde notificación → pantalla correspondiente (caso legal, cupón, etc.)
- **Dependencias**: `firebase_core`, `firebase_messaging`
- **Archivos nuevos**: `core/notifications/push_notification_service.dart`

### Paso 3.4 — Navegación adicional
- [ ] Agregar ruta `/my-coupons` para lista de cupones del usuario
- [ ] Agregar ruta `/legal/case/:id` para detalle de caso legal
- [ ] Agregar ruta `/profile/vehicles` para gestión de vehículos
- [ ] Ajustar deep links para notificaciones
- **Archivos a modificar**: `app/router.dart`

---

## Fase 4 · Testing

### Paso 4.1 — Tests de widgets (UI)
- [ ] Test de `LoginScreen` — Ingreso de teléfono, navegación a OTP
- [ ] Test de `OtpScreen` — Ingreso de código, timer de reenvío
- [ ] Test de `HomeScreen` — Rendering de tarjeta de membresía
- [ ] Test de `LegalSupportScreen` — Botón SOS, diálogo de percance
- [ ] Test de `PromotionsScreen` — Lista, filtros por categoría
- **Setup**: `flutter_test` + `mocktail` para mocks de providers

### Paso 4.2 — Tests de integración
- [ ] Flujo completo: Login → Home → Ver promociones → Generar cupón
- [ ] Flujo: Login → SOS → Crear caso → Ver detalle
- [ ] Flujo: Login → Perfil → Subir documento
- [ ] Usar `integration_test` package de Flutter
- **Archivos**: `test_driver/`, `integration_test/`

### Paso 4.3 — Tests de providers
- [ ] Completar tests faltantes: `legal_provider_test.dart`, `documents_provider_test.dart`
- [ ] Test de `vehiculosProvider`: add, refresh
- [ ] Test de `profileProvider`: update, refresh

---

## Fase 5 · Producción y optimización

### Paso 5.1 — Performance
- [ ] Lazy loading de imágenes con `cached_network_image` (ya instalado)
- [ ] Shimmer loading en listas mientras cargan datos
- [ ] Paginación infinita en lista de promociones y cupones
- [ ] Optimizar rebuilds de Riverpod (select específicos)

### Paso 5.2 — Offline básico
- [ ] Cache local de perfil del asociado (SharedPreferences o SQLite)
- [ ] Cache de lista de promociones para consulta offline
- [ ] Indicador de conectividad en UI
- **Dependencias**: `connectivity_plus`, `sqflite` o `shared_preferences`

### Paso 5.3 — Preparar release
- [ ] Configurar flavors: development, staging, production
- [ ] App icon y splash screen personalizados
- [ ] Configurar Firebase Crashlytics para tracking de errores
- [ ] Ofuscación de código para release
- [ ] Firmar APK/AAB para Play Store
- [ ] Configurar CI: build + test en cada PR

### Paso 5.4 — Accesibilidad y localización
- [ ] Revisar semántica de widgets para screen readers
- [ ] Asegurar contraste de colores WCAG AA
- [ ] Strings centralizados (preparar para l10n aunque sea solo español)

---

## Resumen de progreso

| Fase | Descripción | Esfuerzo estimado | Estado |
|------|-------------|-------------------|--------|
| **Fase 1** | Flujos críticos (SOS, QR, Home) | Grande | 🔴 Pendiente |
| **Fase 2** | Perfil y documentos | Mediano | 🔴 Pendiente |
| **Fase 3** | UX, widgets, notificaciones | Grande | 🔴 Pendiente |
| **Fase 4** | Testing | Mediano | 🔴 Pendiente |
| **Fase 5** | Producción | Mediano | 🔴 Pendiente |
