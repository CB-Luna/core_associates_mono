import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/documents/data/documents_repository.dart';
import '../helpers/fixtures.dart';
import '../helpers/mocks.dart';

void main() {
  late MockApiClient mockApiClient;
  late DocumentsRepository repository;

  setUp(() {
    mockApiClient = MockApiClient();
    repository = DocumentsRepository(apiClient: mockApiClient);
  });

  group('DocumentsRepository', () {
    group('getMyDocuments', () {
      test('returns list of Documento', () async {
        when(() => mockApiClient.get('/documentos/mis-documentos'))
            .thenAnswer((_) async => Response(
                  data: [documentoJson, documentoRechazadoJson],
                  requestOptions:
                      RequestOptions(path: '/documentos/mis-documentos'),
                ));

        final result = await repository.getMyDocuments();

        expect(result, hasLength(2));
        expect(result.first.tipo, 'ine_frente');
        expect(result.last.estado, 'rechazado');
      });

      test('returns empty list when no documents', () async {
        when(() => mockApiClient.get('/documentos/mis-documentos'))
            .thenAnswer((_) async => Response(
                  data: [],
                  requestOptions:
                      RequestOptions(path: '/documentos/mis-documentos'),
                ));

        final result = await repository.getMyDocuments();

        expect(result, isEmpty);
      });
    });

    group('getDocumentUrl', () {
      test('returns streaming URL', () {
        when(() => mockApiClient.imageUrl('/documentos/doc-1/url'))
            .thenReturn('http://10.0.2.2:3501/api/v1/documentos/doc-1/url');

        final result = repository.getDocumentUrl('doc-1');

        expect(result, contains('/documentos/doc-1/url'));
      });
    });
  });
}
