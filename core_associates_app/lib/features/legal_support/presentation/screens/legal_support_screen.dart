import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../../../shared/theme/app_theme.dart';
import '../../../../shared/widgets/kyc_guard.dart';
import '../../data/models/caso_legal.dart';
import '../providers/legal_provider.dart';

class LegalSupportScreen extends ConsumerWidget {
  const LegalSupportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final casosAsync = ref.watch(misCasosProvider);

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              'Soporte Legal',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              'Asistencia en caso de percance vial',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),

            const SizedBox(height: 24),

            // SOS Button with pulse effect
            Center(
              child: Column(
                children: [
                  _SOSButton(onTap: () => _showSOSDialog(context, ref)),
                  const SizedBox(height: 12),
                  Text(
                    'Toca para reportar un percance',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Info cards
            Text(
              'Cobertura incluida',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),

            const _CoverageCard(
              icon: Icons.gavel,
              title: 'Asesoría Legal',
              description: 'Acompañamiento jurídico en percances viales',
            ),
            const SizedBox(height: 8),
            const _CoverageCard(
              icon: Icons.local_hospital,
              title: 'Gestión de Seguros',
              description: 'Apoyo en trámites con aseguradoras',
            ),
            const SizedBox(height: 8),
            const _CoverageCard(
              icon: Icons.description,
              title: 'Documentación',
              description: 'Preparación de actas y documentos legales',
            ),

            const SizedBox(height: 24),

            // Recent cases
            Text(
              'Mis Casos',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),

            casosAsync.when(
              data: (casos) {
                if (casos.isEmpty) {
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
                            Icons.folder_open_outlined,
                            size: 28,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No tienes casos registrados',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Aquí aparecerán tus reportes de percances',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppColors.textTertiary),
                        ),
                      ],
                    ),
                  );
                }
                return Column(
                  children: casos
                      .map(
                        (c) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: _CasoCard(
                            caso: c,
                            onTap: () => context.push('/legal/case/${c.id}'),
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
                      height: 72,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        boxShadow: AppShadows.sm,
                      ),
                    ),
                  ),
                ),
              ),
              error: (_, _) => const Text('Error al cargar casos'),
            ),
          ],
        ),
      ),
    );
  }

  void _showSOSDialog(BuildContext context, WidgetRef ref) {
    if (checkKycBlocked(context, ref)) return;

    String selectedTipo = 'accidente';
    final descripcionController = TextEditingController();

    const tiposPercance = [
      {
        'value': 'accidente',
        'label': 'Accidente',
        'icon': Icons.car_crash,
        'color': Color(0xFFEF4444),
      },
      {
        'value': 'infraccion',
        'label': 'Infracción',
        'icon': Icons.receipt_long,
        'color': Color(0xFFF59E0B),
      },
      {
        'value': 'robo',
        'label': 'Robo',
        'icon': Icons.lock_outlined,
        'color': Color(0xFF8B5CF6),
      },
      {
        'value': 'asalto',
        'label': 'Asalto',
        'icon': Icons.warning_amber_rounded,
        'color': Color(0xFFEC4899),
      },
      {
        'value': 'otro',
        'label': 'Otro',
        'icon': Icons.help_outline,
        'color': Color(0xFF6B7280),
      },
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Reportar Percance'),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Tipo de percance:'),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 3,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.1,
                    children: tiposPercance.map((tipo) {
                      final isSelected = selectedTipo == tipo['value'];
                      final color = tipo['color'] as Color;
                      return GestureDetector(
                        onTap: () => setState(
                          () => selectedTipo = tipo['value'] as String,
                        ),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? color.withValues(alpha: 0.15)
                                : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? color : Colors.grey.shade300,
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                tipo['icon'] as IconData,
                                size: 28,
                                color: isSelected
                                    ? color
                                    : Colors.grey.shade500,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                tipo['label'] as String,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.w400,
                                  color: isSelected
                                      ? color
                                      : Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: descripcionController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Descripción (opcional)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                descripcionController.dispose();
                Navigator.pop(ctx);
              },
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () async {
                final desc = descripcionController.text;
                descripcionController.dispose();
                Navigator.pop(ctx);
                await _reportarPercance(context, ref, selectedTipo, desc);
              },
              style: FilledButton.styleFrom(backgroundColor: AppColors.error),
              child: const Text('Enviar SOS'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _reportarPercance(
    BuildContext context,
    WidgetRef ref,
    String tipo,
    String descripcion,
  ) async {
    try {
      // Get current location
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      double lat = 19.4326;
      double lng = -99.1332;
      bool usedFallback = true;

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        try {
          final position = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              timeLimit: Duration(seconds: 10),
            ),
          );
          lat = position.latitude;
          lng = position.longitude;
          usedFallback = false;
        } catch (_) {
          // Use default coordinates if location fails
        }
      }

      final caso = await ref
          .read(misCasosProvider.notifier)
          .reportarPercance(
            tipoPercance: tipo,
            latitud: lat,
            longitud: lng,
            descripcion: descripcion.isNotEmpty ? descripcion : null,
          );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              usedFallback
                  ? 'Caso creado: ${caso.codigo} (ubicación aproximada — no se pudo obtener GPS)'
                  : 'Caso creado: ${caso.codigo}',
            ),
            backgroundColor: AppColors.secondary,
            duration: Duration(seconds: usedFallback ? 5 : 3),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        final msg = e.toString();
        if (msg.isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(msg),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }
}

class _SOSButton extends StatefulWidget {
  final VoidCallback onTap;
  const _SOSButton({required this.onTap});

  @override
  State<_SOSButton> createState() => _SOSButtonState();
}

class _SOSButtonState extends State<_SOSButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulseAnim,
      builder: (context, child) {
        final pulseValue = _pulseAnim.value;
        return Container(
          width: 140,
          height: 140,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.error.withValues(
                  alpha: 0.15 + 0.15 * pulseValue,
                ),
                blurRadius: 24 + 16 * pulseValue,
                spreadRadius: 4 + 8 * pulseValue,
              ),
            ],
          ),
          child: child,
        );
      },
      child: InkWell(
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(70),
        child: Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppGradients.danger,
            boxShadow: [
              BoxShadow(
                color: AppColors.error.withValues(alpha: 0.4),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.sos, color: Colors.white, size: 36),
              SizedBox(height: 4),
              Text(
                'REPORTAR',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CoverageCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _CoverageCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: AppShadows.sm,
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary50,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
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

class _CasoCard extends StatelessWidget {
  final CasoLegal caso;
  final VoidCallback? onTap;

  const _CasoCard({required this.caso, this.onTap});

  Color get _estadoColor {
    switch (caso.estado) {
      case 'abierto':
        return AppColors.warning;
      case 'en_atencion':
        return AppColors.primary;
      case 'resuelto':
      case 'cerrado':
        return AppColors.secondary;
      case 'cancelado':
        return AppColors.textSecondary;
      default:
        return AppColors.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: AppShadows.sm,
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _estadoColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.gavel, color: _estadoColor, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${caso.tipoPercanceLabel} - ${caso.codigo}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: _estadoColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(AppRadius.full),
                        ),
                        child: Text(
                          caso.estadoLabel,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: _estadoColor,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        caso.prioridad.toUpperCase(),
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textTertiary),
          ],
        ),
      ),
    );
  }
}
