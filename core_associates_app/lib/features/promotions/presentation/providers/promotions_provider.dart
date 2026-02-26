import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/promocion.dart';
import '../../data/models/cupon.dart';
import '../../data/promotions_repository.dart';

// Map provider categories to backend tipo_proveedor values
const categoryMap = <String, String?>{
  'Todas': null,
  'Mecánica': 'taller',
  'Refacciones': 'taller',
  'Seguros': 'abogado',
  'Servicios': 'otro',
  'Comida': 'comida',
};

final selectedCategoryProvider =
    NotifierProvider<SelectedCategoryNotifier, String>(
        SelectedCategoryNotifier.new);

class SelectedCategoryNotifier extends Notifier<String> {
  @override
  String build() => 'Todas';

  void select(String category) => state = category;
}

final promocionesProvider = FutureProvider<List<Promocion>>((ref) async {
  final repo = ref.watch(promotionsRepositoryProvider);
  final category = ref.watch(selectedCategoryProvider);
  final apiCategory = categoryMap[category];
  return repo.getPromociones(categoria: apiCategory);
});

final misCuponesProvider =
    AsyncNotifierProvider<MisCuponesNotifier, List<Cupon>>(
        MisCuponesNotifier.new);

class MisCuponesNotifier extends AsyncNotifier<List<Cupon>> {
  @override
  Future<List<Cupon>> build() async {
    final repo = ref.watch(promotionsRepositoryProvider);
    return repo.getMisCupones();
  }

  Future<Cupon> generarCupon(String promocionId) async {
    final repo = ref.read(promotionsRepositoryProvider);
    final cupon = await repo.generarCupon(promocionId);
    ref.invalidateSelf();
    return cupon;
  }
}
