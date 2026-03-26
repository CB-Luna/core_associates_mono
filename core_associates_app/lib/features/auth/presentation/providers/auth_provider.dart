import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../documents/presentation/providers/documents_provider.dart';
import '../../../legal_support/presentation/providers/legal_provider.dart';
import '../../../profile/data/profile_repository.dart';
import '../../../profile/presentation/providers/profile_provider.dart';
import '../../../promotions/presentation/providers/promotions_provider.dart';
import '../../data/auth_repository.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;
  final String? asociadoEstado;
  final String? motivoRechazo;
  final bool profileIncomplete;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
    this.asociadoEstado,
    this.motivoRechazo,
    this.profileIncomplete = false,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    String? asociadoEstado,
    String? motivoRechazo,
    bool? profileIncomplete,
  }) => AuthState(
    isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    isLoading: isLoading ?? this.isLoading,
    error: error,
    asociadoEstado: asociadoEstado ?? this.asociadoEstado,
    motivoRechazo: motivoRechazo ?? this.motivoRechazo,
    profileIncomplete: profileIncomplete ?? this.profileIncomplete,
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
      final missingBasicProfile =
          asociado.nombre.isEmpty || asociado.apellidoPat.isEmpty;
      // Onboarding requires selfie (fotoUrl) + at least 1 vehicle
      final missingSelfie =
          asociado.fotoUrl == null || asociado.fotoUrl!.isEmpty;
      final missingVehicle = asociado.vehiculos.isEmpty;
      final incomplete = missingBasicProfile || missingSelfie || missingVehicle;
      return AuthState(
        isAuthenticated: true,
        asociadoEstado: asociado.estado,
        profileIncomplete: incomplete,
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
      bool incomplete = false;
      try {
        final profileRepo = ref.read(profileRepositoryProvider);
        final asociado = await profileRepo.getMyProfile();
        estado = asociado.estado;
        final missingBasicProfile =
            asociado.nombre.isEmpty || asociado.apellidoPat.isEmpty;
        final missingSelfie =
            asociado.fotoUrl == null || asociado.fotoUrl!.isEmpty;
        final missingVehicle = asociado.vehiculos.isEmpty;
        incomplete = missingBasicProfile || missingSelfie || missingVehicle;
      } catch (_) {
        // Profile fetch failed — allow entry, estado will be checked later
      }

      state = AsyncData(
        AuthState(
          isAuthenticated: true,
          asociadoEstado: estado,
          profileIncomplete: incomplete,
        ),
      );
      return true;
    } catch (e) {
      state = AsyncData(AuthState(error: e.toString()));
      return false;
    }
  }

  /// Marca el perfil como completo (tras guardar edit-profile en onboarding)
  void markProfileComplete() {
    final current = state.value;
    if (current != null) {
      state = AsyncData(current.copyWith(profileIncomplete: false));
    }
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.logout();

    // Limpiar todo el estado de la sesión anterior
    ref.invalidate(profileProvider);
    ref.invalidate(fotoUrlProvider);
    ref.invalidate(vehiculosProvider);
    ref.invalidate(documentsProvider);
    ref.invalidate(promocionesProvider);
    ref.invalidate(misCuponesProvider);
    ref.invalidate(misCasosProvider);

    state = const AsyncData(AuthState(isAuthenticated: false));
  }
}
