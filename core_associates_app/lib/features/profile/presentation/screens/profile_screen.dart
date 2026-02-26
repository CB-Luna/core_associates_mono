import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../shared/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/profile_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 8),

            // Avatar & name
            profileAsync.when(
              data: (asociado) {
                final nombre = asociado?.nombreCompleto ?? 'Asociado';
                final iniciales = asociado?.iniciales ?? '?';
                final estado = asociado?.estado ?? '---';
                final idUnico = asociado?.idUnico ?? '';

                return Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor:
                          AppColors.primary.withValues(alpha: 0.1),
                      child: Text(
                        iniciales,
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      nombre,
                      style:
                          Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      estado == 'activo'
                          ? 'Miembro activo'
                          : 'Estado: $estado',
                      style:
                          Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: estado == 'activo'
                                    ? AppColors.secondary
                                    : AppColors.warning,
                                fontWeight: FontWeight.w500,
                              ),
                    ),
                    if (idUnico.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        idUnico,
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                      ),
                    ],
                  ],
                );
              },
              loading: () => Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor:
                        AppColors.primary.withValues(alpha: 0.1),
                    child: const CircularProgressIndicator(),
                  ),
                  const SizedBox(height: 12),
                  Text('Cargando...',
                      style: Theme.of(context).textTheme.titleLarge),
                ],
              ),
              error: (_, __) => Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor:
                        AppColors.primary.withValues(alpha: 0.1),
                    child: const Icon(Icons.person,
                        size: 40, color: AppColors.primary),
                  ),
                  const SizedBox(height: 12),
                  Text('Asociado',
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Menu items
            _ProfileMenuItem(
              icon: Icons.person_outline,
              title: 'Datos Personales',
              onTap: () {},
            ),
            _ProfileMenuItem(
              icon: Icons.directions_car_outlined,
              title: 'Mis Vehículos',
              onTap: () {},
            ),
            _ProfileMenuItem(
              icon: Icons.description_outlined,
              title: 'Mis Documentos',
              onTap: () {},
            ),
            _ProfileMenuItem(
              icon: Icons.credit_card_outlined,
              title: 'Mi Membresía',
              onTap: () {},
            ),
            _ProfileMenuItem(
              icon: Icons.notifications_outlined,
              title: 'Notificaciones',
              onTap: () {},
            ),
            _ProfileMenuItem(
              icon: Icons.help_outline,
              title: 'Ayuda y Soporte',
              onTap: () {},
            ),

            const SizedBox(height: 16),

            // Logout
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Cerrar Sesión'),
                      content: const Text(
                        '¿Estás seguro de que quieres cerrar sesión?',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Cancelar'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('Cerrar Sesión'),
                        ),
                      ],
                    ),
                  );

                  if (confirmed == true) {
                    await ref.read(authStateProvider.notifier).logout();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  }
                },
                icon: const Icon(Icons.logout, color: AppColors.error),
                label: const Text(
                  'Cerrar Sesión',
                  style: TextStyle(color: AppColors.error),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.error),
                ),
              ),
            ),

            const SizedBox(height: 24),

            Text(
              'Core Associates v1.0.0',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _ProfileMenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppColors.textPrimary, size: 22),
      ),
      title: Text(title),
      trailing: const Icon(
        Icons.chevron_right,
        color: AppColors.textSecondary,
      ),
      contentPadding: EdgeInsets.zero,
    );
  }
}
