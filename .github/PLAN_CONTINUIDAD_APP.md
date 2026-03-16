# Plan de Continuidad — Core Associates App (Flutter)

> Documento generado tras auditoría completa de la app móvil.  
> Fecha original: 2025-03-10  
> **Última actualización: 2026-03-15**  
> Alcance: Funcionalidad, lógica de negocio, errores detectados, tareas pendientes.

---

## 1. Estado Actual de la App

### Resumen de Arquitectura
- **Stack**: Flutter 3 + Riverpod 3 + GoRouter 17 + Dio 5
- **Estructura**: Feature-first (Clean Architecture ligera, sin capa domain)
- **Features**: Auth (OTP), Home, Promotions, Legal SOS, Profile, Documents
- **API**: Servidor NestJS en `https://core-asoc.cbluna-dev.com/api/v1`
- **Build prod**: `build-apk-prod.ps1` → APK arm64 con `--dart-define=API_URL`

### Tests
| Suite | Total | Estado |
|-------|-------|--------|
| Modelos | ~40 | ✅ Pasan |
| Repositorios | ~30 | ✅ Pasan |
| Providers | ~30 | ✅ Pasan |
| Widgets | ~38 | ✅ Pasan |
| **Total** | **138** | ✅ |

---

## 2. Bugs Corregidos en Esta Auditoría

### 2.1 Permisos de ubicación faltantes (CRÍTICO)
- **Problema**: `AndroidManifest.xml` no declaraba `ACCESS_FINE_LOCATION` ni `ACCESS_COARSE_LOCATION`
- **Impacto**: SOS Legal siempre usaba coordenadas fallback de CDMX (19.4326, -99.1332)
- **Fix**: Agregados ambos permisos en `android/app/src/main/AndroidManifest.xml`
- **Archivo**: `android/app/src/main/AndroidManifest.xml`

### 2.2 Imágenes de promociones no cargan (CRÍTICO)
- **Problema**: `CachedNetworkImage` no enviaba headers de autenticación JWT, pero el endpoint `GET /promociones/:id/imagen` requiere `@UseGuards(JwtAuthGuard)`
- **Impacto**: Todas las imágenes de promociones devolvían 401 → se mostraba placeholder vacío
- **Fix**: 
  - Creado `authHeadersProvider` (FutureProvider) en `api_client.dart`
  - Pasados `httpHeaders` a todos los `CachedNetworkImage` de `promotions_screen.dart` y `home_screen.dart`
- **Archivos**: `api_client.dart`, `promotions_screen.dart`, `home_screen.dart`

### 2.3 Foto de perfil no carga (CRÍTICO)
- **Problema**: `CachedNetworkImageProvider` no pasaba headers JWT — mismo problema que promociones
- **Impacto**: Avatar en pantalla de perfil y edición siempre mostraba fallback
- **Fix**: Pasados `headers` a `CachedNetworkImageProvider` en `profile_screen.dart` y `edit_profile_screen.dart`
- **Archivos**: `profile_screen.dart`, `edit_profile_screen.dart`

### 2.4 API devolvía JSON en vez de 404 cuando no hay foto (CRÍTICO — Backend)
- **Problema**: Endpoints `GET /asociados/me/foto` y `GET /asociados/:id/foto` retornaban `{ url: null }` con HTTP 200 cuando el asociado no tenía foto
- **Impacto**: El CRM web (y la app) recibían JSON como si fuera imagen, creando un blob corrupto
- **Fix**: Cambiado a `throw new NotFoundException(...)` que devuelve HTTP 404 correctamente
- **Archivo**: `core-associates-api/src/modules/asociados/asociados.controller.ts`

### 2.5 Flujo de documentos sin botón de avance (UX)
- **Problema**: Tras subir los 4 documentos requeridos, no había botón "Listo" ni forma de avanzar — el usuario debía regresar y presionar "Hacer esto después"
- **Fix**: 
  - `DocumentsScreen`: Agregado banner de completitud + botón "Listo" cuando los 4 documentos están subidos
  - `OnboardingScreen`: Paso 2 muestra "Continuar" (ElevatedButton prominente) cuando hay docs, oculta "Ir a subir documentos", y muestra "Hacer esto después" solo cuando faltan docs
- **Archivos**: `documents_screen.dart`, `onboarding_screen.dart`

### 2.6 SOS sin feedback cuando usa ubicación fallback (UX)
- **Problema**: Si el GPS fallaba o permisos denegados, el caso se creaba con coordenadas de CDMX sin informar al usuario
- **Fix**: SnackBar muestra "(ubicación aproximada — no se pudo obtener GPS)" cuando se usa fallback
- **Archivo**: `legal_support_screen.dart`

