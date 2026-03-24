class NotaCaso {
  final String id;
  final String casoId;
  final String autorId;
  final String contenido;
  final bool esPrivada;
  final DateTime createdAt;
  final AutorResumen? autor;

  const NotaCaso({
    required this.id,
    required this.casoId,
    required this.autorId,
    required this.contenido,
    required this.esPrivada,
    required this.createdAt,
    this.autor,
  });

  factory NotaCaso.fromJson(Map<String, dynamic> json) {
    return NotaCaso(
      id: json['id'] as String,
      casoId: json['casoId'] as String,
      autorId: json['autorId'] as String,
      contenido: json['contenido'] as String,
      esPrivada: json['esPrivada'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      autor: json['autor'] != null
          ? AutorResumen.fromJson(json['autor'] as Map<String, dynamic>)
          : null,
    );
  }
}

class AutorResumen {
  final String nombre;
  final String rol;

  const AutorResumen({required this.nombre, required this.rol});

  factory AutorResumen.fromJson(Map<String, dynamic> json) {
    return AutorResumen(
      nombre: json['nombre'] as String,
      rol: json['rol'] as String,
    );
  }
}
