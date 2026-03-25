import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/api/api_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/status_badge.dart';
import '../models/caso_legal.dart';
import '../models/nota_caso.dart';
import '../models/documento_caso.dart';
import '../models/asociado_resumen.dart';

import '../providers/casos_providers.dart';
import '../repository/casos_repository.dart';

class CasoDetailScreen extends ConsumerStatefulWidget {
  final String casoId;
  const CasoDetailScreen({super.key, required this.casoId});

  @override
  ConsumerState<CasoDetailScreen> createState() => _CasoDetailScreenState();
}

class _CasoDetailScreenState extends ConsumerState<CasoDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final asyncCaso = ref.watch(casoDetailProvider(widget.casoId));

    return Scaffold(
      appBar: AppBar(
        title:
            asyncCaso.whenOrNull(data: (c) => Text(c.codigo)) ??
            const Text('Caso'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: AppColors.secondary,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Info'),
            Tab(text: 'Notas'),
            Tab(text: 'Documentos'),
          ],
        ),
      ),
      body: asyncCaso.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Error al cargar el caso',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: () =>
                    ref.invalidate(casoDetailProvider(widget.casoId)),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
        data: (caso) => TabBarView(
          controller: _tabController,
          children: [
            _InfoTab(caso: caso),
            _NotasTab(casoId: widget.casoId),
            _DocumentosTab(casoId: widget.casoId),
          ],
        ),
      ),
      // Acciones flotantes
      bottomNavigationBar: asyncCaso.whenOrNull(
        data: (caso) => _AccionesBar(caso: caso),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// TAB: Información general
// ═══════════════════════════════════════════════════════════════

class _InfoTab extends StatelessWidget {
  final CasoLegal caso;
  const _InfoTab({required this.caso});

  Future<void> _llamar(String telefono) async {
    final uri = Uri(scheme: 'tel', path: telefono);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _abrirEnMaps(BuildContext context) async {
    final lat = caso.latitud;
    final lng = caso.longitud;
    final label = Uri.encodeComponent(
      caso.direccionAprox ?? 'Ubicación del caso',
    );

    // Intentar Google Maps primero, luego fallback a geo: URI genérico
    final googleMapsUrl = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=$lat,$lng',
    );
    final geoUri = Uri.parse('geo:$lat,$lng?q=$lat,$lng($label)');

    if (await canLaunchUrl(googleMapsUrl)) {
      await launchUrl(googleMapsUrl, mode: LaunchMode.externalApplication);
    } else if (await canLaunchUrl(geoUri)) {
      await launchUrl(geoUri, mode: LaunchMode.externalApplication);
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No se pudo abrir la aplicación de mapas'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fechaFmt = DateFormat('dd MMM yyyy, HH:mm', 'es_MX');

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        // Estado + prioridad
        Row(
          children: [
            StatusBadge(label: caso.estadoLabel),
            const SizedBox(width: AppSpacing.sm),
            StatusBadge(label: caso.prioridadLabel),
          ],
        ),
        const SizedBox(height: AppSpacing.md),

        // Tipo percance
        _InfoRow(
          icon: Icons.warning_amber,
          label: 'Tipo',
          value: caso.tipoPercanceLabel,
        ),

        if (caso.descripcion != null)
          _InfoRow(
            icon: Icons.description,
            label: 'Descripción',
            value: caso.descripcion!,
          ),

        _InfoRow(
          icon: Icons.calendar_today,
          label: 'Fecha reporte',
          value: fechaFmt.format(caso.createdAt),
        ),

        if (caso.direccionAprox != null)
          _InfoRow(
            icon: Icons.location_on,
            label: 'Dirección',
            value: caso.direccionAprox!,
          ),

        // ── Botón Abrir en Maps ──
        if (caso.latitud != 0 || caso.longitud != 0) ...[
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _abrirEnMaps(context),
              icon: const Icon(Icons.map_outlined),
              label: const Text('Abrir ubicación en Maps'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primaryLight,
              ),
            ),
          ),
        ],

        const Divider(height: AppSpacing.xl),

        // Asociado
        if (caso.asociado != null) ...[
          Text(
            'Asociado',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _AsociadoAvatar(asociado: caso.asociado!, casoId: caso.id),
          const SizedBox(height: AppSpacing.sm),
          if (caso.asociado!.telefono != null)
            InkWell(
              onTap: () => _llamar(caso.asociado!.telefono!),
              borderRadius: BorderRadius.circular(AppRadius.sm),
              child: Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.phone,
                      size: 18,
                      color: AppColors.primaryLight,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    const SizedBox(
                      width: 90,
                      child: Text(
                        'Teléfono',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.neutral500,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        caso.asociado!.telefono!,
                        style: TextStyle(
                          color: AppColors.primaryLight,
                          fontWeight: FontWeight.w500,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.call,
                      size: 18,
                      color: AppColors.primaryLight,
                    ),
                  ],
                ),
              ),
            ),
          if (caso.asociado!.email != null)
            _InfoRow(
              icon: Icons.email,
              label: 'Email',
              value: caso.asociado!.email!,
            ),

          // Vehículos
          if (caso.asociado!.vehiculos.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Vehículos',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            ...caso.asociado!.vehiculos.map(
              (v) => _VehiculoRow(vehiculo: v, casoId: caso.id),
            ),
          ],
        ],
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.neutral500),
          const SizedBox(width: AppSpacing.sm),
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.neutral500),
            ),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// TAB: Notas
