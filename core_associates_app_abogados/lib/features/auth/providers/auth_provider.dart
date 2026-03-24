import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/usuario.dart';
import '../repository/auth_repository.dart';

// ── Estado de autenticación ────────────────────────
enum AuthStatus { initial, loading, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final Usuario? usuario;
  final String? error;

  const AuthState({this.status = AuthStatus.initial, this.usuario, this.error});

  AuthState copyWith({AuthStatus? status, Usuario? usuario, String? error}) {
    return AuthState(
      status: status ?? this.status,
      usuario: usuario ?? this.usuario,
      error: error,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
}

// ── Provider ───────────────────────────────────────
final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _tryRestoreSession();
    return const AuthState();
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  Future<void> _tryRestoreSession() async {
    final hasTokens = await _repo.hasSession();
    if (!hasTokens) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
      return;
    }
    final cached = await _repo.getCachedUser();
    if (cached != null) {
      state = state.copyWith(status: AuthStatus.authenticated, usuario: cached);
    } else {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      final usuario = await _repo.login(email: email, password: password);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        usuario: usuario,
      );
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}
