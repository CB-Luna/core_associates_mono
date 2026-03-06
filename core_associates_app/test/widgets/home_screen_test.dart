import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/home/presentation/screens/home_screen.dart';
import 'package:core_associates_app/features/profile/data/profile_repository.dart';
import 'package:core_associates_app/features/profile/data/models/asociado.dart';
import 'package:core_associates_app/features/promotions/data/promotions_repository.dart';
import 'package:core_associates_app/features/promotions/data/models/promocion.dart';
import 'package:core_associates_app/core/api/api_client.dart';
import 'package:core_associates_app/core/storage/secure_storage.dart';
import '../helpers/mocks.dart';
import '../helpers/fixtures.dart';

void main() {
  late MockProfileRepository mockProfileRepo;
  late MockPromotionsRepository mockPromotionsRepo;
  late MockApiClient mockApiClient;
  late MockSecureStorageService mockStorage;

  final testAsociado = Asociado.fromJson(asociadoJson);
  final testPromocion = Promocion.fromJson(promocionJson);

  setUp(() {
    mockProfileRepo = MockProfileRepository();
    mockPromotionsRepo = MockPromotionsRepository();
    mockApiClient = MockApiClient();
    mockStorage = MockSecureStorageService();
  });

  Widget createHomeScreen({Asociado? asociado, List<Promocion>? promos}) {
    if (asociado != null) {
      when(
        () => mockProfileRepo.getMyProfile(),
      ).thenAnswer((_) async => asociado);
    } else {
      when(
        () => mockProfileRepo.getMyProfile(),
      ).thenAnswer((_) async => testAsociado);
    }

    when(
      () =>
          mockPromotionsRepo.getPromociones(categoria: any(named: 'categoria')),
    ).thenAnswer((_) async => promos ?? [testPromocion]);

    return ProviderScope(
      overrides: [
        profileRepositoryProvider.overrideWithValue(mockProfileRepo),
        promotionsRepositoryProvider.overrideWithValue(mockPromotionsRepo),
        apiClientProvider.overrideWithValue(mockApiClient),
        secureStorageProvider.overrideWithValue(mockStorage),
      ],
      child: const MaterialApp(home: Scaffold(body: HomeScreen())),
    );
  }

  group('HomeScreen', () {
    testWidgets('shows greeting with user name when profile loads', (
      tester,
    ) async {
      await tester.pumpWidget(createHomeScreen());
      await tester.pumpAndSettle();

      expect(find.text('Hola, Juan'), findsOneWidget);
      expect(find.text('Core Associates'), findsAtLeastNWidgets(1));
    });

    testWidgets('shows Bienvenido when profile load fails', (tester) async {
      when(
        () => mockProfileRepo.getMyProfile(),
      ).thenThrow(Exception('network error'));
      when(
        () => mockPromotionsRepo.getPromociones(
          categoria: any(named: 'categoria'),
        ),
      ).thenAnswer((_) async => <Promocion>[]);

      final widget = ProviderScope(
        overrides: [
          profileRepositoryProvider.overrideWithValue(mockProfileRepo),
          promotionsRepositoryProvider.overrideWithValue(mockPromotionsRepo),
          apiClientProvider.overrideWithValue(mockApiClient),
          secureStorageProvider.overrideWithValue(mockStorage),
        ],
        child: const MaterialApp(home: Scaffold(body: HomeScreen())),
      );

      await tester.pumpWidget(widget);
      await tester.pumpAndSettle();

      // failed profile → 'Bienvenido'
      expect(find.text('Bienvenido'), findsAtLeastNWidgets(1));
    });

    testWidgets('renders quick action buttons', (tester) async {
      await tester.pumpWidget(createHomeScreen());
      await tester.pumpAndSettle();

      expect(find.text('Acceso Rápido'), findsOneWidget);
      expect(find.text('Mis Cupones'), findsOneWidget);
      expect(find.text('Documentos'), findsOneWidget);
      expect(find.text('Vehículos'), findsOneWidget);
      expect(find.text('SOS Legal'), findsOneWidget);
    });

    testWidgets('renders Promociones Recientes section', (tester) async {
      await tester.pumpWidget(createHomeScreen());
      await tester.pumpAndSettle();

      expect(find.text('Promociones Recientes'), findsOneWidget);
    });

    testWidgets('shows promotion card with data', (tester) async {
      await tester.pumpWidget(createHomeScreen(promos: [testPromocion]));
      await tester.pumpAndSettle();

      expect(find.text('20% en cambio de aceite'), findsOneWidget);
      expect(find.text('El Rápido S.A.'), findsOneWidget);
    });

    testWidgets('shows membership card with asociado info', (tester) async {
      await tester.pumpWidget(createHomeScreen());
      await tester.pumpAndSettle();

      // Membership card shows 'Asociado #ASC-0001'
      expect(find.textContaining('ASC-0001'), findsOneWidget);
    });
  });
}
