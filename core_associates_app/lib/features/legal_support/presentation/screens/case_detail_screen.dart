import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/theme/app_theme.dart';
import '../../data/models/caso_legal.dart';
import '../providers/legal_provider.dart';

class CaseDetailScreen extends ConsumerWidget {
  final String casoId;

  const CaseDetailScreen({super.key, required this.casoId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final casoAsync = ref.watch(casoDetailProvider(casoId));

    return Scaffold(
      appBar: AppBar(title: const Text('Detalle del Caso')),
      body: casoAsync.when(
        data: (caso) => _CaseDetailBody(caso: caso),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const Center(child: Text('Error al cargar el caso')),
      ),
    );
  }
}

class _CaseDetailBody extends StatelessWidget {
  final CasoLegal caso;

  const _CaseDetailBody({required this.caso});

  Color get _estadoColor {
    switch (caso.estado) {
      case 'abierto':
        return AppColors.warning;
      case 'en_atencion':
        return AppColors.primary;
      case 'escalado':
        return AppColors.error;
      case 'resuelto':
      case 'cerrado':
        return AppColors.secondary;
      case 'cancelado':
        return AppColors.textSecondary;
      default:
        return AppColors.textSecondary;
    }
  }

  Color get _prioridadColor {
    switch (caso.prioridad) {
      case 'urgente':
      case 'alta':
        return AppColors.error;
      case 'media':
        return AppColors.warning;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      caso.codigo,
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      caso.tipoPercanceLabel,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _BadgeChip(label: caso.estadoLabel, color: _estadoColor),
                  const SizedBox(height: 4),
                  _BadgeChip(
                    label: caso.prioridad.toUpperCase(),
                    color: _prioridadColor,
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Description
          if (caso.descripcion != null && caso.descripcion!.isNotEmpty) ...[
            _SectionCard(
              icon: Icons.description,
              title: 'Descripción',
              child: Text(
                caso.descripcion!,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Location
          _SectionCard(
            icon: Icons.location_on,
            title: 'Ubicación',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (caso.direccionAprox != null)
                  Text(
                    caso.direccionAprox!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                const SizedBox(height: 4),
                Text(
                  '${caso.latitud.toStringAsFixed(6)}, ${caso.longitud.toStringAsFixed(6)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Abogado
          _SectionCard(
            icon: Icons.gavel,
            title: 'Abogado asignado',
            child: caso.abogado != null
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        caso.abogado!.razonSocial,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (caso.abogado!.telefono != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          caso.abogado!.telefono!,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppColors.primary),
                        ),
                      ],
                    ],
                  )
                : Text(
                    'Pendiente de asignación',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
          ),

          const SizedBox(height: 16),

          // Dates
          _SectionCard(
            icon: Icons.calendar_today,
            title: 'Fechas',
            child: Column(
              children: [
                _DateRow(label: 'Apertura', date: caso.fechaApertura),
                if (caso.fechaCierre != null)
                  _DateRow(label: 'Cierre', date: caso.fechaCierre!),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Notes
          Text(
            'Notas (${caso.notas.length})',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),

          if (caso.notas.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                'Sin notas por el momento',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            )
          else
            ...caso.notas.map(
              (nota) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _NotaCard(nota: nota),
              ),
            ),
        ],
      ),
    );
  }
}

class _BadgeChip extends StatelessWidget {
  final String label;
  final Color color;

  const _BadgeChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;

  const _SectionCard({
    required this.icon,
    required this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
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
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _DateRow extends StatelessWidget {
  final String label;
  final String date;

  const _DateRow({required this.label, required this.date});

  @override
  Widget build(BuildContext context) {
    final parsed = DateTime.tryParse(date);
    final formatted = parsed != null
        ? '${parsed.day}/${parsed.month}/${parsed.year} ${parsed.hour.toString().padLeft(2, '0')}:${parsed.minute.toString().padLeft(2, '0')}'
        : date;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
          ),
          Text(formatted, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _NotaCard extends StatelessWidget {
  final NotaCaso nota;

  const _NotaCard({required this.nota});

  @override
  Widget build(BuildContext context) {
    final parsed = DateTime.tryParse(nota.createdAt);
    final formatted = parsed != null
        ? '${parsed.day}/${parsed.month}/${parsed.year} ${parsed.hour.toString().padLeft(2, '0')}:${parsed.minute.toString().padLeft(2, '0')}'
        : nota.createdAt;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: nota.esPrivada ? const Color(0xFFFEF9C3) : AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: nota.esPrivada ? const Color(0xFFFDE68A) : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                nota.autor?.nombre ?? 'Sistema',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
              ),
              Text(
                formatted,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(nota.contenido, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