---

## 3. Funcionalidades Verificadas (Operativas)

### 3.1 Autenticación OTP
- ✅ Envío de OTP por SMS
- ✅ Verificación con código (bypass dev: `000000`)
- ✅ Almacenamiento seguro de tokens (FlutterSecureStorage)
- ✅ Refresh automático de token en 401
- ✅ Cierre de sesión (limpia tokens + redirige a login)
- ✅ Expiración detectada → logout automático con callback

### 3.2 Navegación & Routing
- ✅ GoRouter con redirects basados en estado de auth
- ✅ Redirección a `/blocked` si cuenta rechazada/suspendida
- ✅ Redirección a `/onboarding` si perfil incompleto
- ✅ ShellRoute con BottomNavigationBar (4 tabs)
- ✅ Pantallas standalone fuera del shell (/documents, /coupon/:id, etc.)

### 3.3 Home
- ✅ Tarjeta de membresía con estado visual (activo/pendiente/suspendido)
- ✅ Banner KYC cuando estado ≠ activo
- ✅ Accesos rápidos (4 grid items)
- ✅ Promociones recientes (top 3)

### 3.4 Promociones & Cupones
- ✅ Listado con categorías filtrables
- ✅ Generación de cupón con confirmación dialog
- ✅ Detalle de cupón con QR (firma HMAC-SHA256)
- ✅ Lista "Mis Cupones" con estados
- ✅ Imágenes cargan con headers JWT (recién corregido)

### 3.5 Perfil
- ✅ Visualización de datos personales
- ✅ Edición de perfil (nombre, apellidos, email, fecha nacimiento)
- ✅ Upload de foto con camera/galería + compresión (800px, 85%)
- ✅ Cache eviction tras upload de foto
- ✅ Gestión de vehículos (CRUD completo)
- ✅ Vehículo principal marcable

### 3.6 Documentos
- ✅ 4 tipos requeridos: INE frente, INE reverso, Selfie, Tarjeta de circulación
- ✅ Captura por cámara o galería (selfie solo cámara frontal)
- ✅ Compresión automática (80%, max 1920px)
- ✅ Preview con zoom antes de enviar
- ✅ Estados visuales (pendiente, aprobado, rechazado con motivo)
- ✅ Resubir documentos rechazados
- ✅ Botón "Listo" al completar todos (recién agregado)

### 3.7 SOS Legal
- ✅ Botón SOS prominente con dialog de tipo/descripción
- ✅ Obtención de ubicación GPS (con permisos recién corregidos)
- ✅ Fallback a CDMX con aviso al usuario (recién corregido)
- ✅ Listado de casos con colores por estado
- ✅ Detalle de caso: código, tipo, estado, prioridad, abogado, notas
- ✅ Notas privadas diferenciadas visualmente

---

## 4. Áreas de Riesgo Pendientes

### 4.1 Alto Riesgo
| Ítem | Descripción | Impacto Potencial |
|------|-------------|-------------------|
| iOS permisos de ubicación | `Info.plist` puede necesitar `NSLocationWhenInUseUsageDescription` | SOS falla en iOS |
| Push notifications | Firebase configurado pero flujo no verificado end-to-end | Notificaciones no llegan |
| Token refresh race condition | Si dos requests 401 ocurren simultáneamente, doble refresh posible | Sesión corrompida |

### 4.2 Medio Riesgo
| Ítem | Descripción | Impacto Potencial |
|------|-------------|-------------------|
| Cache de fotos | Si URL no cambia tras re-upload, cache puede servir foto vieja | UX confusa |
| Timeout GPS 10s | En interiores puede siempre fallar, usando fallback | Ubicación incorrecta |
| Offline | No hay manejo de estado offline / cola de reintentos | Datos perdidos |

### 4.3 Bajo Riesgo (Mejoras Futuras)
| Ítem | Descripción |
|------|-------------|
| Deep links | No configurados para compartir cupones/promociones |
| Accesibilidad | Sin `Semantics` labels explícitos en widgets custom |
| Internacionalización | Textos hardcodeados en español, sin i18n framework |

---

## 5. Cambios Requeridos — Sprint Actual (Marzo 2026)

