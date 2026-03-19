import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/profile/presentation/providers/profile_provider.dart';
import '../theme/app_theme.dart';

/// Returns `true` if the asociado is NOT activo (blocked).
/// Shows an informative dialog with contextual CTA when blocked.
bool checkKycBlocked(BuildContext context, WidgetRef ref) {
  final profileAsync = ref.read(profileProvider);
  final estado = profileAsync.value?.estado;

  if (estado == null || estado == 'activo') return false;

  showKycBlockedDialog(context, estado);
  return true;
}

/// Shows a dialog explaining why the action is blocked due to KYC status.
void showKycBlockedDialog(BuildContext context, String estado) {
  final IconData icon;
  final String title;
  final String message;
  final Color color;
  final bool showDocumentsButton;

  switch (estado) {
    case 'pendiente':
      icon = Icons.upload_file;
      title = 'Completa tu expediente';
      message =
          'Tu cuenta está pendiente de aprobación. Sube tus documentos para activar tu membresía.';
      color = AppColors.warning;
      showDocumentsButton = true;
    case 'rechazado':
      icon = Icons.error_outline;
      title = 'Cuenta rechazada';
      message =
          'Tu cuenta ha sido rechazada. Revisa y vuelve a subir tus documentos.';
      color = AppColors.error;
      showDocumentsButton = true;
    case 'suspendido':
      icon = Icons.pause_circle_outline;
      title = 'Cuenta suspendida';
      message =
          'Tu membresía ha sido suspendida. Contacta a soporte para más información.';
      color = const Color(0xFF64748B);
      showDocumentsButton = false;
    default:
      icon = Icons.block;
      title = 'Cuenta no activa';
      message = 'Tu cuenta no está activa. Contacta a soporte.';
      color = const Color(0xFF64748B);
      showDocumentsButton = false;
  }

  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      icon: Icon(icon, size: 48, color: color),
      title: Text(title),
      content: Text(message, textAlign: TextAlign.center),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        if (showDocumentsButton) ...[
          FilledButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              context.push('/documents');
            },
            icon: const Icon(Icons.upload_file, size: 18),
            label: const Text('Subir documentos'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Después'),
          ),
        ] else
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Entendido'),
          ),
      ],
    ),
  );
}

/// Returns `true` if the message is a KYC-related 403 from the server.
bool isKycBlockedMessage(String message) {
  return message.contains('pendiente de aprobación') ||
      message.contains('ha sido suspendida') ||
      message.contains('ha sido rechazada') ||
      message.contains('no está activa');
}

/// Infers the asociado estado from a KYC 403 server message.
String estadoFromKycMessage(String message) {
  if (message.contains('pendiente de aprobación')) return 'pendiente';
  if (message.contains('ha sido suspendida')) return 'suspendido';
  if (message.contains('ha sido rechazada')) return 'rechazado';
  return 'baja';
}
