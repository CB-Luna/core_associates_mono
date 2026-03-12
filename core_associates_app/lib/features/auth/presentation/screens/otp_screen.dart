import 'dart:async';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';

import '../../../../shared/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  final String phoneNumber;

  const OtpScreen({super.key, required this.phoneNumber});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _pinController = PinInputController();
  bool _isVerifying = false;
  int _resendSeconds = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void dispose() {
    _pinController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startResendTimer() {
    _resendSeconds = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendSeconds > 0) {
        setState(() => _resendSeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _verifyOtp(String otp) async {
    if (otp.length != 6) return;

    setState(() => _isVerifying = true);

    try {
      final success = await ref
          .read(authStateProvider.notifier)
          .verifyOtp(widget.phoneNumber, otp);

      if (!success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Código incorrecto. Intenta de nuevo.'),
            backgroundColor: AppColors.error,
          ),
        );
        _pinController.clear();
      }
      // Navigation is handled by the router redirect when auth state changes
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error de verificación: $e'),
            backgroundColor: AppColors.error,
          ),
        );
        _pinController.clear();
      }
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resendOtp() async {
    if (_resendSeconds > 0) return;
    try {
      await ref.read(authStateProvider.notifier).sendOtp(widget.phoneNumber);
      _startResendTimer();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Código reenviado')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al reenviar: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String get _maskedPhone {
    final phone = widget.phoneNumber;
    if (phone.length >= 6) {
      return '${phone.substring(0, 6)}****${phone.substring(phone.length - 2)}';
    }
    return phone;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),

              Text(
                'Verificación',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Ingresa el código de 6 dígitos enviado a\n$_maskedPhone',
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
              ),

              const SizedBox(height: 40),

              // OTP Pin fields
              MaterialPinField(
                length: 6,
                pinController: _pinController,
                autoFocus: true,
                keyboardType: TextInputType.number,
                onCompleted: _verifyOtp,
                theme: MaterialPinTheme(
                  shape: MaterialPinShape.outlined,
                  cellSize: const Size(48, 56),
                  borderRadius: BorderRadius.circular(12),
                  borderColor: AppColors.border,
                  focusedBorderColor: AppColors.primary,
                  filledBorderColor: AppColors.primary,
                  textStyle: Theme.of(context).textTheme.headlineSmall,
                ),
              ),

              const SizedBox(height: 24),

              if (_isVerifying)
                const Center(child: CircularProgressIndicator())
              else
                ElevatedButton(
                  onPressed: _pinController.text.length == 6
                      ? () => _verifyOtp(_pinController.text)
                      : null,
                  child: const Text('Verificar'),
                ),

              const SizedBox(height: 24),

              // Web: guía para ver OTP desde la app móvil + botón pegar
              if (kIsWeb) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.phone_android,
                        color: Color(0xFF6366F1),
                        size: 28,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Revisa tu app móvil',
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF6366F1),
                                  ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'El código aparecerá en la pantalla principal de Core Associates en tu teléfono.',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () async {
                    final clip = await Clipboard.getData(Clipboard.kTextPlain);
                    final text = clip?.text?.trim() ?? '';
                    if (text.length == 6 && RegExp(r'^\d{6}$').hasMatch(text)) {
                      _pinController.setText(text);
                      _verifyOtp(text);
                    } else {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'No se encontró un código de 6 dígitos en el portapapeles',
                            ),
                          ),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.content_paste),
                  label: const Text('Pegar código del portapapeles'),
                ),
              ],

              const SizedBox(height: 24),

              // Resend
              Center(
                child: _resendSeconds > 0
                    ? Text(
                        'Reenviar código en $_resendSeconds s',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      )
                    : TextButton(
                        onPressed: _resendOtp,
                        child: const Text('Reenviar código'),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
