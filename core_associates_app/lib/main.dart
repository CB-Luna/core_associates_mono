import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app/router.dart';
import 'shared/theme/app_theme.dart';
import 'shared/widgets/offline_banner.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('es_MX');

  // Initialize Firebase if configured (google-services.json present)
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Firebase not configured yet — skip initialization
    debugPrint('Firebase not configured — push notifications disabled');
  }

  runApp(const ProviderScope(child: CoreAssociatesApp()));
}

class CoreAssociatesApp extends ConsumerWidget {
  const CoreAssociatesApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Core Associates',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
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
}
