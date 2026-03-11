import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/app_constants.dart';
import '../network/api_exception.dart';
import '../storage/secure_storage.dart';

/// Global key for showing SnackBars from outside the widget tree (Dio interceptor).
final rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage: storage);
});

class ApiClient {
  late final Dio _dio;
  final SecureStorageService storage;

  /// Called when a 401 cannot be recovered via refresh token.
  /// Wire this to auth logout so GoRouter redirects to /login.
  VoidCallback? onSessionExpired;

  ApiClient({required this.storage}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: AppConstants.connectionTimeout,
        receiveTimeout: AppConstants.apiTimeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await storage.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            final refreshed = await _refreshToken();
            if (refreshed) {
              final retryResponse = await _retry(error.requestOptions);
              return handler.resolve(retryResponse);
            } else {
              onSessionExpired?.call();
              handler.reject(
                DioException(
                  requestOptions: error.requestOptions,
                  error: 'session_expired',
                  type: DioExceptionType.unknown,
                ),
              );
              return;
            }
          }
          _showGlobalError(error);
          handler.next(error);
        },
      ),
    );
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await storage.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await Dio().post(
        '${AppConstants.apiBaseUrl}${AppConstants.apiPrefix}/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      final newAccessToken = response.data['accessToken'] as String;
      await storage.setAccessToken(newAccessToken);
      return true;
    } catch (_) {
      await storage.clearTokens();
      return false;
    }
  }

  Future<Response<dynamic>> _retry(RequestOptions requestOptions) {
    return _dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: Options(
        method: requestOptions.method,
        headers: requestOptions.headers,
      ),
    );
  }

  void _showGlobalError(DioException error) {
    final show = switch (error.type) {
      DioExceptionType.connectionTimeout => true,
      DioExceptionType.sendTimeout => true,
      DioExceptionType.receiveTimeout => true,
      DioExceptionType.connectionError => true,
      _ => false,
    };
    if (!show) return;
    final message = ApiException.fromDioException(error).message;
    rootScaffoldMessengerKey.currentState
      ?..removeCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 4),
        ),
      );
  }

  String _prefixed(String path) => '${AppConstants.apiPrefix}$path';

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) => _dio.get<T>(_prefixed(path), queryParameters: queryParameters);

  Future<Response<T>> post<T>(String path, {dynamic data}) =>
      _dio.post<T>(_prefixed(path), data: data);

  Future<Response<T>> put<T>(String path, {dynamic data}) =>
      _dio.put<T>(_prefixed(path), data: data);

  Future<Response<T>> patch<T>(String path, {dynamic data}) =>
      _dio.patch<T>(_prefixed(path), data: data);

  Future<Response<T>> delete<T>(String path) => _dio.delete<T>(_prefixed(path));

  /// Build full URL for an API image endpoint (for CachedNetworkImage).
  String imageUrl(String path) =>
      '${AppConstants.apiBaseUrl}${_prefixed(path)}';

  /// Get current auth headers for image loading.
  Future<Map<String, String>> get authHeaders async {
    final token = await storage.getAccessToken();
    if (token == null) return {};
    return {'Authorization': 'Bearer $token'};
  }

  Future<Response<T>> uploadFile<T>(
    String path, {
    required String filePath,
    required String fieldName,
    Map<String, dynamic>? fields,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath),
      if (fields != null) ...fields,
    });
    return _dio.post<T>(
      _prefixed(path),
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
        receiveTimeout: const Duration(seconds: 60),
      ),
    );
  }
}
