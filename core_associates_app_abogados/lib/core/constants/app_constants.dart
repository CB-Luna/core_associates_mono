import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'environment.dart';

class AppConstants {
  AppConstants._();

  // ── API ──────────────────────────────────────────
  static String get apiBaseUrl {
    if (Environment.apiUrl.isNotEmpty) return Environment.apiUrl;
    if (kIsWeb) return ''; // relative path on web
    if (Platform.isAndroid) return 'http://10.0.2.2:3501';
    return 'http://localhost:3501';
  }

  static const String apiPrefix = '/api/v1';

  // ── Timeouts ─────────────────────────────────────
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration connectTimeout = Duration(seconds: 15);

  // ── Storage keys ─────────────────────────────────
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';

  // ── App info ─────────────────────────────────────
  static const String appName = 'Core Abogados';
}
