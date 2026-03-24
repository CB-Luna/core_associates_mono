import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';
import '../models/caso_legal.dart';
import '../providers/casos_providers.dart';
import '../repository/casos_repository.dart';

class CasosDisponiblesScreen extends ConsumerWidget {
  const CasosDisponiblesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncCasos = ref.watch(casosDisponiblesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Casos Disponibles')),
      body: asyncCasos.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Error al cargar casos',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: () =>
                    ref.read(casosDisponiblesProvider.notifier).refresh(),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
        data: (paginated) {
          if (paginated.casos.isEmpty) {
            return const EmptyState(
              icon: Icons.search_off,
              title: 'Sin casos disponibles',
              subtitle:
                  'No hay casos nuevos esperando abogado en este momento.',
            );
          }
          return RefreshIndicator(
            onRefresh: () =>
                ref.read(casosDisponiblesProvider.notifier).refresh(),
            child: ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.md),
              itemCount: paginated.casos.length + (paginated.hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= paginated.casos.length) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    ref
                        .read(casosDisponiblesProvider.notifier)
                        .load(page: paginated.page + 1);
                  });
                  return const Padding(
                    padding: EdgeInsets.all(AppSpacing.lg),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                final caso = paginated.casos[index];
                return _DisponibleCard(caso: caso);
              },
            ),
          );
        },
      ),
    );
  }
}

class _DisponibleCard extends ConsumerStatefulWidget {
  final CasoLegal caso;
  const _DisponibleCard({required this.caso});

  @override
  ConsumerState<_DisponibleCard> createState() => _DisponibleCardState();
}

class _DisponibleCardState extends ConsumerState<_DisponibleCard> {
  bool _postulando = false;
  bool _yaPostulado = false;

  Future<void> _postularse() async {
    setState(() => _postulando = true);
    try {
      final repo = ref.read(casosRepositoryProvider);
      await repo.postularse(widget.caso.id);
      setState(() => _yaPostulado = true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Postulación enviada al operador'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Error al postularse')));
      }
    } finally {
      if (mounted) setState(() => _postulando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final caso = widget.caso;
    final theme = Theme.of(context);
    final fechaFmt = DateFormat('dd MMM yyyy, HH:mm', 'es_MX');

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
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
                StatusBadge(label: caso.prioridadLabel),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),

            Text(
              caso.tipoPercanceLabel,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.neutral600,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),

            if (caso.direccionAprox != null)
              Row(
                children: [
                  Icon(
                    Icons.location_on,
                    size: 16,
                    color: AppColors.neutral500,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      caso.direccionAprox!,
                      style: theme.textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),

            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Icon(Icons.access_time, size: 14, color: AppColors.neutral400),
                const SizedBox(width: 4),
                Text(
                  fechaFmt.format(caso.createdAt),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: AppColors.neutral500,
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.md),

            // Botón postularse
            SizedBox(
              width: double.infinity,
              child: _yaPostulado
                  ? OutlinedButton.icon(
                      onPressed: null,
                      icon: const Icon(Icons.check),
                      label: const Text('Postulado'),
                    )
                  : FilledButton.icon(
                      onPressed: _postulando ? null : _postularse,
                      icon: _postulando
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.handshake),
                      label: const Text('Postularme'),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
