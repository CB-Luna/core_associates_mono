import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import 'models/asociado.dart';
import 'models/vehiculo.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(apiClient: ref.watch(apiClientProvider));
});

class ProfileRepository {
  final ApiClient apiClient;

  ProfileRepository({required this.apiClient});

  Future<Asociado> getMyProfile() async {
    final response = await apiClient.get('/asociados/me');
    return Asociado.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Asociado> updateMyProfile(Map<String, dynamic> data) async {
    final response = await apiClient.put('/asociados/me', data: data);
    return Asociado.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<Vehiculo>> getMyVehiculos() async {
    final response = await apiClient.get('/asociados/me/vehiculos');
    return (response.data as List<dynamic>)
        .map((v) => Vehiculo.fromJson(v as Map<String, dynamic>))
        .toList();
  }

  Future<Vehiculo> addVehiculo(Map<String, dynamic> data) async {
    final response = await apiClient.post(
      '/asociados/me/vehiculos',
      data: data,
    );
    return Vehiculo.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Vehiculo> updateVehiculo(String id, Map<String, dynamic> data) async {
    final response = await apiClient.put('/vehiculos/$id', data: data);
    return Vehiculo.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteVehiculo(String id) async {
    await apiClient.delete('/vehiculos/$id');
  }
}
