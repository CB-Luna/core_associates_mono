import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/documents_repository.dart';
import '../../data/models/documento.dart';

final documentsProvider =
    AsyncNotifierProvider<DocumentsNotifier, List<Documento>>(
  DocumentsNotifier.new,
);

class DocumentsNotifier extends AsyncNotifier<List<Documento>> {
  @override
  Future<List<Documento>> build() async {
    final repo = ref.watch(documentsRepositoryProvider);
    return repo.getMyDocuments();
  }

  Future<void> uploadDocument(String filePath, String tipo) async {
    final repo = ref.read(documentsRepositoryProvider);
    await repo.uploadDocument(filePath, tipo);
    ref.invalidateSelf();
  }
}
