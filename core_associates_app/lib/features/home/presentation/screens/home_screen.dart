import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/api/api_client.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../profile/presentation/providers/profile_provider.dart';
import '../../../promotions/presentation/providers/promotions_provider.dart';
import '../../../promotions/data/models/promocion.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);
    final promosAsync = ref.watch(promocionesProvider);
    final imgHeaders = ref.watch(authHeadersProvider).value ?? {};

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            profileAsync.when(
              data: (asociado) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    asociado != null && asociado.nombre.isNotEmpty
                        ? 'Hola, ${asociado.nombre}'
                        : 'Bienvenido',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Core Associates',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              loading: () => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bienvenido',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Core Associates',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              error: (_, _) => Text(
                'Bienvenido',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Membership card
            _MembershipCard(),

            const SizedBox(height: 16),

            // KYC banner
            _KycBanner(),

            const SizedBox(height: 24),

            // Quick actions
            Text(
              'Acceso Rápido',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _QuickAction(
                    icon: Icons.local_offer_outlined,
                    label: 'Mis Cupones',
                    color: AppColors.primary,
                    onTap: () => context.push('/my-coupons'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickAction(
                    icon: Icons.description_outlined,
                    label: 'Documentos',
                    color: AppColors.secondary,
                    onTap: () => context.push('/documents'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _QuickAction(
                    icon: Icons.directions_car_outlined,
                    label: 'Vehículos',
                    color: AppColors.warning,
                    onTap: () => context.push('/vehicles'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickAction(
                    icon: Icons.warning_amber_rounded,
                    label: 'SOS Legal',
                    color: AppColors.error,
                    onTap: () => context.go('/legal'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Recent promotions
            Text(
              'Promociones Recientes',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            promosAsync.when(
              data: (promos) {
                if (promos.isEmpty) return _PromotionPlaceholder();
                final recent = promos.take(3).toList();
                return Column(
                  children: recent
                      .map(
                        (p) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: _PromocionCard(
                            promocion: p,
                            httpHeaders: imgHeaders,
                            onTap: () => context.go('/promotions'),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => Column(
                children: List.generate(
                  2,
                  (_) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                      ),
                    ),
                  ),
                ),
              ),
              error: (_, _) => _PromotionPlaceholder(),
            ),
          ],
        ),
      ),
    );
  }
}

class _MembershipCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);

    final asociado = profileAsync.value;
    final idUnico = asociado?.idUnico ?? '---';
    final nombre = asociado?.nombreCompleto ?? 'Asociado';
    final estado = asociado?.estado ?? '---';
    final telefono = asociado?.telefono ?? '';
    final estadoLabel = estado == 'activo'
        ? 'Membresía Activa'
        : estado == 'pendiente'
        ? 'Pendiente de aprobación'
        : 'Membresía: $estado';
    final vehiculoPrincipal = asociado?.vehiculos
        .where((v) => v.esPrincipal)
        .firstOrNull;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: estado == 'activo'
            ? AppGradients.primary
            : const LinearGradient(
                colors: [Color(0xFF64748B), Color(0xFF475569)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: estado == 'activo'
            ? AppShadows.colored(AppColors.primary)
            : AppShadows.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    estado == 'activo' ? Icons.verified : Icons.pending,
                    color: Colors.white,
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    estadoLabel,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                  ),
                ],
              ),
              Text(
                'CORE ASSOCIATES',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white54,
                  letterSpacing: 1.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            nombre,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Asociado #$idUnico',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.phone, size: 14, color: Colors.white54),
              const SizedBox(width: 6),
              Text(
                telefono,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.white70),
              ),
              if (vehiculoPrincipal != null) ...[
                const SizedBox(width: 16),
                const Icon(
                  Icons.directions_car,
                  size: 14,
                  color: Colors.white54,
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    '${vehiculoPrincipal.marca} ${vehiculoPrincipal.modelo} ${vehiculoPrincipal.anio}',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _KycBanner extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);
    final asociado = profileAsync.value;

    if (asociado == null || asociado.estado == 'activo') {
      return const SizedBox.shrink();
    }

    final IconData icon;
    final String title;
    final String subtitle;
    final Color color;

    switch (asociado.estado) {
      case 'pendiente':
        icon = Icons.upload_file;
        title = 'Completa tu expediente';
        subtitle = 'Sube tus documentos para activar tu membresía';
        color = AppColors.warning;
      case 'rechazado':
        icon = Icons.error_outline;
        title = 'Documentos rechazados';
        subtitle = 'Revisa y vuelve a subir los documentos indicados';
        color = AppColors.error;
      case 'suspendido':
        icon = Icons.pause_circle_outline;
        title = 'Membresía suspendida';
        subtitle = 'Contacta a soporte para más información';
        color = const Color(0xFF64748B);
      default:
        return const SizedBox.shrink();
    }

    return GestureDetector(
      onTap: asociado.estado == 'pendiente' || asociado.estado == 'rechazado'
          ? () => context.push('/documents')
          : null,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (asociado.estado == 'pendiente' ||
                asociado.estado == 'rechazado')
              Icon(Icons.chevron_right, color: color, size: 20),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: AppShadows.sm,
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _PromocionCard extends StatelessWidget {
  final Promocion promocion;
  final Map<String, String> httpHeaders;
  final VoidCallback onTap;

  const _PromocionCard({
    required this.promocion,
    required this.httpHeaders,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: AppShadows.sm,
        ),
        child: Row(
          children: [
            if (promocion.imagenUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: CachedNetworkImage(
                  imageUrl:
                      '${AppConstants.apiBaseUrl}${AppConstants.apiPrefix}/promociones/${promocion.id}/imagen',
                  httpHeaders: httpHeaders,
                  width: 52,
                  height: 52,
                  fit: BoxFit.cover,
                  errorWidget: (_, _, _) => _discountBadge(context),
                ),
              )
            else
              _discountBadge(context),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    promocion.titulo,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    promocion.proveedor.razonSocial,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.secondary50,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Text(
                promocion.descuentoFormateado,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.secondary700,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _discountBadge(BuildContext context) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: AppColors.secondary50,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Center(
        child: Text(
          promocion.descuentoFormateado,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: AppColors.secondary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

class _PromotionPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: AppShadows.sm,
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.primary50,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.local_offer_outlined,
              size: 28,
              color: AppColors.primary300,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Las promociones disponibles aparecerán aquí',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
