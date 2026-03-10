import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:core_associates_app/features/home/presentation/screens/home_shell.dart';

void main() {
  GoRouter createRouter() => GoRouter(
    initialLocation: '/home',
    routes: [
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (_, _) => const Center(child: Text('Home Content')),
          ),
          GoRoute(
            path: '/promotions',
            builder: (_, _) => const Center(child: Text('Promotions')),
          ),
          GoRoute(
            path: '/legal',
            builder: (_, _) => const Center(child: Text('Legal')),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, _) => const Center(child: Text('Profile')),
          ),
        ],
      ),
    ],
  );

  group('HomeShell', () {
    testWidgets('renders all four navigation tabs', (tester) async {
      final router = createRouter();
      await tester.pumpWidget(
        ProviderScope(child: MaterialApp.router(routerConfig: router)),
      );
      await tester.pumpAndSettle();

      expect(find.text('Inicio'), findsOneWidget);
      expect(find.text('Promociones'), findsOneWidget);
      expect(find.text('Legal SOS'), findsOneWidget);
      expect(find.text('Perfil'), findsOneWidget);
    });

    testWidgets('has BottomNavigationBar with 4 items', (tester) async {
      final router = createRouter();
      await tester.pumpWidget(
        ProviderScope(child: MaterialApp.router(routerConfig: router)),
      );
      await tester.pumpAndSettle();

      expect(find.byType(BottomNavigationBar), findsOneWidget);
      final navBar = tester.widget<BottomNavigationBar>(
        find.byType(BottomNavigationBar),
      );
      expect(navBar.items.length, 4);
    });

    testWidgets('renders child content', (tester) async {
      final router = createRouter();
      await tester.pumpWidget(
        ProviderScope(child: MaterialApp.router(routerConfig: router)),
      );
      await tester.pumpAndSettle();

      expect(find.text('Home Content'), findsOneWidget);
    });
  });
}
