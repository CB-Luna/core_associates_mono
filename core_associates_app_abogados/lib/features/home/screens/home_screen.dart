import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/casos/providers/casos_providers.dart';
import '../../../features/casos/models/caso_legal.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../notificaciones/providers/notificaciones_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? _token;

  @override
  void initState() {
    super.initState();
    ref.read(apiClientProvider).getAccessToken().then((t) {
      if (mounted) setState(() => _token = t);
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final nombre = authState.usuario?.nombre ?? 'Abogado';
    final usuario = authState.usuario;
    final asyncCasos = ref.watch(misCasosProvider);
    final api = ref.watch(apiClientProvider);
    final hasAvatar =
        usuario != null && usuario.avatarUrl != null && _token != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inicio'),
        actions: [_NotificationBell()],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(misCasosProvider.notifier).refresh(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Saludo con avatar ──
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    gradient: AppGradients.header,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: Colors.white24,
                        backgroundImage: hasAvatar
                            ? NetworkImage(
                                api.userAvatarUrl(usuario.id),
                                headers: {'Authorization': 'Bearer $_token'},
                              )
                            : null,
                        onBackgroundImageError: hasAvatar ? (_, __) {} : null,
                        child: !hasAvatar
                            ? const Icon(
                                Icons.gavel_rounded,
                                size: 28,
                                color: Colors.white,
                              )
                            : null,
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hola, $nombre',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            const Text(
                              'Panel de asistencia legal',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.lg),

                // ── Stats ──
                const Text(
                  'Resumen',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                asyncCasos.when(
                  loading: () => _buildStatsPlaceholder(),
                  error: (_, __) => _buildStatsPlaceholder(),
                  data: (paginated) => _buildStatsFromCasos(paginated.casos),
                ),

                const SizedBox(height: AppSpacing.lg),

                // ── Últimos casos ──
                const Text(
                  'Casos recientes',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                asyncCasos.when(
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(AppSpacing.xl),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  error: (_, __) => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(AppSpacing.xl),
                      child: Text(
                        'Error al cargar casos',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    ),
                  ),
                  data: (paginated) {
                    if (paginated.casos.isEmpty) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Column(
                          children: [
                            Icon(
                              Icons.gavel_outlined,
                              size: 40,
                              color: AppColors.neutral400,
                            ),
                            SizedBox(height: AppSpacing.sm),
                            Text(
                              'Sin casos asignados',
                              style: TextStyle(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      );
                    }
                    final recientes = paginated.casos.take(3).toList();
                    return Column(
                      children: recientes
                          .map((caso) => _RecentCasoCard(caso: caso))
                          .toList(),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatsPlaceholder() {
    return Column(
      children: [
        _buildStatRow([
          _StatCard(
            label: 'Asignados',
            value: '—',
            icon: Icons.assignment_outlined,
            color: AppColors.info,
          ),
          _StatCard(
            label: 'En atención',
            value: '—',
            icon: Icons.pending_actions_rounded,
            color: AppColors.warning,
          ),
        ]),
        const SizedBox(height: AppSpacing.sm),
        _buildStatRow([
          _StatCard(
            label: 'Resueltos',
            value: '—',
            icon: Icons.check_circle_outline,
            color: AppColors.success,
          ),
          _StatCard(
            label: 'Escalados',
            value: '—',
            icon: Icons.warning_amber_rounded,
            color: AppColors.error,
          ),
        ]),
      ],
    );
  }

  Widget _buildStatsFromCasos(List<CasoLegal> casos) {
    int asignados = 0, enAtencion = 0, resueltos = 0, escalados = 0;
    for (final c in casos) {
      switch (c.estado) {
        case 'abierto':
        case 'asignado':
          asignados++;
        case 'en_atencion':
          enAtencion++;
        case 'resuelto':
          resueltos++;
        case 'escalado':
          escalados++;
      }
    }
    return Column(
      children: [
        _buildStatRow([
          _StatCard(
            label: 'Asignados',
            value: '$asignados',
            icon: Icons.assignment_outlined,
            color: AppColors.info,
          ),
          _StatCard(
            label: 'En atención',
            value: '$enAtencion',
            icon: Icons.pending_actions_rounded,
            color: AppColors.warning,
          ),
        ]),
        const SizedBox(height: AppSpacing.sm),
        _buildStatRow([
          _StatCard(
            label: 'Resueltos',
            value: '$resueltos',
            icon: Icons.check_circle_outline,
            color: AppColors.success,
          ),
          _StatCard(
            label: 'Escalados',
            value: '$escalados',
            icon: Icons.warning_amber_rounded,
            color: AppColors.error,
          ),
        ]),
      ],
    );
  }

  Widget _buildStatRow(List<Widget> cards) {
    return Row(
      children: cards
          .map(
            (card) => Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: card,
              ),
            ),
          )
          .toList(),
    );
  }
}

// ── Tarjeta de caso reciente en Home ──

class _RecentCasoCard extends StatelessWidget {
  final CasoLegal caso;
  const _RecentCasoCard({required this.caso});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fechaFmt = DateFormat('dd MMM, HH:mm', 'es_MX');

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.md),
        onTap: () => context.push('/caso/${caso.id}'),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              // Icono tipo percance
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(
                  _iconoPercance(caso.tipoPercance),
                  color: AppColors.primaryLight,
                  size: 22,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            caso.codigo,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        StatusBadge(label: caso.estadoLabel),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      caso.tipoPercanceLabel,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.neutral600,
                      ),
                    ),
                    if (caso.asociado != null)
                      Text(
                        caso.asociado!.nombreCompleto,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral500,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                fechaFmt.format(caso.createdAt),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: AppColors.neutral400,
                ),
              ),
            ],
          ),
        ),
      ),
    );
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

// ── Badge de notificaciones no leídas ──

class _NotificationBell extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(notificacionesNoLeidasProvider);
    return IconButton(
      icon: Badge(
        isLabelVisible: count > 0,
        label: Text(
          count > 99 ? '99+' : '$count',
          style: const TextStyle(fontSize: 10),
        ),
        child: const Icon(Icons.notifications_outlined),
      ),
      onPressed: () {
        if (count > 0) {
          ref.read(notificacionesNoLeidasProvider.notifier).marcarTodasLeidas();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Notificaciones marcadas como leídas'),
              duration: Duration(seconds: 2),
            ),
          );
        }
      },
    );
  }
}

// ── Tarjeta de estadística ──

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
