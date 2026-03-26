import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/api/api_client.dart';
import '../../../../core/constants/vehiculo_catalogo.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../data/models/vehiculo.dart';
import '../../data/profile_repository.dart';
import '../providers/profile_provider.dart';

class AddVehicleScreen extends ConsumerStatefulWidget {
  final Vehiculo? vehiculo;

  const AddVehicleScreen({super.key, this.vehiculo});

  @override
  ConsumerState<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends ConsumerState<AddVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _picker = ImagePicker();
  late TextEditingController _marcaCtrl;
  late TextEditingController _modeloCtrl;
  late TextEditingController _anioCtrl;
  late TextEditingController _colorCtrl;
  late TextEditingController _placasCtrl;
  late TextEditingController _serieCtrl;
  bool _saving = false;
  String? _pickedPhotoPath;

  bool get _isEditing => widget.vehiculo != null;

  @override
  void initState() {
    super.initState();
    final v = widget.vehiculo;
    _marcaCtrl = TextEditingController(text: v?.marca ?? '');
    _modeloCtrl = TextEditingController(text: v?.modelo ?? '');
    _anioCtrl = TextEditingController(text: v != null ? '${v.anio}' : '');
    _colorCtrl = TextEditingController(text: v?.color ?? '');
    _placasCtrl = TextEditingController(text: v?.placas ?? '');
    _serieCtrl = TextEditingController(text: v?.numeroSerie ?? '');
  }

