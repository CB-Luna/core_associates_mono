import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/auth_response.dart';
import '../models/usuario.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    api: ref.watch(apiClientProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

class AuthRepository {
  final ApiClient api;
  final SecureStorageService storage;

  AuthRepository({required this.api, required this.storage});

  /// Login con email y contraseña. Valida que el usuario sea abogado.
  Future<Usuario> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await api.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final authResponse = AuthResponse.fromJson(
        response.data as Map<String, dynamic>,
      );

      // Solo permitir abogados
      if (!authResponse.usuario.esAbogado) {
        throw ApiException(
          message: 'Esta app es exclusiva para abogados.',
          statusCode: 403,
        );
      }

      await storage.setTokens(
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );
      // Persistir datos del usuario (login es la fuente completa)
      await storage.setUserData(authResponse.usuario.toJson());

      return authResponse.usuario;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: errorMessage(e));
    }
  }

  /// Recuperar usuario desde storage (datos del login cacheados).
  Future<Usuario?> getCachedUser() async {
    final data = await storage.getUserData();
    if (data == null) return null;
    return Usuario.fromJson(data);
  }

  /// Validar que la sesión siga activa (llama /auth/me).
  Future<bool> validateSession() async {
    try {
      await api.get('/auth/me');
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Cerrar sesión.
  Future<void> logout() async {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // ignore
    } finally {
      await storage.clearAll();
    }
  }

  /// Verificar si hay sesión persistida.
  Future<bool> hasSession() => storage.hasTokens();
}
