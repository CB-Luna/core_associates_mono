import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../shared/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../documents/data/models/documento.dart';
import '../../../documents/presentation/providers/documents_provider.dart';
import '../providers/profile_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _step = 0; // 0 = perfil, 1 = documentos

  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nombreCtrl;
  late TextEditingController _apellidoPatCtrl;
  late TextEditingController _apellidoMatCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _fechaNacCtrl;
  bool _saving = false;

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

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
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
      ref.read(authStateProvider.notifier).markProfileComplete();

      if (mounted) setState(() => _step = 1);
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

  void _finishOnboarding() {
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  _StepDot(index: 0, current: _step, label: 'Perfil'),
                  Expanded(
                    child: Container(
                      height: 2,
                      color: _step > 0 ? AppColors.primary : AppColors.border,
                    ),
                  ),
                  _StepDot(index: 1, current: _step, label: 'Documentos'),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: _step == 0 ? _buildProfileStep() : _buildDocumentsStep(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(
              Icons.person_add_outlined,
              size: 64,
              color: AppColors.primary.withValues(alpha: 0.7),
            ),
            const SizedBox(height: 16),
            Text(
              '¡Bienvenido a Core Associates!',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Completa tus datos para activar tu membresía',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
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
              onPressed: _saving ? null : _saveProfile,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _saving
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

  Widget _buildDocumentsStep() {
    final docsAsync = ref.watch(documentsProvider);

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(
            Icons.upload_file,
            size: 64,
            color: AppColors.primary.withValues(alpha: 0.7),
          ),
          const SizedBox(height: 16),
          Text(
            'Sube tus documentos',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Necesitamos verificar tu identidad. Puedes hacerlo ahora o después desde tu perfil.',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // Document status summary
          Expanded(
            child: docsAsync.when(
              data: (docs) => _buildDocsSummary(docs),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, _) => Center(
                child: TextButton.icon(
                  onPressed: () => ref.invalidate(documentsProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Reintentar'),
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => context.push('/documents'),
            icon: const Icon(Icons.upload_file),
            label: const Text('Ir a subir documentos'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _finishOnboarding,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text('Hacer esto después'),
          ),
        ],
      ),
    );
  }

  Widget _buildDocsSummary(List<Documento> docs) {
    const required = [
      {'tipo': 'ine_frente', 'label': 'INE Frente'},
      {'tipo': 'ine_reverso', 'label': 'INE Reverso'},
      {'tipo': 'selfie', 'label': 'Selfie'},
      {'tipo': 'tarjeta_circulacion', 'label': 'Tarjeta de Circulación'},
    ];

    return ListView(
      children: required.map((req) {
        final doc = docs.cast<Documento?>().firstWhere(
          (d) => d?.tipo == req['tipo'],
          orElse: () => null,
        );
        final uploaded = doc != null;
        final estado = doc?.estado ?? '';

        return ListTile(
          leading: Icon(
            uploaded ? Icons.check_circle : Icons.radio_button_unchecked,
            color: uploaded
                ? (estado == 'aprobado'
                      ? AppColors.secondary
                      : AppColors.warning)
                : AppColors.textSecondary,
          ),
          title: Text(req['label']!),
          subtitle: Text(
            uploaded ? estado.toUpperCase() : 'No subido',
            style: TextStyle(
              fontSize: 12,
              color: uploaded ? AppColors.warning : AppColors.textSecondary,
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _StepDot extends StatelessWidget {
  final int index;
  final int current;
  final String label;

  const _StepDot({
    required this.index,
    required this.current,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = index <= current;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? AppColors.primary : AppColors.border,
          ),
          alignment: Alignment.center,
          child: Text(
            '${index + 1}',
            style: TextStyle(
              color: isActive ? Colors.white : AppColors.textSecondary,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: isActive ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}
