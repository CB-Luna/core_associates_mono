import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import 'models/documento.dart';

final documentsRepositoryProvider = Provider<DocumentsRepository>((ref) {
  return DocumentsRepository(apiClient: ref.watch(apiClientProvider));
});

class DocumentsRepository {
  final ApiClient apiClient;

  DocumentsRepository({required this.apiClient});

  Future<List<Documento>> getMyDocuments() async {
    final response = await apiClient.get('/documentos/mis-documentos');
    final list = response.data as List<dynamic>;
    return list
        .map((e) => Documento.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Documento> uploadDocument(String filePath, String tipo) async {
    final response = await apiClient.uploadFile(
      '/documentos/upload',
      filePath: filePath,
      fieldName: 'file',
      fields: {'tipo': tipo},
    );
    return Documento.fromJson(response.data as Map<String, dynamic>);
  }

  /// Pre-validates an image with AI before uploading.
  /// Returns `{valida: bool, motivo?: String, advertencia?: String}`.
  Future<Map<String, dynamic>> preValidar(String filePath, String tipo) async {
    final response = await apiClient.uploadFile(
      '/documentos/pre-validar',
      filePath: filePath,
      fieldName: 'file',
      fields: {'tipo': tipo},
    );
    return response.data as Map<String, dynamic>;
  }

  /// Returns the full streaming URL for a document.
  String getDocumentUrl(String id) {
    return apiClient.imageUrl('/documentos/$id/url');
  }
}
