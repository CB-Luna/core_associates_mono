import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../profile/data/profile_repository.dart';
import '../../data/auth_repository.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;
  final String? asociadoEstado;
  final String? motivoRechazo;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
    this.asociadoEstado,
    this.motivoRechazo,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    String? asociadoEstado,
    String? motivoRechazo,
  }) => AuthState(
    isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    isLoading: isLoading ?? this.isLoading,
    error: error,
    asociadoEstado: asociadoEstado ?? this.asociadoEstado,
    motivoRechazo: motivoRechazo ?? this.motivoRechazo,
  );
}

final authStateProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    final repo = ref.watch(authRepositoryProvider);
    final isAuth = await repo.isAuthenticated();
    if (!isAuth) return const AuthState(isAuthenticated: false);

    // Fetch profile to get asociado estado
    try {
      final profileRepo = ref.read(profileRepositoryProvider);
      final asociado = await profileRepo.getMyProfile();
      return AuthState(
        isAuthenticated: true,
        asociadoEstado: asociado.estado,
        motivoRechazo: null, // API may include motivoRechazo in future
      );
    } catch (_) {
      return const AuthState(isAuthenticated: true);
    }
  }

  Future<void> sendOtp(String phoneNumber) async {
    final repo = ref.read(authRepositoryProvider);
    await repo.sendOtp(phoneNumber);
  }

  Future<bool> verifyOtp(String phoneNumber, String otp) async {
    state = const AsyncLoading();
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.verifyOtp(phoneNumber, otp);

      // Fetch profile to get estado
      String? estado;
      try {
        final profileRepo = ref.read(profileRepositoryProvider);
        final asociado = await profileRepo.getMyProfile();
        estado = asociado.estado;
      } catch (_) {
        // Profile fetch failed — allow entry, estado will be checked later
      }

      state = AsyncData(
        AuthState(isAuthenticated: true, asociadoEstado: estado),
      );
      return true;
    } catch (e) {
      state = AsyncData(AuthState(error: e.toString()));
      return false;
    }
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.logout();
    state = const AsyncData(AuthState(isAuthenticated: false));
  }
}
