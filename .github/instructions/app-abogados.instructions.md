---
applyTo: "core_associates_app_abogados/**"
---

# App Abogados Flutter — Instrucciones

## Stack

Flutter 3 + Riverpod 3 + GoRouter 17 + Dio 5. Archivos en `snake_case.dart`.

## Concepto

App móvil exclusiva para **abogados/profesionales legales** de la asociación. El abogado es un operador de campo que recibe casos de emergencia, se desplaza al lugar, atiende al asociado y documenta la resolución. Tipo "Uber Driver para emergencias legales".

**Principio**: Notificación → Aceptar → Ir → Atender → Documentar → Cerrar.

## Estructura feature-first

```
lib/
├── main.dart
├── app/
│   ├── router.dart                     # GoRouter + StatefulShellRoute
│   └── home_shell.dart                 # BottomNav 4 tabs
├── core/
│   ├── api/api_client.dart             # Dio wrapper (Bearer + 401 refresh)
│   ├── constants/
│   │   ├── app_constants.dart          # apiBaseUrl, timeouts, storage keys
│   │   └── environment.dart            # dart-define ENV/API_URL
│   ├── network/
│   │   ├── api_exception.dart          # DioException → ApiException
│   │   └── connectivity_provider.dart  # StreamProvider<bool>
│   └── storage/secure_storage.dart     # FlutterSecureStorage (tokens + user JSON)
├── features/
│   ├── auth/                           # Login email/password (NO OTP)
│   │   ├── models/
│   │   │   ├── usuario.dart
│   │   │   └── auth_response.dart
│   │   ├── repository/auth_repository.dart
│   │   ├── providers/auth_provider.dart
│   │   └── screens/login_screen.dart
│   ├── home/                           # Dashboard + stats
│   │   └── screens/home_screen.dart
│   ├── casos/                          # Feature principal
│   │   ├── models/
│   │   │   ├── caso_legal.dart
│   │   │   ├── nota_caso.dart
│   │   │   ├── asociado_resumen.dart
│   │   │   └── documento_caso.dart
│   │   ├── repository/casos_repository.dart
│   │   ├── providers/casos_providers.dart
│   │   └── screens/
│   │       ├── mis_casos_screen.dart
│   │       ├── caso_detail_screen.dart
│   │       └── casos_disponibles_screen.dart
│   └── perfil/
│       └── screens/perfil_screen.dart
└── shared/
    ├── theme/app_theme.dart            # AppColors, AppGradients, Material3
    └── widgets/                        # app_button, status_badge, etc.
```

Cada feature sigue (sin capa `domain`):
```
feature_name/
├── models/modelo.dart              # Clase pura con fromJson()
├── repository/feature_repository.dart
├── providers/feature_provider.dart
└── screens/feature_screen.dart
```

## Auth — Email + Password (NO OTP)

A diferencia de la app de asociados (que usa OTP por SMS), esta app usa **email + contraseña** vía `POST /auth/login`. El login valida que el rol del usuario sea `abogado` — si no lo es, rechaza con error 403.

```dart
// AuthRepository.login() hace:
// 1. POST /auth/login → AuthResponse (accessToken, refreshToken, user)
// 2. Valida usuario.esAbogado → si no, lanza ApiException 403
// 3. Guarda tokens en FlutterSecureStorage
// 4. Cachea datos del usuario como JSON (login es la fuente completa)
```

**Credenciales de prueba** (del seed):
- `abogado1@gmail.com` / `Abogado2026!`

**Nota**: `/auth/me` solo retorna payload JWT mínimo (id, email, rol). Los datos completos (nombre, rolNombre, permisos) solo vienen en la respuesta de login → se cachean en SecureStorage.

## Riverpod — Convenciones de providers

**No se usa code-gen `@riverpod`** — todos los providers son manuales.

Se usa **`Notifier` / `NotifierProvider`** (NO `StateNotifier`, que fue removido en flutter_riverpod 3.x).

```dart
// Repositorios → Provider<T> (singleton)
final xRepositoryProvider = Provider<XRepository>((ref) {
  return XRepository(api: ref.watch(apiClientProvider));
});

// Estado síncrono mutable → NotifierProvider (ej. AuthNotifier)
final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _tryRestoreSession();
    return const AuthState();
  }
  // ...
}

// Listas paginadas → NotifierProvider (ej. MisCasosNotifier)
final misCasosProvider = NotifierProvider<MisCasosNotifier, MisCasosState>(
  MisCasosNotifier.new,
);

// Datos read-only → FutureProvider.family (ej. casoDetail)
final casoDetailProvider = FutureProvider.family<CasoLegal, String>((ref, id) async {
  final repo = ref.watch(casosRepositoryProvider);
  return repo.getCasoDetail(id);
});
```

**Reglas clave:**
- `ref.watch()` en `build()` para dependencias reactivas
- `ref.read()` en métodos mutadores (nunca watch)
- `ref.invalidateSelf()` para refrescar datos tras mutaciones
- **NUNCA** usar `StateNotifier` / `StateNotifierProvider` (no existen en Riverpod 3.x)

## Modelos — clases puras

