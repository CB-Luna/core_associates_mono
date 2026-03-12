import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/storage/secure_storage.dart';

// Teléfono de demo — skip SMS para no depender de Twilio
const _demoPhone = '+525512345678';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    apiClient: ref.watch(apiClientProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

class AuthRepository {
  final ApiClient apiClient;
  final SecureStorageService storage;

  AuthRepository({required this.apiClient, required this.storage});

  Future<void> sendOtp(String phoneNumber) async {
    // Demo: no llamar a Twilio para el teléfono de prueba
    if (phoneNumber == _demoPhone) return;
    await apiClient.post('/auth/otp/send', data: {'telefono': phoneNumber});
  }

  Future<void> verifyOtp(String phoneNumber, String otp) async {
    final response = await apiClient.post(
      '/auth/otp/verify',
      data: {'telefono': phoneNumber, 'otp': otp},
    );

    final data = response.data as Map<String, dynamic>;
    await storage.setTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }

  Future<void> logout() async {
    await storage.clearTokens();
  }

  Future<bool> isAuthenticated() async {
    return storage.hasTokens();
  }

  /// Consulta el OTP pendiente del asociado autenticado.
  /// Retorna `{ codigo, ttlSegundos }` o `null` si no hay token.
  Future<Map<String, dynamic>?> peekOtp() async {
    if (!await storage.hasTokens()) return null;
    final response = await apiClient.get('/auth/otp/peek');
    return response.data as Map<String, dynamic>;
  }
}
