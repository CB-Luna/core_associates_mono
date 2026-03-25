import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'app/router.dart';
import 'core/api/api_client.dart';
import 'core/notifications/push_notification_service.dart';
import 'shared/theme/app_theme.dart';
import 'shared/widgets/offline_banner.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await initializeDateFormatting('es_MX');
  runApp(const ProviderScope(child: CoreAbogadosApp()));
}

class CoreAbogadosApp extends ConsumerStatefulWidget {
  const CoreAbogadosApp({super.key});

  @override
  ConsumerState<CoreAbogadosApp> createState() => _CoreAbogadosAppState();
}

class _CoreAbogadosAppState extends ConsumerState<CoreAbogadosApp> {
  bool _pushInitialized = false;

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    // Inicializar push notifications una sola vez cuando el router esté listo
    if (!_pushInitialized) {
      _pushInitialized = true;
      _initPush(router);
    }

    return MaterialApp.router(
      title: 'Core Abogados',
      theme: AppTheme.light,
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      scaffoldMessengerKey: rootScaffoldMessengerKey,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('es', 'MX')],
      builder: (context, child) {
        return Column(
          children: [
            const OfflineBanner(),
            Expanded(child: child ?? const SizedBox.shrink()),
          ],
        );
      },
    );
  }

  Future<void> _initPush(GoRouter router) async {
    final pushService = ref.read(pushNotificationServiceProvider);

    // Conectar tap de notificación → navegar a /caso/:id
    pushService.onNotificationTap = (casoId) {
      router.push('/caso/$casoId');
    };

    await pushService.initialize();
  }
}
