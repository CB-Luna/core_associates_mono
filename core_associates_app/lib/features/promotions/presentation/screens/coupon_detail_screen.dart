import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../../shared/theme/app_theme.dart';
import '../../data/models/cupon.dart';
import '../providers/promotions_provider.dart';

class CouponDetailScreen extends ConsumerWidget {
  final String cuponId;

  const CouponDetailScreen({super.key, required this.cuponId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cuponesAsync = ref.watch(misCuponesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Detalle del Cupón')),
      body: cuponesAsync.when(
        data: (cupones) {
          final cupon = cupones.cast<Cupon?>().firstWhere(
            (c) => c?.id == cuponId,
            orElse: () => null,
          );

          if (cupon == null) {
            return const Center(child: Text('Cupón no encontrado'));
          }

          return _CouponDetailContent(cupon: cupon);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _CouponDetailContent extends StatelessWidget {
  final Cupon cupon;

  const _CouponDetailContent({required this.cupon});

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

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm', 'es_MX');
    final vencimiento = DateTime.parse(cupon.fechaVencimiento);
    final isExpired = vencimiento.isBefore(DateTime.now());

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Ticket-style card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.xl),
              boxShadow: AppShadows.lg,
            ),
            child: Column(
              children: [
                // Top section with gradient
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
                  decoration: BoxDecoration(
                    gradient: cupon.estado == 'activo'
                        ? AppGradients.primary
                        : cupon.estado == 'canjeado'
                        ? AppGradients.success
                        : AppGradients.surfaceSubtle,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(AppRadius.xl),
                    ),
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(AppRadius.full),
                        ),
                        child: Text(
                          cupon.estado.toUpperCase(),
                          style: TextStyle(
                            color:
                                cupon.estado == 'activo' ||
                                    cupon.estado == 'canjeado'
                                ? Colors.white
                                : _estadoColor(),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        cupon.promocion.titulo,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              fontWeight: FontWeight.bold,
                              color:
                                  cupon.estado == 'activo' ||
                                      cupon.estado == 'canjeado'
                                  ? Colors.white
                                  : AppColors.textPrimary,
                            ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        cupon.proveedor.razonSocial,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color:
                              cupon.estado == 'activo' ||
                                  cupon.estado == 'canjeado'
                              ? Colors.white70
                              : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),

                // Dashed divider effect
                Row(
                  children: List.generate(
                    30,
                    (i) => Expanded(
                      child: Container(
                        height: 1,
                        color: i % 2 == 0
                            ? AppColors.border
                            : Colors.transparent,
                      ),
                    ),
                  ),
                ),

                // QR Code section
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      GestureDetector(
                        onTap: () => _showFullScreenQr(context),
                        child: QrImageView(
                          data: cupon.qrData,
                          version: QrVersions.auto,
                          size: 200,
                          eyeStyle: const QrEyeStyle(
                            eyeShape: QrEyeShape.circle,
                            color: AppColors.textPrimary,
                          ),
                          dataModuleStyle: const QrDataModuleStyle(
                            dataModuleShape: QrDataModuleShape.circle,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Toca para ampliar',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textTertiary,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Code
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.primary50,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Código',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              cupon.codigo,
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 2,
                                    color: AppColors.primary,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Info card
          Container(
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
                _InfoRow(
                  label: 'Descuento',
                  value: cupon.promocion.tipoDescuento == 'porcentaje'
                      ? '${cupon.promocion.valorDescuento.toStringAsFixed(0)}%'
                      : '\$${cupon.promocion.valorDescuento.toStringAsFixed(0)}',
                ),
                const Divider(height: 20),
                _InfoRow(
                  label: 'Generado',
                  value: dateFormat.format(
                    DateTime.parse(cupon.fechaGeneracion),
                  ),
                ),
                const Divider(height: 20),
                _InfoRow(
                  label: 'Vencimiento',
                  value: dateFormat.format(vencimiento),
                  valueColor: isExpired ? AppColors.error : null,
                ),
                if (cupon.fechaCanje != null) ...[
                  const Divider(height: 20),
                  _InfoRow(
                    label: 'Canjeado',
                    value: dateFormat.format(DateTime.parse(cupon.fechaCanje!)),
                    valueColor: AppColors.secondary,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showFullScreenQr(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog.fullscreen(
        child: Scaffold(
          backgroundColor: Colors.white,
          appBar: AppBar(
            title: Text(cupon.codigo),
            backgroundColor: Colors.white,
          ),
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: QrImageView(
                data: cupon.qrData,
                version: QrVersions.auto,
                size: MediaQuery.of(ctx).size.width - 64,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.circle,
                  color: AppColors.textPrimary,
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.circle,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
        ),
        Flexible(
          child: Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: valueColor,
            ),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }
}
