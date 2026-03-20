import 'package:flutter/material.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../data/models/documento.dart';

/// Shows the overall document verification progress for the asociado.
/// Steps: Subidos → En revisión → Aprobados
class DocumentProgress extends StatelessWidget {
  final List<Documento> documents;
  final int requiredCount;

  const DocumentProgress({
    super.key,
    required this.documents,
    this.requiredCount = 4,
  });

  @override
  Widget build(BuildContext context) {
    final uploaded = documents.length;
    final enRevision = documents.where((d) => d.estado == 'pendiente').length;
    final approved = documents.where((d) => d.estado == 'aprobado').length;
    final rejected = documents.where((d) => d.estado == 'rechazado').length;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.fact_check_outlined,
                size: 20,
                color: AppColors.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'Progreso de Verificación',
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Progress bar — aprobados cuentan 100%, pendientes 50%
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: requiredCount > 0
                  ? ((approved + enRevision * 0.5) / requiredCount).clamp(
                      0.0,
                      1.0,
                    )
                  : 0,
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(
                approved == requiredCount
                    ? AppColors.secondary
                    : AppColors.primary,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Step indicators
          Row(
            children: [
              _StepBadge(
                icon: Icons.cloud_upload,
                label: 'Subidos',
                count: '$uploaded/$requiredCount',
                active: uploaded > 0,
                done: uploaded >= requiredCount,
              ),
              const _StepArrow(),
              _StepBadge(
                icon: Icons.hourglass_top,
                label: 'En revisión',
                count: '$enRevision',
                active: enRevision > 0,
                done: enRevision == 0 && uploaded > 0,
              ),
              const _StepArrow(),
              _StepBadge(
                icon: Icons.verified,
                label: 'Aprobados',
                count: '$approved/$requiredCount',
                active: approved > 0,
                done: approved >= requiredCount,
              ),
            ],
          ),

          if (rejected > 0) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber, size: 14, color: AppColors.error),
                  const SizedBox(width: 6),
                  Text(
                    '$rejected documento(s) rechazado(s) — resubir para continuar',
                    style: TextStyle(fontSize: 11, color: AppColors.error),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StepBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final String count;
  final bool active;
  final bool done;

  const _StepBadge({
    required this.icon,
    required this.label,
    required this.count,
    required this.active,
    required this.done,
  });

  @override
  Widget build(BuildContext context) {
    final color = done
        ? AppColors.secondary
        : active
        ? AppColors.primary
        : Colors.grey.shade400;

    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          Text(
            count,
            style: TextStyle(fontSize: 10, color: color.withValues(alpha: 0.7)),
          ),
        ],
      ),
    );
  }
}

class _StepArrow extends StatelessWidget {
  const _StepArrow();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Icon(
        Icons.arrow_forward_ios,
        size: 12,
        color: Colors.grey.shade300,
      ),
    );
  }
}
