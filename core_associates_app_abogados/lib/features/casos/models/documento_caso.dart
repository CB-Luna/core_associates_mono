class DocumentoCaso {
  final String id;
  final String casoId;
  final String nombre;
  final String contentType;
  final int fileSize;
  final String subidoPorId;
  final DateTime createdAt;
  final AutorDocumento? subidoPor;

  const DocumentoCaso({
    required this.id,
    required this.casoId,
    required this.nombre,
    required this.contentType,
    required this.fileSize,
    required this.subidoPorId,
    required this.createdAt,
    this.subidoPor,
  });

  factory DocumentoCaso.fromJson(Map<String, dynamic> json) {
    return DocumentoCaso(
      id: json['id'] as String,
      casoId: json['casoId'] as String,
      nombre: json['nombre'] as String,
      contentType: json['contentType'] as String,
      fileSize: json['fileSize'] as int? ?? 0,
      subidoPorId: json['subidoPorId'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      subidoPor: json['subidoPor'] != null
          ? AutorDocumento.fromJson(json['subidoPor'] as Map<String, dynamic>)
          : null,
    );
  }

  bool get esImagen => contentType.startsWith('image/');

  bool get esPdf => contentType == 'application/pdf';

  String get fileSizeLabel {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) {
      return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    }
    return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class AutorDocumento {
  final String nombre;
  final String rol;

  const AutorDocumento({required this.nombre, required this.rol});

  factory AutorDocumento.fromJson(Map<String, dynamic> json) {
    return AutorDocumento(
      nombre: json['nombre'] as String,
      rol: json['rol'] as String,
    );
  }
}
