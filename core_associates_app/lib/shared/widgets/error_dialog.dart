import 'package:flutter/material.dart';
import '../../shared/theme/app_theme.dart';

class ErrorDialog extends StatelessWidget {
  final String titulo;
  final String mensaje;
  final VoidCallback? onRetry;

  const ErrorDialog({
    super.key,
    this.titulo = 'Error',
    required this.mensaje,
    this.onRetry,
  });

  static Future<void> show(
    BuildContext context, {
    String titulo = 'Error',
    required String mensaje,
    VoidCallback? onRetry,
  }) {
    return showDialog(
      context: context,
      builder: (_) =>
          ErrorDialog(titulo: titulo, mensaje: mensaje, onRetry: onRetry),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error),
          const SizedBox(width: 8),
          Text(titulo),
        ],
      ),
      content: Text(mensaje),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cerrar'),
        ),
        if (onRetry != null)
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              onRetry!();
            },
            child: const Text('Reintentar'),
          ),
      ],
    );
  }
}
