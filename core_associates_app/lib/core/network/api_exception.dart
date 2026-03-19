import 'package:dio/dio.dart';

class ApiException {
  final String message;
  final int? statusCode;

  const ApiException({required this.message, this.statusCode});

  static ApiException fromDioException(DioException e) {
    if (e.error == 'session_expired') {
      return const ApiException(
        message: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
        statusCode: 401,
      );
    }

    if (e.error == 'kyc_blocked') {
      return const ApiException(message: '', statusCode: 403);
    }

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const ApiException(
          message: 'Tiempo de espera agotado. Verifica tu conexión.',
        );
      case DioExceptionType.connectionError:
        return const ApiException(
          message: 'Sin conexión al servidor. Verifica tu internet.',
        );
      case DioExceptionType.badResponse:
        return _fromResponse(e.response);
      default:
        return const ApiException(message: 'Ocurrió un error inesperado.');
    }
  }

  static ApiException _fromResponse(Response<dynamic>? response) {
    final statusCode = response?.statusCode;
    final data = response?.data;

    String message = 'Error del servidor';
    if (data is Map<String, dynamic>) {
      final msg = data['message'];
      if (msg is String) {
        message = msg;
      } else if (msg is List) {
        message = msg.join('. ');
      }
    }

    return ApiException(message: message, statusCode: statusCode);
  }

  @override
  String toString() => message;
}

/// Extrae un mensaje legible de cualquier error, priorizando [ApiException].
String errorMessage(Object error) {
  if (error is ApiException) return error.message;
  if (error is DioException) {
    return ApiException.fromDioException(error).message;
  }
  return 'Ocurrió un error inesperado.';
}
