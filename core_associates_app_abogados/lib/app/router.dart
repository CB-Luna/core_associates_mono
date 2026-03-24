import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/casos/screens/caso_detail_screen.dart';
import '../features/casos/screens/casos_disponibles_screen.dart';
import '../features/casos/screens/mis_casos_screen.dart';
import '../features/home/screens/home_screen.dart';
import '../features/perfil/screens/perfil_screen.dart';
import 'home_shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

final routerProvider = Provider<GoRouter>((ref) {
  final authNotifier = _AuthChangeNotifier(ref);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/home',
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final auth = ref.read(authStateProvider);
      final isLogin = state.matchedLocation == '/login';

      if (auth.status == AuthStatus.initial ||
          auth.status == AuthStatus.loading) {
        return null; // esperar
      }

      if (!auth.isAuthenticated) {
        return isLogin ? null : '/login';
      }

      if (isLogin) return '/home';
      return null;
    },
    routes: [
      // ── Login (fuera del shell) ──
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),

      // ── Shell con BottomNav ──
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) =>
            HomeShell(navigationShell: navigationShell),
        branches: [
          // Tab 0: Inicio
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                pageBuilder: (_, __) =>
                    const NoTransitionPage(child: HomeScreen()),
              ),
            ],
          ),
          // Tab 1: Mis Casos
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/mis-casos',
                pageBuilder: (_, __) =>
                    const NoTransitionPage(child: MisCasosScreen()),
              ),
            ],
          ),
          // Tab 2: Disponibles
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/disponibles',
                pageBuilder: (_, __) =>
                    const NoTransitionPage(child: CasosDisponiblesScreen()),
              ),
            ],
          ),
          // Tab 3: Perfil
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/perfil',
                pageBuilder: (_, __) =>
                    const NoTransitionPage(child: PerfilScreen()),
              ),
            ],
          ),
        ],
      ),

      // ── Detalle de caso (fuera del shell, pantalla completa) ──
      GoRoute(
        path: '/caso/:id',
        builder: (_, state) =>
            CasoDetailScreen(casoId: state.pathParameters['id']!),
      ),
    ],
  );
});

/// Notifica al router cuando cambia el estado de auth.
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(Ref ref) {
    ref.listen<AuthState>(authStateProvider, (_, __) => notifyListeners());
  }
}
