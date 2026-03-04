---
applyTo: "core_associates_app/**"
---

# App Flutter — Instrucciones

## Stack

Flutter 3 + Riverpod 3 + GoRouter 17 + Dio 5. Archivos en `snake_case.dart`.

## Estructura feature-first (Clean Architecture ligera)

```
lib/
├── main.dart
├── app/router.dart                     # GoRouter config
├── core/
│   ├── api/api_client.dart             # Dio wrapper centralizado
│   ├── constants/app_constants.dart
│   └── storage/secure_storage.dart     # FlutterSecureStorage
├── features/
│   ├── auth/
│   ├── documents/
│   ├── home/
│   ├── legal_support/
│   ├── profile/
│   └── promotions/
└── shared/theme/app_theme.dart
```

Cada feature sigue:
```
feature_name/
├── data/
│   ├── feature_repository.dart         # Repositorio → ApiClient
│   └── models/modelo.dart              # Clase pura con fromJson()
└── presentation/
    ├── providers/feature_provider.dart  # Riverpod Notifiers
    └── screens/feature_screen.dart      # Widgets UI
```

No hay capa `domain` separada (sin use cases ni entities abstractas).

## Riverpod — Convenciones de providers

**No se usa code-gen `@riverpod`** — todos los providers son manuales.

```dart
// Repositorios → Provider<T> (singleton)
final xRepositoryProvider = Provider<XRepository>((ref) {
  return XRepository(apiClient: ref.watch(apiClientProvider));
});

// Estado async mutable → AsyncNotifierProvider
final xProvider = AsyncNotifierProvider<XNotifier, List<X>>(XNotifier.new);

class XNotifier extends AsyncNotifier<List<X>> {
  @override
  Future<List<X>> build() async {
    final repo = ref.watch(xRepositoryProvider);  // watch en build()
    return repo.getData();
  }

  Future<void> doAction() async {
    final repo = ref.read(xRepositoryProvider);   // read en mutations
    await repo.mutate();
    ref.invalidateSelf();                          // re-fetch automático
  }
}

// Datos read-only → FutureProvider
final datosProvider = FutureProvider<List<T>>((ref) async {
  final repo = ref.watch(xRepositoryProvider);
  return repo.getData();
});
```

**Reglas clave:**
- `ref.watch()` en `build()` para dependencias reactivas
- `ref.read()` en métodos mutadores (nunca watch)
- `ref.invalidateSelf()` para refrescar datos tras mutaciones
- `AsyncValue.guard()` para manejo seguro de estado

## Modelos — clases puras

```dart
class Modelo {
  final String id;
  final String? campoOpcional;

  const Modelo({required this.id, this.campoOpcional});

  factory Modelo.fromJson(Map<String, dynamic> json) {
    return Modelo(
      id: json['id'] as String,
      campoOpcional: json['campoOpcional'] as String?,
    );
  }
}
```

- Solo `fromJson()`, sin `toJson()` — mutaciones envían `Map<String, dynamic>` raw.
- Sin `freezed` ni `json_serializable`.
- Getters computados para lógica de presentación: `String get descuentoFormateado`.

## Navegación — GoRouter

```
/login          → LoginScreen
/otp            → OtpScreen (extra: phone)
/documents      → DocumentsScreen (fuera del shell)
/coupon/:id     → CouponDetailScreen (path param)

ShellRoute (HomeShell con BottomNavigationBar):
  /home         → HomeScreen
  /promotions   → PromotionsScreen
  /legal        → LegalSupportScreen
  /profile      → ProfileScreen
```

- `ShellRoute` con `NoTransitionPage` para tabs.
- Auth redirect centralizado via `refreshListenable` → `authStateProvider`.
- Path params: `state.pathParameters['id']`. Extra params: `state.extra as String`.

## API Client (`core/api/api_client.dart`)

- Base URL dinámica: `10.0.2.2:3501` (Android emulator) / `localhost:3501` (iOS).
- Prefijo automático `/api/v1/...`.
- Interceptor Bearer token + refresh automático en 401.
- Si refresh falla: limpia tokens, rechaza con `'session_expired'`.
- Métodos: `get`, `post`, `put`, `patch`, `delete`, `uploadFile` (multipart).
- Timeouts: connect 15s, receive 30s, upload 60s.

## Auth — flujo OTP

1. `sendOtp(phone)` → `POST /auth/otp/send`
2. Navega a `/otp` con `extra: phone`
3. `verifyOtp(phone, otp)` → `POST /auth/otp/verify` → tokens
4. Tokens guardados en `FlutterSecureStorage`
5. `AuthState(isAuthenticated: true)` → GoRouter redirige a `/home`
