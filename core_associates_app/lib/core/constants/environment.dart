abstract class Environment {
  static const String name = String.fromEnvironment('ENV', defaultValue: 'dev');

  static bool get isDev => name == 'dev';
  static bool get isProd => name == 'prod';

  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: '',
  );
}
