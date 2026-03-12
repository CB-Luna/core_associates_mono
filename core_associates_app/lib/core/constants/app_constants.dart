import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show Platform;

import 'environment.dart';

abstract class AppConstants {
  static const String appName = 'Core Associates';

  static String get apiBaseUrl {
    // If API_URL is provided via --dart-define, use it
    if (Environment.apiUrl.isNotEmpty) {
      return Environment.apiUrl;
    }
    const port = '3501';
    // Web uses localhost directly
    if (kIsWeb) {
      return 'http://localhost:$port';
    }
    // Android emulator uses 10.0.2.2 to reach host localhost
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:$port';
    }
    return 'http://localhost:$port';
  }

  static const String apiPrefix = '/api/v1';

  // OTP
  static const int otpLength = 6;
  static const int otpExpirationMinutes = 5;

  // Storage keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration connectionTimeout = Duration(seconds: 15);
}