```dart
class CasoLegal {
  final String id;
  final String codigo;           // ← NO "folio"
  final String? direccionAprox;  // ← NO "direccion"
  // ...

  factory CasoLegal.fromJson(Map<String, dynamic> json) { ... }
}
```

- Solo `fromJson()`, sin `toJson()` (excepto Usuario que necesita cacheo).
- Sin `freezed` ni `json_serializable`.
- Getters computados para lógica de presentación: `String get estadoLabel`, `bool get puedeResolver`.
- Decimales de Prisma llegan como `String` en JSON → parsear con `double.tryParse()`.

## Navegación — GoRouter

```
/login          → LoginScreen (fuera del shell)
/caso/:id       → CasoDetailScreen (fuera del shell, path param)

StatefulShellRoute.indexedStack (HomeShell con NavigationBar):
  /home         → HomeScreen         (tab 0: Inicio)
  /mis-casos    → MisCasosScreen     (tab 1: Mis Casos)
  /disponibles  → CasosDisponiblesScreen (tab 2: Disponibles)
  /perfil       → PerfilScreen       (tab 3: Perfil)
```

- Auth redirect centralizado via `refreshListenable` → `authStateProvider`.
- `NoTransitionPage` para tabs (sin animación al cambiar).
- Path params: `state.pathParameters['id']`.

## API Client (`core/api/api_client.dart`)

- Base URL dinámica via `--dart-define=API_URL=...`:
  - Android emulator: `http://10.0.2.2:3501`
  - iOS simulator: `http://localhost:3501`
  - Producción: `https://core-asoc.cbluna-dev.com`
- Prefijo automático `/api/v1/...`.
- Interceptor Bearer token + refresh automático en 401 (Completer singleton para evitar race).
- Si refresh falla: limpia tokens + redirige a login.
- Error global → SnackBar via `rootScaffoldMessengerKey`.
- Métodos: `get`, `post`, `put`, `patch`, `delete`, `uploadFile` (multipart).
- Timeouts: connect 15s, receive 30s, upload 60s.

## Shared Widgets (`shared/widgets/`)

| Widget | Descripción |
|---|---|
| `AppButton` | Botón primario con loading state |
| `StatusBadge` | Badge semántico — usa param `label` (NO `estado`) |
| `AsyncValueWidget` | Wrapper para `AsyncValue` (loading/error/data) |
| `EmptyState` | Ilustración + mensaje cuando no hay datos |
| `OfflineBanner` | Banner rojo cuando no hay conexión |

## Theme (`shared/theme/app_theme.dart`)

- **Material 3** con `GoogleFonts.inter`
- Paleta: primary navy `#1E3A5F`, primaryLight `#2563EB`, secondary amber, accent green
- Neutrals: `neutral200/400/500/600` (Tailwind Slate)
- `AppGradients`, `AppShadows` (usa `withValues(alpha:)` no `withOpacity`)
- `AppRadius`, `AppSpacing` para consistencia

## Build APK

```powershell
# Desde la raíz del monorepo:
.\build-apk-prod-abogados.ps1

# O manualmente desde core_associates_app_abogados/:
flutter build apk --release --target-platform android-arm64 --split-per-abi `
  "--dart-define=API_URL=https://core-asoc.cbluna-dev.com" `
  "--dart-define=ENV=prod"
```

**Nota**: Esta app NO tiene product flavors (a diferencia de la app de asociados). El build es `release` directo sin `--flavor`.

## Endpoints API usados

| Método | Endpoint | Uso |
|--------|----------|-----|
| `POST` | `/auth/login` | Login email/password → JWT |
| `POST` | `/auth/refresh` | Refresh token |
| `GET` | `/casos-legales/abogado/mis-casos` | Lista casos asignados |
| `GET` | `/casos-legales/abogado/mis-casos/:id` | Detalle caso |
| `GET` | `/casos-legales/abogado/disponibles` | Casos sin abogado |
| `POST` | `/casos-legales/:id/postularse` | Postularse a caso |
| `POST` | `/casos-legales/:id/aceptar` | Aceptar asignación |
| `POST` | `/casos-legales/:id/rechazar` | Rechazar asignación |
| `PUT` | `/casos-legales/:id/estado-abogado` | Cambiar estado |
| `GET` | `/casos-legales/:id/notas` | Listar notas |
| `POST` | `/casos-legales/:id/notas` | Agregar nota |
| `POST` | `/casos-legales/:id/documentos` | Subir documento |
| `GET` | `/casos-legales/:id/documentos` | Listar documentos |

## Diferencias clave vs App Asociados (`core_associates_app/`)

| Aspecto | App Asociados | App Abogados |
|---|---|---|
| Auth | OTP por SMS | Email + password |
| Rol | Asociado (conductor) | Abogado (profesional legal) |
| Features | Promociones, cupones, SOS | Casos legales, notas, documentos |
| Navigation | 4 tabs (Home, Promos, Legal, Perfil) | 4 tabs (Home, Mis Casos, Disponibles, Perfil) |
| Flavors | `dev` / `prod` | Sin flavors (release directo) |
| API endpoints | `/asociados/*`, `/cupones/*` | `/casos-legales/abogado/*` |
| Riverpod | Igual | Igual (Notifier, NO StateNotifier) |
