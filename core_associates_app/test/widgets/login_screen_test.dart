import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/auth/presentation/screens/login_screen.dart';
import 'package:core_associates_app/features/auth/data/auth_repository.dart';
import 'package:core_associates_app/features/auth/presentation/providers/auth_provider.dart';
import 'package:core_associates_app/core/api/api_client.dart';
import 'package:core_associates_app/core/storage/secure_storage.dart';
import '../helpers/mocks.dart';

void main() {
  late MockAuthRepository mockAuthRepo;
  late MockApiClient mockApiClient;
  late MockSecureStorageService mockStorage;

  setUp(() {
    mockAuthRepo = MockAuthRepository();
    mockApiClient = MockApiClient();
    mockStorage = MockSecureStorageService();
    when(() => mockAuthRepo.isAuthenticated()).thenAnswer((_) async => false);
  });

  Widget createLoginScreen() {
    return ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(mockAuthRepo),
        apiClientProvider.overrideWithValue(mockApiClient),
        secureStorageProvider.overrideWithValue(mockStorage),
      ],
      child: const MaterialApp(
        home: LoginScreen(),
      ),
    );
  }

  group('LoginScreen', () {
    testWidgets('renders title and subtitle', (tester) async {
      await tester.pumpWidget(createLoginScreen());
      await tester.pumpAndSettle();

      expect(find.text('Core Associates'), findsOneWidget);
      expect(find.text('Asociación de Conductores'), findsOneWidget);
    });

    testWidgets('renders phone input field', (tester) async {
      await tester.pumpWidget(createLoginScreen());
      await tester.pumpAndSettle();

      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('renders continue button', (tester) async {
      await tester.pumpWidget(createLoginScreen());
      await tester.pumpAndSettle();

      expect(find.widgetWithText(ElevatedButton, 'Continuar'), findsOneWidget);
    });

    testWidgets('shows validation error on empty phone submit', (tester) async {
      await tester.pumpWidget(createLoginScreen());
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(ElevatedButton, 'Continuar'));
      await tester.pumpAndSettle();

      // The validation message 'Ingresa tu número de teléfono' appears
      // both as the title label and as error text — expect at least 2
      expect(
        find.text('Ingresa tu número de teléfono'),
        findsAtLeast(2),
      );
    });

    testWidgets('validates short phone number', (tester) async {
      await tester.pumpWidget(createLoginScreen());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField), '551234');
      await tester.tap(find.widgetWithText(ElevatedButton, 'Continuar'));
      await tester.pumpAndSettle();

      expect(find.text('El número debe tener 10 dígitos'), findsOneWidget);
    });

    testWidgets('accepts 10-digit phone input', (tester) async {
      await tester.pumpWidget(createLoginScreen());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField), '5512345678');
      await tester.pump();

      expect(find.text('5512345678'), findsOneWidget);
    });
  });
}
