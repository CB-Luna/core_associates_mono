import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../shared/theme/app_theme.dart';
import '../providers/profile_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nombreCtrl;
  late TextEditingController _apellidoPatCtrl;
  late TextEditingController _apellidoMatCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _fechaNacCtrl;
  bool _saving = false;
  bool _uploadingFoto = false;

  @override
  void initState() {
    super.initState();
    final asociado = ref.read(profileProvider).value;
    _nombreCtrl = TextEditingController(text: asociado?.nombre ?? '');
    _apellidoPatCtrl = TextEditingController(text: asociado?.apellidoPat ?? '');
    _apellidoMatCtrl = TextEditingController(text: asociado?.apellidoMat ?? '');
    _emailCtrl = TextEditingController(text: asociado?.email ?? '');
    _fechaNacCtrl = TextEditingController(
      text: asociado?.fechaNacimiento ?? '',
    );
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _apellidoPatCtrl.dispose();
    _apellidoMatCtrl.dispose();
    _emailCtrl.dispose();
    _fechaNacCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initial =
        DateTime.tryParse(_fechaNacCtrl.text) ??
        DateTime(now.year - 25, now.month, now.day);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1940),
      lastDate: DateTime(now.year - 16, now.month, now.day),
    );
    if (picked != null) {
      _fechaNacCtrl.text =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    }
  }

  Future<void> _pickAndUploadFoto() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      imageQuality: 85,
    );
    if (image == null) return;

    setState(() => _uploadingFoto = true);
    try {
      await ref.read(profileProvider.notifier).uploadFoto(image.path);
      // Evict the cached photo so CachedNetworkImage re-fetches
      final url = ref.read(fotoUrlProvider);
      await CachedNetworkImage.evictFromCache(url);
      ref.invalidate(fotoUrlProvider);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Foto actualizada')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al subir foto: $e')));
      }
    } finally {
      if (mounted) setState(() => _uploadingFoto = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      final data = <String, dynamic>{};
      if (_nombreCtrl.text.isNotEmpty) data['nombre'] = _nombreCtrl.text.trim();
      if (_apellidoPatCtrl.text.isNotEmpty) {
        data['apellidoPat'] = _apellidoPatCtrl.text.trim();
      }
      data['apellidoMat'] = _apellidoMatCtrl.text.trim().isEmpty
          ? null
          : _apellidoMatCtrl.text.trim();
      if (_emailCtrl.text.isNotEmpty) data['email'] = _emailCtrl.text.trim();
      if (_fechaNacCtrl.text.isNotEmpty) {
        data['fechaNacimiento'] = _fechaNacCtrl.text.trim();
      }

      await ref.read(profileProvider.notifier).updateProfile(data);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Perfil actualizado')));
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al guardar: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Editar Perfil')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Foto de perfil
              Center(
                child: GestureDetector(
                  onTap: _uploadingFoto ? null : _pickAndUploadFoto,
                  child: Stack(
                    children: [
                      Consumer(
                        builder: (context, ref, _) {
                          final fotoUrl = ref.watch(fotoUrlProvider);
                          return CircleAvatar(
                            radius: 48,
                            backgroundColor: AppColors.primary.withValues(
                              alpha: 0.1,
                            ),
                            backgroundImage: CachedNetworkImageProvider(
                              fotoUrl,
                            ),
                            onBackgroundImageError: (_, __) {},
                            child: null,
                          );
                        },
                      ),
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
                          child: _uploadingFoto
                              ? const SizedBox(
                                  height: 16,
                                  width: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(
                                  Icons.camera_alt,
                                  size: 16,
                                  color: Colors.white,
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _nombreCtrl,
                decoration: const InputDecoration(
                  labelText: 'Nombre',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _apellidoPatCtrl,
                decoration: const InputDecoration(
                  labelText: 'Apellido Paterno',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _apellidoMatCtrl,
                decoration: const InputDecoration(
                  labelText: 'Apellido Materno (opcional)',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailCtrl,
                decoration: const InputDecoration(
                  labelText: 'Correo electrónico',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _fechaNacCtrl,
                decoration: InputDecoration(
                  labelText: 'Fecha de nacimiento',
                  prefixIcon: const Icon(Icons.cake_outlined),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.calendar_today),
                    onPressed: _pickDate,
                  ),
                ),
                readOnly: true,
                onTap: _pickDate,
              ),
              const SizedBox(height: 32),
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
                    : const Text('Guardar Cambios'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
