import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/promotions/presentation/screens/promotions_screen.dart';
import 'package:core_associates_app/features/promotions/data/promotions_repository.dart';
import 'package:core_associates_app/features/promotions/data/models/promocion.dart';

import 'package:core_associates_app/core/api/api_client.dart';
import 'package:core_associates_app/core/storage/secure_storage.dart';
import '../helpers/mocks.dart';
import '../helpers/fixtures.dart';

void main() {
  late MockPromotionsRepository mockPromotionsRepo;
  late MockApiClient mockApiClient;
  late MockSecureStorageService mockStorage;

  final testPromocion = Promocion.fromJson(promocionJson);
  final testPromocionMonto = Promocion.fromJson(promocionMontoJson);

  setUp(() {
    mockPromotionsRepo = MockPromotionsRepository();
    mockApiClient = MockApiClient();
    mockStorage = MockSecureStorageService();
  });

  Widget createPromotionsScreen({List<Promocion>? promos}) {
    when(
      () =>
          mockPromotionsRepo.getPromociones(categoria: any(named: 'categoria')),
    ).thenAnswer((_) async => promos ?? [testPromocion, testPromocionMonto]);
    when(() => mockPromotionsRepo.getMisCupones()).thenAnswer((_) async => []);

    return ProviderScope(
      overrides: [
        promotionsRepositoryProvider.overrideWithValue(mockPromotionsRepo),
        apiClientProvider.overrideWithValue(mockApiClient),
        secureStorageProvider.overrideWithValue(mockStorage),
      ],
      child: const MaterialApp(home: Scaffold(body: PromotionsScreen())),
    );
  }

  group('PromotionsScreen', () {
    testWidgets('renders title and subtitle', (tester) async {
      await tester.pumpWidget(createPromotionsScreen());
      await tester.pumpAndSettle();

      expect(find.text('Promociones'), findsOneWidget);
      expect(find.text('Descuentos exclusivos para asociados'), findsOneWidget);
    });

    testWidgets('renders Mis cupones link', (tester) async {
      await tester.pumpWidget(createPromotionsScreen());
      await tester.pumpAndSettle();

      expect(find.text('Mis cupones'), findsOneWidget);
    });

    testWidgets('renders category filter chips', (tester) async {
      await tester.pumpWidget(createPromotionsScreen());
      await tester.pumpAndSettle();

      expect(find.text('Todas'), findsOneWidget);
      expect(find.text('Mecánica'), findsOneWidget);
      expect(find.text('Comida'), findsOneWidget);
      expect(find.text('Seguros'), findsOneWidget);
      expect(find.text('Servicios'), findsOneWidget);
    });

    testWidgets('shows promotion cards with data', (tester) async {
      await tester.pumpWidget(createPromotionsScreen());
      await tester.pumpAndSettle();

      expect(find.text('20% en cambio de aceite'), findsOneWidget);
      expect(find.text('\$200 en alineación'), findsOneWidget);
      expect(find.text('El Rápido S.A.'), findsAtLeastNWidgets(1));
    });

    testWidgets('shows Obtener cupón buttons', (tester) async {
      await tester.pumpWidget(createPromotionsScreen());
      await tester.pumpAndSettle();

      expect(find.text('Obtener cupón'), findsNWidgets(2));
    });

    testWidgets('empty state shown when no promos', (tester) async {
      await tester.pumpWidget(createPromotionsScreen(promos: []));
      await tester.pumpAndSettle();

      expect(find.text('Sin promociones disponibles'), findsOneWidget);
    });

    testWidgets('tapping Obtener cupón shows confirmation dialog', (
      tester,
    ) async {
      await tester.pumpWidget(createPromotionsScreen());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Obtener cupón').first);
      await tester.pumpAndSettle();

      expect(find.text('Generar Cupón'), findsOneWidget);
      expect(find.text('Cancelar'), findsOneWidget);
      expect(find.text('Generar'), findsOneWidget);
    });

    testWidgets('coupon dialog can be dismissed', (tester) async {
      await tester.pumpWidget(createPromotionsScreen());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Obtener cupón').first);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Cancelar'));
      await tester.pumpAndSettle();

      expect(find.text('Generar Cupón'), findsNothing);
    });

    testWidgets('shows discount formatted in cards', (tester) async {
      await tester.pumpWidget(createPromotionsScreen());
      await tester.pumpAndSettle();

      // 20% and $200
      expect(find.text('20%'), findsOneWidget);
      expect(find.text('\$200'), findsOneWidget);
    });
  });
}
