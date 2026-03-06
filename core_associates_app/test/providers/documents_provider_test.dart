import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/documents/data/models/documento.dart';
import 'package:core_associates_app/features/documents/data/documents_repository.dart';
import 'package:core_associates_app/features/documents/presentation/providers/documents_provider.dart';
import '../helpers/fixtures.dart';
import '../helpers/mocks.dart';

void main() {
  group('DocumentsNotifier', () {
    late MockDocumentsRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockDocumentsRepository();
    });

    tearDown(() => container.dispose());

    ProviderContainer createContainer() {
      container = ProviderContainer(
        overrides: [documentsRepositoryProvider.overrideWithValue(mockRepo)],
      );
      return container;
    }

    test('build fetches documents', () async {
      when(
        () => mockRepo.getMyDocuments(),
      ).thenAnswer((_) async => [Documento.fromJson(documentoJson)]);

      createContainer();
      final result = await container.read(documentsProvider.future);

      expect(result, hasLength(1));
      expect(result.first.tipo, 'ine_frente');
    });

    test('build returns error state on exception', () async {
      when(
        () => mockRepo.getMyDocuments(),
      ).thenAnswer((_) async => throw Exception('Error'));

      createContainer();
      // Listen to trigger build, then wait for async error to settle
      container.listen(documentsProvider, (_, _) {});
      await Future<void>.delayed(const Duration(milliseconds: 200));
      final state = container.read(documentsProvider);
      expect(state.hasError, isTrue);
    });

    test('uploadDocument calls repo and invalidates', () async {
      when(
        () => mockRepo.getMyDocuments(),
      ).thenAnswer((_) async => <Documento>[]);
      when(
        () => mockRepo.uploadDocument(any(), any()),
      ).thenAnswer((_) async => Documento.fromJson(documentoJson));

      createContainer();
      await container.read(documentsProvider.future);

      await container
          .read(documentsProvider.notifier)
          .uploadDocument('/path/to/file.jpg', 'ine_frente');

      verify(
        () => mockRepo.uploadDocument('/path/to/file.jpg', 'ine_frente'),
      ).called(1);
    });
  });
}
