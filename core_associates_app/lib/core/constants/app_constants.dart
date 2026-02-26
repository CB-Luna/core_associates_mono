import 'dart:io' show Platform;

abstract class AppConstants {
  static const String appName = 'Core Associates';

  static String get apiBaseUrl {
    const port = '3501';
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
