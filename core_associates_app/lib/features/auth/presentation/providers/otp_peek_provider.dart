import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/auth_repository.dart';

class OtpPeekState {
  final String? codigo;
  final int ttlSegundos;

  const OtpPeekState({this.codigo, this.ttlSegundos = 0});

  bool get hasPending => codigo != null && ttlSegundos > 0;
}

final otpPeekProvider = AsyncNotifierProvider<OtpPeekNotifier, OtpPeekState>(
  OtpPeekNotifier.new,
);

class OtpPeekNotifier extends AsyncNotifier<OtpPeekState> {
  Timer? _pollTimer;

  @override
  Future<OtpPeekState> build() async {
    ref.onDispose(() => _pollTimer?.cancel());
    _startPolling();
    return _fetch();
  }

  Future<OtpPeekState> _fetch() async {
    try {
      final repo = ref.read(authRepositoryProvider);
      final data = await repo.peekOtp();
      if (data == null) return const OtpPeekState();
      return OtpPeekState(
        codigo: data['codigo'] as String?,
        ttlSegundos: (data['ttlSegundos'] as num?)?.toInt() ?? 0,
      );
    } catch (_) {
      return const OtpPeekState();
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      ref.invalidateSelf();
    });
  }
}
