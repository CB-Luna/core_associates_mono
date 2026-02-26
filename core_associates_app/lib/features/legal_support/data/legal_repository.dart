import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import 'models/caso_legal.dart';

final legalRepositoryProvider = Provider<LegalRepository>((ref) {
  return LegalRepository(apiClient: ref.watch(apiClientProvider));
});

class LegalRepository {
  final ApiClient apiClient;

  LegalRepository({required this.apiClient});

  Future<CasoLegal> crearCaso({
    required String tipoPercance,
    required double latitud,
    required double longitud,
    String? descripcion,
    String? direccionAprox,
  }) async {
    final response = await apiClient.post('/casos-legales', data: {
      'tipoPercance': tipoPercance,
      'latitud': latitud,
      'longitud': longitud,
      'descripcion': ?descripcion,
      'direccionAprox': ?direccionAprox,
    });
    return CasoLegal.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<CasoLegal>> getMisCasos() async {
    final response = await apiClient.get('/casos-legales/mis-casos');
    return (response.data as List<dynamic>)
        .map((c) => CasoLegal.fromJson(c as Map<String, dynamic>))
        .toList();
  }
}
