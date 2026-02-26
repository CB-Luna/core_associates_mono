class Vehiculo {
  final String id;
  final String marca;
  final String modelo;
  final int anio;
  final String color;
  final String placas;
  final String? numeroSerie;
  final bool esPrincipal;

  const Vehiculo({
    required this.id,
    required this.marca,
    required this.modelo,
    required this.anio,
    required this.color,
    required this.placas,
    this.numeroSerie,
    required this.esPrincipal,
  });

  factory Vehiculo.fromJson(Map<String, dynamic> json) {
    return Vehiculo(
      id: json['id'] as String,
      marca: json['marca'] as String,
      modelo: json['modelo'] as String,
      anio: json['anio'] as int,
      color: json['color'] as String,
      placas: json['placas'] as String,
      numeroSerie: json['numeroSerie'] as String?,
      esPrincipal: json['esPrincipal'] as bool? ?? false,
    );
  }
}