  @override
  void dispose() {
    _marcaCtrl.dispose();
    _modeloCtrl.dispose();
    _anioCtrl.dispose();
    _colorCtrl.dispose();
    _placasCtrl.dispose();
    _serieCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
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

    final picked = await _picker.pickImage(
      source: source,
      imageQuality: 85,
      maxWidth: 800,
    );
    if (picked != null && mounted) {
      setState(() => _pickedPhotoPath = picked.path);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      final data = <String, dynamic>{
        'marca': _marcaCtrl.text.trim(),
        'modelo': _modeloCtrl.text.trim(),
        'anio': int.parse(_anioCtrl.text.trim()),
        'color': _colorCtrl.text.trim(),
        'placas': _placasCtrl.text.trim(),
        'esPrincipal': true,
      };
      if (_serieCtrl.text.trim().isNotEmpty) {
        data['numeroSerie'] = _serieCtrl.text.trim();
      }

      final notifier = ref.read(vehiculosProvider.notifier);
      Vehiculo result;
      if (_isEditing) {
        result = await notifier.updateVehiculo(widget.vehiculo!.id, data);
      } else {
        result = await notifier.addVehiculo(data);
      }

      // Upload photo if one was picked (non-blocking: vehicle already saved)
      if (_pickedPhotoPath != null) {
        try {
          final repo = ref.read(profileRepositoryProvider);
          await repo.uploadVehiculoFoto(result.id, _pickedPhotoPath!);
        } catch (_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Vehículo guardado, pero no se pudo subir la foto',
                ),
              ),
            );
          }
        }
        ref.invalidate(vehiculosProvider);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isEditing ? 'Vehículo actualizado' : 'Vehículo agregado',
            ),
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _buildPhotoPreview() {
    final headers = ref.watch(authHeadersProvider).value ?? {};

    Widget content;
    if (_pickedPhotoPath != null) {
      content = ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.file(
          File(_pickedPhotoPath!),
          width: 120,
          height: 120,
          fit: BoxFit.cover,
        ),
      );
    } else if (_isEditing && widget.vehiculo!.fotoUrl != null) {
      final repo = ref.read(profileRepositoryProvider);
      final url = repo.getVehiculoFotoUrl(widget.vehiculo!.id);
      content = ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: url,
          httpHeaders: headers,
          width: 120,
          height: 120,
          fit: BoxFit.cover,
          placeholder: (_, __) =>
              const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          errorWidget: (_, __, ___) => const Icon(
            Icons.directions_car,
            size: 48,
            color: AppColors.primary,
          ),
        ),
      );
    } else {
      content = Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.camera_alt_outlined,
            size: 36,
            color: AppColors.primary.withValues(alpha: 0.6),
          ),
          const SizedBox(height: 4),
          Text(
            'Añadir foto',
            style: TextStyle(
              fontSize: 12,
              color: AppColors.primary.withValues(alpha: 0.6),
            ),
          ),
        ],
      );
    }

    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.3),
          width: 1.5,
        ),
      ),
      child: content,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Editar Vehículo' : 'Agregar Vehículo'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // --- Photo picker ---
              Center(
                child: GestureDetector(
                  onTap: _pickPhoto,
                  child: _buildPhotoPreview(),
                ),
              ),
              const SizedBox(height: 20),
              Autocomplete<String>(
                optionsBuilder: (textEditingValue) {
                  if (textEditingValue.text.isEmpty) return vehiculoMarcas;
                  final query = textEditingValue.text.toLowerCase();
                  return vehiculoMarcas.where(
                    (m) => m.toLowerCase().contains(query),
                  );
                },
                onSelected: (marca) {
                  _marcaCtrl.text = marca;
                  _modeloCtrl.clear();
                  setState(() {});
                },
                fieldViewBuilder:
                    (context, controller, focusNode, onFieldSubmitted) {
                      // Sync with external controller
                      if (controller.text != _marcaCtrl.text) {
                        controller.text = _marcaCtrl.text;
                      }
                      return TextFormField(
                        controller: controller,
                        focusNode: focusNode,
                        decoration: const InputDecoration(
                          labelText: 'Marca',
                          prefixIcon: Icon(Icons.directions_car_outlined),
                          hintText: 'Ej. Nissan',
                        ),
                        validator: (v) => (v == null || v.trim().isEmpty)
                            ? 'Requerido'
                            : null,
                        textCapitalization: TextCapitalization.words,
                        onChanged: (v) => _marcaCtrl.text = v,
                      );
                    },
              ),
              const SizedBox(height: 16),
              Autocomplete<String>(
                optionsBuilder: (textEditingValue) {
                  final modelos = modelosPorMarca(_marcaCtrl.text);
                  if (modelos.isEmpty) return const Iterable<String>.empty();
                  if (textEditingValue.text.isEmpty) return modelos;
                  final query = textEditingValue.text.toLowerCase();
                  return modelos.where((m) => m.toLowerCase().contains(query));
                },
                onSelected: (modelo) {
                  _modeloCtrl.text = modelo;
                },
                fieldViewBuilder:
                    (context, controller, focusNode, onFieldSubmitted) {
                      if (controller.text != _modeloCtrl.text) {
                        controller.text = _modeloCtrl.text;
                      }
                      return TextFormField(
                        controller: controller,
                        focusNode: focusNode,
                        decoration: const InputDecoration(
                          labelText: 'Modelo',
                          prefixIcon: Icon(Icons.badge_outlined),
                          hintText: 'Ej. Versa',
                        ),
                        validator: (v) => (v == null || v.trim().isEmpty)
                            ? 'Requerido'
                            : null,
                        textCapitalization: TextCapitalization.words,
                        onChanged: (v) => _modeloCtrl.text = v,
                      );
                    },
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _anioCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Año',
                        prefixIcon: Icon(Icons.calendar_today),
                        hintText: 'Ej. 2022',
                      ),
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Requerido';
                        final year = int.tryParse(v.trim());
                        if (year == null || year < 1990 || year > 2030) {
                          return 'Año inválido';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _colorCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Color',
                        prefixIcon: Icon(Icons.palette_outlined),
                        hintText: 'Ej. Blanco',
                      ),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                      textCapitalization: TextCapitalization.words,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _placasCtrl,
                decoration: const InputDecoration(
                  labelText: 'Placas',
                  prefixIcon: Icon(Icons.credit_card),
                  hintText: 'Ej. ABC-123-D',
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                textCapitalization: TextCapitalization.characters,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _serieCtrl,
                decoration: const InputDecoration(
                  labelText: 'Número de serie (opcional)',
                  prefixIcon: Icon(Icons.tag),
                  hintText: 'Ej. 3N1CN7AD0NL000001',
                ),
                textCapitalization: TextCapitalization.characters,
              ),
              const SizedBox(height: 16),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(_isEditing ? 'Guardar Cambios' : 'Agregar Vehículo'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
