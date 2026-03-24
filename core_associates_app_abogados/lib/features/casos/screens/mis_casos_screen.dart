import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';
import '../models/caso_legal.dart';
import '../providers/casos_providers.dart';

class MisCasosScreen extends ConsumerWidget {
  const MisCasosScreen({super.key});

  static const _filtros = <String?>[
    null,
    'asignado',
    'en_atencion',
    'escalado',
    'resuelto',
  ];

  static const _filtroLabels = [
    'Todos',
    'Asignados',
    'En atención',
    'Escalados',
    'Resueltos',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncCasos = ref.watch(misCasosProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mis Casos')),
      body: Column(
        children: [
          // ── Filtro chips ─────────────────────────────
          SizedBox(
            height: 52,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
              itemCount: _filtros.length,
              itemBuilder: (context, i) {
                // determine selected by reading notifier
                final notifier = ref.read(misCasosProvider.notifier);
                return ChoiceChip(
                  label: Text(_filtroLabels[i]),
                  selected: false, // simplified – could track state
                  onSelected: (_) => notifier.setFiltro(_filtros[i]),
                );
              },
            ),
          ),

          // ── Lista ────────────────────────────────────
          Expanded(
            child: asyncCasos.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 48,
                      color: AppColors.error,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'Error al cargar casos',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    TextButton(
                      onPressed: () =>
                          ref.read(misCasosProvider.notifier).refresh(),
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
              data: (paginated) {
                if (paginated.casos.isEmpty) {
                  return const EmptyState(
                    icon: Icons.gavel_outlined,
                    title: 'Sin casos asignados',
                    subtitle:
                        'Cuando te asignen o aceptes un caso aparecerá aquí.',
                  );
                }
                return RefreshIndicator(
                  onRefresh: () =>
                      ref.read(misCasosProvider.notifier).refresh(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    itemCount:
                        paginated.casos.length + (paginated.hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= paginated.casos.length) {
                        // load more trigger
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          ref
                              .read(misCasosProvider.notifier)
                              .load(page: paginated.page + 1);
                        });
                        return const Padding(
                          padding: EdgeInsets.all(AppSpacing.lg),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }
                      final caso = paginated.casos[index];
                      return _CasoCard(caso: caso);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CasoCard extends StatelessWidget {
  final CasoLegal caso;
  const _CasoCard({required this.caso});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fechaFmt = DateFormat('dd MMM yyyy, HH:mm', 'es_MX');

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.md),
        onTap: () => context.push('/caso/${caso.id}'),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: folio + badge
              Row(
                children: [
                  Expanded(
                    child: Text(
                      caso.codigo,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  StatusBadge(label: caso.estadoLabel),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),

              // Tipo percance
              Text(
                caso.tipoPercanceLabel,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutral600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),

              // Asociado
              if (caso.asociado != null)
                Row(
                  children: [
                    Icon(
                      Icons.person_outline,
                      size: 16,
                      color: AppColors.neutral500,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      caso.asociado!.nombreCompleto,
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),

              const SizedBox(height: AppSpacing.sm),

              // Footer: fecha + notas count
              Row(
                children: [
                  const Icon(
                    Icons.access_time,
                    size: 14,
                    color: AppColors.neutral400,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    fechaFmt.format(caso.createdAt),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral500,
                    ),
                  ),
                  const Spacer(),
                  if (caso.notasCount != null && caso.notasCount! > 0) ...[
                    const Icon(
                      Icons.comment_outlined,
                      size: 14,
                      color: AppColors.neutral400,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${caso.notasCount}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.neutral500,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
