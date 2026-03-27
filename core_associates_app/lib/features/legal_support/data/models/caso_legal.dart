class AutorNota {
  final String nombre;
  final String? rol;

  const AutorNota({required this.nombre, this.rol});

  factory AutorNota.fromJson(Map<String, dynamic> json) {
    return AutorNota(
      nombre: json['nombre'] as String,
      rol: json['rol'] as String?,
    );
  }
}

class NotaCaso {
  final String id;
  final String contenido;
  final bool esPrivada;
  final String createdAt;
  final AutorNota? autor;

  const NotaCaso({
    required this.id,
    required this.contenido,
    this.esPrivada = false,
    required this.createdAt,
    this.autor,
  });

  factory NotaCaso.fromJson(Map<String, dynamic> json) {
    return NotaCaso(
      id: json['id'] as String,
      contenido: json['contenido'] as String,
      esPrivada: json['esPrivada'] as bool? ?? false,
      createdAt: json['createdAt'] as String,
      autor: json['autor'] != null
          ? AutorNota.fromJson(json['autor'] as Map<String, dynamic>)
          : null,
    );
  }
}

class AbogadoInfo {
  final String razonSocial;
  final String? telefono;

  const AbogadoInfo({required this.razonSocial, this.telefono});

  factory AbogadoInfo.fromJson(Map<String, dynamic> json) {
    return AbogadoInfo(
      razonSocial: json['razonSocial'] as String,
      telefono: json['telefono'] as String?,
    );
  }
}

class AbogadoUsuarioInfo {
  final String nombre;
  final String? avatarUrl;
  final String? especialidad;
  final String? telefono;

  const AbogadoUsuarioInfo({
    required this.nombre,
    this.avatarUrl,
    this.especialidad,
    this.telefono,
  });

  factory AbogadoUsuarioInfo.fromJson(Map<String, dynamic> json) {
    return AbogadoUsuarioInfo(
      nombre: json['nombre'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      especialidad: json['especialidad'] as String?,
      telefono: json['telefono'] as String?,
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
  final AbogadoInfo? abogado;
  final AbogadoUsuarioInfo? abogadoUsuario;
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
    this.abogado,
    this.abogadoUsuario,
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
      abogado: json['abogado'] != null
          ? AbogadoInfo.fromJson(json['abogado'] as Map<String, dynamic>)
          : null,
      abogadoUsuario: json['abogadoUsuario'] != null
          ? AbogadoUsuarioInfo.fromJson(
              json['abogadoUsuario'] as Map<String, dynamic>,
            )
          : null,
      notas:
          (json['notas'] as List<dynamic>?)
              ?.map((n) => NotaCaso.fromJson(n as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
