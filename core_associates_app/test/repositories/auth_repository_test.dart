import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/auth/data/auth_repository.dart';
import '../helpers/mocks.dart';

void main() {
  late MockApiClient mockApiClient;
  late MockSecureStorageService mockStorage;
  late AuthRepository repository;

  setUp(() {
    mockApiClient = MockApiClient();
    mockStorage = MockSecureStorageService();
    repository = AuthRepository(
      apiClient: mockApiClient,
      storage: mockStorage,
    );
  });

  group('AuthRepository', () {
    group('sendOtp', () {
      test('calls apiClient.post with correct path and data', () async {
        when(() => mockApiClient.post(
              '/auth/otp/send',
              data: {'telefono': '+525512345678'},
            )).thenAnswer((_) async => Response(
              data: {'message': 'OTP sent'},
              requestOptions: RequestOptions(path: '/auth/otp/send'),
            ));

        await repository.sendOtp('+525512345678');

        verify(() => mockApiClient.post(
              '/auth/otp/send',
              data: {'telefono': '+525512345678'},
            )).called(1);
      });
    });

    group('verifyOtp', () {
      test('saves tokens on successful verification', () async {
        when(() => mockApiClient.post(
              '/auth/otp/verify',
              data: {'telefono': '+525512345678', 'otp': '000000'},
            )).thenAnswer((_) async => Response(
              data: {
                'accessToken': 'access-123',
                'refreshToken': 'refresh-456',
              },
              requestOptions: RequestOptions(path: '/auth/otp/verify'),
            ));
        when(() => mockStorage.setTokens(
              accessToken: 'access-123',
              refreshToken: 'refresh-456',
            )).thenAnswer((_) async {});

        await repository.verifyOtp('+525512345678', '000000');

        verify(() => mockStorage.setTokens(
              accessToken: 'access-123',
              refreshToken: 'refresh-456',
            )).called(1);
      });
    });

    group('logout', () {
      test('clears tokens', () async {
        when(() => mockStorage.clearTokens()).thenAnswer((_) async {});

        await repository.logout();

        verify(() => mockStorage.clearTokens()).called(1);
      });
    });

    group('isAuthenticated', () {
      test('returns true when tokens exist', () async {
        when(() => mockStorage.hasTokens()).thenAnswer((_) async => true);

        final result = await repository.isAuthenticated();

        expect(result, isTrue);
      });

      test('returns false when no tokens', () async {
        when(() => mockStorage.hasTokens()).thenAnswer((_) async => false);

        final result = await repository.isAuthenticated();

        expect(result, isFalse);
      });
    });
  });
}
