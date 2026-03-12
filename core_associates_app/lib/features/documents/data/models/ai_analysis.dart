class AiAnalysis {
  final String id;
  final String estado; // 'procesando' | 'completado' | 'error'
  final double? confianza;
  final Map<String, dynamic>? datosExtraidos;
  final Map<String, dynamic>? validaciones;
  final String createdAt;

  const AiAnalysis({
    required this.id,
    required this.estado,
    this.confianza,
    this.datosExtraidos,
    this.validaciones,
    required this.createdAt,
  });

  factory AiAnalysis.fromJson(Map<String, dynamic> json) {
    return AiAnalysis(
      id: json['id'] as String,
      estado: json['estado'] as String,
      confianza: (json['confianza'] as num?)?.toDouble(),
      datosExtraidos: json['datosExtraidos'] as Map<String, dynamic>?,
      validaciones: json['validaciones'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] as String,
    );
  }

  bool get isProcessing => estado == 'procesando';
  bool get isCompleted => estado == 'completado';
  bool get isError => estado == 'error';

  int get confidencePercent => ((confianza ?? 0) * 100).round();

  bool get allValidationsPassed {
    if (validaciones == null) return false;
    return validaciones!.values.every((v) => v == true);
  }

  List<MapEntry<String, dynamic>> get extractedFields {
    if (datosExtraidos == null) return [];
    return datosExtraidos!.entries.toList();
  }

  List<MapEntry<String, bool>> get validationEntries {
    if (validaciones == null) return [];
    return validaciones!.entries
        .map((e) => MapEntry(e.key, e.value as bool))
        .toList();
  }
}
