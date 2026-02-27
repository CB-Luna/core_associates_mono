import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/profile/data/profile_repository.dart';
import '../helpers/fixtures.dart';
import '../helpers/mocks.dart';

void main() {
  late MockApiClient mockApiClient;
  late ProfileRepository repository;

  setUp(() {
    mockApiClient = MockApiClient();
    repository = ProfileRepository(apiClient: mockApiClient);
  });

  group('ProfileRepository', () {
    group('getMyProfile', () {
      test('returns Asociado from API response', () async {
        when(() => mockApiClient.get('/asociados/me'))
            .thenAnswer((_) async => Response(
                  data: asociadoJson,
                  requestOptions: RequestOptions(path: '/asociados/me'),
                ));

        final result = await repository.getMyProfile();

        expect(result.id, 'uuid-1');
        expect(result.nombre, 'Juan');
        expect(result.vehiculos, hasLength(1));
      });
    });

    group('updateMyProfile', () {
      test('sends data and returns updated Asociado', () async {
        final updateData = {'nombre': 'Carlos'};
        when(() => mockApiClient.put('/asociados/me', data: updateData))
            .thenAnswer((_) async => Response(
                  data: {...asociadoJson, 'nombre': 'Carlos'},
                  requestOptions: RequestOptions(path: '/asociados/me'),
                ));

        final result = await repository.updateMyProfile(updateData);

        expect(result.nombre, 'Carlos');
        verify(() => mockApiClient.put('/asociados/me', data: updateData))
            .called(1);
      });
    });

    group('getMyVehiculos', () {
      test('returns list of Vehiculo', () async {
        when(() => mockApiClient.get('/asociados/me/vehiculos'))
            .thenAnswer((_) async => Response(
                  data: [vehiculoJson],
                  requestOptions:
                      RequestOptions(path: '/asociados/me/vehiculos'),
                ));

        final result = await repository.getMyVehiculos();

        expect(result, hasLength(1));
        expect(result.first.marca, 'Toyota');
      });

      test('returns empty list when no vehiculos', () async {
        when(() => mockApiClient.get('/asociados/me/vehiculos'))
            .thenAnswer((_) async => Response(
                  data: [],
                  requestOptions:
                      RequestOptions(path: '/asociados/me/vehiculos'),
                ));

        final result = await repository.getMyVehiculos();

        expect(result, isEmpty);
      });
    });

    group('addVehiculo', () {
      test('sends data and returns new Vehiculo', () async {
        final newVehiculo = {
          'marca': 'Nissan',
          'modelo': 'Versa',
          'anio': 2022,
          'color': 'Negro',
          'placas': 'DEF-456',
        };
        when(() =>
                mockApiClient.post('/asociados/me/vehiculos', data: newVehiculo))
            .thenAnswer((_) async => Response(
                  data: {
                    'id': 'v-new',
                    ...newVehiculo,
                    'esPrincipal': false,
                  },
                  requestOptions:
                      RequestOptions(path: '/asociados/me/vehiculos'),
                ));

        final result = await repository.addVehiculo(newVehiculo);

        expect(result.marca, 'Nissan');
        expect(result.id, 'v-new');
      });
    });
  });
}
