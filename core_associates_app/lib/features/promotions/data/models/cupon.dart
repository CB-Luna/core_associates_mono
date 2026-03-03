class CuponPromocionResumen {
  final String titulo;
  final String tipoDescuento;
  final double valorDescuento;

  const CuponPromocionResumen({
    required this.titulo,
    required this.tipoDescuento,
    required this.valorDescuento,
  });

  factory CuponPromocionResumen.fromJson(Map<String, dynamic> json) {
    return CuponPromocionResumen(
      titulo: json['titulo'] as String,
      tipoDescuento: json['tipoDescuento'] as String,
      valorDescuento: double.parse(json['valorDescuento'].toString()),
    );
  }
}

class CuponProveedorResumen {
  final String razonSocial;
  final String tipo;

  const CuponProveedorResumen({required this.razonSocial, required this.tipo});

  factory CuponProveedorResumen.fromJson(Map<String, dynamic> json) {
    return CuponProveedorResumen(
      razonSocial: json['razonSocial'] as String,
      tipo: json['tipo'] as String,
    );
  }
}

class Cupon {
  final String id;
  final String codigo;
  final String qrPayload;
  final String qrFirma;
  final String estado;
  final String fechaGeneracion;
  final String fechaVencimiento;
  final String? fechaCanje;
  final CuponPromocionResumen promocion;
  final CuponProveedorResumen proveedor;

  const Cupon({
    required this.id,
    required this.codigo,
    required this.qrPayload,
    required this.qrFirma,
    required this.estado,
    required this.fechaGeneracion,
    required this.fechaVencimiento,
    this.fechaCanje,
    required this.promocion,
    required this.proveedor,
  });

  bool get isActive => estado == 'activo';

  /// QR data for client-side rendering (same format as server QR)
  String get qrData {
    return '{"payload":$qrPayload,"firma":"$qrFirma"}';
  }

  factory Cupon.fromJson(Map<String, dynamic> json) {
    return Cupon(
      id: json['id'] as String,
      codigo: json['codigo'] as String,
      qrPayload: json['qrPayload'] as String,
      qrFirma: json['qrFirma'] as String? ?? '',
      estado: json['estado'] as String,
      fechaGeneracion: json['fechaGeneracion'] as String,
      fechaVencimiento: json['fechaVencimiento'] as String,
      fechaCanje: json['fechaCanje'] as String?,
      promocion: CuponPromocionResumen.fromJson(
        json['promocion'] as Map<String, dynamic>,
      ),
      proveedor: CuponProveedorResumen.fromJson(
        json['proveedor'] as Map<String, dynamic>,
      ),
    );
  }
}