### 5.1 Eliminar menciones de IA en pantalla de Documentos (APP-01)
- **Prioridad**: Alta
- **Contexto**: En `documents_screen.dart` se importa y muestra `AiAnalysisCard` — un card expandible por documento que muestra estado de análisis IA (confianza %, validaciones, datos extraídos).
- **Problema**: El usuario (asociado) NO debe ver nada relacionado con IA. El análisis IA es exclusivo del CRM (operador/admin revisa los documentos). La app solo debe permitir subir documentos y ver su estado (pendiente/aprobado/rechazado).
- **Archivos a modificar**:
  - `lib/features/documents/presentation/screens/documents_screen.dart` — Eliminar import y uso de `AiAnalysisCard`
  - `lib/features/documents/presentation/widgets/ai_analysis_card.dart` — Se puede conservar el archivo pero no debe ser referenciado desde la pantalla de documentos
  - `lib/features/documents/data/models/ai_analysis.dart` — No necesariamente eliminar (puede usarse internamente), pero no debe haber UI visible
- **Criterio de aceptación**: La pantalla de documentos muestra solo: tipo de documento, estado, preview de imagen, botón de resubir si rechazado. Sin stepper, card ni texto que mencione "IA", "análisis", "confianza" o "validaciones".

### 5.2 Imagen opcional de vehículo al registrar (APP-02)
- **Prioridad**: Media
- **Contexto**: Actualmente `add_vehicle_screen.dart` es un formulario de solo texto (marca, modelo, año, color, placas, número de serie, switch principal). No hay carga de imagen.
- **Cambio requerido**: Agregar campo opcional para subir foto del vehículo (cámara o galería), con preview antes de guardar.
- **Impacto Backend**: 
  - Modelo `Vehiculo` en `schema.prisma` necesita campo `fotoUrl String? @map("foto_url")`. 
  - Nuevo endpoint `POST /vehiculos/:id/foto` y `GET /vehiculos/:id/foto` (similar al patrón de foto de asociado).
  - Bucket de MinIO: `core-associates-vehicles` (o reutilizar bucket existente con path `vehiculos/{id}/`).
- **Impacto App**:
  - Modelo `vehiculo.dart` — agregar `fotoUrl` campo opcional
  - `add_vehicle_screen.dart` — agregar `ImagePicker` (cámara/galería) con preview, compresión similar a fotos de perfil (800px, 85%)
  - `vehicles_screen.dart` — mostrar thumbnail de foto en la lista si existe
  - `vehicle_repository.dart` — método `uploadFoto(vehiculoId, file)`
- **Criterio de aceptación**: Al crear/editar vehículo, aparece un área para agregar foto (opcional). Si se sube, se persiste en MinIO y se muestra como thumbnail en la lista de vehículos.

### 5.3 SOS — Iconos de tipo de incidente en vez de dropdown (APP-03)
- **Prioridad**: Alta
- **Contexto**: `_showSOSDialog()` en `legal_support_screen.dart` (L170-244) usa un `DropdownButtonFormField` con 5 opciones: accidente, infracción, robo, asalto, otro.
- **Cambio requerido**: Reemplazar el dropdown por una grilla de **iconos grandes tocables** para selección rápida del tipo de incidente. En una emergencia, el usuario necesita taps rápidos, no un dropdown.
- **Diseño propuesto**:
  ```
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │  🚗💥   │ │  🚫📝   │ │  🔒🚗   │
  │Accidente│ │Infracción│ │  Robo   │
  └─────────┘ └─────────┘ └─────────┘
  ┌─────────┐ ┌─────────┐
  │  ⚠️🔫   │ │  ❓❓   │
  │ Asalto  │ │  Otro   │
  └─────────┘ └─────────┘
  ```
  - Cada tipo es un card/tile con icono grande (Material Icons o custom) + label debajo
  - Al tocar se marca visualmente (borde de color, background highlight)
  - El campo de descripción permanece debajo
- **Archivos a modificar**:
  - `lib/features/legal_support/presentation/screens/legal_support_screen.dart` — `_showSOSDialog()`
- **Iconos sugeridos**: `Icons.car_crash` (accidente), `Icons.description` (infracción), `Icons.lock` (robo), `Icons.warning` (asalto), `Icons.help_outline` (otro). Pueden ser Material Icons con fondo de color semántico (rojo para asalto, naranja para accidente, etc.).
- **Criterio de aceptación**: El modal SOS muestra iconos grandes tocables en grid. Selección instantánea con feedback visual. No hay dropdown. Botón "Enviar SOS" sigue funcionando igual.

