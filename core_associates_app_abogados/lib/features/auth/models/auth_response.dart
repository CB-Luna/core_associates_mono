import 'usuario.dart';

/// Respuesta del endpoint POST /auth/login
class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final Usuario usuario;

  const AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.usuario,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      usuario: Usuario.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
