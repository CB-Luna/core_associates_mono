import 'ai_analysis.dart';

class Documento {
  final String id;
  final String tipo;
  final String estado;
  final String contentType;
  final int fileSize;
  final String? motivoRechazo;
  final String createdAt;
  final AiAnalysis? analisis;

  const Documento({
    required this.id,
    required this.tipo,
    required this.estado,
    required this.contentType,
    required this.fileSize,
    this.motivoRechazo,
    required this.createdAt,
    this.analisis,
  });

  factory Documento.fromJson(Map<String, dynamic> json) {
    return Documento(
      id: json['id'] as String,
      tipo: json['tipo'] as String,
      estado: json['estado'] as String,
      contentType: json['contentType'] as String? ?? 'image/jpeg',
      fileSize: json['fileSize'] as int? ?? 0,
      motivoRechazo: json['motivoRechazo'] as String?,
      createdAt: json['createdAt'] as String,
      analisis: json['analisis'] != null
          ? AiAnalysis.fromJson(json['analisis'] as Map<String, dynamic>)
          : null,
    );
  }

  String get tipoLabel {
    switch (tipo) {
      case 'ine_frente':
        return 'INE Frente';
      case 'ine_reverso':
        return 'INE Reverso';
      case 'selfie':
        return 'Selfie';
      case 'tarjeta_circulacion':
        return 'Tarjeta de Circulación';
      default:
        return 'Otro';
    }
  }
}
