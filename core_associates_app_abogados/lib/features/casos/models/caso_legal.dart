import 'asociado_resumen.dart';
import 'nota_caso.dart';

class CasoLegal {
  final String id;
  final String codigo;
  final String asociadoId;
  final String? abogadoId;
  final String? abogadoUsuarioId;
  final String tipoPercance;
  final String? descripcion;
  final double latitud;
  final double longitud;
  final String? direccionAprox;
  final String estado;
  final String prioridad;
  final DateTime fechaApertura;
  final DateTime? fechaAsignacion;
  final DateTime? fechaCierre;
  final DateTime createdAt;
  final DateTime updatedAt;
  final AsociadoResumen? asociado;
  final List<NotaCaso> notas;
  final int? notasCount;

  const CasoLegal({
    required this.id,
    required this.codigo,
    required this.asociadoId,
    this.abogadoId,
    this.abogadoUsuarioId,
    required this.tipoPercance,
    this.descripcion,
    required this.latitud,
    required this.longitud,
    this.direccionAprox,
    required this.estado,
    required this.prioridad,
    required this.fechaApertura,
    this.fechaAsignacion,
    this.fechaCierre,
    required this.createdAt,
    required this.updatedAt,
    this.asociado,
    this.notas = const [],
    this.notasCount,
  });

  factory CasoLegal.fromJson(Map<String, dynamic> json) {
    // _count viene de Prisma include
    final count = json['_count'] as Map<String, dynamic>?;

    return CasoLegal(
      id: json['id'] as String,
      codigo: json['codigo'] as String,
      asociadoId: json['asociadoId'] as String,
      abogadoId: json['abogadoId'] as String?,
      abogadoUsuarioId: json['abogadoUsuarioId'] as String?,
      tipoPercance: json['tipoPercance'] as String,
      descripcion: json['descripcion'] as String?,
      latitud: _parseDouble(json['latitud']),
      longitud: _parseDouble(json['longitud']),
      direccionAprox: json['direccionAprox'] as String?,
      estado: json['estado'] as String,
      prioridad: json['prioridad'] as String,
      fechaApertura: DateTime.parse(json['fechaApertura'] as String),
      fechaAsignacion: json['fechaAsignacion'] != null
          ? DateTime.parse(json['fechaAsignacion'] as String)
          : null,
      fechaCierre: json['fechaCierre'] != null
          ? DateTime.parse(json['fechaCierre'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      asociado: json['asociado'] != null
          ? AsociadoResumen.fromJson(json['asociado'] as Map<String, dynamic>)
          : null,
      notas:
          (json['notas'] as List<dynamic>?)
              ?.map((n) => NotaCaso.fromJson(n as Map<String, dynamic>))
              .toList() ??
          const [],
      notasCount: count?['notas'] as int?,
    );
  }

  static double _parseDouble(dynamic v) {
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  /// Label legible del tipo de percance.
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
      case 'otro':
        return 'Otro';
      default:
        return tipoPercance;
    }
  }

  /// Label legible del estado.
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

  /// Label legible de prioridad.
  String get prioridadLabel {
    switch (prioridad) {
      case 'baja':
        return 'Baja';
      case 'media':
        return 'Media';
      case 'alta':
        return 'Alta';
      case 'urgente':
        return 'Urgente';
      default:
        return prioridad;
    }
  }

  bool get estaAsignado => abogadoUsuarioId != null;
  bool get estaDisponible => estado == 'abierto' && !estaAsignado;
}
