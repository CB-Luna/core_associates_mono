import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/status_badge.dart';
import '../models/caso_legal.dart';
import '../models/nota_caso.dart';

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
          _InfoRow(
            icon: Icons.person,
            label: 'Nombre',
            value: caso.asociado!.nombreCompleto,
          ),
          if (caso.asociado!.telefono != null)
            _InfoRow(
              icon: Icons.phone,
              label: 'Teléfono',
              value: caso.asociado!.telefono!,
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
              (v) => _InfoRow(
                icon: Icons.directions_car,
                label: v.placas ?? '',
                value: v.descripcion,
              ),
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

class _DocumentosTab extends ConsumerWidget {
  final String casoId;
  const _DocumentosTab({required this.casoId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncDocs = ref.watch(documentosCasoProvider(casoId));
    final theme = Theme.of(context);
    final fechaFmt = DateFormat('dd MMM yyyy', 'es_MX');

    return asyncDocs.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: TextButton(
          onPressed: () => ref.invalidate(documentosCasoProvider(casoId)),
          child: const Text('Reintentar'),
        ),
      ),
      data: (docs) {
        if (docs.isEmpty) {
          return const Center(
            child: Text(
              'Sin documentos',
              style: TextStyle(color: AppColors.neutral500),
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: docs.length,
          itemBuilder: (context, i) {
            final doc = docs[i];
            return ListTile(
              leading: Icon(
                doc.esImagen
                    ? Icons.image
                    : doc.esPdf
                    ? Icons.picture_as_pdf
                    : Icons.insert_drive_file,
                color: AppColors.primary,
              ),
              title: Text(
                doc.nombre,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              subtitle: Text(
                '${doc.fileSizeLabel} · ${fechaFmt.format(doc.createdAt)}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.neutral500,
                ),
              ),
              trailing: const Icon(Icons.open_in_new, size: 18),
              onTap: () {
                // TODO: abrir/descargar documento
              },
            );
          },
        );
      },
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

    if (caso.estado == 'asignado') {
      acciones.add(
        Expanded(
          child: FilledButton.icon(
            onPressed: _loading
                ? null
                : () => _confirmarAccion('Iniciar atención', 'en_atencion'),
            icon: const Icon(Icons.play_arrow),
            label: const Text('Iniciar atención'),
          ),
        ),
      );
    }

    if (caso.estado == 'en_atencion') {
      acciones.addAll([
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _loading
                ? null
                : () => _confirmarAccion('Escalar caso', 'escalado'),
            icon: const Icon(Icons.arrow_upward),
            label: const Text('Escalar'),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: FilledButton.icon(
            onPressed: _loading
                ? null
                : () => _confirmarAccion('Resolver caso', 'resuelto'),
            icon: const Icon(Icons.check_circle),
            label: const Text('Resolver'),
          ),
        ),
      ]);
    }

    if (acciones.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(top: BorderSide(color: AppColors.neutral200)),
      ),
      child: SafeArea(child: Row(children: acciones)),
    );
  }
}