// ═══════════════════════════════════════════════════════════════

class _NotasTab extends ConsumerStatefulWidget {
  final String casoId;
  const _NotasTab({required this.casoId});

  @override
  ConsumerState<_NotasTab> createState() => _NotasTabState();
}

class _NotasTabState extends ConsumerState<_NotasTab> {
  final _controller = TextEditingController();
  bool _enviando = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _enviarNota() async {
    final contenido = _controller.text.trim();
    if (contenido.isEmpty) return;

    setState(() => _enviando = true);
    try {
      final repo = ref.read(casosRepositoryProvider);
      await repo.addNota(widget.casoId, contenido: contenido);
      _controller.clear();
      ref.invalidate(notasCasoProvider(widget.casoId));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Error al enviar nota')));
      }
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final asyncNotas = ref.watch(notasCasoProvider(widget.casoId));
    final theme = Theme.of(context);
    final fechaFmt = DateFormat('dd MMM, HH:mm', 'es_MX');

    return Column(
      children: [
        Expanded(
          child: asyncNotas.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: TextButton(
                onPressed: () =>
                    ref.invalidate(notasCasoProvider(widget.casoId)),
                child: const Text('Reintentar'),
              ),
            ),
            data: (notas) {
              if (notas.isEmpty) {
                return const Center(
                  child: Text(
                    'Sin notas aún',
                    style: TextStyle(color: AppColors.neutral500),
                  ),
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: notas.length,
                itemBuilder: (context, i) {
                  final nota = notas[i];
                  return _NotaCard(nota: nota, fechaFmt: fechaFmt);
                },
              );
            },
          ),
        ),

        // Input de nueva nota
        Container(
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            border: Border(top: BorderSide(color: AppColors.neutral200)),
          ),
          child: SafeArea(
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'Escribir nota...',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.sm,
                      ),
                    ),
                    maxLines: 3,
                    minLines: 1,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                IconButton.filled(
                  onPressed: _enviando ? null : _enviarNota,
                  icon: _enviando
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _NotaCard extends StatelessWidget {
  final NotaCaso nota;
  final DateFormat fechaFmt;
  const _NotaCard({required this.nota, required this.fechaFmt});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  nota.autor?.nombre ?? 'Sin autor',
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                if (nota.autor?.rol != null)
                  Text(
                    '· ${nota.autor!.rol}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.neutral500,
                    ),
                  ),
                const Spacer(),
                Text(
                  fechaFmt.format(nota.createdAt),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: AppColors.neutral400,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(nota.contenido, style: theme.textTheme.bodyMedium),
            if (nota.esPrivada)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.xs),
                child: Row(
                  children: [
                    Icon(Icons.lock, size: 12, color: AppColors.neutral400),
                    const SizedBox(width: 2),
                    Text(
                      'Privada',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.neutral400,
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
}

// ═══════════════════════════════════════════════════════════════
// TAB: Documentos
// ═══════════════════════════════════════════════════════════════

class _DocumentosTab extends ConsumerStatefulWidget {
  final String casoId;
  const _DocumentosTab({required this.casoId});

  @override
  ConsumerState<_DocumentosTab> createState() => _DocumentosTabState();
}

class _DocumentosTabState extends ConsumerState<_DocumentosTab> {
  bool _subiendo = false;

  Future<void> _subirDocumento() async {
    final opcion = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Tomar foto'),
              onTap: () => Navigator.pop(ctx, 'camera'),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Galería'),
              onTap: () => Navigator.pop(ctx, 'gallery'),
            ),
            ListTile(
              leading: const Icon(Icons.attach_file),
              title: const Text('Archivo (PDF, Word, Excel…)'),
              onTap: () => Navigator.pop(ctx, 'file'),
            ),
          ],
        ),
      ),
    );
    if (opcion == null) return;

    String? filePath;
    String? fileName;

    if (opcion == 'camera' || opcion == 'gallery') {
      final picker = ImagePicker();
      final xFile = await picker.pickImage(
        source: opcion == 'camera' ? ImageSource.camera : ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (xFile == null) return;
      filePath = xFile.path;
      fileName = xFile.name;
    } else {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: [
          'pdf',
          'doc',
          'docx',
          'xls',
          'xlsx',
          'txt',
          'jpg',
          'jpeg',
          'png',
        ],
      );
      if (result == null || result.files.isEmpty) return;
      final file = result.files.first;
      if (file.path == null) return;
      filePath = file.path!;
      fileName = file.name;
    }

    setState(() => _subiendo = true);
    try {
      final repo = ref.read(casosRepositoryProvider);
      await repo.uploadDocumento(
        widget.casoId,
        filePath: filePath,
        fileName: fileName,
      );
      ref.invalidate(documentosCasoProvider(widget.casoId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Documento subido correctamente'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error al subir documento')),
        );
      }
    } finally {
      if (mounted) setState(() => _subiendo = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final asyncDocs = ref.watch(documentosCasoProvider(widget.casoId));
    final theme = Theme.of(context);
    final fechaFmt = DateFormat('dd MMM yyyy', 'es_MX');
    final api = ref.watch(apiClientProvider);

    return Column(
      children: [
        Expanded(
          child: asyncDocs.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: TextButton(
                onPressed: () =>
                    ref.invalidate(documentosCasoProvider(widget.casoId)),
                child: const Text('Reintentar'),
              ),
            ),
            data: (docs) {
              if (docs.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.folder_open,
                        size: 48,
                        color: AppColors.neutral400,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      const Text(
                        'Sin documentos',
                        style: TextStyle(color: AppColors.neutral500),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      FilledButton.icon(
                        onPressed: _subiendo ? null : _subirDocumento,
                        icon: const Icon(Icons.add_a_photo),
                        label: const Text('Subir primera foto'),
                      ),
                    ],
                  ),
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: docs.length,
                itemBuilder: (context, i) {
                  final doc = docs[i];

                  return Card(
                    margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      onTap: () => _openDocument(context, ref, doc),
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.sm),
                        child: Row(
                          children: [
                            _DocThumbnail(
                              doc: doc,
                              casoId: widget.casoId,
                              api: api,
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    doc.nombre,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${doc.fileSizeLabel} · ${fechaFmt.format(doc.createdAt)}',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: AppColors.neutral500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Icon(
                              doc.esImagen ? Icons.zoom_in : Icons.open_in_new,
                              size: 20,
                              color: AppColors.neutral400,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),

        // Barra de subir documento
        Container(
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            border: Border(top: BorderSide(color: AppColors.neutral200)),
          ),
          child: SafeArea(
            child: SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _subiendo ? null : _subirDocumento,
                icon: _subiendo
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.add_a_photo),
                label: Text(_subiendo ? 'Subiendo...' : 'Adjuntar documento'),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _openDocument(
    BuildContext context,
    WidgetRef ref,
    DocumentoCaso doc,
  ) async {
    final api = ref.read(apiClientProvider);
    final presignedUrl = await api.getDocumentoPresignedUrl(doc.casoId, doc.id);
    if (presignedUrl == null || !context.mounted) return;

    if (doc.esImagen) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              _ImageViewerScreen(nombre: doc.nombre, imageUrl: presignedUrl),
        ),
      );
    } else {
      final uri = Uri.parse(presignedUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No se pudo abrir el documento')),
          );
        }
      }
    }
  }
}

class _DocThumbnail extends StatefulWidget {
  final DocumentoCaso doc;
  final String casoId;
  final ApiClient api;

  const _DocThumbnail({
    required this.doc,
    required this.casoId,
    required this.api,
  });

  @override
  State<_DocThumbnail> createState() => _DocThumbnailState();
}

class _DocThumbnailState extends State<_DocThumbnail> {
  String? _presignedUrl;

  @override
  void initState() {
    super.initState();
    if (widget.doc.esImagen) {
      widget.api.getDocumentoPresignedUrl(widget.casoId, widget.doc.id).then((
        url,
      ) {
        if (mounted && url != null) setState(() => _presignedUrl = url);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.doc.esImagen && _presignedUrl != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.sm),
        child: Image.network(
          _presignedUrl!,
          width: 56,
          height: 56,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _iconFallback(),
        ),
      );
    }
    return _iconFallback();
  }

  Widget _iconFallback() {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Icon(
        widget.doc.esImagen
            ? Icons.image
            : widget.doc.esPdf
            ? Icons.picture_as_pdf
            : Icons.insert_drive_file,
        color: AppColors.primary,
        size: 28,
      ),
    );
  }
}

/// Visor fullscreen de imágenes de documentos.
class _ImageViewerScreen extends StatelessWidget {
  final String nombre;
  final String imageUrl;

  const _ImageViewerScreen({required this.nombre, required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(nombre, style: const TextStyle(fontSize: 16)),
      ),
      body: Center(
        child: InteractiveViewer(
          minScale: 0.5,
          maxScale: 4.0,
          child: Image.network(
            imageUrl,
            fit: BoxFit.contain,
            loadingBuilder: (_, child, progress) {
              if (progress == null) return child;
              return const Center(
                child: CircularProgressIndicator(color: Colors.white),
              );
            },
            errorBuilder: (_, __, ___) => const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.broken_image, color: Colors.white54, size: 64),
                  SizedBox(height: 16),
                  Text(
                    'No se pudo cargar la imagen',
                    style: TextStyle(color: Colors.white54),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// Avatar de asociado con foto del servidor
// ═══════════════════════════════════════════════════════════════

class _AsociadoAvatar extends ConsumerStatefulWidget {
  final AsociadoResumen asociado;
  final String casoId;
  const _AsociadoAvatar({required this.asociado, required this.casoId});

  @override
  ConsumerState<_AsociadoAvatar> createState() => _AsociadoAvatarState();
}

class _AsociadoAvatarState extends ConsumerState<_AsociadoAvatar> {
  String? _token;

  @override
  void initState() {
    super.initState();
    if (widget.asociado.fotoUrl != null) {
      ref.read(apiClientProvider).getAccessToken().then((t) {
        if (mounted) setState(() => _token = t);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = ref.watch(apiClientProvider);
    final asociado = widget.asociado;
    final hasFoto = asociado.fotoUrl != null && _token != null;

    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: AppColors.primaryLight.withValues(alpha: 0.15),
          backgroundImage: hasFoto
              ? NetworkImage(
                  api.asociadoFotoUrl(widget.casoId),
                  headers: {'Authorization': 'Bearer $_token'},
                )
              : null,
          onBackgroundImageError: hasFoto ? (_, __) {} : null,
          child: !hasFoto
              ? Text(
                  _iniciales(asociado.nombreCompleto),
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryLight,
                  ),
                )
              : null,
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            asociado.nombreCompleto,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  String _iniciales(String nombre) {
    final parts = nombre.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty)
      return parts[0][0].toUpperCase();
    return '?';
  }
}

// ═══════════════════════════════════════════════════════════════
// Fila de vehículo con icono
// ═══════════════════════════════════════════════════════════════

class _VehiculoRow extends ConsumerStatefulWidget {
  final VehiculoResumen vehiculo;
  final String casoId;
  const _VehiculoRow({required this.vehiculo, required this.casoId});

  @override
  ConsumerState<_VehiculoRow> createState() => _VehiculoRowState();
}

class _VehiculoRowState extends ConsumerState<_VehiculoRow> {
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
    final api = ref.watch(apiClientProvider);
    final v = widget.vehiculo;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail del vehículo
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.sm),
            child: _token != null
                ? Image.network(
                    api.vehiculoFotoUrl(widget.casoId, v.id),
                    headers: {'Authorization': 'Bearer $_token'},
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _vehicleIcon(),
                  )
                : _vehicleIcon(),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  v.descripcion,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (v.placas != null)
                  Text(
                    v.placas!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral500,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _vehicleIcon() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: const Icon(
        Icons.directions_car,
        color: AppColors.primary,
        size: 24,
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// Barra de acciones del caso
// ═══════════════════════════════════════════════════════════════

class _AccionesBar extends ConsumerStatefulWidget {
  final CasoLegal caso;
  const _AccionesBar({required this.caso});

  @override
  ConsumerState<_AccionesBar> createState() => _AccionesBarState();
}

class _AccionesBarState extends ConsumerState<_AccionesBar> {
  bool _loading = false;

  Future<void> _cambiarEstado(String nuevoEstado) async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(casosRepositoryProvider);
      await repo.cambiarEstado(widget.caso.id, nuevoEstado);
      ref.invalidate(casoDetailProvider(widget.caso.id));
      ref.read(misCasosProvider.notifier).refresh();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error al cambiar estado')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmarAccion(String titulo, String estado) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(titulo),
        content: Text(
          '¿Confirmas cambiar el estado a "${_estadoLabel(estado)}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _cambiarEstado(estado);
    }
  }

  String _estadoLabel(String estado) {
    switch (estado) {
      case 'en_atencion':
        return 'En atención';
      case 'escalado':
        return 'Escalado';
      case 'resuelto':
        return 'Resuelto';
      default:
        return estado;
    }
  }

  @override
  Widget build(BuildContext context) {
    final caso = widget.caso;

    // Determinar acciones disponibles según estado actual
    final acciones = <Widget>[];

    if (caso.estado == 'abierto' || caso.estado == 'asignado') {
      acciones.add(
        OutlinedButton.icon(
          onPressed: _loading
              ? null
              : () => _confirmarAccion('Iniciar atención', 'en_atencion'),
          icon: const Icon(Icons.play_arrow, size: 18),
          label: const Text('Iniciar atención'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            side: const BorderSide(color: AppColors.primary),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          ),
        ),
      );
    }

    if (caso.estado == 'en_atencion') {
      acciones.addAll([
        OutlinedButton.icon(
          onPressed: _loading
              ? null
              : () => _confirmarAccion('Escalar caso', 'escalado'),
          icon: const Icon(Icons.arrow_upward, size: 18),
          label: const Text('Escalar'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF7C3AED),
            side: const BorderSide(color: Color(0xFF7C3AED)),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        OutlinedButton.icon(
          onPressed: _loading
              ? null
              : () => _confirmarAccion('Resolver caso', 'resuelto'),
          icon: const Icon(Icons.check_circle, size: 18),
          label: const Text('Resolver'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.success,
            side: const BorderSide(color: AppColors.success),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          ),
        ),
      ]);
    }

    if (caso.estado == 'escalado') {
      acciones.add(
        OutlinedButton.icon(
          onPressed: _loading
              ? null
              : () => _confirmarAccion('Resolver caso', 'resuelto'),
          icon: const Icon(Icons.check_circle, size: 18),
          label: const Text('Resolver'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.success,
            side: const BorderSide(color: AppColors.success),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          ),
        ),
      );
    }

    if (acciones.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(top: BorderSide(color: AppColors.neutral200)),
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: acciones,
        ),
      ),
    );
  }
}