### 5.4 OTP — Mostrar código de verificación en pantalla correcta (APP-04)
- **Prioridad**: Alta
- **Contexto**: Actualmente existe un sistema de "OTP peek" (`otpPeekProvider`) que hace polling cada 5s al endpoint `/auth/otp-peek`. El widget `_PendingOtpBanner` se muestra en la **pantalla Home** (`home_screen.dart`, L398-462), mostrando el código OTP en texto grande. Es un workaround para los casos donde la notificación SMS no llega.
- **Problema**: El código se muestra en la pantalla de Home/Menú, pero el usuario está en la **pantalla de login/OTP** cuando necesita ver el código. Debería aparecer en la misma pantalla donde se ingresa el teléfono o donde se teclea el código OTP.
- **Cambio requerido**: Mover el banner de OTP peek a la pantalla de ingreso del número de teléfono (`login_screen.dart`) o la pantalla OTP (`otp_screen.dart`). Ideal: mostrarlo justo **debajo del campo de teléfono** o **arriba del campo de código OTP**, según dónde se encuentre el usuario en el flujo.
- **Archivos a modificar**:
  - `lib/features/home/presentation/screens/home_screen.dart` — **Eliminar** `_PendingOtpBanner` y su referencia
  - `lib/features/auth/presentation/screens/login_screen.dart` — **Agregar** banner de OTP peek visible después de enviar el OTP
  - O bien `lib/features/auth/presentation/screens/otp_screen.dart` — Agregar banner aquí (más lógico: el usuario ya está esperando el código)
- **Nota**: Este es un workaround temporal para números que no reciben SMS. El flujo ideal es que el SMS llegue. Sin embargo, mientras no se resuelva el delivery de SMS, este peek es necesario.
- **Criterio de aceptación**: Al solicitar OTP, si el polling devuelve un código pendiente, este aparece visible en la misma pantalla donde el usuario está (login o OTP). Ya no aparece en Home.

---

## 6. Recomendaciones de Siguientes Pasos

### Prioridad 1 — Inmediato (cambios de este sprint)
1. **APP-01**: Eliminar IA de pantalla de documentos
2. **APP-03**: SOS con iconos en vez de dropdown
3. **APP-04**: Mover OTP peek a pantalla de login/OTP

### Prioridad 2 — Corto Plazo
4. **APP-02**: Imagen de vehículo (requiere cambio en backend + app)
5. **Verificar permisos iOS**: Confirmar `Info.plist` tiene location usage descriptions
6. **Test end-to-end en dispositivo físico**: GPS real, fotos, build producción
7. **Notificaciones push**: Verificar recepción cuando operador aprueba/rechaza docs

### Prioridad 3 — Mediano Plazo
8. **Manejo de errores**: Retry automático en requests fallidos por timeout
9. **Modo offline**: Cache de perfil y cupones activos
10. **Deep links**: Compartir cupones/promociones vía URL
11. **Accesibilidad**: Semantics labels, contrast ratios, font scaling

---

## 7. Registro de Cambios por Archivo

### Auditoría original (2025-03-10)

| Archivo | Tipo de Cambio |
|---------|---------------|
| `android/app/src/main/AndroidManifest.xml` | Agregados permisos FINE/COARSE LOCATION |
| `lib/core/api/api_client.dart` | Agregado `authHeadersProvider` |
| `lib/features/promotions/.../promotions_screen.dart` | httpHeaders en CachedNetworkImage + import |
| `lib/features/home/.../home_screen.dart` | httpHeaders en CachedNetworkImage + import |
| `lib/features/profile/.../profile_screen.dart` | headers en CachedNetworkImageProvider + import |
| `lib/features/profile/.../edit_profile_screen.dart` | headers en CachedNetworkImageProvider + import |
| `lib/features/documents/.../documents_screen.dart` | Botón "Listo" + banner completitud + go_router import |
| `lib/features/profile/.../onboarding_screen.dart` | Paso 2 contextual: Continuar vs Hacer esto después |
| `lib/features/legal_support/.../legal_support_screen.dart` | Feedback de ubicación fallback en SOS |
| `../core-associates-api/.../asociados.controller.ts` | NotFoundException en endpoints de foto sin imagen |

### Pendientes este sprint

| Tarea | Archivos principales | Estado |
|-------|---------------------|--------|
| APP-01: Eliminar IA de documentos | `documents_screen.dart`, `ai_analysis_card.dart` | ⏳ Pendiente |
| APP-02: Foto de vehículo | `add_vehicle_screen.dart`, `vehiculo.dart`, `schema.prisma` | ⏳ Pendiente |
| APP-03: SOS iconos | `legal_support_screen.dart` | ⏳ Pendiente |
| APP-04: OTP peek en login | `home_screen.dart`, `login_screen.dart`/`otp_screen.dart` | ⏳ Pendiente |

---

## 8. Comandos de Verificación

```bash
# Tests unitarios (desde core_associates_app/)
flutter test

# Análisis estático
flutter analyze

# Build de producción
# Desde raíz del monorepo:
.\build-apk-prod.ps1

# Deploy al servidor
.\deploy-ionos.ps1
```
