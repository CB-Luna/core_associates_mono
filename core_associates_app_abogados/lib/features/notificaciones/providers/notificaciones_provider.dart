import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

/// Contador de notificaciones no leídas.
/// Se refresca cada 30 segundos y tras acciones relevantes.
final notificacionesNoLeidasProvider =
    NotifierProvider<NotificacionesNoLeidasNotifier, int>(
      NotificacionesNoLeidasNotifier.new,
    );

class NotificacionesNoLeidasNotifier extends Notifier<int> {
  Timer? _timer;

  @override
  int build() {
    _fetchCount();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _fetchCount());
    ref.onDispose(() => _timer?.cancel());
    return 0;
  }

  Future<void> _fetchCount() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.get('/notificaciones-crm/no-leidas/count');
      final data = res.data as Map<String, dynamic>;
      final count = data['count'] as int? ?? 0;
      state = count;
    } catch (_) {
      // silencioso — no alterar el state si falla
    }
  }

  Future<void> refresh() => _fetchCount();

  Future<void> marcarLeida(String id) async {
    try {
      final api = ref.read(apiClientProvider);
      await api.put('/notificaciones-crm/$id/leer');
      state = (state - 1).clamp(0, 999);
    } catch (_) {}
  }

  Future<void> marcarTodasLeidas() async {
    try {
      final api = ref.read(apiClientProvider);
      await api.put('/notificaciones-crm/leer-todas');
      state = 0;
    } catch (_) {}
  }
}
