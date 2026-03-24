/// Asociado resumido incluido en un caso legal.
class AsociadoResumen {
  final String? id;
  final String? idUnico;
  final String nombre;
  final String? apellidoPat;
  final String? apellidoMat;
  final String? telefono;
  final String? email;
  final String? fotoUrl;
  final List<VehiculoResumen> vehiculos;

  const AsociadoResumen({
    this.id,
    this.idUnico,
    required this.nombre,
    this.apellidoPat,
    this.apellidoMat,
    this.telefono,
    this.email,
    this.fotoUrl,
    this.vehiculos = const [],
  });

  factory AsociadoResumen.fromJson(Map<String, dynamic> json) {
    return AsociadoResumen(
      id: json['id'] as String?,
      idUnico: json['idUnico'] as String?,
      nombre: json['nombre'] as String? ?? '',
      apellidoPat: json['apellidoPat'] as String?,
      apellidoMat: json['apellidoMat'] as String?,
      telefono: json['telefono'] as String?,
      email: json['email'] as String?,
      fotoUrl: json['fotoUrl'] as String?,
      vehiculos:
          (json['vehiculos'] as List<dynamic>?)
              ?.map((v) => VehiculoResumen.fromJson(v as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  String get nombreCompleto {
    final parts = [
      nombre,
      apellidoPat,
      apellidoMat,
    ].where((p) => p != null && p.isNotEmpty);
    return parts.join(' ');
  }
}

class VehiculoResumen {
  final String id;
  final String? marca;
  final String? modelo;
  final int? anio;
  final String? color;
  final String? placas;
  final bool esPrincipal;

  const VehiculoResumen({
    required this.id,
    this.marca,
    this.modelo,
    this.anio,
    this.color,
    this.placas,
    this.esPrincipal = false,
  });

  factory VehiculoResumen.fromJson(Map<String, dynamic> json) {
    return VehiculoResumen(
      id: json['id'] as String,
      marca: json['marca'] as String?,
      modelo: json['modelo'] as String?,
      anio: json['anio'] as int?,
      color: json['color'] as String?,
      placas: json['placas'] as String?,
      esPrincipal: json['esPrincipal'] as bool? ?? false,
    );
  }

  String get descripcion {
    final parts = <String>[
      if (marca != null && marca!.isNotEmpty) marca!,
      if (modelo != null && modelo!.isNotEmpty) modelo!,
      if (anio != null) '$anio',
    ];
    return parts.join(' ');
  }
}
