import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/api/api_client.dart';
import '../../../../core/services/push_notification_service.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class HomeShell extends ConsumerStatefulWidget {
  final Widget child;

  const HomeShell({super.key, required this.child});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  bool _pushInitialized = false;

  @override
  void initState() {
    super.initState();
    _initPush();
    _wireSessionExpired();
  }

  Future<void> _initPush() async {
    if (_pushInitialized) return;
    _pushInitialized = true;
    try {
      await ref.read(pushNotificationServiceProvider).initialize();
    } catch (_) {
      // Push not available (e.g., Firebase not configured)
    }
  }

  void _wireSessionExpired() {
    ref.read(apiClientProvider).onSessionExpired = () {
      ref.read(authStateProvider.notifier).logout();
    };
  }

  int _currentIndex() {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/promotions')) return 1;
    if (location.startsWith('/legal')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0;
  }

  void _onTap(int index) {
    switch (index) {
      case 0:
        context.go('/home');
      case 1:
        context.go('/promotions');
      case 2:
        context.go('/legal');
      case 3:
        context.go('/profile');
    }
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex();

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index,
        onTap: _onTap,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_offer_outlined),
            activeIcon: Icon(Icons.local_offer),
            label: 'Promociones',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shield_outlined),
            activeIcon: Icon(Icons.shield),
            label: 'Legal SOS',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}
