import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/auth_repository.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) =>
      AuthState(
        isAuthenticated: isAuthenticated ?? this.isAuthenticated,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    final repo = ref.watch(authRepositoryProvider);
    final isAuth = await repo.isAuthenticated();
    return AuthState(isAuthenticated: isAuth);
  }

  Future<void> sendOtp(String phoneNumber) async {
    final repo = ref.read(authRepositoryProvider);
    await repo.sendOtp(phoneNumber);
  }

  Future<bool> verifyOtp(String phoneNumber, String otp) async {
    state = const AsyncData(AuthState(isLoading: true));
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.verifyOtp(phoneNumber, otp);
      state = const AsyncData(AuthState(isAuthenticated: true));
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
