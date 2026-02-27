import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../../shared/theme/app_theme.dart';
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
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              'Asistencia en caso de percance vial',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),

            const SizedBox(height: 24),

            // SOS Button
            Center(
              child: Column(
                children: [
                  InkWell(
                    onTap: () => _showSOSDialog(context, ref),
                    borderRadius: BorderRadius.circular(60),
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.error,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.error.withValues(alpha: 0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
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
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
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
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
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
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 12),

            casosAsync.when(
              data: (casos) {
                if (casos.isEmpty) {
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.folder_open_outlined,
                            size: 40, color: AppColors.textSecondary),
                        const SizedBox(height: 8),
                        Text(
                          'No tienes casos registrados',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  );
                }
                return Column(
                  children: casos
                      .map((c) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _CasoCard(caso: c),
                          ))
                      .toList(),
                );
              },
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (_, _) => const Text('Error al cargar casos'),
            ),
          ],
        ),
      ),
    );
  }

  void _showSOSDialog(BuildContext context, WidgetRef ref) {
    String selectedTipo = 'accidente';
    final descripcionController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Reportar Percance'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Tipo de percance:'),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: selectedTipo,
                items: const [
                  DropdownMenuItem(
                      value: 'accidente', child: Text('Accidente')),
                  DropdownMenuItem(
                      value: 'infraccion', child: Text('Infracción')),
                  DropdownMenuItem(value: 'robo', child: Text('Robo')),
                  DropdownMenuItem(value: 'asalto', child: Text('Asalto')),
                  DropdownMenuItem(value: 'otro', child: Text('Otro')),
                ],
                onChanged: (v) => setState(() => selectedTipo = v!),
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
              const SizedBox(height: 12),
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
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await _reportarPercance(
                    context, ref, selectedTipo, descripcionController.text);
              },
              style: FilledButton.styleFrom(
                  backgroundColor: AppColors.error),
              child: const Text('Enviar SOS'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _reportarPercance(BuildContext context, WidgetRef ref,
      String tipo, String descripcion) async {
    try {
      // Get current location
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      double lat = 19.4326;
      double lng = -99.1332;

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        try {
          final position = await Geolocator.getCurrentPosition(
            locationSettings:
                const LocationSettings(timeLimit: Duration(seconds: 10)),
          );
          lat = position.latitude;
          lng = position.longitude;
        } catch (_) {
          // Use default coordinates if location fails
        }
      }

      final caso = await ref.read(misCasosProvider.notifier).reportarPercance(
            tipoPercance: tipo,
            latitud: lat,
            longitud: lng,
            descripcion: descripcion.isNotEmpty ? descripcion : null,
          );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Caso creado: ${caso.codigo}'),
            backgroundColor: AppColors.secondary,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
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
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primary, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
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

  const _CasoCard({required this.caso});

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
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: _estadoColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.gavel, color: _estadoColor, size: 24),
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
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: _estadoColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        caso.estadoLabel,
                        style:
                            Theme.of(context).textTheme.labelSmall?.copyWith(
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
        ],
      ),
    );
  }
}
