import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Steps in the onboarding wizard.
/// 0 = Datos personales
/// 1 = Selfie (obligatoria)
/// 2 = Vehículo (obligatorio)
/// 3 = Tarjeta de circulación (obligatoria)
/// 4 = INE frente (opcional)
/// 5 = INE reverso (opcional)
enum OnboardingStep {
  datosPersonales,
  selfie,
  vehiculo,
  tarjetaCirculacion,
  ineFront,
  ineReverso,
}

class OnboardingState {
  final OnboardingStep currentStep;
  final bool isSaving;
  final String? error;

  /// Track which optional docs were skipped
  final bool ineSkipped;

  const OnboardingState({
    this.currentStep = OnboardingStep.datosPersonales,
    this.isSaving = false,
    this.error,
    this.ineSkipped = false,
  });

  int get stepIndex => currentStep.index;
  int get totalSteps => OnboardingStep.values.length;

  /// Steps 0-3 are mandatory, 4-5 are optional (INE)
  bool get isOptionalStep =>
      currentStep == OnboardingStep.ineFront ||
      currentStep == OnboardingStep.ineReverso;

  OnboardingState copyWith({
    OnboardingStep? currentStep,
    bool? isSaving,
    String? error,
    bool? ineSkipped,
  }) {
    return OnboardingState(
      currentStep: currentStep ?? this.currentStep,
      isSaving: isSaving ?? this.isSaving,
      error: error,
      ineSkipped: ineSkipped ?? this.ineSkipped,
    );
  }
}

final onboardingProvider =
    NotifierProvider<OnboardingNotifier, OnboardingState>(
      OnboardingNotifier.new,
    );

class OnboardingNotifier extends Notifier<OnboardingState> {
  @override
  OnboardingState build() => const OnboardingState();

  void goToStep(OnboardingStep step) {
    state = state.copyWith(currentStep: step);
  }

  void nextStep() {
    final next = state.stepIndex + 1;
    if (next < OnboardingStep.values.length) {
      state = state.copyWith(currentStep: OnboardingStep.values[next]);
    }
  }

  void previousStep() {
    final prev = state.stepIndex - 1;
    if (prev >= 0) {
      state = state.copyWith(currentStep: OnboardingStep.values[prev]);
    }
  }

  void setSaving(bool saving) {
    state = state.copyWith(isSaving: saving);
  }

  void setError(String? error) {
    state = state.copyWith(error: error);
  }

  void skipIne() {
    state = state.copyWith(ineSkipped: true);
  }

  void reset() {
    state = const OnboardingState();
  }
}
