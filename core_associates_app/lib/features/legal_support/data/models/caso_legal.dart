class NotaCaso {
  final String id;
  final String contenido;
  final String createdAt;

  const NotaCaso({
    required this.id,
    required this.contenido,
    required this.createdAt,
  });

  factory NotaCaso.fromJson(Map<String, dynamic> json) {
    return NotaCaso(
      id: json['id'] as String,
      contenido: json['contenido'] as String,
      createdAt: json['createdAt'] as String,
    );
  }
}

class CasoLegal {
  final String id;
  final String codigo;
  final String tipoPercance;
  final String? descripcion;
  final double latitud;
  final double longitud;
  final String? direccionAprox;
  final String estado;
  final String prioridad;
  final String fechaApertura;
  final String? fechaCierre;
  final List<NotaCaso> notas;

  const CasoLegal({
    required this.id,
    required this.codigo,
    required this.tipoPercance,
    this.descripcion,
    required this.latitud,
    required this.longitud,
    this.direccionAprox,
    required this.estado,
    required this.prioridad,
    required this.fechaApertura,
    this.fechaCierre,
    this.notas = const [],
  });

  String get tipoPercanceLabel {
    switch (tipoPercance) {
      case 'accidente':
        return 'Accidente';
      case 'infraccion':
        return 'Infracción';
      case 'robo':
        return 'Robo';
      case 'asalto':
        return 'Asalto';
      default:
        return 'Otro';
    }
  }

  String get estadoLabel {
    switch (estado) {
      case 'abierto':
        return 'Abierto';
      case 'en_atencion':
        return 'En atención';
      case 'escalado':
        return 'Escalado';
      case 'resuelto':
        return 'Resuelto';
      case 'cerrado':
        return 'Cerrado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  factory CasoLegal.fromJson(Map<String, dynamic> json) {
    return CasoLegal(
      id: json['id'] as String,
      codigo: json['codigo'] as String,
      tipoPercance: json['tipoPercance'] as String,
      descripcion: json['descripcion'] as String?,
      latitud: double.parse(json['latitud'].toString()),
      longitud: double.parse(json['longitud'].toString()),
      direccionAprox: json['direccionAprox'] as String?,
      estado: json['estado'] as String,
      prioridad: json['prioridad'] as String,
      fechaApertura: json['fechaApertura'] as String,
      fechaCierre: json['fechaCierre'] as String?,
      notas: (json['notas'] as List<dynamic>?)
              ?.map((n) => NotaCaso.fromJson(n as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
