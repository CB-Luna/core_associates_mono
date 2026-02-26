import 'vehiculo.dart';

class Asociado {
  final String id;
  final String idUnico;
  final String nombre;
  final String apellidoPat;
  final String? apellidoMat;
  final String telefono;
  final String? email;
  final String? fechaNacimiento;
  final String? fotoUrl;
  final String estado;
  final String fechaRegistro;
  final List<Vehiculo> vehiculos;

  const Asociado({
    required this.id,
    required this.idUnico,
    required this.nombre,
    required this.apellidoPat,
    this.apellidoMat,
    required this.telefono,
    this.email,
    this.fechaNacimiento,
    this.fotoUrl,
    required this.estado,
    required this.fechaRegistro,
    this.vehiculos = const [],
  });

  String get nombreCompleto {
    final parts = [nombre, apellidoPat, apellidoMat]
        .where((p) => p != null && p.isNotEmpty)
        .toList();
    return parts.isEmpty ? 'Asociado' : parts.join(' ');
  }

  String get iniciales {
    if (nombre.isEmpty) return '?';
    final parts = [nombre, apellidoPat].where((p) => p.isNotEmpty).toList();
    return parts.map((p) => p[0].toUpperCase()).join();
  }

  factory Asociado.fromJson(Map<String, dynamic> json) {
    return Asociado(
      id: json['id'] as String,
      idUnico: json['idUnico'] as String,
      nombre: json['nombre'] as String? ?? '',
      apellidoPat: json['apellidoPat'] as String? ?? '',
      apellidoMat: json['apellidoMat'] as String?,
      telefono: json['telefono'] as String,
      email: json['email'] as String?,
      fechaNacimiento: json['fechaNacimiento'] as String?,
      fotoUrl: json['fotoUrl'] as String?,
      estado: json['estado'] as String,
      fechaRegistro: json['fechaRegistro'] as String? ?? '',
      vehiculos: (json['vehiculos'] as List<dynamic>?)
              ?.map((v) => Vehiculo.fromJson(v as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
