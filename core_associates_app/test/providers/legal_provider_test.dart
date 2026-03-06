import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/legal_support/data/models/caso_legal.dart';
import 'package:core_associates_app/features/legal_support/data/legal_repository.dart';
import 'package:core_associates_app/features/legal_support/presentation/providers/legal_provider.dart';
import '../helpers/fixtures.dart';
import '../helpers/mocks.dart';

void main() {
  group('MisCasosNotifier', () {
    late MockLegalRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockLegalRepository();
    });

    tearDown(() => container.dispose());

    ProviderContainer createContainer() {
      container = ProviderContainer(
        overrides: [legalRepositoryProvider.overrideWithValue(mockRepo)],
      );
      return container;
    }

    test('build fetches mis casos', () async {
      when(
        () => mockRepo.getMisCasos(),
      ).thenAnswer((_) async => [CasoLegal.fromJson(casoLegalJson)]);

      createContainer();
      final result = await container.read(misCasosProvider.future);

      expect(result, hasLength(1));
      expect(result.first.codigo, 'LEG-001');
    });

    test('build returns empty list on error', () async {
      when(() => mockRepo.getMisCasos()).thenThrow(Exception('Network error'));

      createContainer();
      final result = await container.read(misCasosProvider.future);

      expect(result, isEmpty);
    });

    test('reportarPercance creates case and invalidates', () async {
      when(() => mockRepo.getMisCasos()).thenAnswer((_) async => <CasoLegal>[]);
      when(
        () => mockRepo.crearCaso(
          tipoPercance: any(named: 'tipoPercance'),
          latitud: any(named: 'latitud'),
          longitud: any(named: 'longitud'),
          descripcion: any(named: 'descripcion'),
          direccionAprox: any(named: 'direccionAprox'),
        ),
      ).thenAnswer((_) async => CasoLegal.fromJson(casoLegalJson));

      createContainer();
      await container.read(misCasosProvider.future);

      final caso = await container
          .read(misCasosProvider.notifier)
          .reportarPercance(
            tipoPercance: 'accidente',
            latitud: 19.4326,
            longitud: -99.1332,
            descripcion: 'Choque en Reforma',
          );

      expect(caso.tipoPercance, 'accidente');
      verify(
        () => mockRepo.crearCaso(
          tipoPercance: 'accidente',
          latitud: 19.4326,
          longitud: -99.1332,
          descripcion: 'Choque en Reforma',
          direccionAprox: null,
        ),
      ).called(1);
    });
  });

  group('casoDetailProvider', () {
    late MockLegalRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockLegalRepository();
    });

    tearDown(() => container.dispose());

    test('fetches case detail by id', () async {
      when(
        () => mockRepo.getCasoDetail('caso-1'),
      ).thenAnswer((_) async => CasoLegal.fromJson(casoLegalJson));

      container = ProviderContainer(
        overrides: [legalRepositoryProvider.overrideWithValue(mockRepo)],
      );

      final result = await container.read(casoDetailProvider('caso-1').future);

      expect(result.codigo, 'LEG-001');
      expect(result.tipoPercance, 'accidente');
    });
  });
}
