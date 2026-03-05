import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/theme/app_theme.dart';
import '../../data/models/vehiculo.dart';
import '../providers/profile_provider.dart';

class AddVehicleScreen extends ConsumerStatefulWidget {
  final Vehiculo? vehiculo;

  const AddVehicleScreen({super.key, this.vehiculo});

  @override
  ConsumerState<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends ConsumerState<AddVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _marcaCtrl;
  late TextEditingController _modeloCtrl;
  late TextEditingController _anioCtrl;
  late TextEditingController _colorCtrl;
  late TextEditingController _placasCtrl;
  late TextEditingController _serieCtrl;
  late bool _esPrincipal;
  bool _saving = false;

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
    _esPrincipal = v?.esPrincipal ?? true;
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
        'esPrincipal': _esPrincipal,
      };
      if (_serieCtrl.text.trim().isNotEmpty) {
        data['numeroSerie'] = _serieCtrl.text.trim();
      }

      final notifier = ref.read(vehiculosProvider.notifier);
      if (_isEditing) {
        await notifier.updateVehiculo(widget.vehiculo!.id, data);
      } else {
        await notifier.addVehiculo(data);
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
              TextFormField(
                controller: _marcaCtrl,
                decoration: const InputDecoration(
                  labelText: 'Marca',
                  prefixIcon: Icon(Icons.directions_car_outlined),
                  hintText: 'Ej. Nissan',
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _modeloCtrl,
                decoration: const InputDecoration(
                  labelText: 'Modelo',
                  prefixIcon: Icon(Icons.badge_outlined),
                  hintText: 'Ej. Versa',
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                textCapitalization: TextCapitalization.words,
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
              SwitchListTile(
                title: const Text('Vehículo principal'),
                subtitle: const Text('Se usará como vehículo predeterminado'),
                value: _esPrincipal,
                onChanged: (v) => setState(() => _esPrincipal = v),
                activeColor: AppColors.primary,
                contentPadding: EdgeInsets.zero,
              ),
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
