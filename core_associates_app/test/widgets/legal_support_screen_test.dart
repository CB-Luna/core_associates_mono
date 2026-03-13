import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/legal_support/presentation/screens/legal_support_screen.dart';
import 'package:core_associates_app/features/legal_support/data/legal_repository.dart';
import 'package:core_associates_app/features/legal_support/data/models/caso_legal.dart';
import 'package:core_associates_app/core/api/api_client.dart';
import 'package:core_associates_app/core/storage/secure_storage.dart';
import '../helpers/mocks.dart';
import '../helpers/fixtures.dart';

void main() {
  late MockLegalRepository mockLegalRepo;
  late MockApiClient mockApiClient;
  late MockSecureStorageService mockStorage;

  final testCaso = CasoLegal.fromJson(casoLegalJson);

  setUp(() {
    mockLegalRepo = MockLegalRepository();
    mockApiClient = MockApiClient();
    mockStorage = MockSecureStorageService();
  });

  Widget createLegalScreen({List<CasoLegal>? casos}) {
    when(
      () => mockLegalRepo.getMisCasos(),
    ).thenAnswer((_) async => casos ?? [testCaso]);

    return ProviderScope(
      overrides: [
        legalRepositoryProvider.overrideWithValue(mockLegalRepo),
        apiClientProvider.overrideWithValue(mockApiClient),
        secureStorageProvider.overrideWithValue(mockStorage),
      ],
      child: const MaterialApp(home: Scaffold(body: LegalSupportScreen())),
    );
  }

  group('LegalSupportScreen', () {
    testWidgets('renders title and subtitle', (tester) async {
      await tester.pumpWidget(createLegalScreen());
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('Soporte Legal'), findsOneWidget);
      expect(find.text('Asistencia en caso de percance vial'), findsOneWidget);
    });

    testWidgets('renders SOS button', (tester) async {
      await tester.pumpWidget(createLegalScreen());
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('REPORTAR'), findsOneWidget);
      expect(find.byIcon(Icons.sos), findsOneWidget);
    });

    testWidgets('renders coverage cards', (tester) async {
      await tester.pumpWidget(createLegalScreen());
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('Cobertura incluida'), findsOneWidget);
      expect(find.text('Asesoría Legal'), findsOneWidget);
      expect(find.text('Gestión de Seguros'), findsOneWidget);
      expect(find.text('Documentación'), findsOneWidget);
    });

    testWidgets('renders Mis Casos section heading', (tester) async {
      await tester.pumpWidget(createLegalScreen());
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('Mis Casos'), findsOneWidget);
    });

    testWidgets('shows empty state when no cases', (tester) async {
      await tester.pumpWidget(createLegalScreen(casos: []));
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('No tienes casos registrados'), findsOneWidget);
      expect(find.byIcon(Icons.folder_open_outlined), findsOneWidget);
    });

    testWidgets('shows case card with caso data', (tester) async {
      await tester.pumpWidget(createLegalScreen(casos: [testCaso]));
      await tester.pump(const Duration(seconds: 1));

      // Card renders 'Accidente - LEG-001'
      expect(find.textContaining('LEG-001'), findsOneWidget);
      expect(find.textContaining('Accidente'), findsOneWidget);
    });

    testWidgets('tapping SOS button opens report dialog', (tester) async {
      await tester.pumpWidget(createLegalScreen());
      await tester.pump(const Duration(seconds: 1));

      // Tap the SOS circle
      await tester.tap(find.text('REPORTAR'));
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('Reportar Percance'), findsOneWidget);
      expect(find.text('Tipo de percance:'), findsOneWidget);
      expect(find.text('Cancelar'), findsOneWidget);
      expect(find.text('Enviar SOS'), findsOneWidget);
    });

    testWidgets('SOS dialog can be dismissed with Cancelar', (tester) async {
      await tester.pumpWidget(createLegalScreen());
      await tester.pump(const Duration(seconds: 1));

      await tester.tap(find.text('REPORTAR'));
      await tester.pump(const Duration(seconds: 1));

      await tester.tap(find.text('Cancelar'));
      await tester.pump(const Duration(seconds: 1));

      // Dialog is gone
      expect(find.text('Reportar Percance'), findsNothing);
    });

    testWidgets('shows description field in SOS dialog', (tester) async {
      await tester.pumpWidget(createLegalScreen());
      await tester.pump(const Duration(seconds: 1));

      await tester.tap(find.text('REPORTAR'));
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('Descripción (opcional)'), findsOneWidget);
    });
  });
}
