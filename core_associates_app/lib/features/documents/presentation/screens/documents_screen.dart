import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/api/api_client.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../data/documents_repository.dart';
import '../../data/models/documento.dart';
import '../providers/documents_provider.dart';

const _requiredDocs = [
  {'tipo': 'ine_frente', 'label': 'INE Frente', 'icon': Icons.badge_outlined},
  {'tipo': 'ine_reverso', 'label': 'INE Reverso', 'icon': Icons.badge_outlined},
  {'tipo': 'selfie', 'label': 'Selfie', 'icon': Icons.face_outlined},
  {
    'tipo': 'tarjeta_circulacion',
    'label': 'Tarjeta de Circulación',
    'icon': Icons.directions_car_outlined,
  },
];

class DocumentsScreen extends ConsumerStatefulWidget {
  const DocumentsScreen({super.key});

  @override
  ConsumerState<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends ConsumerState<DocumentsScreen> {
  final _picker = ImagePicker();
  String? _uploadingTipo;

  Future<void> _pickAndUpload(String tipo) async {
    // Selfie siempre abre cámara directa
    ImageSource? source;
    if (tipo == 'selfie') {
      source = ImageSource.camera;
    } else {
      source = await showModalBottomSheet<ImageSource>(
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
    }

    if (source == null) return;

    final picked = await _picker.pickImage(
      source: source,
      imageQuality: 80,
      maxWidth: 1920,
      preferredCameraDevice: tipo == 'selfie'
          ? CameraDevice.front
          : CameraDevice.rear,
    );
    if (picked == null || !mounted) return;

    // Preview antes de enviar
    final confirmed = await _showPreviewDialog(picked.path, tipo);
    if (confirmed != true || !mounted) return;

    setState(() => _uploadingTipo = tipo);

    try {
      await ref
          .read(documentsProvider.notifier)
          .uploadDocument(picked.path, tipo);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Documento subido correctamente'),
            backgroundColor: AppColors.secondary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _uploadingTipo = null);
    }
  }

  Future<bool?> _showPreviewDialog(String filePath, String tipo) {
    final label =
        _requiredDocs.firstWhere(
              (d) => d['tipo'] == tipo,
              orElse: () => {'label': tipo},
            )['label']
            as String;

    return showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                'Verificar $label',
                style: Theme.of(
                  ctx,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Verifica que la imagen sea clara y legible antes de enviar.',
                textAlign: TextAlign.center,
                style: Theme.of(
                  ctx,
                ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
              ),
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 350),
                child: Image.file(File(filePath), fit: BoxFit.contain),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.pop(ctx, false),
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('Reintentar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => Navigator.pop(ctx, true),
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('Enviar'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _previewDocument(String docId, String label) async {
    try {
      final repo = ref.read(documentsRepositoryProvider);
      final url = repo.getDocumentUrl(docId);
      final headers = await ref.read(apiClientProvider).authHeaders;
      if (!mounted) return;

      showDialog(
        context: context,
        builder: (ctx) => Dialog.fullscreen(
          child: Scaffold(
            backgroundColor: Colors.black,
            appBar: AppBar(
              title: Text(label),
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
            ),
            body: InteractiveViewer(
              minScale: 0.5,
              maxScale: 4.0,
              child: Center(
                child: CachedNetworkImage(
                  imageUrl: url,
                  httpHeaders: headers,
                  fit: BoxFit.contain,
                  placeholder: (_, __) => const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
                  errorWidget: (_, __, ___) => const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.broken_image, size: 64, color: Colors.grey),
                      SizedBox(height: 12),
                      Text(
                        'No se pudo cargar la imagen',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final docsAsync = ref.watch(documentsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mis Documentos')),
      body: docsAsync.when(
        data: (docs) {
          final allUploaded = _requiredDocs.every(
            (req) => docs.any((d) => d.tipo == req['tipo']),
          );

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                'Sube tus documentos para completar tu verificación',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 20),
              for (final req in _requiredDocs) ...[
                _DocumentTile(
                  tipo: req['tipo'] as String,
                  label: req['label'] as String,
                  icon: req['icon'] as IconData,
                  document: docs.cast<Documento?>().firstWhere(
                    (d) => d?.tipo == req['tipo'],
                    orElse: () => null,
                  ),
                  isUploading: _uploadingTipo == req['tipo'],
                  onUpload: () => _pickAndUpload(req['tipo'] as String),
                  onPreview: (id) =>
                      _previewDocument(id, req['label'] as String),
                ),
                const SizedBox(height: 12),
              ],
              if (allUploaded) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.secondary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle,
                        color: AppColors.secondary,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Todos los documentos han sido enviados. '
                          'Serán revisados por un operador.',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppColors.secondary),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    if (context.canPop()) {
                      context.pop();
                    } else {
                      context.go('/home');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Listo'),
                ),
              ],
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text('Error: $e'),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.invalidate(documentsProvider),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DocumentTile extends StatelessWidget {
  final String tipo;
  final String label;
  final IconData icon;
  final Documento? document;
  final bool isUploading;
  final VoidCallback onUpload;
  final void Function(String id) onPreview;

  const _DocumentTile({
    required this.tipo,
    required this.label,
    required this.icon,
    this.document,
    required this.isUploading,
    required this.onUpload,
    required this.onPreview,
  });

  Color _estadoColor(String estado) {
    switch (estado) {
      case 'aprobado':
        return AppColors.secondary;
      case 'rechazado':
        return AppColors.error;
      default:
        return AppColors.warning;
    }
  }

  IconData _estadoIcon(String estado) {
    switch (estado) {
      case 'aprobado':
        return Icons.check_circle;
      case 'rechazado':
        return Icons.cancel;
      default:
        return Icons.schedule;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: document != null
              ? _estadoColor(document!.estado).withValues(alpha: 0.3)
              : AppColors.border,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color:
                  (document != null
                          ? _estadoColor(document!.estado)
                          : AppColors.primary)
                      .withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: document != null
                  ? _estadoColor(document!.estado)
                  : AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                if (document != null) ...[
                  Row(
                    children: [
                      Icon(
                        _estadoIcon(document!.estado),
                        size: 14,
                        color: _estadoColor(document!.estado),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        document!.estado.toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: _estadoColor(document!.estado),
                        ),
                      ),
                    ],
                  ),
                  if (document!.motivoRechazo != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        document!.motivoRechazo!,
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.error.withValues(alpha: 0.8),
                        ),
                      ),
                    ),
                ] else
                  Text(
                    'No subido',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          if (isUploading)
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else if (document != null)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.visibility, size: 20),
                  onPressed: () => onPreview(document!.id),
                  tooltip: 'Ver',
                ),
                if (document!.estado != 'aprobado')
                  IconButton(
                    icon: const Icon(Icons.upload, size: 20),
                    onPressed: onUpload,
                    tooltip: 'Resubir',
                  ),
              ],
            )
          else
            IconButton(
              icon: const Icon(
                Icons.upload_file,
                color: AppColors.primary,
                size: 24,
              ),
              onPressed: onUpload,
              tooltip: 'Subir',
            ),
        ],
      ),
    );
  }
}
