import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/features/auth/presentation/screens/otp_screen.dart';
import 'package:core_associates_app/features/auth/data/auth_repository.dart';
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

  Widget createOtpScreen({String phone = '+525512345678'}) {
    return ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(mockAuthRepo),
        apiClientProvider.overrideWithValue(mockApiClient),
        secureStorageProvider.overrideWithValue(mockStorage),
      ],
      child: MaterialApp(home: OtpScreen(phoneNumber: phone)),
    );
  }

  group('OtpScreen', () {
    testWidgets('renders verification title', (tester) async {
      await tester.pumpWidget(createOtpScreen());
      await tester.pump();

      expect(find.text('Verificación'), findsOneWidget);
    });

    testWidgets('displays masked phone number', (tester) async {
      await tester.pumpWidget(createOtpScreen(phone: '+525512345678'));
      await tester.pump();

      // _maskedPhone: "+52551****78"
      expect(find.textContaining('****'), findsOneWidget);
    });

    testWidgets('renders verify button', (tester) async {
      await tester.pumpWidget(createOtpScreen());
      await tester.pump();

      expect(find.widgetWithText(ElevatedButton, 'Verificar'), findsOneWidget);
    });

    testWidgets('shows resend countdown initially', (tester) async {
      await tester.pumpWidget(createOtpScreen());
      await tester.pump();

      // Timer starts at 60s
      expect(find.textContaining('Reenviar código en'), findsOneWidget);
    });

    testWidgets('renders back button in app bar', (tester) async {
      await tester.pumpWidget(createOtpScreen());
      await tester.pump();

      expect(find.byIcon(Icons.arrow_back), findsOneWidget);
    });

    testWidgets('shows instruction text', (tester) async {
      await tester.pumpWidget(createOtpScreen());
      await tester.pump();

      expect(
        find.textContaining('Ingresa el código de 6 dígitos'),
        findsOneWidget,
      );
    });
  });
}
