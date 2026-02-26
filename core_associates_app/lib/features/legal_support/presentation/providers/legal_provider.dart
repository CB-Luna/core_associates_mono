import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/caso_legal.dart';
import '../../data/legal_repository.dart';

final misCasosProvider =
    AsyncNotifierProvider<MisCasosNotifier, List<CasoLegal>>(
        MisCasosNotifier.new);

class MisCasosNotifier extends AsyncNotifier<List<CasoLegal>> {
  @override
  Future<List<CasoLegal>> build() async {
    try {
      final repo = ref.watch(legalRepositoryProvider);
      return await repo.getMisCasos();
    } catch (_) {
      return [];
    }
  }

  Future<CasoLegal> reportarPercance({
    required String tipoPercance,
    required double latitud,
    required double longitud,
    String? descripcion,
    String? direccionAprox,
  }) async {
    final repo = ref.read(legalRepositoryProvider);
    final caso = await repo.crearCaso(
      tipoPercance: tipoPercance,
      latitud: latitud,
      longitud: longitud,
      descripcion: descripcion,
      direccionAprox: direccionAprox,
    );
    ref.invalidateSelf();
    return caso;
  }
}
