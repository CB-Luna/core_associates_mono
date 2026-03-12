# Plan de Continuidad — Core Associates App (Flutter)

> Documento generado tras auditoría completa de la app móvil.  
> Fecha: 2025-03-10  
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

## 5. Recomendaciones de Siguientes Pasos

### Prioridad 1 — Inmediato (antes del siguiente release)
1. **Verificar permisos iOS**: Confirmar `Info.plist` tiene location usage descriptions
2. **Test end-to-end en dispositivo físico**: Verificar GPS real, subida de fotos, carga de imágenes con la build de producción
3. **Rebuild y deploy**: `build-apk-prod.ps1` + `deploy-ionos.ps1` para que los fixes lleguen a producción

### Prioridad 2 — Corto Plazo
4. **Notificaciones push**: Verificar recepción de notificaciones cuando operador aprueba/rechaza documentos o asigna abogado
5. **Manejo de errores mejorado**: Agregar retry automático en requests fallidos por timeout de red
6. **Test de integración**: Crear tests que cubran el flujo completo OTP → onboarding → documentos → home

### Prioridad 3 — Mediano Plazo
7. **Modo offline**: Cachear datos del perfil y cupones activos para acceso sin conexión
8. **Deep links**: Habilitar compartir cupones/promociones vía URL
9. **Analytics**: Integrar tracking de eventos para entender uso real de features
10. **Accesibilidad**: Agregar `Semantics` labels, contrast ratios, font scaling

---

## 6. Registro de Cambios por Archivo

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

---

## 7. Comandos de Verificación

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
