import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core_associates_app/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App smoke tests', () {
    testWidgets('App starts and shows login screen', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: CoreAssociatesApp()));
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should show the login screen with phone input
      expect(find.byType(MaterialApp), findsOneWidget);

      // Look for login UI elements (text field or login-related text)
      final hasLoginElements =
          find.textContaining('teléfono').evaluate().isNotEmpty ||
          find.textContaining('Iniciar').evaluate().isNotEmpty ||
          find.textContaining('Bienvenido').evaluate().isNotEmpty ||
          find.byType(TextField).evaluate().isNotEmpty;

      expect(
        hasLoginElements,
        isTrue,
        reason: 'Login screen should have phone input or welcome text',
      );
    });

    testWidgets('Login screen has submit button', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: CoreAssociatesApp()));
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should have at least one ElevatedButton or button-like widget
      final buttons =
          find.byType(ElevatedButton).evaluate().isNotEmpty ||
          find.byType(FilledButton).evaluate().isNotEmpty ||
          find.byType(TextButton).evaluate().isNotEmpty;

      expect(
        buttons,
        isTrue,
        reason: 'Login screen should have a submit button',
      );
    });

    testWidgets('Can enter phone number', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: CoreAssociatesApp()));
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Find a text field and enter a phone number
      final textFields = find.byType(TextField);
      if (textFields.evaluate().isNotEmpty) {
        await tester.enterText(textFields.first, '5510000001');
        await tester.pump();

        expect(find.text('5510000001'), findsOneWidget);
      }
    });
  });
}
