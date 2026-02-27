import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/auth/data/auth_repository.dart';
import 'package:core_associates_app/features/auth/presentation/providers/auth_provider.dart';
import '../helpers/mocks.dart';

void main() {
  group('AuthState', () {
    test('default state is not authenticated', () {
      const state = AuthState();
      expect(state.isAuthenticated, isFalse);
      expect(state.isLoading, isFalse);
      expect(state.error, isNull);
    });

    test('copyWith updates fields', () {
      const state = AuthState();
      final updated = state.copyWith(isAuthenticated: true);

      expect(updated.isAuthenticated, isTrue);
      expect(updated.isLoading, isFalse);
    });

    test('copyWith clears error when not passed', () {
      const state = AuthState(error: 'some error');
      final updated = state.copyWith(isAuthenticated: true);

      expect(updated.error, isNull);
    });
  });

  group('AuthNotifier', () {
    late MockAuthRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockAuthRepository();
    });

    tearDown(() {
      container.dispose();
    });

    ProviderContainer createContainer() {
      container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );
      return container;
    }

    test('build checks authentication state', () async {
      when(() => mockRepo.isAuthenticated()).thenAnswer((_) async => true);

      final container = createContainer();
      final state = await container.read(authStateProvider.future);

      expect(state.isAuthenticated, isTrue);
    });

    test('build returns unauthenticated when no tokens', () async {
      when(() => mockRepo.isAuthenticated()).thenAnswer((_) async => false);

      final container = createContainer();
      final state = await container.read(authStateProvider.future);

      expect(state.isAuthenticated, isFalse);
    });

    test('sendOtp delegates to repository', () async {
      when(() => mockRepo.isAuthenticated()).thenAnswer((_) async => false);
      when(() => mockRepo.sendOtp('+525512345678'))
          .thenAnswer((_) async {});

      final container = createContainer();
      // Wait for build to complete
      await container.read(authStateProvider.future);

      await container.read(authStateProvider.notifier).sendOtp('+525512345678');

      verify(() => mockRepo.sendOtp('+525512345678')).called(1);
    });

    test('verifyOtp returns true and sets authenticated on success', () async {
      when(() => mockRepo.isAuthenticated()).thenAnswer((_) async => false);
      when(() => mockRepo.verifyOtp('+525512345678', '000000'))
          .thenAnswer((_) async {});

      final container = createContainer();
      await container.read(authStateProvider.future);

      final result = await container
          .read(authStateProvider.notifier)
          .verifyOtp('+525512345678', '000000');

      expect(result, isTrue);
      final state = await container.read(authStateProvider.future);
      expect(state.isAuthenticated, isTrue);
    });

    test('verifyOtp returns false and sets error on failure', () async {
      when(() => mockRepo.isAuthenticated()).thenAnswer((_) async => false);
      when(() => mockRepo.verifyOtp('+525512345678', '999999'))
          .thenThrow(Exception('Invalid OTP'));

      final container = createContainer();
      await container.read(authStateProvider.future);

      final result = await container
          .read(authStateProvider.notifier)
          .verifyOtp('+525512345678', '999999');

      expect(result, isFalse);
      final state = await container.read(authStateProvider.future);
      expect(state.error, contains('Invalid OTP'));
    });

    test('logout clears authentication state', () async {
      when(() => mockRepo.isAuthenticated()).thenAnswer((_) async => true);
      when(() => mockRepo.logout()).thenAnswer((_) async {});

      final container = createContainer();
      await container.read(authStateProvider.future);

      await container.read(authStateProvider.notifier).logout();

      final state = await container.read(authStateProvider.future);
      expect(state.isAuthenticated, isFalse);
      verify(() => mockRepo.logout()).called(1);
    });
  });
}
