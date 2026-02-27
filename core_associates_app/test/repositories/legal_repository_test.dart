import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/legal_support/data/legal_repository.dart';
import '../helpers/fixtures.dart';
import '../helpers/mocks.dart';

void main() {
  late MockApiClient mockApiClient;
  late LegalRepository repository;

  setUp(() {
    mockApiClient = MockApiClient();
    repository = LegalRepository(apiClient: mockApiClient);
  });

  group('LegalRepository', () {
    group('crearCaso', () {
      test('sends data and returns CasoLegal', () async {
        when(() => mockApiClient.post(
              '/casos-legales',
              data: any(named: 'data'),
            )).thenAnswer((_) async => Response(
              data: casoLegalJson,
              requestOptions: RequestOptions(path: '/casos-legales'),
            ));

        final result = await repository.crearCaso(
          tipoPercance: 'accidente',
          latitud: 19.4326,
          longitud: -99.1332,
          descripcion: 'Choque por alcance',
          direccionAprox: 'Av. Reforma 500',
        );

        expect(result.id, 'caso-1');
        expect(result.tipoPercance, 'accidente');
        verify(() => mockApiClient.post(
              '/casos-legales',
              data: any(named: 'data'),
            )).called(1);
      });
    });

    group('getMisCasos', () {
      test('returns list of CasoLegal', () async {
        when(() => mockApiClient.get('/casos-legales/mis-casos'))
            .thenAnswer((_) async => Response(
                  data: [casoLegalJson, casoLegalMinimalJson],
                  requestOptions:
                      RequestOptions(path: '/casos-legales/mis-casos'),
                ));

        final result = await repository.getMisCasos();

        expect(result, hasLength(2));
        expect(result.first.codigo, 'LEG-001');
        expect(result.last.codigo, 'LEG-002');
      });

      test('returns empty list when no cases', () async {
        when(() => mockApiClient.get('/casos-legales/mis-casos'))
            .thenAnswer((_) async => Response(
                  data: [],
                  requestOptions:
                      RequestOptions(path: '/casos-legales/mis-casos'),
                ));

        final result = await repository.getMisCasos();

        expect(result, isEmpty);
      });
    });
  });
}
