import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_constants.dart';
import '../network/api_exception.dart';
import '../storage/secure_storage.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage: storage);
});

/// Key global para mostrar SnackBars desde cualquier parte de la app.
final rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

class ApiClient {
  final SecureStorageService storage;
  late final Dio _dio;
  Completer<String>? _refreshCompleter;

  ApiClient({required this.storage}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: '${AppConstants.apiBaseUrl}${AppConstants.apiPrefix}',
        receiveTimeout: AppConstants.receiveTimeout,
        connectTimeout: AppConstants.connectTimeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            try {
              final newToken = await _refreshToken();
              error.requestOptions.headers['Authorization'] =
                  'Bearer $newToken';
              final retryResponse = await _dio.fetch(error.requestOptions);
              return handler.resolve(retryResponse);
            } catch (_) {
              await storage.clearAll();
              _showError('Sesión expirada. Inicia sesión nuevamente.');
              return handler.reject(error);
            }
          }
          _showGlobalError(error);
          handler.next(error);
        },
      ),
    );
  }

  // ── Token refresh (singleton) ────────────────────
  Future<String> _refreshToken() async {
    if (_refreshCompleter != null) return _refreshCompleter!.future;
    _refreshCompleter = Completer<String>();
    try {
      final refreshToken = await storage.getRefreshToken();
      if (refreshToken == null) throw Exception('No refresh token');
      final response = await Dio().post(
        '${AppConstants.apiBaseUrl}${AppConstants.apiPrefix}/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final newAccess = response.data['accessToken'] as String;
      final newRefresh = response.data['refreshToken'] as String;
      await storage.setTokens(accessToken: newAccess, refreshToken: newRefresh);
      _refreshCompleter!.complete(newAccess);
      return newAccess;
    } catch (e) {
      _refreshCompleter!.completeError(e);
      rethrow;
    } finally {
      _refreshCompleter = null;
    }
  }

  // ── HTTP shortcuts ───────────────────────────────
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => _dio.get(path, queryParameters: queryParameters, options: options);

  Future<Response<T>> post<T>(String path, {dynamic data, Options? options}) =>
      _dio.post(path, data: data, options: options);

  Future<Response<T>> put<T>(String path, {dynamic data, Options? options}) =>
      _dio.put(path, data: data, options: options);

  Future<Response<T>> patch<T>(String path, {dynamic data, Options? options}) =>
      _dio.patch(path, data: data, options: options);

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Options? options,
  }) => _dio.delete(path, data: data, options: options);

  // ── File upload ──────────────────────────────────
  Future<Response<T>> uploadFile<T>(
    String path, {
    required String filePath,
    String fieldName = 'archivo',
    Map<String, dynamic>? extra,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath),
      if (extra != null) ...extra,
    });
    return _dio.post(path, data: formData);
  }

  // ── Image URL helper ─────────────────────────────
  String imageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '${AppConstants.apiBaseUrl}$path';
  }

  // ── Error presentation ───────────────────────────
  void _showGlobalError(DioException error) {
    if (error.response?.statusCode == 401) return; // handled above
    final apiError = ApiException.fromDioException(error);
    _showError(apiError.message);
  }

  void _showError(String message) {
    rootScaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
