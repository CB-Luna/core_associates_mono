import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/api/api_client.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../documents/presentation/providers/documents_provider.dart';
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

    final asociado = profileAsync.value;
    final isActive = asociado?.estado == 'activo';

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            // Greeting
            profileAsync.when(
              data: (a) => Text(
                a != null && a.nombre.isNotEmpty
                    ? 'Hola, ${a.nombre}'
                    : 'Bienvenido',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              loading: () => Text(
                'Bienvenido',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              error: (_, _) => Text(
                'Bienvenido',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Core Associates',
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),

            // Membership card
            _MembershipCard(),

            // Verification checklist (only shows when not active)
            if (!isActive && asociado != null) ...[
              const SizedBox(height: 16),
              _VerificationChecklist(),
            ],

            const SizedBox(height: 24),

            // SOS Legal — always prominent
            _SosLegalBanner(),

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
                    onTap: isActive ? () => context.push('/my-coupons') : null,
                    locked: !isActive,
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
                    label: 'Mi Vehículo',
                    color: AppColors.warning,
                    onTap: () => context.push('/vehicles'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickAction(
                    icon: Icons.person_outline,
                    label: 'Mi Perfil',
                    color: AppColors.accent,
                    onTap: () => context.go('/profile'),
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
                            isActive: isActive,
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

// ─── Membership Card ─────────────────────────────────────────────────────────

class _MembershipCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);

    final asociado = profileAsync.value;
    final idUnico = asociado?.idUnico ?? '---';
    final nombre = asociado?.nombreCompleto ?? 'Asociado';
    final estado = asociado?.estado ?? '---';
    final telefono = asociado?.telefono ?? '';
    final vehiculoPrincipal = asociado?.vehiculos
        .where((v) => v.esPrincipal)
        .firstOrNull;

    final isActive = estado == 'activo';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: isActive
            ? AppGradients.primary
            : const LinearGradient(
                colors: [Color(0xFF64748B), Color(0xFF475569)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: isActive
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
                    isActive ? Icons.verified : Icons.hourglass_top_rounded,
                    color: Colors.white,
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isActive ? 'Membresía Activa' : _estadoLabel(estado),
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
          if (!isActive) ...[
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline,
                    color: Colors.white70,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _estadoMessage(estado),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  static String _estadoLabel(String estado) {
    switch (estado) {
      case 'pendiente':
        return 'En proceso de verificación';
      case 'rechazado':
        return 'Verificación con observaciones';
      case 'suspendido':
        return 'Membresía suspendida';
      default:
        return 'Membresía: $estado';
    }
  }

  static String _estadoMessage(String estado) {
    switch (estado) {
      case 'pendiente':
        return 'Tu membresía está en proceso de activación. Completa tus documentos y espera la revisión.';
      case 'rechazado':
        return 'Algunos documentos necesitan corrección. Revisa los detalles y vuelve a subirlos.';
      case 'suspendido':
        return 'Tu membresía ha sido suspendida. Contacta a soporte para más información.';
      default:
        return '';
    }
  }
}

// ─── Verification Checklist ──────────────────────────────────────────────────

class _VerificationChecklist extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);
    final docsAsync = ref.watch(documentsProvider);
    final asociado = profileAsync.value;
    final docs = docsAsync.value ?? [];

    if (asociado == null) return const SizedBox.shrink();

    // Obtener el estado del tipo de documento más reciente
    String? docEstado(String tipo) {
      final match = docs.where((d) => d.tipo == tipo);
      return match.isEmpty ? null : match.first.estado;
    }

    final hasSelfie = asociado.fotoUrl != null && asociado.fotoUrl!.isNotEmpty;
    final hasVehicle = asociado.vehiculos.isNotEmpty;

    // Para selfie, priorizar el estado del documento; si no hay doc pero hay foto, es aprobado
    final selfieEstado = docEstado('selfie') ?? (hasSelfie ? 'aprobado' : null);
    final vehiculoEstado = hasVehicle ? 'aprobado' : null;

    final items = [
      _CheckItem('Datos personales', 'aprobado', Icons.person_outline),
      _CheckItem(
        'Selfie de verificación',
        selfieEstado,
        Icons.camera_alt_outlined,
      ),
      _CheckItem(
        'Vehículo registrado',
        vehiculoEstado,
        Icons.directions_car_outlined,
      ),
      _CheckItem(
        'Tarjeta de circulación',
        docEstado('tarjeta_circulacion'),
        Icons.credit_card_outlined,
      ),
      _CheckItem('INE Frente', docEstado('ine_frente'), Icons.badge_outlined),
      _CheckItem('INE Reverso', docEstado('ine_reverso'), Icons.badge_outlined),
    ];

    final completedCount = items.where((i) => i.completed).length;
    final progress = completedCount / items.length;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: AppShadows.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.checklist_rounded,
                size: 20,
                color: AppColors.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'Verificación de expediente',
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              Text(
                '$completedCount/${items.length}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation<Color>(
                progress == 1.0 ? AppColors.secondary : AppColors.primary,
              ),
            ),
          ),
          const SizedBox(height: 14),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  Icon(
                    _CheckItem.iconForEstado(item.estado),
                    size: 18,
                    color: _CheckItem.colorForEstado(item.estado),
                  ),
                  const SizedBox(width: 10),
                  Icon(item.icon, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    item.label,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: _CheckItem.labelColorForEstado(item.estado),
                      decoration: item.completed
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (completedCount < items.length) ...[
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => context.push('/documents'),
                icon: const Icon(Icons.upload_file, size: 18),
                label: const Text('Completar documentos'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CheckItem {
  final String label;
  final String? estado; // null=no subido, 'pendiente', 'aprobado', 'rechazado'
  final IconData icon;
  const _CheckItem(this.label, this.estado, this.icon);
  bool get completed => estado == 'aprobado';

  static IconData iconForEstado(String? estado) => switch (estado) {
    'aprobado' => Icons.check_circle_rounded,
    'rechazado' => Icons.cancel_rounded,
    'pendiente' => Icons.access_time_rounded,
    _ => Icons.radio_button_unchecked,
  };

  static Color colorForEstado(String? estado) => switch (estado) {
    'aprobado' => AppColors.secondary,
    'rechazado' => AppColors.error,
    'pendiente' => Colors.amber,
    _ => AppColors.textTertiary,
  };

  static Color labelColorForEstado(String? estado) => switch (estado) {
    'aprobado' => AppColors.textSecondary,
    'rechazado' => AppColors.error,
    'pendiente' => Colors.amber,
    _ => AppColors.textPrimary,
  };
}

// ─── SOS Legal Banner ────────────────────────────────────────────────────────

class _SosLegalBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => GoRouter.of(context).go('/legal'),
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: AppGradients.danger,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: AppShadows.colored(AppColors.error),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SOS Legal',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '¿Accidente, asalto o infracción? Reporta aquí.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white70),
          ],
        ),
      ),
    );
  }
}

// ─── Quick Action ────────────────────────────────────────────────────────────

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;
  final bool locked;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
    this.locked = false,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = locked ? AppColors.textTertiary : color;
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
            Stack(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: effectiveColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: effectiveColor, size: 22),
                ),
                if (locked)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.textTertiary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: const Icon(
                        Icons.lock,
                        size: 9,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: locked ? AppColors.textTertiary : AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Promotion Card ──────────────────────────────────────────────────────────

class _PromocionCard extends StatelessWidget {
  final Promocion promocion;
  final Map<String, String> httpHeaders;
  final bool isActive;
  final VoidCallback onTap;

  const _PromocionCard({
    required this.promocion,
    required this.httpHeaders,
    required this.isActive,
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
                  if (!isActive) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Activa tu membresía para acceder',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.warning,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isActive ? AppColors.secondary50 : AppColors.border,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Text(
                promocion.descuentoFormateado,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: isActive
                      ? AppColors.secondary700
                      : AppColors.textTertiary,
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

// ─── Promotion Placeholder ───────────────────────────────────────────────────

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
            decoration: const BoxDecoration(
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
