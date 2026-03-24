import 'package:dio/dio.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException({required this.message, this.statusCode, this.data});

  factory ApiException.fromDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          message: 'Tiempo de espera agotado. Verifica tu conexión.',
          statusCode: e.response?.statusCode,
        );
      case DioExceptionType.badResponse:
        final status = e.response?.statusCode ?? 0;
        final body = e.response?.data;
        String msg = 'Error del servidor';
        if (body is Map && body.containsKey('message')) {
          final raw = body['message'];
          msg = raw is List ? raw.join(', ') : raw.toString();
        }
        return ApiException(message: msg, statusCode: status, data: body);
      case DioExceptionType.cancel:
        return ApiException(message: 'Petición cancelada.');
      case DioExceptionType.connectionError:
        return ApiException(message: 'No se pudo conectar al servidor.');
      default:
        return ApiException(message: 'Error de conexión inesperado.');
    }
  }

  @override
  String toString() => 'ApiException($statusCode): $message';
}

String errorMessage(Object error) {
  if (error is ApiException) return error.message;
  if (error is DioException) {
    return ApiException.fromDioException(error).message;
  }
  return error.toString();
}
