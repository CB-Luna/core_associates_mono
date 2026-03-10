import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/providers/auth_provider.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/otp_screen.dart';
import '../features/home/presentation/screens/home_shell.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/home/presentation/screens/account_blocked_screen.dart';
import '../features/promotions/presentation/screens/promotions_screen.dart';
import '../features/legal_support/presentation/screens/legal_support_screen.dart';
import '../features/profile/presentation/screens/profile_screen.dart';
import '../features/documents/presentation/screens/documents_screen.dart';
import '../features/promotions/presentation/screens/coupon_detail_screen.dart';
import '../features/promotions/presentation/screens/my_coupons_screen.dart';
import '../features/legal_support/presentation/screens/case_detail_screen.dart';
import '../features/profile/presentation/screens/edit_profile_screen.dart';
import '../features/profile/presentation/screens/onboarding_screen.dart';
import '../features/profile/presentation/screens/vehicles_screen.dart';
import '../features/profile/presentation/screens/add_vehicle_screen.dart';
import '../features/profile/data/models/vehiculo.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

/// Listenable that notifies GoRouter when auth state changes,
/// without recreating the entire router instance.
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(Ref ref) {
    ref.listen(authStateProvider, (_, _) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _AuthChangeNotifier(ref);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/login',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authStateProvider);
      final isLoggedIn = authState.value?.isAuthenticated ?? false;
      final isOnLoginPage =
          state.matchedLocation == '/login' || state.matchedLocation == '/otp';
      final isOnBlockedPage = state.matchedLocation == '/blocked';
      final isOnOnboarding = state.matchedLocation == '/onboarding';

      if (!isLoggedIn && !isOnLoginPage) return '/login';
      if (isLoggedIn && isOnLoginPage) {
        final estado = authState.value?.asociadoEstado;
        if (estado == 'rechazado' || estado == 'suspendido') return '/blocked';
        if (authState.value?.profileIncomplete == true) return '/onboarding';
        return '/home';
      }

      // Prevent blocked users from accessing main app
      if (isLoggedIn && !isOnBlockedPage) {
        final estado = authState.value?.asociadoEstado;
        if (estado == 'rechazado' || estado == 'suspendido') return '/blocked';
      }

      // Force onboarding if profile is incomplete
      if (isLoggedIn && !isOnOnboarding && !isOnBlockedPage) {
        if (authState.value?.profileIncomplete == true) return '/onboarding';
      }

      return null;
    },
    routes: [
      // Auth routes
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final phone = state.extra as String? ?? '';
          return OtpScreen(phoneNumber: phone);
        },
      ),

      // Blocked account screen
      GoRoute(
        path: '/blocked',
        builder: (context, state) {
          final authState = ref.read(authStateProvider);
          final estado = authState.value?.asociadoEstado ?? 'suspendido';
          final motivo = authState.value?.motivoRechazo;
          return AccountBlockedScreen(estado: estado, motivo: motivo);
        },
      ),

      // Onboarding route (profile completion for new users)
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),

      // Standalone routes (outside bottom nav)
      GoRoute(
        path: '/documents',
        builder: (context, state) => const DocumentsScreen(),
      ),
      GoRoute(
        path: '/coupon/:id',
        builder: (context, state) {
          final cuponId = state.pathParameters['id']!;
          return CouponDetailScreen(cuponId: cuponId);
        },
      ),
      GoRoute(
        path: '/my-coupons',
        builder: (context, state) => const MyCouponsScreen(),
      ),
      GoRoute(
        path: '/legal/case/:id',
        builder: (context, state) {
          final casoId = state.pathParameters['id']!;
          return CaseDetailScreen(casoId: casoId);
        },
      ),
      GoRoute(
        path: '/edit-profile',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/vehicles',
        builder: (context, state) => const VehiclesScreen(),
      ),
      GoRoute(
        path: '/vehicles/add',
        builder: (context, state) => const AddVehicleScreen(),
      ),
      GoRoute(
        path: '/vehicles/edit',
        builder: (context, state) {
          final vehiculo = state.extra as Vehiculo;
          return AddVehicleScreen(vehiculo: vehiculo);
        },
      ),

      // Main shell with bottom navigation
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: '/promotions',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: PromotionsScreen()),
          ),
          GoRoute(
            path: '/legal',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: LegalSupportScreen()),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ProfileScreen()),
          ),
        ],
      ),
    ],
  );
});
