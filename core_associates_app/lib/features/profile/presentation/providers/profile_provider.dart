import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/asociado.dart';
import '../../data/models/vehiculo.dart';
import '../../data/profile_repository.dart';

final profileProvider = AsyncNotifierProvider<ProfileNotifier, Asociado?>(
  ProfileNotifier.new,
);

class ProfileNotifier extends AsyncNotifier<Asociado?> {
  @override
  Future<Asociado?> build() async {
    try {
      final repo = ref.watch(profileRepositoryProvider);
      return await repo.getMyProfile();
    } catch (_) {
      return null;
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(profileRepositoryProvider);
      return repo.getMyProfile();
    });
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    final repo = ref.read(profileRepositoryProvider);
    final updated = await repo.updateMyProfile(data);
    state = AsyncData(updated);
  }
}

final vehiculosProvider =
    AsyncNotifierProvider<VehiculosNotifier, List<Vehiculo>>(
      VehiculosNotifier.new,
    );

class VehiculosNotifier extends AsyncNotifier<List<Vehiculo>> {
  @override
  Future<List<Vehiculo>> build() async {
    try {
      final repo = ref.watch(profileRepositoryProvider);
      return await repo.getMyVehiculos();
    } catch (_) {
      return [];
    }
  }

  Future<void> addVehiculo(Map<String, dynamic> data) async {
    final repo = ref.read(profileRepositoryProvider);
    await repo.addVehiculo(data);
    ref.invalidateSelf();
  }

  Future<void> updateVehiculo(String id, Map<String, dynamic> data) async {
    final repo = ref.read(profileRepositoryProvider);
    await repo.updateVehiculo(id, data);
    ref.invalidateSelf();
  }

  Future<void> deleteVehiculo(String id) async {
    final repo = ref.read(profileRepositoryProvider);
    await repo.deleteVehiculo(id);
    ref.invalidateSelf();
  }
}
