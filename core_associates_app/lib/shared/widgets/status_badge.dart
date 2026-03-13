import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Colored badge with semantic meaning, used for estados.
class StatusBadge extends StatelessWidget {
  final String label;
  final Color? color;

  const StatusBadge({super.key, required this.label, this.color});

  factory StatusBadge.fromEstado(String estado) {
    final Color color;
    switch (estado) {
      case 'activo':
      case 'aprobado':
      case 'canjeado':
        color = AppColors.secondary;
      case 'pendiente':
        color = AppColors.warning;
      case 'rechazado':
      case 'suspendido':
      case 'baja':
      case 'cancelado':
        color = AppColors.error;
      default:
        color = AppColors.textSecondary;
    }
    return StatusBadge(label: estado, color: color);
  }

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.textSecondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: c, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label[0].toUpperCase() + label.substring(1),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: c,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
