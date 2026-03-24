import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Badge de estado para casos legales.
class StatusBadge extends StatelessWidget {
  final String label;
  final Color? color;

  const StatusBadge({super.key, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final badgeColor = color ?? _colorForStatus(label);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: badgeColor,
        ),
      ),
    );
  }

  static Color _colorForStatus(String status) {
    switch (status.toLowerCase()) {
      case 'nuevo':
      case 'disponible':
        return AppColors.info;
      case 'asignado':
      case 'en_atencion':
      case 'en atención':
        return AppColors.warning;
      case 'resuelto':
      case 'cerrado':
        return AppColors.success;
      case 'escalado':
        return AppColors.error;
      case 'cancelado':
        return AppColors.textSecondary;
      default:
        return AppColors.textSecondary;
    }
  }
}
