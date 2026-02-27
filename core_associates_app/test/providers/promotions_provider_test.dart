import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/promotions/data/models/cupon.dart';
import 'package:core_associates_app/features/promotions/data/models/promocion.dart';
import 'package:core_associates_app/features/promotions/data/promotions_repository.dart';
import 'package:core_associates_app/features/promotions/presentation/providers/promotions_provider.dart';
import '../helpers/fixtures.dart';
import '../helpers/mocks.dart';

void main() {
  group('SelectedCategoryNotifier', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() => container.dispose());

    test('initial state is Todas', () {
      expect(container.read(selectedCategoryProvider), 'Todas');
    });

    test('select updates category', () {
      container.read(selectedCategoryProvider.notifier).select('Mecánica');
      expect(container.read(selectedCategoryProvider), 'Mecánica');
    });
  });

  group('categoryMap', () {
    test('maps Todas to null', () {
      expect(categoryMap['Todas'], isNull);
    });

    test('maps Mecánica to taller', () {
      expect(categoryMap['Mecánica'], 'taller');
    });

    test('maps Comida to comida', () {
      expect(categoryMap['Comida'], 'comida');
    });
  });

  group('promocionesProvider', () {
    late MockPromotionsRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockPromotionsRepository();
    });

    tearDown(() => container.dispose());

    test('fetches all promotions when category is Todas', () async {
      when(() => mockRepo.getPromociones())
          .thenAnswer((_) async => [Promocion.fromJson(promocionJson)]);

      container = ProviderContainer(
        overrides: [
          promotionsRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      final result = await container.read(promocionesProvider.future);

      expect(result, hasLength(1));
      verify(() => mockRepo.getPromociones()).called(1);
    });

    test('passes categoria when category is selected', () async {
      when(() => mockRepo.getPromociones(categoria: 'taller'))
          .thenAnswer((_) async => [Promocion.fromJson(promocionJson)]);

      container = ProviderContainer(
        overrides: [
          promotionsRepositoryProvider.overrideWithValue(mockRepo),
          selectedCategoryProvider.overrideWith(() {
            final notifier = SelectedCategoryNotifier();
            return notifier;
          }),
        ],
      );

      // Change category then read
      container.read(selectedCategoryProvider.notifier).select('Mecánica');
      final result = await container.read(promocionesProvider.future);

      expect(result, hasLength(1));
      verify(() => mockRepo.getPromociones(categoria: 'taller')).called(1);
    });
  });

  group('MisCuponesNotifier', () {
    late MockPromotionsRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockPromotionsRepository();
    });

    tearDown(() => container.dispose());

    test('build fetches cupones', () async {
      when(() => mockRepo.getMisCupones())
          .thenAnswer((_) async => [Cupon.fromJson(cuponJson)]);

      container = ProviderContainer(
        overrides: [
          promotionsRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      final result = await container.read(misCuponesProvider.future);

      expect(result, hasLength(1));
      expect(result.first.codigo, 'CUP-ABC123');
    });

    test('generarCupon generates and returns cupon', () async {
      when(() => mockRepo.getMisCupones())
          .thenAnswer((_) async => <Cupon>[]);
      when(() => mockRepo.generarCupon('promo-1'))
          .thenAnswer((_) async => Cupon.fromJson(cuponJson));

      container = ProviderContainer(
        overrides: [
          promotionsRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );

      // Wait for build
      await container.read(misCuponesProvider.future);

      final cupon = await container
          .read(misCuponesProvider.notifier)
          .generarCupon('promo-1');

      expect(cupon.id, 'cup-1');
      verify(() => mockRepo.generarCupon('promo-1')).called(1);
    });
  });
}
