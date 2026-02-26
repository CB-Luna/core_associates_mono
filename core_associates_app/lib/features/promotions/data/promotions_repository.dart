import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import 'models/promocion.dart';
import 'models/cupon.dart';

final promotionsRepositoryProvider = Provider<PromotionsRepository>((ref) {
  return PromotionsRepository(apiClient: ref.watch(apiClientProvider));
});

class PromotionsRepository {
  final ApiClient apiClient;

  PromotionsRepository({required this.apiClient});

  Future<List<Promocion>> getPromociones({String? categoria}) async {
    final queryParams = <String, dynamic>{};
    if (categoria != null) queryParams['categoria'] = categoria;

    final response =
        await apiClient.get('/promociones', queryParameters: queryParams);
    return (response.data as List<dynamic>)
        .map((p) => Promocion.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  Future<Promocion> getPromocion(String id) async {
    final response = await apiClient.get('/promociones/$id');
    return Promocion.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Cupon> generarCupon(String promocionId) async {
    final response = await apiClient.post('/cupones', data: {
      'promocionId': promocionId,
    });
    return Cupon.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<Cupon>> getMisCupones() async {
    final response = await apiClient.get('/cupones/mis-cupones');
    return (response.data as List<dynamic>)
        .map((c) => Cupon.fromJson(c as Map<String, dynamic>))
        .toList();
  }
}
