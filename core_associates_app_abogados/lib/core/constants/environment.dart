class Environment {
  Environment._();

  static const String name = String.fromEnvironment('ENV', defaultValue: 'dev');
  static const String apiUrl = String.fromEnvironment('API_URL');

  static bool get isProduction => name == 'prod';
  static bool get isDevelopment => name == 'dev';
}
