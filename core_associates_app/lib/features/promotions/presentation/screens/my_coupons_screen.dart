import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../shared/theme/app_theme.dart';
import '../../data/models/cupon.dart';
import '../providers/promotions_provider.dart';

class MyCouponsScreen extends ConsumerWidget {
  const MyCouponsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cuponesAsync = ref.watch(misCuponesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mis Cupones')),
      body: cuponesAsync.when(
        data: (cupones) {
          if (cupones.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.confirmation_number_outlined,
                    size: 64,
                    color: AppColors.textSecondary.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No tienes cupones aún',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Genera un cupón desde las promociones disponibles',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }

          final activos = cupones.where((c) => c.estado == 'activo').toList();
          final otros = cupones.where((c) => c.estado != 'activo').toList();

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(misCuponesProvider),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                if (activos.isNotEmpty) ...[
                  Text(
                    'Activos',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.secondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...activos.map(
                    (c) => _CuponCard(
                      cupon: c,
                      onTap: () => context.push('/coupon/${c.id}'),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
                if (otros.isNotEmpty) ...[
                  Text(
                    'Anteriores',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...otros.map(
                    (c) => _CuponCard(
                      cupon: c,
                      onTap: () => context.push('/coupon/${c.id}'),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text(
                'Error al cargar cupones',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.invalidate(misCuponesProvider),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CuponCard extends StatelessWidget {
  final Cupon cupon;
  final VoidCallback onTap;

  const _CuponCard({required this.cupon, required this.onTap});

  Color _estadoColor() {
    switch (cupon.estado) {
      case 'activo':
        return AppColors.secondary;
      case 'canjeado':
        return AppColors.primary;
      case 'vencido':
        return AppColors.textSecondary;
      default:
        return AppColors.error;
    }
  }

  String _estadoLabel() {
    switch (cupon.estado) {
      case 'activo':
        return 'Activo';
      case 'canjeado':
        return 'Canjeado';
      case 'vencido':
        return 'Vencido';
      default:
        return cupon.estado;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm', 'es_MX');
    final vencimiento = DateTime.parse(cupon.fechaVencimiento);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              // Descuento badge
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: _estadoColor().withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    cupon.promocion.tipoDescuento == 'porcentaje'
                        ? '${cupon.promocion.valorDescuento.toStringAsFixed(0)}%'
                        : '\$${cupon.promocion.valorDescuento.toStringAsFixed(0)}',
                    style: TextStyle(
                      color: _estadoColor(),
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      cupon.promocion.titulo,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      cupon.proveedor.razonSocial,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Vence: ${dateFormat.format(vencimiento)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: vencimiento.isBefore(DateTime.now())
                            ? AppColors.error
                            : AppColors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Estado badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _estadoColor().withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _estadoLabel(),
                  style: TextStyle(
                    color: _estadoColor(),
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
