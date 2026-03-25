import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../core/api/api_client.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/app_button.dart';

class PerfilScreen extends ConsumerStatefulWidget {
  const PerfilScreen({super.key});

  @override
  ConsumerState<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends ConsumerState<PerfilScreen> {
  File? _localPhoto;
  String? _token;

  @override
  void initState() {
    super.initState();
    ref.read(apiClientProvider).getAccessToken().then((t) {
      if (mounted) setState(() => _token = t);
    });
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Cámara'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Galería'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;

    final xFile = await picker.pickImage(
      source: source,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );
    if (xFile != null) {
      final file = File(xFile.path);
      setState(() => _localPhoto = file);

      // Subir al servidor
      try {
        final api = ref.read(apiClientProvider);
        await api.uploadFile(
          '/auth/me/avatar',
          filePath: file.path,
          fieldName: 'file',
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Foto de perfil actualizada'),
              duration: Duration(seconds: 2),
            ),
          );
        }
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Foto guardada localmente (sin conexión al servidor)',
              ),
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final usuario = authState.usuario;

    return Scaffold(
      appBar: AppBar(title: const Text('Mi Perfil')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            children: [
              const SizedBox(height: AppSpacing.lg),

              // ── Avatar editable ──
              GestureDetector(
                onTap: _pickPhoto,
                child: Stack(
                  children: [
                    _buildAvatar(usuario),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          size: 16,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppSpacing.md),

              // ── Nombre ──
              Text(
                usuario?.nombre ?? '—',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                usuario?.email ?? '',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),

              const SizedBox(height: AppSpacing.xs),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.secondary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: const Text(
                  'Abogado',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.secondaryDark,
                  ),
                ),
              ),

              const SizedBox(height: AppSpacing.xl),

              // ── Opciones ──
              _buildOption(
                Icons.info_outline_rounded,
                'Acerca de',
                _showAboutDialog,
              ),

              const SizedBox(height: AppSpacing.xl),

              // ── Cerrar sesión ──
              AppButton(
                label: 'Cerrar Sesión',
                outlined: true,
                icon: Icons.logout_rounded,
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Cerrar sesión'),
                      content: const Text(
                        '¿Estás seguro que deseas cerrar sesión?',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('Cancelar'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('Cerrar sesión'),
                        ),
                      ],
                    ),
                  );
                  if (confirmed == true) {
                    ref.read(authStateProvider.notifier).logout();
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(dynamic usuario) {
    final api = ref.watch(apiClientProvider);

    ImageProvider? image;
    if (_localPhoto != null) {
      image = FileImage(_localPhoto!);
    } else if (usuario != null && usuario.avatarUrl != null && _token != null) {
      image = NetworkImage(
        api.userAvatarUrl(usuario.id),
        headers: {'Authorization': 'Bearer $_token'},
      );
    }

    return CircleAvatar(
      radius: 48,
      backgroundColor: AppColors.primaryLight.withValues(alpha: 0.15),
      backgroundImage: image,
      onBackgroundImageError: image != null ? (_, __) {} : null,
      child: image == null
          ? const Icon(Icons.gavel_rounded, size: 40, color: AppColors.primary)
          : null,
    );
  }

  Widget _buildOption(IconData icon, String label, VoidCallback? onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(label),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textHint),
        onTap: onTap,
      ),
    );
  }

  Future<void> _showAboutDialog() async {
    final info = await PackageInfo.fromPlatform();
    if (!mounted) return;
    showAboutDialog(
      context: context,
      applicationName: 'Core Abogados',
      applicationVersion: 'v${info.version} (${info.buildNumber})',
      applicationIcon: const Icon(
        Icons.gavel_rounded,
        size: 48,
        color: AppColors.primary,
      ),
      children: [
        const Text(
          'App de gestión de casos legales para abogados de Core Associates.',
        ),
      ],
    );
  }
}
