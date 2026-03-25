import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/api/api_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_badge.dart';
import '../models/caso_legal.dart';
import '../providers/casos_providers.dart';

class MisCasosScreen extends ConsumerStatefulWidget {
  const MisCasosScreen({super.key});

  @override
  ConsumerState<MisCasosScreen> createState() => _MisCasosScreenState();
}

class _MisCasosScreenState extends ConsumerState<MisCasosScreen> {
  int _selectedFilter = 0;

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

  Future<void> _pickDateRange() async {
    final notifier = ref.read(misCasosProvider.notifier);
    final now = DateTime.now();
    final initial = (notifier.fechaDesde != null && notifier.fechaHasta != null)
        ? DateTimeRange(
            start: DateTime.parse(notifier.fechaDesde!),
            end: DateTime.parse(notifier.fechaHasta!),
          )
        : DateTimeRange(
            start: now.subtract(const Duration(days: 30)),
            end: now,
          );

    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2024),
      lastDate: now,
      initialDateRange: initial,
      locale: const Locale('es', 'MX'),
      helpText: 'Filtrar por fecha de apertura',
      saveText: 'Aplicar',
    );

    if (picked != null) {
      final fmt = DateFormat('yyyy-MM-dd');
      notifier.setDateRange(fmt.format(picked.start), fmt.format(picked.end));
    }
  }

  void _clearDateRange() {
    ref.read(misCasosProvider.notifier).setDateRange(null, null);
  }

  @override
  Widget build(BuildContext context) {
    final asyncCasos = ref.watch(misCasosProvider);
    final notifier = ref.read(misCasosProvider.notifier);
    final hasDateFilter = notifier.fechaDesde != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Casos'),
        actions: [
          IconButton(
            icon: Icon(
              hasDateFilter ? Icons.date_range : Icons.date_range_outlined,
              color: hasDateFilter ? AppColors.primaryLight : null,
            ),
            tooltip: 'Filtrar por fecha',
            onPressed: _pickDateRange,
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Date range indicator ─────────────────────
          if (hasDateFilter)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.xs,
              ),
              color: AppColors.primaryLight.withValues(alpha: 0.08),
              child: Row(
                children: [
                  const Icon(
                    Icons.date_range,
                    size: 16,
                    color: AppColors.primaryLight,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Expanded(
                    child: Text(
                      '${notifier.fechaDesde}  →  ${notifier.fechaHasta}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.primaryLight,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: _clearDateRange,
                    child: const Icon(
                      Icons.close,
                      size: 18,
                      color: AppColors.neutral500,
                    ),
                  ),
                ],
              ),
            ),

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
                final isSelected = _selectedFilter == i;
                return ChoiceChip(
                  label: Text(
                    _filtroLabels[i],
                    style: TextStyle(
                      color: isSelected ? Colors.white : AppColors.neutral600,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                  ),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.neutral200,
                  onSelected: (_) {
                    setState(() => _selectedFilter = i);
                    ref.read(misCasosProvider.notifier).setFiltro(_filtros[i]);
                  },
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

class _CasoCard extends ConsumerStatefulWidget {
  final CasoLegal caso;
  const _CasoCard({required this.caso});

  @override
  ConsumerState<_CasoCard> createState() => _CasoCardState();
}

class _CasoCardState extends ConsumerState<_CasoCard> {
  String? _token;

  @override
  void initState() {
    super.initState();
    final asociado = widget.caso.asociado;
    if (asociado?.id != null && asociado?.fotoUrl != null) {
      ref.read(apiClientProvider).getAccessToken().then((t) {
        if (mounted) setState(() => _token = t);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final caso = widget.caso;
    final api = ref.watch(apiClientProvider);
    final theme = Theme.of(context);
    final fechaFmt = DateFormat('dd MMM yyyy, HH:mm', 'es_MX');
    final hasFoto =
        caso.asociado?.id != null &&
        caso.asociado?.fotoUrl != null &&
        _token != null;

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
              // Header: código + badge
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
              const SizedBox(height: AppSpacing.sm),

              // Tipo percance con icono
              Row(
                children: [
                  Icon(
                    _iconoPercance(caso.tipoPercance),
                    size: 16,
                    color: AppColors.primaryLight,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    caso.tipoPercanceLabel,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.neutral600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),

              // Asociado con avatar
              if (caso.asociado != null)
                Container(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: AppColors.primaryLight.withValues(
                          alpha: 0.15,
                        ),
                        backgroundImage: hasFoto
                            ? NetworkImage(
                                api.asociadoFotoUrl(caso.asociado!.id!),
                                headers: {'Authorization': 'Bearer $_token'},
                              )
                            : null,
                        onBackgroundImageError: hasFoto ? (_, __) {} : null,
                        child: !hasFoto
                            ? Text(
                                _iniciales(caso.asociado!.nombreCompleto),
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primaryLight,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              caso.asociado!.nombreCompleto,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (caso.asociado!.telefono != null)
                              Text(
                                caso.asociado!.telefono!,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: AppColors.neutral500,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: AppSpacing.sm),

              // Footer: fecha + notas count + dirección
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
              if (caso.direccionAprox != null) ...[
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 14,
                      color: AppColors.neutral400,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        caso.direccionAprox!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral500,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _iniciales(String nombre) {
    final parts = nombre.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) {
      return parts[0][0].toUpperCase();
    }
    return '?';
  }

  IconData _iconoPercance(String tipo) {
    switch (tipo) {
      case 'accidente':
        return Icons.car_crash_outlined;
      case 'infraccion':
        return Icons.receipt_long_outlined;
      case 'robo':
        return Icons.local_police_outlined;
      case 'asalto':
        return Icons.warning_amber_rounded;
      default:
        return Icons.gavel_outlined;
    }
  }
}
