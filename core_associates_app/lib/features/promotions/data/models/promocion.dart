class ProveedorResumen {
  final String id;
  final String razonSocial;
  final String tipo;
  final String? logotipoUrl;

  const ProveedorResumen({
    required this.id,
    required this.razonSocial,
    required this.tipo,
    this.logotipoUrl,
  });

  factory ProveedorResumen.fromJson(Map<String, dynamic> json) {
    return ProveedorResumen(
      id: json['id'] as String,
      razonSocial: json['razonSocial'] as String,
      tipo: json['tipo'] as String,
      logotipoUrl: json['logotipoUrl'] as String?,
    );
  }
}

class Promocion {
  final String id;
  final String titulo;
  final String descripcion;
  final String tipoDescuento;
  final double valorDescuento;
  final String fechaInicio;
  final String fechaFin;
  final int vigenciaCupon;
  final String? terminos;
  final String? imagenUrl;
  final int? maxCupones;
  final String estado;
  final ProveedorResumen proveedor;

  const Promocion({
    required this.id,
    required this.titulo,
    required this.descripcion,
    required this.tipoDescuento,
    required this.valorDescuento,
    required this.fechaInicio,
    required this.fechaFin,
    required this.vigenciaCupon,
    this.terminos,
    this.imagenUrl,
    this.maxCupones,
    required this.estado,
    required this.proveedor,
  });

  String get descuentoFormateado {
    if (tipoDescuento == 'porcentaje') {
      return '${valorDescuento.toInt()}%';
    }
    return '\$${valorDescuento.toInt()}';
  }

  factory Promocion.fromJson(Map<String, dynamic> json) {
    return Promocion(
      id: json['id'] as String,
      titulo: json['titulo'] as String,
      descripcion: json['descripcion'] as String,
      tipoDescuento: json['tipoDescuento'] as String,
      valorDescuento: double.parse(json['valorDescuento'].toString()),
      fechaInicio: json['fechaInicio'] as String,
      fechaFin: json['fechaFin'] as String,
      vigenciaCupon: json['vigenciaCupon'] as int,
      terminos: json['terminos'] as String?,
      imagenUrl: json['imagenUrl'] as String?,
      maxCupones: json['maxCupones'] as int?,
      estado: json['estado'] as String,
      proveedor: ProveedorResumen.fromJson(
          json['proveedor'] as Map<String, dynamic>),
    );
  }
}
