import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/providers/auth_provider.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/otp_screen.dart';
import '../features/home/presentation/screens/home_shell.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/promotions/presentation/screens/promotions_screen.dart';
import '../features/legal_support/presentation/screens/legal_support_screen.dart';
import '../features/profile/presentation/screens/profile_screen.dart';
import '../features/documents/presentation/screens/documents_screen.dart';
import '../features/promotions/presentation/screens/coupon_detail_screen.dart';
import '../features/promotions/presentation/screens/my_coupons_screen.dart';
import '../features/legal_support/presentation/screens/case_detail_screen.dart';

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

      if (!isLoggedIn && !isOnLoginPage) return '/login';
      if (isLoggedIn && isOnLoginPage) return '/home';
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
