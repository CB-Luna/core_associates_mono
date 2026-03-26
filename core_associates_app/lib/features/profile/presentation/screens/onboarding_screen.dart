import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/constants/vehiculo_catalogo.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../documents/data/documents_repository.dart';
import '../../../documents/presentation/providers/documents_provider.dart';
import '../../data/profile_repository.dart';
import '../providers/onboarding_provider.dart';
import '../providers/profile_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  // --- Profile form controllers ---
  final _profileFormKey = GlobalKey<FormState>();
  late TextEditingController _nombreCtrl;
  late TextEditingController _apellidoPatCtrl;
  late TextEditingController _apellidoMatCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _fechaNacCtrl;

  // --- Vehicle form controllers ---
  final _vehicleFormKey = GlobalKey<FormState>();
  late TextEditingController _marcaCtrl;
  late TextEditingController _modeloCtrl;
  late TextEditingController _anioCtrl;
  late TextEditingController _colorCtrl;
  late TextEditingController _placasCtrl;
  late TextEditingController _serieCtrl;

  // --- Document capture state ---
  final _picker = ImagePicker();
  String? _capturedImagePath;
  bool _isPreValidating = false;
  String? _preValidationError;

  // --- Vehicle photo (optional) ---
  String? _vehicleImagePath;

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

    _marcaCtrl = TextEditingController();
    _modeloCtrl = TextEditingController();
    _anioCtrl = TextEditingController();
    _colorCtrl = TextEditingController();
    _placasCtrl = TextEditingController();
    _serieCtrl = TextEditingController();

    // Auto-advance past already-completed steps
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _detectStartingStep();
    });
  }

  void _detectStartingStep() {
    final asociado = ref.read(profileProvider).value;
    if (asociado == null) return;

    final hasProfile =
        asociado.nombre.isNotEmpty && asociado.apellidoPat.isNotEmpty;
    final hasSelfie = asociado.fotoUrl != null && asociado.fotoUrl!.isNotEmpty;
    final hasVehicle = asociado.vehiculos.isNotEmpty;

    final notifier = ref.read(onboardingProvider.notifier);

    if (!hasProfile) return; // Start at step 0
    if (!hasSelfie) {
      notifier.goToStep(OnboardingStep.selfie);
      return;
    }
    if (!hasVehicle) {
      notifier.goToStep(OnboardingStep.vehiculo);
      return;
    }
    // Has profile + selfie + vehicle → go to tarjeta
    notifier.goToStep(OnboardingStep.tarjetaCirculacion);
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _apellidoPatCtrl.dispose();
    _apellidoMatCtrl.dispose();
    _emailCtrl.dispose();
    _fechaNacCtrl.dispose();
    _marcaCtrl.dispose();
    _modeloCtrl.dispose();
    _anioCtrl.dispose();
    _colorCtrl.dispose();
    _placasCtrl.dispose();
    _serieCtrl.dispose();
    super.dispose();
  }

  // ────────────────── Step labels & icons ──────────────────

  static const _stepLabels = [
    'Datos',
    'Selfie',
    'Vehículo',
    'Tarjeta',
    'INE Frente',
    'INE Reverso',
  ];

  static const _stepIcons = [
    Icons.person_outline,
    Icons.camera_alt_outlined,
    Icons.directions_car_outlined,
    Icons.credit_card_outlined,
    Icons.badge_outlined,
    Icons.badge_outlined,
  ];

  // ────────────────── Actions ──────────────────

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

  Future<void> _saveProfile() async {
    if (!_profileFormKey.currentState!.validate()) return;

    final notifier = ref.read(onboardingProvider.notifier);
    notifier.setSaving(true);
    try {
      final data = <String, dynamic>{
        'nombre': _nombreCtrl.text.trim(),
        'apellidoPat': _apellidoPatCtrl.text.trim(),
      };
      if (_apellidoMatCtrl.text.trim().isNotEmpty) {
        data['apellidoMat'] = _apellidoMatCtrl.text.trim();
      }
      if (_emailCtrl.text.trim().isNotEmpty) {
        data['email'] = _emailCtrl.text.trim();
      }
      if (_fechaNacCtrl.text.trim().isNotEmpty) {
        data['fechaNacimiento'] = _fechaNacCtrl.text.trim();
      }

      await ref.read(profileProvider.notifier).updateProfile(data);

      notifier.nextStep();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al guardar: $e')));
      }
    } finally {
      notifier.setSaving(false);
    }
  }

  Future<void> _captureDocument(String tipo, {bool cameraOnly = false}) async {
    setState(() {
      _capturedImagePath = null;
      _preValidationError = null;
    });

    ImageSource? source;
    if (cameraOnly) {
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
      imageQuality: 85,
      maxWidth: 1200,
      preferredCameraDevice: tipo == 'selfie'
          ? CameraDevice.front
          : CameraDevice.rear,
    );
    if (picked == null || !mounted) return;

    setState(() {
      _capturedImagePath = picked.path;
      _isPreValidating = true;
      _preValidationError = null;
    });

    // Pre-validate with AI
    try {
      final repo = ref.read(documentsRepositoryProvider);
      final result = await repo.preValidar(picked.path, tipo);
      final valida = result['valida'] as bool? ?? false;

      if (!mounted) return;

      if (!valida) {
        setState(() {
          _preValidationError =
              result['motivo'] as String? ?? 'La imagen no pasó la validación';
          _isPreValidating = false;
        });
      } else {
        setState(() => _isPreValidating = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          // If pre-validation fails, allow upload anyway (non-blocking)
          _isPreValidating = false;
        });
      }
    }
  }

  Future<void> _uploadAndAdvance(String tipo) async {
    if (_capturedImagePath == null) return;

    final notifier = ref.read(onboardingProvider.notifier);
    notifier.setSaving(true);
    try {
      if (tipo == 'selfie') {
        // Upload selfie as profile photo
        await ref
            .read(profileRepositoryProvider)
            .uploadFoto(_capturedImagePath!);
        ref.invalidate(profileProvider);
      } else {
        // Upload as document
        await ref
            .read(documentsProvider.notifier)
            .uploadDocument(_capturedImagePath!, tipo);
      }

      if (mounted) {
        setState(() {
          _capturedImagePath = null;
          _preValidationError = null;
        });

        // Mark profile complete after tarjeta de circulación (last mandatory step)
        if (tipo == 'tarjeta_circulacion') {
          ref.read(authStateProvider.notifier).markProfileComplete();
        }

        notifier.nextStep();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al subir: $e')));
      }
    } finally {
      notifier.setSaving(false);
    }
  }

  Future<void> _saveVehicle() async {
    if (!_vehicleFormKey.currentState!.validate()) return;

    final notifier = ref.read(onboardingProvider.notifier);
    notifier.setSaving(true);
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

      final vehiculo = await ref.read(vehiculosProvider.notifier).addVehiculo(data);

      // Subir foto del vehículo (opcional, no bloquea el avance)
      if (_vehicleImagePath != null) {
        try {
          await ref
              .read(profileRepositoryProvider)
              .uploadVehiculoFoto(vehiculo.id, _vehicleImagePath!);
        } catch (_) {}
        if (mounted) setState(() => _vehicleImagePath = null);
      }

      notifier.nextStep();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al guardar vehículo: $e')),
        );
      }
    } finally {
      notifier.setSaving(false);
    }
  }

  void _skipIne() {
    ref.read(onboardingProvider.notifier).skipIne();
    context.go('/home');
  }

  // ────────────────── Build ──────────────────

  @override
  Widget build(BuildContext context) {
    final obState = ref.watch(onboardingProvider);
    final stepIndex = obState.stepIndex;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Progress bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: _OnboardingProgressBar(
                currentStep: stepIndex,
                totalSteps: _stepLabels.length,
                labels: _stepLabels,
                icons: _stepIcons,
              ),
            ),
            const SizedBox(height: 20),
            // Step content
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _buildCurrentStep(obState),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentStep(OnboardingState obState) {
    switch (obState.currentStep) {
      case OnboardingStep.datosPersonales:
        return _buildProfileStep(obState);
      case OnboardingStep.selfie:
        return _buildDocCaptureStep(
          key: const ValueKey('selfie'),
          title: 'Tómate una selfie',
          subtitle:
              'Necesitamos verificar tu identidad con una foto en tiempo real.',
          icon: Icons.camera_alt_outlined,
          tipo: 'selfie',
          cameraOnly: true,
          isSaving: obState.isSaving,
        );
      case OnboardingStep.vehiculo:
        return _buildVehicleStep(obState);
      case OnboardingStep.tarjetaCirculacion:
        return _buildDocCaptureStep(
          key: const ValueKey('tarjeta'),
          title: 'Tarjeta de circulación',
          subtitle: 'Fotografía la tarjeta de circulación de tu vehículo.',
          icon: Icons.credit_card_outlined,
          tipo: 'tarjeta_circulacion',
          cameraOnly: false,
          isSaving: obState.isSaving,
        );
      case OnboardingStep.ineFront:
        return _buildDocCaptureStep(
          key: const ValueKey('ine_frente'),
          title: 'INE — Frente',
          subtitle: 'Fotografía el frente de tu credencial INE.',
          icon: Icons.badge_outlined,
          tipo: 'ine_frente',
          cameraOnly: false,
          isSaving: obState.isSaving,
          isOptional: true,
        );
      case OnboardingStep.ineReverso:
        return _buildDocCaptureStep(
          key: const ValueKey('ine_reverso'),
          title: 'INE — Reverso',
          subtitle: 'Ahora fotografía el reverso de tu INE.',
          icon: Icons.badge_outlined,
          tipo: 'ine_reverso',
          cameraOnly: false,
          isSaving: obState.isSaving,
          isOptional: true,
        );
    }
  }

  // ────────────────── Step 0: Profile form ──────────────────

  Widget _buildProfileStep(OnboardingState obState) {
    return SingleChildScrollView(
      key: const ValueKey('profile'),
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _profileFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(
              Icons.person_add_outlined,
              size: 56,
              color: AppColors.primary.withValues(alpha: 0.7),
            ),
            const SizedBox(height: 12),
            Text(
              '¡Bienvenido a Core Associates!',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Completa tus datos para iniciar la activación de tu membresía',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            TextFormField(
              controller: _nombreCtrl,
              decoration: const InputDecoration(
                labelText: 'Nombre *',
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
                labelText: 'Apellido Paterno *',
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
              onPressed: obState.isSaving ? null : _saveProfile,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: obState.isSaving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Continuar'),
            ),
          ],
        ),
      ),
    );
  }

  // ────────────────── Steps 1,3,4,5: Document capture ──────────────────

  Widget _buildDocCaptureStep({
    required Key key,
    required String title,
    required String subtitle,
    required IconData icon,
    required String tipo,
    required bool cameraOnly,
    required bool isSaving,
    bool isOptional = false,
  }) {
    return SingleChildScrollView(
      key: key,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(icon, size: 56, color: AppColors.primary.withValues(alpha: 0.7)),
          const SizedBox(height: 12),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // Image preview / capture area
          GestureDetector(
            onTap: isSaving
                ? null
                : () => _captureDocument(tipo, cameraOnly: cameraOnly),
            child: Container(
              height: 260,
              decoration: BoxDecoration(
                color: AppColors.primary50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _preValidationError != null
                      ? AppColors.error
                      : AppColors.primary200,
                  width: 2,
                ),
              ),
              child: _capturedImagePath != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.file(
                            File(_capturedImagePath!),
                            fit: BoxFit.cover,
                          ),
                          if (_isPreValidating)
                            Container(
                              color: Colors.black38,
                              child: const Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    CircularProgressIndicator(
                                      color: Colors.white,
                                    ),
                                    SizedBox(height: 12),
                                    Text(
                                      'Analizando imagen...',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          // Re-take button
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Material(
                              color: Colors.black54,
                              shape: const CircleBorder(),
                              child: IconButton(
                                icon: const Icon(
                                  Icons.refresh,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                onPressed: isSaving
                                    ? null
                                    : () => _captureDocument(
                                        tipo,
                                        cameraOnly: cameraOnly,
                                      ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  : tipo == 'selfie'
                  // ── Oval face guide for selfie ──
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 140,
                          height: 180,
                          child: CustomPaint(
                            painter: _OvalGuidePainter(
                              color: AppColors.primary.withValues(alpha: 0.6),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Centra tu rostro en el óvalo',
                          style: TextStyle(
                            color: AppColors.primary.withValues(alpha: 0.7),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Toca para abrir la cámara',
                          style: TextStyle(
                            color: AppColors.primary.withValues(alpha: 0.5),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    )
                  // ── Default empty state for non-selfie docs ──
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          cameraOnly
                              ? Icons.camera_alt_outlined
                              : Icons.add_photo_alternate_outlined,
                          size: 56,
                          color: AppColors.primary.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          cameraOnly
                              ? 'Toca para abrir la cámara'
                              : 'Toca para capturar o seleccionar',
                          style: TextStyle(
                            color: AppColors.primary.withValues(alpha: 0.7),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
            ),
          ),

          // Pre-validation error
          if (_preValidationError != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: AppColors.error.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.warning_amber_rounded,
                    color: AppColors.error,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _preValidationError!,
                      style: const TextStyle(
                        color: AppColors.error,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Upload button
          ElevatedButton(
            onPressed:
                (_capturedImagePath != null &&
                    !_isPreValidating &&
                    _preValidationError == null &&
                    !isSaving)
                ? () => _uploadAndAdvance(tipo)
                : null,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: isSaving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Subir y continuar'),
          ),

          // Reintentar — re-open camera when AI rejected the document
          if (_preValidationError != null && !isSaving) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () {
                setState(() {
                  _capturedImagePath = null;
                  _preValidationError = null;
                });
                _captureDocument(tipo, cameraOnly: cameraOnly);
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
            ),
          ],

          // Skip for optional steps (INE)
          if (isOptional) ...[
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: isSaving ? null : _skipIne,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Hacerlo después'),
            ),
          ],
        ],
      ),
    );
  }

  // ────────────────── Step 2: Vehicle registration ──────────────────

  Widget _buildVehicleStep(OnboardingState obState) {
    return SingleChildScrollView(
      key: const ValueKey('vehiculo'),
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _vehicleFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(
              Icons.directions_car_outlined,
              size: 56,
              color: AppColors.primary.withValues(alpha: 0.7),
            ),
            const SizedBox(height: 12),
            Text(
              'Registra tu vehículo',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Tu membresía incluye un vehículo. Ingresa los datos.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
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
                    if (controller.text != _marcaCtrl.text) {
                      controller.text = _marcaCtrl.text;
                    }
                    return TextFormField(
                      controller: controller,
                      focusNode: focusNode,
                      decoration: const InputDecoration(
                        labelText: 'Marca *',
                        prefixIcon: Icon(Icons.directions_car_outlined),
                        hintText: 'Ej. Nissan',
                      ),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Requerido' : null,
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
              onSelected: (modelo) => _modeloCtrl.text = modelo,
              fieldViewBuilder:
                  (context, controller, focusNode, onFieldSubmitted) {
                    if (controller.text != _modeloCtrl.text) {
                      controller.text = _modeloCtrl.text;
                    }
                    return TextFormField(
                      controller: controller,
                      focusNode: focusNode,
                      decoration: const InputDecoration(
                        labelText: 'Modelo *',
                        prefixIcon: Icon(Icons.car_repair_outlined),
                        hintText: 'Ej. Versa',
                      ),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                      textCapitalization: TextCapitalization.words,
                      onChanged: (v) => _modeloCtrl.text = v,
                    );
                  },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _anioCtrl,
              decoration: const InputDecoration(
                labelText: 'Año *',
                prefixIcon: Icon(Icons.calendar_today_outlined),
                hintText: 'Ej. 2020',
              ),
              keyboardType: TextInputType.number,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Requerido';
                final n = int.tryParse(v.trim());
                if (n == null || n < 1990 || n > DateTime.now().year + 1) {
                  return 'Año no válido';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _colorCtrl,
              decoration: const InputDecoration(
                labelText: 'Color *',
                prefixIcon: Icon(Icons.palette_outlined),
                hintText: 'Ej. Blanco',
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Requerido' : null,
              textCapitalization: TextCapitalization.words,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _placasCtrl,
              decoration: const InputDecoration(
                labelText: 'Placas *',
                prefixIcon: Icon(Icons.pin_outlined),
                hintText: 'Ej. ABC-123-A',
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Requerido' : null,
              textCapitalization: TextCapitalization.characters,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _serieCtrl,
              decoration: const InputDecoration(
                labelText: 'No. de serie (opcional)',
                prefixIcon: Icon(Icons.tag_outlined),
              ),
              textCapitalization: TextCapitalization.characters,
            ),
            const SizedBox(height: 20),

            // Foto del vehículo (opcional)
            Text(
              'Foto del vehículo (opcional)',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: obState.isSaving
                  ? null
                  : () async {
                      final picked = await _picker.pickImage(
                        source: ImageSource.gallery,
                        imageQuality: 85,
                      );
                      if (picked != null && mounted) {
                        setState(() => _vehicleImagePath = picked.path);
                      }
                    },
              child: Container(
                height: 140,
                decoration: BoxDecoration(
                  color: AppColors.primary50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary200, width: 1.5),
                ),
                child: _vehicleImagePath != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(11),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.file(
                              File(_vehicleImagePath!),
                              fit: BoxFit.cover,
                            ),
                            Positioned(
                              top: 6,
                              right: 6,
                              child: Material(
                                color: Colors.black54,
                                shape: const CircleBorder(),
                                child: IconButton(
                                  iconSize: 18,
                                  icon: const Icon(
                                    Icons.close,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                  onPressed: obState.isSaving
                                      ? null
                                      : () => setState(() => _vehicleImagePath = null),
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.add_photo_alternate_outlined,
                            size: 40,
                            color: AppColors.primary.withValues(alpha: 0.5),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Toca para agregar foto',
                            style: TextStyle(
                              color: AppColors.primary.withValues(alpha: 0.7),
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: obState.isSaving ? null : _saveVehicle,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: obState.isSaving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Continuar'),
            ),
          ],
        ),
      ),
    );
  }
}

// ────────────────── Progress bar widget ──────────────────

class _OnboardingProgressBar extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final List<String> labels;
  final List<IconData> icons;

  const _OnboardingProgressBar({
    required this.currentStep,
    required this.totalSteps,
    required this.labels,
    required this.icons,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Step counter text
        Text(
          'Paso ${currentStep + 1} de $totalSteps',
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 8),
        // Linear progress bar
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: (currentStep + 1) / totalSteps,
            minHeight: 6,
            backgroundColor: AppColors.border,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
        ),
        const SizedBox(height: 8),
        // Current step label
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icons[currentStep], size: 16, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(
              labels[currentStep],
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Paints a dashed oval outline to guide the user when taking a selfie.
class _OvalGuidePainter extends CustomPainter {
  const _OvalGuidePainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    const double dashWidth = 8;
    const double dashSpace = 5;

    final path = Path()..addOval(rect);
    final metrics = path.computeMetrics().first;
    final length = metrics.length;
    double distance = 0;
    while (distance < length) {
      final end = (distance + dashWidth).clamp(0.0, length);
      canvas.drawPath(metrics.extractPath(distance, end), paint);
      distance += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(_OvalGuidePainter oldDelegate) =>
      oldDelegate.color != color;
}
