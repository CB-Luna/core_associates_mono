import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/profile/data/models/asociado.dart';
import 'package:core_associates_app/features/profile/data/models/vehiculo.dart';
import 'package:core_associates_app/features/profile/data/profile_repository.dart';
import 'package:core_associates_app/features/profile/presentation/providers/profile_provider.dart';
import '../helpers/fixtures.dart';
import '../helpers/mocks.dart';

void main() {
  group('ProfileNotifier', () {
    late MockProfileRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockProfileRepository();
    });

    tearDown(() => container.dispose());

    ProviderContainer createContainer() {
      container = ProviderContainer(
        overrides: [profileRepositoryProvider.overrideWithValue(mockRepo)],
      );
      return container;
    }

    test('build fetches profile', () async {
      when(
        () => mockRepo.getMyProfile(),
      ).thenAnswer((_) async => Asociado.fromJson(asociadoJson));

      createContainer();
      final result = await container.read(profileProvider.future);

      expect(result, isNotNull);
      expect(result!.nombre, 'Juan');
      expect(result.idUnico, 'ASC-0001');
    });

    test('build returns null on error', () async {
      when(() => mockRepo.getMyProfile()).thenThrow(Exception('Not found'));

      createContainer();
      final result = await container.read(profileProvider.future);

      expect(result, isNull);
    });

    test('updateProfile updates state', () async {
      when(
        () => mockRepo.getMyProfile(),
      ).thenAnswer((_) async => Asociado.fromJson(asociadoJson));
      when(() => mockRepo.updateMyProfile(any())).thenAnswer(
        (_) async => Asociado.fromJson({...asociadoJson, 'nombre': 'Pedro'}),
      );

      createContainer();
      await container.read(profileProvider.future);

      await container.read(profileProvider.notifier).updateProfile({
        'nombre': 'Pedro',
      });

      final updated = await container.read(profileProvider.future);
      expect(updated!.nombre, 'Pedro');
    });
  });

  group('VehiculosNotifier', () {
    late MockProfileRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockProfileRepository();
    });

    tearDown(() => container.dispose());

    ProviderContainer createContainer() {
      container = ProviderContainer(
        overrides: [profileRepositoryProvider.overrideWithValue(mockRepo)],
      );
      return container;
    }

    test('build fetches vehiculos', () async {
      when(
        () => mockRepo.getMyVehiculos(),
      ).thenAnswer((_) async => [Vehiculo.fromJson(vehiculoJson)]);

      createContainer();
      final result = await container.read(vehiculosProvider.future);

      expect(result, hasLength(1));
      expect(result.first.marca, 'Toyota');
    });

    test('build returns empty list on error', () async {
      when(() => mockRepo.getMyVehiculos()).thenThrow(Exception('Error'));

      createContainer();
      final result = await container.read(vehiculosProvider.future);

      expect(result, isEmpty);
    });

    test('addVehiculo calls repo and invalidates', () async {
      when(
        () => mockRepo.getMyVehiculos(),
      ).thenAnswer((_) async => <Vehiculo>[]);
      when(
        () => mockRepo.addVehiculo(any()),
      ).thenAnswer((_) async => Vehiculo.fromJson(vehiculoJson));

      createContainer();
      await container.read(vehiculosProvider.future);

      final data = {
        'marca': 'Toyota',
        'modelo': 'Corolla',
        'anio': 2020,
        'color': 'Blanco',
        'placas': 'ABC-123',
      };
      await container.read(vehiculosProvider.notifier).addVehiculo(data);

      verify(() => mockRepo.addVehiculo(data)).called(1);
    });

    test('deleteVehiculo calls repo', () async {
      when(
        () => mockRepo.getMyVehiculos(),
      ).thenAnswer((_) async => [Vehiculo.fromJson(vehiculoJson)]);
      when(() => mockRepo.deleteVehiculo(any())).thenAnswer((_) async {});

      createContainer();
      await container.read(vehiculosProvider.future);

      await container.read(vehiculosProvider.notifier).deleteVehiculo('v-1');

      verify(() => mockRepo.deleteVehiculo('v-1')).called(1);
    });
  });
}
