/// Modelo de usuario (abogado) para la app.
/// Datos que llegan del login (subconjunto del modelo Prisma).
class Usuario {
  final String id;
  final String email;
  final String nombre;
  final String rol;
  final String? rolId;
  final String? rolNombre;
  final List<String> permisos;
  final String? avatarUrl;

  const Usuario({
    required this.id,
    required this.email,
    required this.nombre,
    required this.rol,
    this.rolId,
    this.rolNombre,
    this.permisos = const [],
    this.avatarUrl,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      id: json['id'] as String,
      email: json['email'] as String,
      nombre: json['nombre'] as String,
      rol: json['rol'] as String,
      rolId: json['rolId'] as String?,
      rolNombre: json['rolNombre'] as String?,
      permisos:
          (json['permisos'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'nombre': nombre,
    'rol': rol,
    'rolId': rolId,
    'rolNombre': rolNombre,
    'permisos': permisos,
    'avatarUrl': avatarUrl,
  };

  bool get esAbogado => rol == 'abogado';
}
