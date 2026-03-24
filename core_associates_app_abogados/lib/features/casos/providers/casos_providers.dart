import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/caso_legal.dart';
import '../models/nota_caso.dart';
import '../models/documento_caso.dart';
import '../repository/casos_repository.dart';

// ── Mis Casos ────────────────────────────────────────────────

final misCasosProvider =
    NotifierProvider<MisCasosNotifier, AsyncValue<PaginatedCasos>>(
      MisCasosNotifier.new,
    );

class MisCasosNotifier extends Notifier<AsyncValue<PaginatedCasos>> {
  String? _estadoFiltro;

  CasosRepository get _repo => ref.read(casosRepositoryProvider);

  @override
  AsyncValue<PaginatedCasos> build() {
    load();
    return const AsyncValue.loading();
  }

  Future<void> load({int page = 1}) async {
    if (page == 1) state = const AsyncValue.loading();
    try {
      final result = await _repo.getMisCasos(page: page, estado: _estadoFiltro);
      if (page > 1 && state.hasValue) {
        final prev = state.value!;
        state = AsyncValue.data(
          PaginatedCasos(
            casos: [...prev.casos, ...result.casos],
            total: result.total,
            page: result.page,
            limit: result.limit,
          ),
        );
      } else {
        state = AsyncValue.data(result);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void setFiltro(String? estado) {
    _estadoFiltro = estado;
    load();
  }

  Future<void> refresh() => load();
}

// ── Caso Detail ──────────────────────────────────────────────

final casoDetailProvider = FutureProvider.family<CasoLegal, String>((
  ref,
  id,
) async {
  final repo = ref.watch(casosRepositoryProvider);
  return repo.getCasoDetail(id);
});

// ── Casos Disponibles ────────────────────────────────────────

final casosDisponiblesProvider =
    NotifierProvider<CasosDisponiblesNotifier, AsyncValue<PaginatedCasos>>(
      CasosDisponiblesNotifier.new,
    );

class CasosDisponiblesNotifier extends Notifier<AsyncValue<PaginatedCasos>> {
  CasosRepository get _repo => ref.read(casosRepositoryProvider);

  @override
  AsyncValue<PaginatedCasos> build() {
    load();
    return const AsyncValue.loading();
  }

  Future<void> load({int page = 1}) async {
    if (page == 1) state = const AsyncValue.loading();
    try {
      final result = await _repo.getCasosDisponibles(page: page);
      if (page > 1 && state.hasValue) {
        final prev = state.value!;
        state = AsyncValue.data(
          PaginatedCasos(
            casos: [...prev.casos, ...result.casos],
            total: result.total,
            page: result.page,
            limit: result.limit,
          ),
        );
      } else {
        state = AsyncValue.data(result);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() => load();
}

// ── Notas del caso ───────────────────────────────────────────

final notasCasoProvider = FutureProvider.family<List<NotaCaso>, String>((
  ref,
  casoId,
) async {
  final repo = ref.watch(casosRepositoryProvider);
  return repo.getNotas(casoId);
});

// ── Documentos del caso ──────────────────────────────────────

final documentosCasoProvider =
    FutureProvider.family<List<DocumentoCaso>, String>((ref, casoId) async {
      final repo = ref.watch(casosRepositoryProvider);
      return repo.getDocumentos(casoId);
    });
