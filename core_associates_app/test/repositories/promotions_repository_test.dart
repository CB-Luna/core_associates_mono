import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/promotions/data/promotions_repository.dart';
import '../helpers/fixtures.dart';
import '../helpers/mocks.dart';

void main() {
  late MockApiClient mockApiClient;
  late PromotionsRepository repository;

  setUp(() {
    mockApiClient = MockApiClient();
    repository = PromotionsRepository(apiClient: mockApiClient);
  });

  group('PromotionsRepository', () {
    group('getPromociones', () {
      test('returns list of Promocion without filter', () async {
        when(() => mockApiClient.get(
              '/promociones',
              queryParameters: <String, dynamic>{},
            )).thenAnswer((_) async => Response(
              data: [promocionJson, promocionMontoJson],
              requestOptions: RequestOptions(path: '/promociones'),
            ));

        final result = await repository.getPromociones();

        expect(result, hasLength(2));
        expect(result.first.titulo, '20% en cambio de aceite');
      });

      test('passes categoria as query parameter', () async {
        when(() => mockApiClient.get(
              '/promociones',
              queryParameters: {'categoria': 'taller'},
            )).thenAnswer((_) async => Response(
              data: [promocionJson],
              requestOptions: RequestOptions(path: '/promociones'),
            ));

        final result = await repository.getPromociones(categoria: 'taller');

        expect(result, hasLength(1));
        verify(() => mockApiClient.get(
              '/promociones',
              queryParameters: {'categoria': 'taller'},
            )).called(1);
      });
    });

    group('getPromocion', () {
      test('returns single Promocion by id', () async {
        when(() => mockApiClient.get('/promociones/promo-1'))
            .thenAnswer((_) async => Response(
                  data: promocionJson,
                  requestOptions:
                      RequestOptions(path: '/promociones/promo-1'),
                ));

        final result = await repository.getPromocion('promo-1');

        expect(result.id, 'promo-1');
      });
    });

    group('generarCupon', () {
      test('sends promocionId and returns Cupon', () async {
        when(() => mockApiClient.post(
              '/cupones',
              data: {'promocionId': 'promo-1'},
            )).thenAnswer((_) async => Response(
              data: cuponJson,
              requestOptions: RequestOptions(path: '/cupones'),
            ));

        final result = await repository.generarCupon('promo-1');

        expect(result.id, 'cup-1');
        expect(result.codigo, 'CUP-ABC123');
      });
    });

    group('getMisCupones', () {
      test('returns list of Cupon', () async {
        when(() => mockApiClient.get('/cupones/mis-cupones'))
            .thenAnswer((_) async => Response(
                  data: [cuponJson, cuponCanjeadoJson],
                  requestOptions:
                      RequestOptions(path: '/cupones/mis-cupones'),
                ));

        final result = await repository.getMisCupones();

        expect(result, hasLength(2));
        expect(result.first.isActive, isTrue);
        expect(result.last.isActive, isFalse);
      });
    });
  });
}
