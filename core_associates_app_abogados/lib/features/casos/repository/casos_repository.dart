import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../models/caso_legal.dart';
import '../models/nota_caso.dart';
import '../models/documento_caso.dart';

final casosRepositoryProvider = Provider<CasosRepository>((ref) {
  return CasosRepository(ref.watch(apiClientProvider));
});

class CasosRepository {
  final ApiClient _api;

  CasosRepository(this._api);

  // ── Mis casos asignados ──────────────────────────────────

  Future<PaginatedCasos> getMisCasos({
    int page = 1,
    int limit = 20,
    String? estado,
    String? fechaDesde,
    String? fechaHasta,
  }) async {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (estado != null) params['estado'] = estado;
    if (fechaDesde != null) params['fechaDesde'] = fechaDesde;
    if (fechaHasta != null) params['fechaHasta'] = fechaHasta;

    final res = await _api.get(
      '/casos-legales/abogado/mis-casos',
      queryParameters: params,
    );
    final data = res.data as Map<String, dynamic>;

    final meta = data['meta'] as Map<String, dynamic>? ?? {};

    return PaginatedCasos(
      casos: (data['data'] as List)
          .map((e) => CasoLegal.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: meta['total'] as int? ?? 0,
      page: meta['page'] as int? ?? page,
      limit: meta['limit'] as int? ?? limit,
    );
  }

  Future<CasoLegal> getCasoDetail(String id) async {
    final res = await _api.get('/casos-legales/abogado/mis-casos/$id');
    return CasoLegal.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Casos disponibles ────────────────────────────────────

  Future<PaginatedCasos> getCasosDisponibles({
    int page = 1,
    int limit = 20,
  }) async {
    final res = await _api.get(
      '/casos-legales/abogado/disponibles',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = res.data as Map<String, dynamic>;
    final meta = data['meta'] as Map<String, dynamic>? ?? {};

    return PaginatedCasos(
      casos: (data['data'] as List)
          .map((e) => CasoLegal.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: meta['total'] as int? ?? 0,
      page: meta['page'] as int? ?? page,
      limit: meta['limit'] as int? ?? limit,
    );
  }

  // ── Acciones sobre caso ──────────────────────────────────

  Future<void> postularse(String casoId) async {
    await _api.post('/casos-legales/$casoId/postularse');
  }

  Future<CasoLegal> aceptarAsignacion(String casoId) async {
    final res = await _api.post('/casos-legales/$casoId/aceptar');
    return CasoLegal.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> rechazarAsignacion(String casoId, {String? motivo}) async {
    await _api.post(
      '/casos-legales/$casoId/rechazar',
      data: motivo != null ? {'motivo': motivo} : null,
    );
  }

  Future<CasoLegal> cambiarEstado(String casoId, String estado) async {
    final res = await _api.put(
      '/casos-legales/$casoId/estado-abogado',
      data: {'estado': estado},
    );
    return CasoLegal.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Notas ────────────────────────────────────────────────

  Future<List<NotaCaso>> getNotas(String casoId) async {
    final res = await _api.get('/casos-legales/$casoId/notas');
    return (res.data as List)
        .map((e) => NotaCaso.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<NotaCaso> addNota(
    String casoId, {
    required String contenido,
    bool esPrivada = false,
  }) async {
    final res = await _api.post(
      '/casos-legales/$casoId/notas',
      data: {'contenido': contenido, 'esPrivada': esPrivada},
    );
    return NotaCaso.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Documentos ───────────────────────────────────────────

  Future<List<DocumentoCaso>> getDocumentos(String casoId) async {
    final res = await _api.get('/casos-legales/$casoId/documentos');
    return (res.data as List)
        .map((e) => DocumentoCaso.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<DocumentoCaso> uploadDocumento(
    String casoId, {
    required String filePath,
    required String fileName,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });
    final res = await _api.post(
      '/casos-legales/$casoId/documentos',
      data: formData,
    );
    return DocumentoCaso.fromJson(res.data as Map<String, dynamic>);
  }
}

/// Wrapper de respuesta paginada
class PaginatedCasos {
  final List<CasoLegal> casos;
  final int total;
  final int page;
  final int limit;

  const PaginatedCasos({
    required this.casos,
    required this.total,
    required this.page,
    required this.limit,
  });

  bool get hasMore => page * limit < total;
}
